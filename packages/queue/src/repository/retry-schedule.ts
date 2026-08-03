import type { Queryable, ValidationRunRow } from "@zod-ai/db";
import { logStructured } from "@zod-ai/shared";
import { commitShaPrefix } from "../contracts/events";
import { sanitizeFailureMessage, type SchedulerFailureCode } from "../contracts/errors";
import { computeRetryDelayMs } from "../retry/backoff";
import { mapValidationRunRow, type ClaimedValidationRun } from "./mappers";

export interface ScheduleRetryInput {
  runId: string;
  organizationId: string;
  workerId: string;
  runVersion: number;
  fromStatus: "claimed" | "preparing" | "running" | "collecting";
  attemptCount: number;
  maxAttempts: number;
  retryBaseDelayMs: number;
  failureCode: SchedulerFailureCode;
  failureMessage: string;
  failureMessageMaxLength?: number;
}

/**
 * Ownership-scoped retry scheduling. Exhausted attempts → failed.
 * commit_sha is never modified.
 */
export async function scheduleRetryOrFail(
  db: Queryable,
  input: ScheduleRetryInput,
): Promise<{ outcome: "requeued" | "failed"; run: ClaimedValidationRun | null }> {
  const message = sanitizeFailureMessage(
    input.failureMessage,
    input.failureMessageMaxLength ?? 500,
  );

  if (input.attemptCount >= input.maxAttempts) {
    const failed = await db.query<ValidationRunRow>(
      `update validation_runs
       set
         status = 'failed',
         completed_at = now(),
         claimed_by = null,
         lease_expires_at = null,
         failure_code = 'attempts_exhausted',
         failure_message = $5
       where id = $1
         and organization_id = $2
         and claimed_by = $3
         and run_version = $4
         and status = $6
       returning *`,
      [
        input.runId,
        input.organizationId,
        input.workerId,
        input.runVersion,
        sanitizeFailureMessage(`Attempts exhausted: ${message}`, input.failureMessageMaxLength ?? 500),
        input.fromStatus,
      ],
    );
    const row = failed.rows[0];
    if (row) {
      logStructured("error", "validation_run_failed", {
        organization_id: row.organization_id,
        repository_id: row.repository_id,
        validation_run_id: row.id,
        worker_id: input.workerId,
        attempt: row.attempt_count,
        error_code: "attempts_exhausted",
        commit_sha_prefix: commitShaPrefix(row.commit_sha),
      });
    }
    return { outcome: "failed", run: row ? mapValidationRunRow(row) : null };
  }

  const delayMs = computeRetryDelayMs(input.attemptCount, input.retryBaseDelayMs);
  const requeued = await db.query<ValidationRunRow>(
    `update validation_runs
     set
       status = 'queued',
       claimed_by = null,
       claimed_at = null,
       heartbeat_at = null,
       lease_expires_at = null,
       timeout_at = null,
       available_at = now() + ($5::text || ' milliseconds')::interval,
       failure_code = $6,
       failure_message = $7
     where id = $1
       and organization_id = $2
       and claimed_by = $3
       and run_version = $4
       and status = $8
     returning *`,
    [
      input.runId,
      input.organizationId,
      input.workerId,
      input.runVersion,
      String(delayMs),
      input.failureCode,
      message,
      input.fromStatus,
    ],
  );

  const row = requeued.rows[0];
  if (row) {
    logStructured("info", "validation_run_retry_scheduled", {
      organization_id: row.organization_id,
      repository_id: row.repository_id,
      validation_run_id: row.id,
      worker_id: input.workerId,
      attempt: row.attempt_count,
      error_code: input.failureCode,
      delay_ms: delayMs,
      commit_sha_prefix: commitShaPrefix(row.commit_sha),
    });
  }
  return { outcome: "requeued", run: row ? mapValidationRunRow(row) : null };
}
