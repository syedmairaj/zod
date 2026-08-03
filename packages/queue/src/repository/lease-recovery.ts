import type { Queryable } from "@zod-ai/db";
import { logStructured } from "@zod-ai/shared";
import { commitShaPrefix } from "../contracts/events";
import { computeRetryDelayMs } from "../retry/backoff";

export interface RecoverExpiredLeasesInput {
  retryBaseDelayMs: number;
  limit?: number;
}

export interface LeaseRecoveryResult {
  requeuedIds: string[];
  failedIds: string[];
}

/**
 * Expired leases with attempts remaining → queued with backoff.
 * Attempts exhausted → failed. Never maps infrastructure failure to success.
 */
export async function recoverExpiredLeases(
  db: Queryable,
  input: RecoverExpiredLeasesInput,
): Promise<LeaseRecoveryResult> {
  const limit = input.limit ?? 50;

  const expired = await db.query<{
    id: string;
    organization_id: string;
    repository_id: string;
    attempt_count: number;
    max_attempts: number;
    commit_sha: string | null;
    claimed_by: string | null;
  }>(
    `select id, organization_id, repository_id, attempt_count, max_attempts, commit_sha, claimed_by
     from validation_runs
     where status in ('claimed', 'preparing', 'running', 'collecting')
       and lease_expires_at is not null
       and lease_expires_at < now()
     order by lease_expires_at asc
     for update skip locked
     limit $1`,
    [limit],
  );

  const requeuedIds: string[] = [];
  const failedIds: string[] = [];

  for (const row of expired.rows) {
    logStructured("warn", "validation_run_lease_expired", {
      organization_id: row.organization_id,
      repository_id: row.repository_id,
      validation_run_id: row.id,
      worker_id: row.claimed_by ?? undefined,
      attempt: row.attempt_count,
      commit_sha_prefix: commitShaPrefix(row.commit_sha),
      error_code: "lease_expired",
    });

    if (row.attempt_count < row.max_attempts) {
      const delayMs = computeRetryDelayMs(row.attempt_count, input.retryBaseDelayMs);
      await db.query(
        `update validation_runs
         set
           status = 'queued',
           claimed_by = null,
           claimed_at = null,
           heartbeat_at = null,
           lease_expires_at = null,
           timeout_at = null,
           available_at = now() + ($2::text || ' milliseconds')::interval,
           failure_code = 'lease_expired',
           failure_message = 'Lease expired; scheduled for retry'
         where id = $1
           and status in ('claimed', 'preparing', 'running', 'collecting')
           and lease_expires_at is not null
           and lease_expires_at < now()`,
        [row.id, String(delayMs)],
      );
      requeuedIds.push(row.id);
      logStructured("info", "validation_run_retry_scheduled", {
        organization_id: row.organization_id,
        repository_id: row.repository_id,
        validation_run_id: row.id,
        attempt: row.attempt_count,
        error_code: "lease_expired",
        delay_ms: delayMs,
      });
    } else {
      await db.query(
        `update validation_runs
         set
           status = 'failed',
           completed_at = now(),
           claimed_by = null,
           lease_expires_at = null,
           failure_code = 'attempts_exhausted',
           failure_message = 'Lease expired and max attempts exhausted'
         where id = $1
           and status in ('claimed', 'preparing', 'running', 'collecting')
           and lease_expires_at is not null
           and lease_expires_at < now()`,
        [row.id],
      );
      failedIds.push(row.id);
      logStructured("error", "validation_run_failed", {
        organization_id: row.organization_id,
        repository_id: row.repository_id,
        validation_run_id: row.id,
        attempt: row.attempt_count,
        error_code: "attempts_exhausted",
      });
    }
  }

  return { requeuedIds, failedIds };
}
