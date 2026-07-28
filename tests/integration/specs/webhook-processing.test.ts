import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { pullRequestsRepo, validationRunsRepo, webhookDeliveriesRepo } from "@zod-ai/db";
import { createTestPool } from "../setup/connection";
import { createTestInstallation, createTestOrganization, createTestRepository, createTestUser } from "../setup/fixtures";

/**
 * Integration tests for the webhook replay-protection and PR-revision
 * persistence logic used by app/api/github/webhook/route.ts, run against a
 * real Postgres unique constraint rather than mocked behavior.
 */
describe("webhook idempotency and pull request revision handling (real Postgres)", () => {
  let pool: Pool;
  let organizationId: string;
  let repositoryId: string;

  beforeAll(async () => {
    pool = createTestPool();
    const userId = await createTestUser(pool);
    const org = await createTestOrganization(pool, userId, "Webhook Org");
    organizationId = org.id;
    const installation = await createTestInstallation(pool, organizationId);
    repositoryId = (await createTestRepository(pool, organizationId, installation.id)).id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it("claims a delivery id exactly once; a repeat delivery is a no-op", async () => {
    const deliveryId = `delivery-${crypto.randomUUID()}`;

    const firstClaim = await webhookDeliveriesRepo.claimWebhookDelivery(pool, deliveryId, "pull_request", "opened");
    expect(firstClaim).toBe(true);

    const secondClaim = await webhookDeliveriesRepo.claimWebhookDelivery(pool, deliveryId, "pull_request", "opened");
    expect(secondClaim).toBe(false);
  });

  it("claims concurrent duplicate deliveries exactly once (race safety via unique constraint)", async () => {
    const deliveryId = `delivery-race-${crypto.randomUUID()}`;

    const results = await Promise.all(
      Array.from({ length: 5 }, () => webhookDeliveriesRepo.claimWebhookDelivery(pool, deliveryId, "pull_request", "synchronize")),
    );

    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("creates one queued validation run per new PR revision, and supersedes the run for the prior revision", async () => {
    const prV1 = await pullRequestsRepo.upsertPullRequestRevision(pool, {
      organizationId,
      repositoryId,
      providerPrNumber: 42,
      headSha: "1".repeat(40),
      baseSha: "0".repeat(40),
      title: "Add feature",
      author: "dev",
      state: "open",
    });
    const runV1 = await validationRunsRepo.createValidationRun(pool, {
      organizationId,
      repositoryId,
      pullRequestId: prV1.id,
      trigger: "pull_request_opened",
    });
    expect(runV1.status).toBe("queued");

    // Simulate a `synchronize` event: new head_sha -> new pull_requests row (new revision).
    const prV2 = await pullRequestsRepo.upsertPullRequestRevision(pool, {
      organizationId,
      repositoryId,
      providerPrNumber: 42,
      headSha: "2".repeat(40),
      baseSha: "0".repeat(40),
      title: "Add feature",
      author: "dev",
      state: "open",
    });
    expect(prV2.id).not.toBe(prV1.id);

    const runV2 = await validationRunsRepo.createValidationRun(pool, {
      organizationId,
      repositoryId,
      pullRequestId: prV2.id,
      trigger: "pull_request_synchronize",
    });

    const supersededIds = await validationRunsRepo.supersedeOpenRunsForPullRequest(
      pool,
      organizationId,
      repositoryId,
      42,
      prV2.id,
      runV2.id,
    );
    expect(supersededIds).toContain(runV1.id);

    const runs = await validationRunsRepo.listValidationRunsForRepository(pool, organizationId, repositoryId, 50);
    const persistedV1 = runs.find((r) => r.id === runV1.id);
    const persistedV2 = runs.find((r) => r.id === runV2.id);

    expect(persistedV1?.status).toBe("superseded");
    expect(persistedV1?.superseded_by).toBe(runV2.id);
    expect(persistedV2?.status).toBe("queued");
  });

  it("upserting the exact same revision twice does not create a duplicate pull_requests row", async () => {
    const first = await pullRequestsRepo.upsertPullRequestRevision(pool, {
      organizationId,
      repositoryId,
      providerPrNumber: 99,
      headSha: "9".repeat(40),
      baseSha: "0".repeat(40),
      title: "Idempotent revision",
      author: "dev",
      state: "open",
    });
    const second = await pullRequestsRepo.upsertPullRequestRevision(pool, {
      organizationId,
      repositoryId,
      providerPrNumber: 99,
      headSha: "9".repeat(40),
      baseSha: "0".repeat(40),
      title: "Idempotent revision (edited title)",
      author: "dev",
      state: "open",
    });

    expect(second.id).toBe(first.id);
    expect(second.title).toBe("Idempotent revision (edited title)");
  });
});
