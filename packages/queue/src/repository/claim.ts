import type { Queryable, ValidationRunRow } from "@zod-ai/db";
import { mapValidationRunRow, type ClaimedValidationRun } from "./mappers";

export interface ClaimNextRunInput {
  workerId: string;
  leaseDurationMs: number;
  runTimeoutMs: number;
}

/**
 * Atomically claims the next eligible queued run using
 * FOR UPDATE SKIP LOCKED. Two workers cannot claim the same attempt.
 */
export async function claimNextValidationRun(
  db: Queryable,
  input: ClaimNextRunInput,
): Promise<ClaimedValidationRun | null> {
  const result = await db.query<ValidationRunRow>(
    `with candidate as (
       select id
       from validation_runs
       where status = 'queued'
         and available_at <= now()
         and attempt_count < max_attempts
       order by created_at asc
       for update skip locked
       limit 1
     )
     update validation_runs vr
     set
       status = 'claimed',
       claimed_by = $1,
       claimed_at = now(),
       heartbeat_at = now(),
       lease_expires_at = now() + ($2::text || ' milliseconds')::interval,
       timeout_at = now() + ($3::text || ' milliseconds')::interval,
       attempt_count = vr.attempt_count + 1,
       started_at = coalesce(vr.started_at, now()),
       failure_code = null,
       failure_message = null,
       scheduler_result_json = null,
       run_version = vr.run_version + 1
     from candidate
     where vr.id = candidate.id
     returning vr.*`,
    [input.workerId, String(input.leaseDurationMs), String(input.runTimeoutMs)],
  );

  const row = result.rows[0];
  return row ? mapValidationRunRow(row) : null;
}
