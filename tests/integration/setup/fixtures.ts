import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { githubInstallationsRepo, organizationsRepo, repositoriesRepo, withTransaction } from "@zod-ai/db";

export async function createTestUser(pool: Pool, email = `${randomUUID()}@example.com`): Promise<string> {
  const result = await pool.query<{ id: string }>(`insert into auth.users (email) values ($1) returning id`, [
    email,
  ]);
  const row = result.rows[0];
  if (!row) throw new Error("Failed to insert test auth.users row");
  return row.id;
}

export async function createTestOrganization(
  pool: Pool,
  ownerUserId: string,
  namePrefix = "Test Org",
): Promise<{ id: string; slug: string }> {
  const slug = `${namePrefix.toLowerCase().replace(/\s+/g, "-")}-${randomUUID().slice(0, 8)}`;
  const org = await withTransaction(pool, (client) =>
    organizationsRepo.createOrganizationWithOwner(client, { name: namePrefix, slug, ownerUserId }),
  );
  return { id: org.id, slug: org.slug };
}

export async function createTestInstallation(
  pool: Pool,
  organizationId: string,
  installationId = Math.floor(Math.random() * 1_000_000_000),
): Promise<{ id: string; installationId: number }> {
  const installation = await githubInstallationsRepo.linkInstallation(pool, {
    organizationId,
    installationId,
    accountLogin: `account-${installationId}`,
  });
  return {
    id: installation.id,
    // pg may return int8-ish values as strings; GitHub wire format is numeric.
    installationId: Number(installation.installation_id),
  };
}

export async function createTestRepository(
  pool: Pool,
  organizationId: string,
  githubInstallationId: string,
  providerRepositoryId = Math.floor(Math.random() * 1_000_000_000),
): Promise<{ id: string; owner: string; name: string; providerRepositoryId: number }> {
  const repo = await repositoriesRepo.connectRepository(pool, {
    organizationId,
    githubInstallationId,
    providerRepositoryId,
    owner: "acme",
    name: `repo-${providerRepositoryId}`,
    defaultBranch: "main",
    isPrivate: true,
  });
  return {
    id: repo.id,
    owner: repo.owner,
    name: repo.name,
    providerRepositoryId: Number(repo.provider_repository_id),
  };
}
