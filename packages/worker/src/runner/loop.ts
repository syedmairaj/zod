import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { pollAndClaimNextRun } from "@zod-ai/queue";
import {
  logStructured,
  sleep,
  type PlaceholderMode,
  type SchedulerConfig,
} from "@zod-ai/shared";
import { executeClaimedRun } from "../lifecycle/execute-run";
import type { ShutdownController } from "../shutdown/controller";
import { resolvePlaceholderMode } from "./placeholder";

export interface WorkerLoopOptions {
  pool: Pool;
  config: SchedulerConfig;
  shutdown: ShutdownController;
  workerId?: string;
  placeholderMode?: PlaceholderMode;
  /** When set, exit after processing this many claimed runs (tests / smoke). */
  maxJobs?: number;
  placeholderDurationMs?: number;
}

export function createWorkerId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

/**
 * Long-running poll loop. Queue SQL lives in @zod-ai/queue; this only
 * orchestrates claim → heartbeat lifecycle → placeholder → finalize.
 */
export async function runWorkerLoop(options: WorkerLoopOptions): Promise<void> {
  const workerId = options.workerId ?? createWorkerId(options.config.workerIdPrefix);
  const mode = options.placeholderMode ?? resolvePlaceholderMode();
  let processed = 0;

  logStructured("info", "worker_started", {
    worker_id: workerId,
    poll_interval_ms: options.config.pollIntervalMs,
    lease_duration_ms: options.config.leaseDurationMs,
    max_attempts: options.config.maxAttempts,
  });

  try {
    while (!options.shutdown.isShuttingDown) {
      if (options.maxJobs !== undefined && processed >= options.maxJobs) {
        break;
      }

      const { run } = await pollAndClaimNextRun(options.pool, workerId, options.config);

      if (!run) {
        await Promise.race([
          sleep(options.config.pollIntervalMs, options.shutdown.signal).catch(() => undefined),
          options.shutdown.waitUntilShutdown(),
        ]);
        continue;
      }

      logStructured("info", "validation_run_claimed", {
        organization_id: run.organizationId,
        repository_id: run.repositoryId,
        validation_run_id: run.id,
        worker_id: workerId,
        attempt: run.attemptCount,
        status: run.status,
        trigger: run.trigger,
        commit_sha_prefix: run.commitSha?.slice(0, 12),
      });

      await executeClaimedRun({
        db: options.pool,
        run,
        config: options.config,
        mode,
        signal: options.shutdown.signal,
        placeholderDurationMs: options.placeholderDurationMs,
      });
      processed += 1;
    }
  } finally {
    logStructured("info", "worker_stopping", {
      worker_id: workerId,
      reason: options.shutdown.shutdownReason ?? "manual",
    });
    logStructured("info", "worker_stopped", {
      worker_id: workerId,
      jobs_processed: processed,
    });
  }
}
