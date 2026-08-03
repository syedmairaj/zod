import type { Queryable, ValidationRunRow } from "@zod-ai/db";
import { logStructured } from "@zod-ai/shared";
import { commitShaPrefix } from "../contracts/events";
import { mapValidationRunRow, type ClaimedValidationRun } from "../repository/mappers";

export interface RequestCancellationInput {
  organizationId: string;
  runId: string;
}

/**
 * Idempotent cancellation request.
 * - queued → cancelled immediately
 * - active → sets cancellation_requested_at; worker finalizes cancelled
 * - already final → no-op (returns current row)
 */
export async function requestCancellation(
  db: Queryable,
  input: RequestCancellationInput,
): Promise<ClaimedValidationRun | null> {
  const existing = await db.query<ValidationRunRow>(
    `select * from validation_runs where organization_id = $1 and id = $2`,
    [input.organizationId, input.runId],
  );
  const row = existing.rows[0];
  if (!row) {
    return null;
  }

  if (["completed", "failed", "timed_out", "cancelled", "superseded"].includes(row.status)) {
    return mapValidationRunRow(row);
  }

  logStructured("info", "validation_run_cancel_requested", {
    organization_id: row.organization_id,
    repository_id: row.repository_id,
    validation_run_id: row.id,
    status: row.status,
    commit_sha_prefix: commitShaPrefix(row.commit_sha),
  });

  if (row.status === "queued") {
    const cancelled = await db.query<ValidationRunRow>(
      `update validation_runs
       set
         status = 'cancelled',
         cancellation_requested_at = coalesce(cancellation_requested_at, now()),
         cancelled_at = now(),
         completed_at = now()
       where organization_id = $1
         and id = $2
         and status = 'queued'
       returning *`,
      [input.organizationId, input.runId],
    );
    const cancelledRow = cancelled.rows[0];
    if (cancelledRow) {
      logStructured("info", "validation_run_cancelled", {
        organization_id: cancelledRow.organization_id,
        repository_id: cancelledRow.repository_id,
        validation_run_id: cancelledRow.id,
        commit_sha_prefix: commitShaPrefix(cancelledRow.commit_sha),
      });
      return mapValidationRunRow(cancelledRow);
    }
    return mapValidationRunRow(row);
  }

  const requested = await db.query<ValidationRunRow>(
    `update validation_runs
     set cancellation_requested_at = coalesce(cancellation_requested_at, now())
     where organization_id = $1
       and id = $2
       and status in ('claimed', 'preparing', 'running', 'collecting')
     returning *`,
    [input.organizationId, input.runId],
  );
  const requestedRow = requested.rows[0];
  return requestedRow ? mapValidationRunRow(requestedRow) : mapValidationRunRow(row);
}

export function isCancellationRequested(run: {
  cancellationRequestedAt: string | null;
  status: string;
}): boolean {
  return run.cancellationRequestedAt !== null || run.status === "cancelled";
}
