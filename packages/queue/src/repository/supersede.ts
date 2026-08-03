import type { Queryable } from "@zod-ai/db";
import { logStructured } from "@zod-ai/shared";
import { commitShaPrefix } from "../contracts/events";

/**
 * Supersedes older open runs for the same PR number.
 * Push and PR contexts do not supersede unrelated work (PR-number scoped).
 * Active runs become superseded immediately; workers cannot finalize afterward.
 */
export async function supersedeOpenRunsForPullRequest(
  db: Queryable,
  organizationId: string,
  repositoryId: string,
  providerPrNumber: number,
  keepPullRequestId: string,
  supersededByRunId: string,
): Promise<string[]> {
  const result = await db.query<{
    id: string;
    commit_sha: string | null;
    status: string;
  }>(
    `update validation_runs vr
     set
       status = 'superseded',
       superseded_by = $5,
       completed_at = coalesce(vr.completed_at, now()),
       claimed_by = null,
       lease_expires_at = null,
       cancellation_requested_at = coalesce(vr.cancellation_requested_at, now())
     from pull_requests pr
     where vr.pull_request_id = pr.id
       and vr.organization_id = $1
       and vr.repository_id = $2
       and pr.provider_pr_number = $3
       and pr.id <> $4
       and vr.status in ('queued', 'claimed', 'preparing', 'running', 'collecting')
     returning vr.id, vr.commit_sha, vr.status`,
    [organizationId, repositoryId, providerPrNumber, keepPullRequestId, supersededByRunId],
  );

  for (const row of result.rows) {
    logStructured("info", "validation_run_superseded", {
      organization_id: organizationId,
      repository_id: repositoryId,
      validation_run_id: row.id,
      superseded_by: supersededByRunId,
      commit_sha_prefix: commitShaPrefix(row.commit_sha),
    });
  }

  return result.rows.map((row) => row.id);
}
