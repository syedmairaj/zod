import type { Queryable, ValidationRunRow } from "@zod-ai/db";
import type { SchedulerPlaceholderResult } from "@zod-ai/shared";
import { canTransition, type ValidationRunStatus } from "../contracts/statuses";
import { sanitizeFailureMessage, type SchedulerFailureCode } from "../contracts/errors";
import { mapValidationRunRow, type ClaimedValidationRun } from "./mappers";

export interface TransitionInput {
  runId: string;
  organizationId: string;
  workerId: string;
  runVersion: number;
  from: ValidationRunStatus;
  to: ValidationRunStatus;
  failureCode?: SchedulerFailureCode;
  failureMessage?: string;
  failureMessageMaxLength?: number;
  schedulerResult?: SchedulerPlaceholderResult;
  clearLease?: boolean;
}

/**
 * Ownership-scoped status transition. Stale workers (wrong claimed_by or
 * run_version) cannot mutate the row. Invalid transitions leave data unchanged.
 */
export async function transitionOwnedRun(
  db: Queryable,
  input: TransitionInput,
): Promise<ClaimedValidationRun | null> {
  if (!canTransition(input.from, input.to)) {
    return null;
  }

  const failureMessage =
    input.failureMessage !== undefined
      ? sanitizeFailureMessage(input.failureMessage, input.failureMessageMaxLength ?? 500)
      : null;

  const isFinal = ["completed", "failed", "timed_out", "cancelled", "superseded"].includes(input.to);
  const clearLease = input.clearLease ?? isFinal;

  const result = await db.query<ValidationRunRow>(
    `update validation_runs
     set
       status = $5,
       failure_code = coalesce($6, failure_code),
       failure_message = coalesce($7, failure_message),
       scheduler_result_json = coalesce($8::jsonb, scheduler_result_json),
       completed_at = case when $9::boolean then coalesce(completed_at, now()) else completed_at end,
       cancelled_at = case when $5 = 'cancelled' then coalesce(cancelled_at, now()) else cancelled_at end,
       claimed_by = case when $10::boolean then null else claimed_by end,
       lease_expires_at = case when $10::boolean then null else lease_expires_at end,
       heartbeat_at = case when $10::boolean then heartbeat_at else heartbeat_at end
     where id = $1
       and organization_id = $2
       and claimed_by = $3
       and run_version = $4
       and status = $11
     returning *`,
    [
      input.runId,
      input.organizationId,
      input.workerId,
      input.runVersion,
      input.to,
      input.failureCode ?? null,
      failureMessage,
      input.schedulerResult ? JSON.stringify(input.schedulerResult) : null,
      isFinal,
      clearLease,
      input.from,
    ],
  );

  const row = result.rows[0];
  return row ? mapValidationRunRow(row) : null;
}

export async function getValidationRunById(
  db: Queryable,
  organizationId: string,
  runId: string,
): Promise<ClaimedValidationRun | null> {
  const result = await db.query<ValidationRunRow>(
    `select * from validation_runs where organization_id = $1 and id = $2`,
    [organizationId, runId],
  );
  const row = result.rows[0];
  return row ? mapValidationRunRow(row) : null;
}
