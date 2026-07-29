import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { githubInstallationsRepo, repositoriesRepo } from "@zod-ai/db";
import { createTestPool } from "../setup/connection";
import { createTestInstallation, createTestOrganization, createTestUser } from "../setup/fixtures";

describe("Milestone 1 GitHub onboarding schema and persistence", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createTestPool();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("stores account_id, permissions_json, and installed_by_user_id on new installations", async () => {
    const userId = await createTestUser(pool);
    const org = await createTestOrganization(pool, userId);
    const installationId = Math.floor(Math.random() * 1_000_000_000);

    const linked = await githubInstallationsRepo.linkOrRefreshInstallation(pool, {
      organizationId: org.id,
      installationId,
      accountLogin: "acme",
      accountId: "9007199254740993",
      permissions: { metadata: "read", pull_requests: "read" },
      installedByUserId: userId,
    });

    expect(linked.kind).toBe("created");
    if (linked.kind === "conflict") return;
    expect(linked.installation.account_id).toBe("9007199254740993");
    expect(linked.installation.permissions_json).toEqual({ metadata: "read", pull_requests: "read" });
    expect(linked.installation.installed_by_user_id).toBe(userId);
    expect(linked.installation.revoked_at).toBeNull();
  });

  it("allows legacy nullable rows and refreshes them without inventing prior metadata", async () => {
    const userId = await createTestUser(pool);
    const org = await createTestOrganization(pool, userId);
    const legacy = await createTestInstallation(pool, org.id);

    const row = await githubInstallationsRepo.getInstallationForOrganization(pool, org.id, legacy.id);
    expect(row.account_id).toBeNull();
    expect(row.permissions_json).toBeNull();
    expect(row.installed_by_user_id).toBeNull();

    const refreshed = await githubInstallationsRepo.linkOrRefreshInstallation(pool, {
      organizationId: org.id,
      installationId: legacy.installationId,
      accountLogin: "acme-refreshed",
      accountId: "42",
      permissions: { metadata: "read" },
      installedByUserId: userId,
    });

    expect(refreshed.kind).toBe("refreshed");
    if (refreshed.kind !== "refreshed") return;
    expect(refreshed.installation.account_login).toBe("acme-refreshed");
    expect(refreshed.installation.account_id).toBe("42");
    expect(refreshed.installation.permissions_json).toEqual({ metadata: "read" });
  });

  it("is idempotent for the same organization and rejects cross-organization linking", async () => {
    const userA = await createTestUser(pool);
    const userB = await createTestUser(pool);
    const orgA = await createTestOrganization(pool, userA, "Org A");
    const orgB = await createTestOrganization(pool, userB, "Org B");
    const installationId = Math.floor(Math.random() * 1_000_000_000);

    const first = await githubInstallationsRepo.linkOrRefreshInstallation(pool, {
      organizationId: orgA.id,
      installationId,
      accountLogin: "shared",
      accountId: "11",
      permissions: { metadata: "read" },
      installedByUserId: userA,
    });
    expect(first.kind).toBe("created");

    const again = await githubInstallationsRepo.linkOrRefreshInstallation(pool, {
      organizationId: orgA.id,
      installationId,
      accountLogin: "shared",
      accountId: "11",
      permissions: { metadata: "read", checks: "write" },
      installedByUserId: userA,
    });
    expect(again.kind).toBe("refreshed");
    if (again.kind === "refreshed") {
      expect(again.installation.permissions_json).toEqual({ metadata: "read", checks: "write" });
    }

    const conflict = await githubInstallationsRepo.linkOrRefreshInstallation(pool, {
      organizationId: orgB.id,
      installationId,
      accountLogin: "shared",
      accountId: "11",
      permissions: { metadata: "read" },
      installedByUserId: userB,
    });
    expect(conflict.kind).toBe("conflict");

    const stillA = await githubInstallationsRepo.getInstallationByInstallationId(pool, installationId);
    expect(stillA?.organization_id).toBe(orgA.id);
  });

  it("rejects direct organization_id updates via database trigger", async () => {
    const userA = await createTestUser(pool);
    const userB = await createTestUser(pool);
    const orgA = await createTestOrganization(pool, userA, "Trigger A");
    const orgB = await createTestOrganization(pool, userB, "Trigger B");
    const installation = await createTestInstallation(pool, orgA.id);

    await expect(
      pool.query(`update github_installations set organization_id = $1 where id = $2`, [orgB.id, installation.id]),
    ).rejects.toThrow(/organization_id is immutable/);
  });

  it("rejects repository installation reassignment", async () => {
    const user = await createTestUser(pool);
    const org = await createTestOrganization(pool, user);
    const installationA = await createTestInstallation(pool, org.id);
    const installationB = await createTestInstallation(pool, org.id);
    const repo = await repositoriesRepo.connectRepository(pool, {
      organizationId: org.id,
      githubInstallationId: installationA.id,
      providerRepositoryId: Math.floor(Math.random() * 1_000_000_000),
      owner: "acme",
      name: "store",
      defaultBranch: "main",
      isPrivate: true,
    });

    await expect(
      pool.query(`update repositories set github_installation_id = $1 where id = $2`, [installationB.id, repo.id]),
    ).rejects.toThrow(/immutable/);
  });

  it("sets and clears revoked_at and disconnected_at correctly", async () => {
    const userId = await createTestUser(pool);
    const org = await createTestOrganization(pool, userId);
    const linked = await githubInstallationsRepo.linkOrRefreshInstallation(pool, {
      organizationId: org.id,
      installationId: Math.floor(Math.random() * 1_000_000_000),
      accountLogin: "revoke-me",
      accountId: "77",
      permissions: { metadata: "read" },
      installedByUserId: userId,
    });
    if (linked.kind === "conflict") throw new Error("unexpected conflict");

    const revoked = await githubInstallationsRepo.revokeInstallationForOrganization(
      pool,
      org.id,
      linked.installation.id,
    );
    expect(revoked.status).toBe("deleted");
    expect(revoked.revoked_at).toBeTruthy();

    const reconnected = await githubInstallationsRepo.linkOrRefreshInstallation(pool, {
      organizationId: org.id,
      installationId: linked.installation.installation_id,
      accountLogin: "revoke-me",
      accountId: "77",
      permissions: { metadata: "read" },
      installedByUserId: userId,
    });
    expect(reconnected.kind).toBe("refreshed");
    if (reconnected.kind === "refreshed") {
      expect(reconnected.installation.status).toBe("active");
      expect(reconnected.installation.revoked_at).toBeNull();
    }

    const repo = await repositoriesRepo.connectRepository(pool, {
      organizationId: org.id,
      githubInstallationId: linked.installation.id,
      providerRepositoryId: Math.floor(Math.random() * 1_000_000_000),
      owner: "acme",
      name: "api",
      defaultBranch: "main",
      isPrivate: true,
    });
    expect(repo.disconnected_at).toBeNull();

    const disconnected = await repositoriesRepo.disconnectRepository(pool, org.id, repo.id);
    expect(disconnected.status).toBe("disconnected");
    expect(disconnected.disconnected_at).toBeTruthy();

    const reactivated = await repositoriesRepo.connectRepository(pool, {
      organizationId: org.id,
      githubInstallationId: linked.installation.id,
      providerRepositoryId: repo.provider_repository_id,
      owner: "acme",
      name: "api-renamed",
      defaultBranch: "main",
      isPrivate: false,
    });
    expect(reactivated.id).toBe(repo.id);
    expect(reactivated.name).toBe("api-renamed");
    expect(reactivated.is_private).toBe(false);
    expect(reactivated.status).toBe("active");
    expect(reactivated.disconnected_at).toBeNull();
  });

  it("syncs renames, visibility, and removed access without creating duplicates", async () => {
    const userId = await createTestUser(pool);
    const org = await createTestOrganization(pool, userId);
    const installation = await createTestInstallation(pool, org.id);
    const providerA = Math.floor(Math.random() * 1_000_000_000);
    const providerB = providerA + 1;

    const first = await repositoriesRepo.connectRepository(pool, {
      organizationId: org.id,
      githubInstallationId: installation.id,
      providerRepositoryId: providerA,
      owner: "acme",
      name: "old-name",
      defaultBranch: "main",
      isPrivate: true,
    });

    await repositoriesRepo.connectRepository(pool, {
      organizationId: org.id,
      githubInstallationId: installation.id,
      providerRepositoryId: providerB,
      owner: "acme",
      name: "gone",
      defaultBranch: "main",
      isPrivate: true,
    });

    const sync = await repositoriesRepo.syncRepositoriesFromInstallation(pool, org.id, installation.id, [
      {
        providerRepositoryId: providerA,
        owner: "acme",
        name: "new-name",
        defaultBranch: "develop",
        isPrivate: false,
      },
    ]);

    expect(sync.disconnected).toBe(1);
    expect(sync.updated).toBe(1);

    const rows = await repositoriesRepo.listRepositoriesForInstallation(pool, org.id, installation.id);
    expect(rows).toHaveLength(2);

    const renamed = rows.find((row) => Number(row.provider_repository_id) === providerA);
    expect(renamed?.id).toBe(first.id);
    expect(renamed?.name).toBe("new-name");
    expect(renamed?.is_private).toBe(false);
    expect(renamed?.status).toBe("active");

    const removed = rows.find((row) => Number(row.provider_repository_id) === providerB);
    expect(removed?.status).toBe("disconnected");
    expect(removed?.disconnected_at).toBeTruthy();
  });

  it("does not write encrypted_credentials_reference during link or refresh", async () => {
    const userId = await createTestUser(pool);
    const org = await createTestOrganization(pool, userId);
    const linked = await githubInstallationsRepo.linkOrRefreshInstallation(pool, {
      organizationId: org.id,
      installationId: Math.floor(Math.random() * 1_000_000_000),
      accountLogin: "no-tokens",
      accountId: "1",
      permissions: { metadata: "read" },
      installedByUserId: userId,
    });
    if (linked.kind === "conflict") throw new Error("unexpected conflict");
    expect(linked.installation.encrypted_credentials_reference).toBeNull();
  });
});
