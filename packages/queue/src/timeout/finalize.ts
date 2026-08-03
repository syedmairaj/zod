import type { Queryable } from "@zod-ai/db";
import { logStructured } from "@zod-ai/shared";
import { commitShaPrefix } from "../contracts/events";
import { transitionOwnedRun } from "../repository/transitions";
import type { ClaimedValidationRun } from "../repository/mappers";
import type { ValidationRunStatus } from "../contracts/statuses";

/**
 * Ownership-scoped timeout finalization. Late completion after this is ignored
 * because run_version/claimed_by/status no longer match.
 */
export async function finalizeTimedOut(
  db: Queryable,
  run: ClaimedValidationRun,
  from: ValidationRunStatus,
): Promise<ClaimedValidationRun | null> {
  const updated = await transitionOwnedRun(db, {
    runId: run.id,
    organizationId: run.organizationId,
    workerId: run.claimedBy,
    runVersion: run.runVersion,
    from,
    to: "timed_out",
    failureCode: "timed_out",
    failureMessage: "Run exceeded configured timeout",
    clearLease: true,
  });

  if (updated) {
    logStructured("warn", "validation_run_timed_out", {
      organization_id: run.organizationId,
      repository_id: run.repositoryId,
      validation_run_id: run.id,
      worker_id: run.claimedBy,
      attempt: run.attemptCount,
      commit_sha_prefix: commitShaPrefix(run.commitSha),
      error_code: "timed_out",
    });
  }

  return updated;
}
