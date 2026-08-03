import type { Queryable } from "@zod-ai/db";
import type { EnqueuedValidationJob, EnqueueValidationJobInput } from "@zod-ai/shared";
import { logStructured } from "@zod-ai/shared";
import { commitShaPrefix } from "../contracts/events";

/**
 * Enqueues a validation job by persisting a `validation_runs` row with
 * status `queued`. Does not execute jobs. Installation tokens are never stored.
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
    max_attempts: number;
  }>(
    `insert into validation_runs (
       organization_id, repository_id, pull_request_id, commit_sha, status, trigger,
       webhook_delivery_id, available_at, attempt_count, max_attempts
     )
     values ($1, $2, $3, $4, 'queued', $5, $6, now(), 0, coalesce($7, 3))
     returning id, organization_id, repository_id, pull_request_id, commit_sha, trigger, max_attempts`,
    [
      input.organizationId,
      input.repositoryId,
      input.pullRequestId,
      input.commitSha,
      input.trigger,
      input.deliveryId,
      input.maxAttempts ?? null,
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
    commit_sha_prefix: commitShaPrefix(row.commit_sha),
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
