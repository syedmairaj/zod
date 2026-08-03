import type { Queryable } from "@zod-ai/db";
import {
  commitShaPrefix,
  finalizeTimedOut,
  getValidationRunById,
  hasTimedOut,
  HeartbeatSession,
  isCancellationRequested,
  scheduleRetryOrFail,
  transitionOwnedRun,
  type ClaimedValidationRun,
} from "@zod-ai/queue";
import {
  logStructured,
  type PlaceholderMode,
  type SchedulerConfig,
  type Clock,
  systemClock,
} from "@zod-ai/shared";
import {
  PlaceholderCancelledError,
  PlaceholderFatalError,
  PlaceholderRetryableError,
  PlaceholderTimeoutError,
  runPlaceholderTask,
} from "../runner/placeholder";

export interface ExecuteRunOptions {
  db: Queryable;
  run: ClaimedValidationRun;
  config: SchedulerConfig;
  mode: PlaceholderMode;
  clock?: Clock;
  /** Abort when worker is shutting down. */
  signal?: AbortSignal;
  placeholderDurationMs?: number;
}

export type ExecuteRunOutcome =
  | "completed"
  | "failed"
  | "timed_out"
  | "cancelled"
  | "superseded"
  | "requeued"
  | "ownership_lost";

async function refresh(
  db: Queryable,
  run: ClaimedValidationRun,
): Promise<ClaimedValidationRun | null> {
  return getValidationRunById(db, run.organizationId, run.id);
}

function lostOrTerminal(current: ClaimedValidationRun | null, workerId: string): ExecuteRunOutcome | null {
  if (!current) return "ownership_lost";
  if (current.claimedBy && current.claimedBy !== workerId) return "ownership_lost";
  if (current.status === "superseded") return "superseded";
  if (current.status === "cancelled") return "cancelled";
  if (current.status === "timed_out") return "timed_out";
  if (current.status === "failed") return "failed";
  if (current.status === "completed") return "completed";
  return null;
}

/**
 * Progresses a claimed run through preparing → running → collecting → completed
 * using only the safe placeholder task. No repository checkout or execution.
 */
