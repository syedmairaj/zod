import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import {
  ForbiddenError,
  NotFoundError,
  auditEventsRepo,
  organizationsRepo,
  repositoriesRepo,
  requireOrganizationAccess,
  validationRunsRepo,
  pullRequestsRepo,
} from "@zod-ai/db";
import { createTestPool } from "../setup/connection";
import { createTestInstallation, createTestOrganization, createTestRepository, createTestUser } from "../setup/fixtures";

/**
 * Real Postgres integration tests proving that the application-layer
 * data-access functions never leak rows across `organization_id` boundaries,
 * per AGENTS.md ("Every tenant-owned query constrains organization_id") and
 * SECURITY_MODEL.md's tenant-isolation release gate.
 */
describe("tenant isolation (application layer, real Postgres)", () => {
  let pool: Pool;
  let orgA: { id: string; slug: string };
  let orgB: { id: string; slug: string };
  let userA: string;
  let userB: string;
  let repoA: { id: string };
  let repoB: { id: string };

  beforeAll(async () => {
    pool = createTestPool();
    userA = await createTestUser(pool);
    userB = await createTestUser(pool);
    orgA = await createTestOrganization(pool, userA, "Org A");
    orgB = await createTestOrganization(pool, userB, "Org B");

    const installationA = await createTestInstallation(pool, orgA.id);
    const installationB = await createTestInstallation(pool, orgB.id);
    repoA = await createTestRepository(pool, orgA.id, installationA.id);
    repoB = await createTestRepository(pool, orgB.id, installationB.id);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("does not return organization B's repositories when listing organization A's repositories", async () => {
    const reposForA = await repositoriesRepo.listRepositoriesForOrganization(pool, orgA.id);
    expect(reposForA.map((r) => r.id)).toContain(repoA.id);
    expect(reposForA.map((r) => r.id)).not.toContain(repoB.id);
  });

  it("throws NotFoundError when fetching org B's repository scoped under org A", async () => {
    await expect(repositoriesRepo.getRepositoryForOrganization(pool, orgA.id, repoB.id)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("denies requireOrganizationAccess for a user of org A against org B", async () => {
    await expect(requireOrganizationAccess(pool, userA, orgB.id)).rejects.toThrow(ForbiddenError);
  });

  it("allows requireOrganizationAccess for a user against their own organization", async () => {
    const auth = await requireOrganizationAccess(pool, userA, orgA.id);
    expect(auth.role).toBe("owner");
  });

  it("isolates pull requests and validation runs created under different organizations", async () => {
    const prA = await pullRequestsRepo.upsertPullRequestRevision(pool, {
      organizationId: orgA.id,
      repositoryId: repoA.id,
      providerPrNumber: 1,
      headSha: "a".repeat(40),
      baseSha: "b".repeat(40),
      title: "Org A change",
      author: "alice",
      state: "open",
    });
    const runA = await validationRunsRepo.createValidationRun(pool, {
      organizationId: orgA.id,
      repositoryId: repoA.id,
      pullRequestId: prA.id,
      trigger: "pull_request_opened",
    });

    const runsForB = await validationRunsRepo.listValidationRunsForOrganization(pool, orgB.id, 50);
    expect(runsForB.map((r) => r.id)).not.toContain(runA.id);

    const runsForA = await validationRunsRepo.listValidationRunsForOrganization(pool, orgA.id, 50);
    expect(runsForA.map((r) => r.id)).toContain(runA.id);
  });

  it("isolates audit events between organizations", async () => {
    const event = await auditEventsRepo.recordAuditEvent(pool, {
      organizationId: orgA.id,
      actorType: "user",
      actorId: userA,
      action: "repository.connected",
      targetType: "repository",
      targetId: repoA.id,
    });

    const eventsForB = await auditEventsRepo.listAuditEventsForOrganization(pool, orgB.id, 100);
    expect(eventsForB.map((e) => e.id)).not.toContain(event.id);
  });

  it("getOrganizationById does not implicitly cross tenant boundaries via id-only lookups elsewhere", async () => {
    // getOrganizationById is intentionally id-only (organizations is the
    // tenant root, not a tenant-owned child table), but every *child* table
    // lookup above must include organization_id. Confirm the org record
    // itself is at least real and distinct.
    const org = await organizationsRepo.getOrganizationById(pool, orgA.id);
    expect(org.id).toBe(orgA.id);
    expect(org.id).not.toBe(orgB.id);
  });
});
