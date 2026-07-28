import type { ValidationRunTrigger } from "@zod-ai/shared-types";
import type { Queryable } from "../client";
import type { ValidationRunRow } from "../database.types";

export interface CreateValidationRunInput {
  organizationId: string;
  repositoryId: string;
  pullRequestId: string;
  trigger: ValidationRunTrigger;
}

export async function createValidationRun(
  db: Queryable,
  input: CreateValidationRunInput,
): Promise<ValidationRunRow> {
  const result = await db.query<ValidationRunRow>(
    `insert into validation_runs (organization_id, repository_id, pull_request_id, status, trigger)
     values ($1, $2, $3, 'queued', $4)
     returning *`,
    [input.organizationId, input.repositoryId, input.pullRequestId, input.trigger],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Validation run insert returned no row");
  }
  return row;
}

/**
 * Marks any still-pending validation runs for earlier revisions of the same
 * pull request (by provider_pr_number) as superseded by the new run, per
 * ARCHITECTURE.md 9 ("Cancel superseded PR runs"). Actual cancellation of
 * in-flight work happens in the (not-yet-built) orchestrator; this is the
 * persistence-layer bookkeeping only.
 */
export async function supersedeOpenRunsForPullRequest(
  db: Queryable,
  organizationId: string,
  repositoryId: string,
  providerPrNumber: number,
  keepPullRequestId: string,
  supersededByRunId: string,
): Promise<string[]> {
  const result = await db.query<{ id: string }>(
    `update validation_runs vr
     set status = 'superseded', superseded_by = $5
     from pull_requests pr
     where vr.pull_request_id = pr.id
       and vr.organization_id = $1
       and vr.repository_id = $2
       and pr.provider_pr_number = $3
       and pr.id <> $4
       and vr.status in ('queued', 'running')
     returning vr.id`,
    [organizationId, repositoryId, providerPrNumber, keepPullRequestId, supersededByRunId],
  );
  return result.rows.map((row) => row.id);
}

export interface ValidationRunWithContext extends ValidationRunRow {
  provider_pr_number: number;
  pr_title: string;
  head_sha: string;
  repository_owner: string;
  repository_name: string;
}

export async function listValidationRunsForOrganization(
  db: Queryable,
  organizationId: string,
  limit = 50,
): Promise<ValidationRunWithContext[]> {
  const result = await db.query<ValidationRunWithContext>(
    `select vr.*, pr.provider_pr_number, pr.title as pr_title, pr.head_sha,
            r.owner as repository_owner, r.name as repository_name
     from validation_runs vr
     join pull_requests pr on pr.id = vr.pull_request_id
     join repositories r on r.id = vr.repository_id
     where vr.organization_id = $1
     order by vr.created_at desc
     limit $2`,
    [organizationId, limit],
  );
  return result.rows;
}

export async function listValidationRunsForRepository(
  db: Queryable,
  organizationId: string,
  repositoryId: string,
  limit = 50,
): Promise<ValidationRunWithContext[]> {
  const result = await db.query<ValidationRunWithContext>(
    `select vr.*, pr.provider_pr_number, pr.title as pr_title, pr.head_sha,
            r.owner as repository_owner, r.name as repository_name
     from validation_runs vr
     join pull_requests pr on pr.id = vr.pull_request_id
     join repositories r on r.id = vr.repository_id
     where vr.organization_id = $1 and vr.repository_id = $2
     order by vr.created_at desc
     limit $3`,
    [organizationId, repositoryId, limit],
  );
  return result.rows;
}
