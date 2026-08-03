import type { Queryable, ValidationRunRow } from "@zod-ai/db";
import { logStructured } from "@zod-ai/shared";
import { commitShaPrefix } from "../contracts/events";
import { mapValidationRunRow, type ClaimedValidationRun } from "../repository/mappers";

export interface RenewLeaseInput {
  runId: string;
  organizationId: string;
  workerId: string;
  runVersion: number;
  leaseDurationMs: number;
}

/**
 * Extends lease for the owning worker only. Returns null if ownership lost.
 */
export async function renewLease(
  db: Queryable,
  input: RenewLeaseInput,
): Promise<ClaimedValidationRun | null> {
  const result = await db.query<ValidationRunRow>(
    `update validation_runs
     set
       heartbeat_at = now(),
       lease_expires_at = now() + ($5::text || ' milliseconds')::interval
     where id = $1
       and organization_id = $2
       and claimed_by = $3
       and run_version = $4
       and status in ('claimed', 'preparing', 'running', 'collecting')
     returning *`,
    [
      input.runId,
      input.organizationId,
      input.workerId,
      input.runVersion,
      String(input.leaseDurationMs),
    ],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  logStructured("debug", "validation_run_heartbeat", {
    organization_id: row.organization_id,
    repository_id: row.repository_id,
    validation_run_id: row.id,
    worker_id: input.workerId,
    attempt: row.attempt_count,
    status: row.status,
    commit_sha_prefix: commitShaPrefix(row.commit_sha),
  });

  return mapValidationRunRow(row);
}
