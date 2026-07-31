import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { processGithubWebhook } from "@zod-ai/github";
import { UnauthorizedError } from "@zod-ai/shared";
import { validationRunsRepo } from "@zod-ai/db";
import { createTestPool } from "../setup/connection";
import {
  createTestInstallation,
  createTestOrganization,
  createTestRepository,
  createTestUser,
} from "../setup/fixtures";

const SECRET = "integration-webhook-secret";

function sign(body: string): string {
  return `sha256=${createHmac("sha256", SECRET).update(body).digest("hex")}`;
}

async function getDeliveryAction(
  pool: Pool,
  deliveryId: string,
): Promise<{ event_type: string; action: string | null; status: string } | null> {
  const result = await pool.query<{ event_type: string; action: string | null; status: string }>(
    `select event_type, action, status from webhook_deliveries where delivery_id = $1`,
    [deliveryId],
  );
  return result.rows[0] ?? null;
}

describe("processGithubWebhook (real Postgres)", () => {
  let pool: Pool;
  let organizationId: string;
  let repositoryId: string;
  let installationId: number;
  let providerRepositoryId: number;

  beforeAll(async () => {
    pool = createTestPool();
    const userId = await createTestUser(pool);
    const org = await createTestOrganization(pool, userId, "Webhook Process Org");
    organizationId = org.id;
    const installation = await createTestInstallation(pool, organizationId);
    installationId = installation.installationId;
    const repo = await createTestRepository(pool, organizationId, installation.id);
    repositoryId = repo.id;
    providerRepositoryId = repo.providerRepositoryId;
  });

  afterAll(async () => {
    await pool.end();
  });

  it("accepts a valid pull_request delivery and enqueues a queued run", async () => {
    const headSha = "a".repeat(40);
    const body = JSON.stringify({
      action: "opened",
      number: 7,
      pull_request: {
        id: 7001,
        number: 7,
        title: "Ship webhook",
        state: "open",
        merged: false,
        user: { login: "dev" },
        head: { sha: headSha },
        base: { sha: "b".repeat(40) },
      },
      repository: {
        id: providerRepositoryId,
        name: "repo",
        full_name: "acme/repo",
        private: true,
        owner: { login: "acme", id: 1 },
      },
      installation: { id: installationId },
    });
    const deliveryId = `pr-${crypto.randomUUID()}`;

    const result = await processGithubWebhook(pool, {
      rawBody: body,
      signatureHeader: sign(body),
      deliveryId,
      eventType: "pull_request",
      webhookSecret: SECRET,
    });

    expect(result.status).toBe("ok");
    expect(result.queueJobId).toBeTruthy();
    expect(result.commitSha).toBe(headSha);

    const runs = await validationRunsRepo.listValidationRunsForRepository(
      pool,
      organizationId,
      repositoryId,
      10,
    );
    const queued = runs.find((r) => r.id === result.queueJobId);
    expect(queued?.status).toBe("queued");
    expect(queued?.commit_sha).toBe(headSha);
    expect(queued?.trigger).toBe("pull_request_opened");
    expect(queued?.webhook_delivery_id).toBe(deliveryId);
  });

  it("rejects an invalid signature", async () => {
    const body = JSON.stringify({ zen: "ok" });
    await expect(
      processGithubWebhook(pool, {
        rawBody: body,
        signatureHeader: sign("tampered"),
        deliveryId: `bad-sig-${crypto.randomUUID()}`,
        eventType: "ping",
        webhookSecret: SECRET,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("treats replayed deliveries as duplicates", async () => {
    const body = JSON.stringify({
      action: "opened",
      number: 8,
      pull_request: {
        id: 8001,
        number: 8,
        title: "Replay",
        state: "open",
        merged: false,
        user: { login: "dev" },
        head: { sha: "c".repeat(40) },
        base: { sha: "d".repeat(40) },
      },
      repository: {
        id: providerRepositoryId,
        name: "repo",
        full_name: "acme/repo",
        private: true,
        owner: { login: "acme", id: 1 },
      },
      installation: { id: installationId },
    });
    const deliveryId = `replay-${crypto.randomUUID()}`;
    const input = {
      rawBody: body,
      signatureHeader: sign(body),
      deliveryId,
      eventType: "pull_request" as const,
      webhookSecret: SECRET,
    };

    const first = await processGithubWebhook(pool, input);
    const second = await processGithubWebhook(pool, input);

    expect(first.status).toBe("ok");
    expect(second.status).toBe("duplicate");

    const runs = await validationRunsRepo.listValidationRunsForRepository(
      pool,
      organizationId,
      repositoryId,
      50,
    );
    expect(runs.filter((r) => r.webhook_delivery_id === deliveryId)).toHaveLength(1);
  });

  it("ignores events for unknown installations without enqueueing", async () => {
    const body = JSON.stringify({
      action: "opened",
      number: 9,
      pull_request: {
        id: 9001,
        number: 9,
        title: "Missing install",
        state: "open",
        merged: false,
        user: { login: "dev" },
        head: { sha: "e".repeat(40) },
        base: { sha: "f".repeat(40) },
      },
      repository: {
        id: providerRepositoryId,
        name: "repo",
        full_name: "acme/repo",
        private: true,
        owner: { login: "acme", id: 1 },
      },
      installation: { id: installationId + 999_999 },
    });
    const deliveryId = `missing-install-${crypto.randomUUID()}`;

    const result = await processGithubWebhook(pool, {
      rawBody: body,
      signatureHeader: sign(body),
      deliveryId,
      eventType: "pull_request",
      webhookSecret: SECRET,
    });

    expect(result.status).toBe("ignored");
    const runs = await validationRunsRepo.listValidationRunsForRepository(
      pool,
      organizationId,
      repositoryId,
      50,
    );
    expect(runs.some((r) => r.webhook_delivery_id === deliveryId)).toBe(false);
  });

  it("acknowledges unsupported events safely", async () => {
    const body = JSON.stringify({ action: "opened", issue: { number: 1 } });
    const result = await processGithubWebhook(pool, {
      rawBody: body,
      signatureHeader: sign(body),
      deliveryId: `unsupported-${crypto.randomUUID()}`,
      eventType: "issues",
      webhookSecret: SECRET,
    });
    expect(result.status).toBe("ignored");
  });

  it("enqueues a push-triggered run bound to after SHA", async () => {
    const after = "1".repeat(40);
    const body = JSON.stringify({
      ref: "refs/heads/main",
      after,
      repository: {
        id: providerRepositoryId,
        name: "repo",
        full_name: "acme/repo",
        private: true,
        owner: { login: "acme", id: 1 },
      },
      installation: { id: installationId },
      sender: { login: "dev" },
    });
    const deliveryId = `push-${crypto.randomUUID()}`;

    const result = await processGithubWebhook(pool, {
      rawBody: body,
      signatureHeader: sign(body),
      deliveryId,
      eventType: "push",
      webhookSecret: SECRET,
    });

    expect(result.status).toBe("ok");
    expect(result.commitSha).toBe(after);
    expect(result.queueJobId).toBeTruthy();

    const runs = await validationRunsRepo.listValidationRunsForRepository(
      pool,
      organizationId,
      repositoryId,
      50,
    );
    const pushRun = runs.find((r) => r.id === result.queueJobId);
    expect(pushRun?.trigger).toBe("push");
    expect(pushRun?.pull_request_id).toBeNull();
    expect(pushRun?.commit_sha).toBe(after);
  });

  it("persists pull_request synchronize action on webhook_deliveries", async () => {
    const body = JSON.stringify({
      action: "synchronize",
      number: 11,
      pull_request: {
        id: 11001,
        number: 11,
        title: "Sync",
        state: "open",
        merged: false,
        user: { login: "dev" },
        head: { sha: "2".repeat(40) },
        base: { sha: "3".repeat(40) },
      },
      repository: {
        id: providerRepositoryId,
        name: "repo",
        full_name: "acme/repo",
        private: true,
        owner: { login: "acme", id: 1 },
      },
      installation: { id: installationId },
    });
    const deliveryId = `pr-sync-action-${crypto.randomUUID()}`;

    const result = await processGithubWebhook(pool, {
      rawBody: body,
      signatureHeader: sign(body),
      deliveryId,
      eventType: "pull_request",
      webhookSecret: SECRET,
    });

    expect(result.status).toBe("ok");
    expect(result.queueJobId).toBeTruthy();

    const delivery = await getDeliveryAction(pool, deliveryId);
    expect(delivery).toEqual({
      event_type: "pull_request",
      action: "synchronize",
      status: "processed",
    });
  });

  it("persists installation new_permissions_accepted action", async () => {
    const body = JSON.stringify({
      action: "new_permissions_accepted",
      installation: {
        id: installationId,
        account: { login: "acme", id: 1, type: "Organization" },
      },
    });
    const deliveryId = `install-action-${crypto.randomUUID()}`;

    const result = await processGithubWebhook(pool, {
      rawBody: body,
      signatureHeader: sign(body),
      deliveryId,
      eventType: "installation",
      webhookSecret: SECRET,
    });

    expect(result.status).toBe("ok");
    const delivery = await getDeliveryAction(pool, deliveryId);
    expect(delivery).toEqual({
      event_type: "installation",
      action: "new_permissions_accepted",
      status: "processed",
    });
  });

  it("persists push deliveries with action = NULL", async () => {
    const body = JSON.stringify({
      ref: "refs/heads/main",
      after: "4".repeat(40),
      repository: {
        id: providerRepositoryId,
        name: "repo",
        full_name: "acme/repo",
        private: true,
        owner: { login: "acme", id: 1 },
      },
      installation: { id: installationId },
    });
    const deliveryId = `push-null-action-${crypto.randomUUID()}`;

    await processGithubWebhook(pool, {
      rawBody: body,
      signatureHeader: sign(body),
      deliveryId,
      eventType: "push",
      webhookSecret: SECRET,
    });

    const delivery = await getDeliveryAction(pool, deliveryId);
    expect(delivery?.action).toBeNull();
    expect(delivery?.event_type).toBe("push");
  });

  it("keeps duplicate deliveries idempotent while preserving the original action", async () => {
    const body = JSON.stringify({
      action: "synchronize",
      number: 12,
      pull_request: {
        id: 12001,
        number: 12,
        title: "Dup",
        state: "open",
        merged: false,
        user: { login: "dev" },
        head: { sha: "5".repeat(40) },
        base: { sha: "6".repeat(40) },
      },
      repository: {
        id: providerRepositoryId,
        name: "repo",
        full_name: "acme/repo",
        private: true,
        owner: { login: "acme", id: 1 },
      },
      installation: { id: installationId },
    });
    const deliveryId = `dup-action-${crypto.randomUUID()}`;
    const input = {
      rawBody: body,
      signatureHeader: sign(body),
      deliveryId,
      eventType: "pull_request" as const,
      webhookSecret: SECRET,
    };

    const first = await processGithubWebhook(pool, input);
    const second = await processGithubWebhook(pool, input);

    expect(first.status).toBe("ok");
    expect(second.status).toBe("duplicate");

    const delivery = await getDeliveryAction(pool, deliveryId);
    expect(delivery?.action).toBe("synchronize");

    const count = await pool.query<{ n: string }>(
      `select count(*)::text as n from webhook_deliveries where delivery_id = $1`,
      [deliveryId],
    );
    expect(count.rows[0]?.n).toBe("1");
  });
});