export async function executeClaimedRun(options: ExecuteRunOptions): Promise<ExecuteRunOutcome> {
  const clock = options.clock ?? systemClock;
  const { db, config, mode } = options;
  let run = options.run;
  const workerId = run.claimedBy;

  const heartbeat = new HeartbeatSession(db, run, config, () => undefined);
  heartbeat.start();

  const stopHeartbeat = (): void => {
    heartbeat.stop();
  };

  try {
    logStructured("info", "validation_run_started", {
      organization_id: run.organizationId,
      repository_id: run.repositoryId,
      validation_run_id: run.id,
      worker_id: workerId,
      attempt: run.attemptCount,
      status: run.status,
      trigger: run.trigger,
      commit_sha_prefix: commitShaPrefix(run.commitSha),
    });

    // claimed → preparing
    {
      const current = await refresh(db, run);
      const early = lostOrTerminal(current, workerId);
      if (early) return early;
      if (!current) return "ownership_lost";
      if (isCancellationRequested(current)) {
        const cancelled = await transitionOwnedRun(db, {
          runId: run.id,
          organizationId: run.organizationId,
          workerId,
          runVersion: run.runVersion,
          from: current.status,
          to: "cancelled",
          failureCode: "cancelled",
          failureMessage: "Cancellation requested before prepare",
        });
        if (cancelled) {
          logStructured("info", "validation_run_cancelled", {
            organization_id: run.organizationId,
            validation_run_id: run.id,
            worker_id: workerId,
            commit_sha_prefix: commitShaPrefix(run.commitSha),
          });
          return "cancelled";
        }
        return "ownership_lost";
      }
      if (hasTimedOut(current.timeoutAt, clock.now())) {
        await finalizeTimedOut(db, { ...run, ...current, claimedBy: workerId }, current.status);
        return "timed_out";
      }
      const moved = await transitionOwnedRun(db, {
        runId: run.id,
        organizationId: run.organizationId,
        workerId,
        runVersion: run.runVersion,
        from: "claimed",
        to: "preparing",
      });
      if (!moved) return "ownership_lost";
      run = moved;
    }

    // preparing → running
    {
      const current = await refresh(db, run);
      const early = lostOrTerminal(current, workerId);
      if (early) return early;
      if (!current) return "ownership_lost";
      if (isCancellationRequested(current) || options.signal?.aborted) {
        const cancelled = await transitionOwnedRun(db, {
          runId: run.id,
          organizationId: run.organizationId,
          workerId,
          runVersion: run.runVersion,
          from: "preparing",
          to: "cancelled",
          failureCode: "cancelled",
          failureMessage: "Cancellation requested before run",
        });
        return cancelled ? "cancelled" : "ownership_lost";
      }
      const moved = await transitionOwnedRun(db, {
        runId: run.id,
        organizationId: run.organizationId,
        workerId,
        runVersion: run.runVersion,
        from: "preparing",
        to: "running",
      });
      if (!moved) return "ownership_lost";
      run = moved;
    }

    // running: placeholder
    let placeholderResult;
    try {
      if (heartbeat.ownershipLost) return "ownership_lost";
      if (hasTimedOut(run.timeoutAt, clock.now()) || mode === "timeout") {
        await finalizeTimedOut(db, run, "running");
        return "timed_out";
      }
      const current = await refresh(db, run);
      if (current && (isCancellationRequested(current) || mode === "cancellation" || options.signal?.aborted)) {
        const cancelled = await transitionOwnedRun(db, {
          runId: run.id,
          organizationId: run.organizationId,
          workerId,
          runVersion: run.runVersion,
          from: "running",
          to: "cancelled",
          failureCode: "cancelled",
          failureMessage: "Cancellation honored during placeholder",
        });
        return cancelled ? "cancelled" : "ownership_lost";
      }

      placeholderResult = await runPlaceholderTask({
        workerId,
        attempt: run.attemptCount,
        mode,
        durationMs: options.placeholderDurationMs,
        signal: options.signal,
      });
    } catch (error) {
      if (error instanceof PlaceholderTimeoutError) {
        await finalizeTimedOut(db, run, "running");
        return "timed_out";
      }
      if (error instanceof PlaceholderCancelledError || options.signal?.aborted) {
        const cancelled = await transitionOwnedRun(db, {
          runId: run.id,
          organizationId: run.organizationId,
          workerId,
          runVersion: run.runVersion,
          from: "running",
          to: "cancelled",
          failureCode: "cancelled",
          failureMessage: "Cancellation honored during placeholder",
        });
        return cancelled ? "cancelled" : "ownership_lost";
      }
      if (error instanceof PlaceholderRetryableError) {
        const result = await scheduleRetryOrFail(db, {
          runId: run.id,
          organizationId: run.organizationId,
          workerId,
          runVersion: run.runVersion,
          fromStatus: "running",
          attemptCount: run.attemptCount,
          maxAttempts: run.maxAttempts,
          retryBaseDelayMs: config.retryBaseDelayMs,
          failureCode: error.code,
          failureMessage: error.message,
          failureMessageMaxLength: config.failureMessageMaxLength,
        });
        return result.outcome === "requeued" ? "requeued" : "failed";
      }
      if (error instanceof PlaceholderFatalError) {
        const failed = await transitionOwnedRun(db, {
          runId: run.id,
          organizationId: run.organizationId,
          workerId,
          runVersion: run.runVersion,
          from: "running",
          to: "failed",
          failureCode: error.code,
          failureMessage: error.message,
          failureMessageMaxLength: config.failureMessageMaxLength,
        });
        if (failed) {
          logStructured("error", "validation_run_failed", {
            organization_id: run.organizationId,
            validation_run_id: run.id,
            worker_id: workerId,
            error_code: error.code,
            commit_sha_prefix: commitShaPrefix(run.commitSha),
          });
          return "failed";
        }
        return "ownership_lost";
      }
      // Unexpected errors are non-success; retry if attempts remain.
      const result = await scheduleRetryOrFail(db, {
        runId: run.id,
        organizationId: run.organizationId,
        workerId,
        runVersion: run.runVersion,
        fromStatus: "running",
        attemptCount: run.attemptCount,
        maxAttempts: run.maxAttempts,
        retryBaseDelayMs: config.retryBaseDelayMs,
        failureCode: "transient_db_error",
        failureMessage: error instanceof Error ? error.message : "Unexpected worker error",
        failureMessageMaxLength: config.failureMessageMaxLength,
      });
      return result.outcome === "requeued" ? "requeued" : "failed";
    }

    // running → collecting
    {
      const current = await refresh(db, run);
      const early = lostOrTerminal(current, workerId);
      if (early) return early;
      if (!current) return "ownership_lost";
      if (isCancellationRequested(current)) {
        const cancelled = await transitionOwnedRun(db, {
          runId: run.id,
          organizationId: run.organizationId,
          workerId,
          runVersion: run.runVersion,
          from: "running",
          to: "cancelled",
          failureCode: "cancelled",
          failureMessage: "Cancellation requested before collect",
        });
        return cancelled ? "cancelled" : "ownership_lost";
      }
      const moved = await transitionOwnedRun(db, {
        runId: run.id,
        organizationId: run.organizationId,
        workerId,
        runVersion: run.runVersion,
        from: "running",
        to: "collecting",
      });
      if (!moved) return "ownership_lost";
      run = moved;
    }

    // collecting → completed (scheduler-ok only — not code correctness)
    {
      const current = await refresh(db, run);
      const early = lostOrTerminal(current, workerId);
      if (early) return early;
      if (!current) return "ownership_lost";
      const completed = await transitionOwnedRun(db, {
        runId: run.id,
        organizationId: run.organizationId,
        workerId,
        runVersion: run.runVersion,
        from: "collecting",
        to: "completed",
        schedulerResult: placeholderResult,
      });
      if (!completed) return "ownership_lost";
      logStructured("info", "validation_run_completed", {
        organization_id: run.organizationId,
        repository_id: run.repositoryId,
        validation_run_id: run.id,
        worker_id: workerId,
        attempt: run.attemptCount,
        status: "completed",
        commit_sha_prefix: commitShaPrefix(run.commitSha),
        note: "scheduler_placeholder_ok_not_code_verdict",
      });
      return "completed";
    }
  } finally {
    stopHeartbeat();
  }
}
