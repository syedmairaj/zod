import type { Queryable } from "@zod-ai/db";
import type { EnqueuedValidationJob, EnqueueValidationJobInput } from "@zod-ai/shared";
import { logStructured } from "@zod-ai/shared";

/**
 * Enqueues a validation job by persisting a `validation_runs` row with
 * status `queued`. Milestone 2 does not execute jobs — Milestone 3+ workers
 * will lease these rows. Installation tokens are never stored here.
 */
export async function enqueueValidationJob(
  db: Queryable,
  input: EnqueueValidationJobInput,
): Promise<EnqueuedValidationJob> {
  const result = await db.query<{
    id: string;
    organization_id: string;
    repository_id: string;
    pull_request_id: string | null;
    commit_sha: string | null;
    trigger: EnqueueValidationJobInput["trigger"];
  }>(
    `insert into validation_runs (
       organization_id, repository_id, pull_request_id, commit_sha, status, trigger, webhook_delivery_id
     )
     values ($1, $2, $3, $4, 'queued', $5, $6)
     returning id, organization_id, repository_id, pull_request_id, commit_sha, trigger`,
    [
      input.organizationId,
      input.repositoryId,
      input.pullRequestId,
      input.commitSha,
      input.trigger,
      input.deliveryId,
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Queue enqueue returned no row");
  }

  logStructured("info", "validation_job_enqueued", {
    organization_id: row.organization_id,
    repository_id: row.repository_id,
    job_id: row.id,
    trigger: row.trigger,
    commit_sha: row.commit_sha,
    operation: "enqueue",
    result: "ok",
  });

  return {
    id: row.id,
    organizationId: row.organization_id,
    repositoryId: row.repository_id,
    pullRequestId: row.pull_request_id,
    commitSha: row.commit_sha ?? input.commitSha,
    trigger: row.trigger,
    status: "queued",
  };
}
