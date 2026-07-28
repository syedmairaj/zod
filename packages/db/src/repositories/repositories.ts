import type { Queryable } from "../client";
import type { RepositoryRow } from "../database.types";
import { NotFoundError } from "../errors";

export interface ConnectRepositoryInput {
  organizationId: string;
  githubInstallationId: string;
  providerRepositoryId: number;
  owner: string;
  name: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export async function connectRepository(db: Queryable, input: ConnectRepositoryInput): Promise<RepositoryRow> {
  const result = await db.query<RepositoryRow>(
    `insert into repositories (
       organization_id, github_installation_id, provider_repository_id,
       owner, name, default_branch, is_private, status
     )
     values ($1, $2, $3, $4, $5, $6, $7, 'active')
     on conflict (github_installation_id, provider_repository_id) do update set
       owner = excluded.owner,
       name = excluded.name,
       default_branch = excluded.default_branch,
       is_private = excluded.is_private,
       status = 'active'
     returning *`,
    [
      input.organizationId,
      input.githubInstallationId,
      input.providerRepositoryId,
      input.owner,
      input.name,
      input.defaultBranch,
      input.isPrivate,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Repository insert returned no row");
  }
  return row;
}

export async function listRepositoriesForOrganization(
  db: Queryable,
  organizationId: string,
): Promise<RepositoryRow[]> {
  const result = await db.query<RepositoryRow>(
    `select * from repositories where organization_id = $1 order by created_at desc`,
    [organizationId],
  );
  return result.rows;
}

export async function getRepositoryForOrganization(
  db: Queryable,
  organizationId: string,
  repositoryId: string,
): Promise<RepositoryRow> {
  const result = await db.query<RepositoryRow>(
    `select * from repositories where organization_id = $1 and id = $2`,
    [organizationId, repositoryId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError(`Repository ${repositoryId} not found`);
  }
  return row;
}

/**
 * Resolves a repository from GitHub's own installation_id + repository_id.
 * Like `getInstallationByInstallationId`, this is the trusted bootstrap
 * lookup for the webhook path: both ids originate from a signature-verified
 * payload, and this query is how we derive organization_id, not something we
 * filter by (it doesn't exist as an input yet).
 */
export async function findRepositoryByProviderIds(
  db: Queryable,
  installationId: number,
  providerRepositoryId: number,
): Promise<RepositoryRow | null> {
  const result = await db.query<RepositoryRow>(
    `select r.*
     from repositories r
     join github_installations gi on gi.id = r.github_installation_id
     where gi.installation_id = $1 and r.provider_repository_id = $2`,
    [installationId, providerRepositoryId],
  );
  return result.rows[0] ?? null;
}
