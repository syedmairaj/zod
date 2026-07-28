import type { PullRequestState } from "@zod-ai/shared-types";
import type { Queryable } from "../client";
import type { PullRequestRow } from "../database.types";

export interface UpsertPullRequestRevisionInput {
  organizationId: string;
  repositoryId: string;
  providerPrNumber: number;
  headSha: string;
  baseSha: string;
  title: string;
  author: string;
  state: PullRequestState;
}

/**
 * Each row is one revision (head_sha) of a pull request. A `synchronize`
 * event creates a new row (new revision) rather than mutating the previous
 * one, per the unique constraint on (repository_id, provider_pr_number,
 * head_sha). Re-delivery of the exact same revision safely upserts in place.
 */
export async function upsertPullRequestRevision(
  db: Queryable,
  input: UpsertPullRequestRevisionInput,
): Promise<PullRequestRow> {
  const result = await db.query<PullRequestRow>(
    `insert into pull_requests (
       organization_id, repository_id, provider_pr_number, head_sha, base_sha, title, author, state
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (repository_id, provider_pr_number, head_sha) do update set
       base_sha = excluded.base_sha,
       title = excluded.title,
       author = excluded.author,
       state = excluded.state
     returning *`,
    [
      input.organizationId,
      input.repositoryId,
      input.providerPrNumber,
      input.headSha,
      input.baseSha,
      input.title,
      input.author,
      input.state,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Pull request insert returned no row");
  }
  return row;
}

export async function listPullRequestsForRepository(
  db: Queryable,
  organizationId: string,
  repositoryId: string,
): Promise<PullRequestRow[]> {
  const result = await db.query<PullRequestRow>(
    `select distinct on (provider_pr_number) *
     from pull_requests
     where organization_id = $1 and repository_id = $2
     order by provider_pr_number, created_at desc`,
    [organizationId, repositoryId],
  );
  return result.rows;
}
