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
       owner, name, default_branch, is_private, status, disconnected_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, 'active', null)
     on conflict (github_installation_id, provider_repository_id) do update set
       owner = excluded.owner,
       name = excluded.name,
       default_branch = excluded.default_branch,
       is_private = excluded.is_private,
       status = 'active',
       disconnected_at = null
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

export async function disconnectRepository(
  db: Queryable,
  organizationId: string,
  repositoryId: string,
): Promise<RepositoryRow> {
  const result = await db.query<RepositoryRow>(
    `update repositories
     set status = 'disconnected', disconnected_at = coalesce(disconnected_at, now())
     where organization_id = $1 and id = $2
     returning *`,
    [organizationId, repositoryId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError(`Repository ${repositoryId} not found`);
  }
  return row;
}

/**
 * Sync metadata for repositories already known to Zod.ai against the live
 * GitHub installation list. Does not auto-connect unauthorized or newly
 * visible repos — selection remains an explicit product action.
 *
 * - rename / visibility / default branch → update in place
 * - missing from GitHub access → status disconnected + disconnected_at
 * - still on GitHub but previously disconnected → leave disconnected
 *   (user must re-select to reactivate)
 */
export async function syncRepositoriesFromInstallation(
  db: Queryable,
  organizationId: string,
  githubInstallationId: string,
  available: Array<{
    providerRepositoryId: number;
    owner: string;
    name: string;
    defaultBranch: string;
    isPrivate: boolean;
  }>,
): Promise<{ updated: number; disconnected: number }> {
  const availableById = new Map(
    available.map((repo) => [Number(repo.providerRepositoryId), repo] as const),
  );
  const existing = await listRepositoriesForInstallation(db, organizationId, githubInstallationId);

  let updated = 0;
  let disconnected = 0;

  for (const row of existing) {
    const providerId = Number(row.provider_repository_id);
    const live = availableById.get(providerId);
    if (!live) {
      if (row.status !== "disconnected") {
        await disconnectRepository(db, organizationId, row.id);
        disconnected += 1;
      }
      continue;
    }

    await db.query(
      `update repositories set
         owner = $3,
         name = $4,
         default_branch = $5,
         is_private = $6
       where organization_id = $1 and id = $2`,
      [organizationId, row.id, live.owner, live.name, live.defaultBranch, live.isPrivate],
    );
    updated += 1;
  }

  return { updated, disconnected };
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

export async function listRepositoriesForInstallation(
  db: Queryable,
  organizationId: string,
  githubInstallationId: string,
): Promise<RepositoryRow[]> {
  const result = await db.query<RepositoryRow>(
    `select * from repositories
     where organization_id = $1 and github_installation_id = $2
     order by created_at desc`,
    [organizationId, githubInstallationId],
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
