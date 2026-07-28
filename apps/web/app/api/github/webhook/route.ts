import { verifyGithubWebhookSignature } from "@zod-ai/github";
import {
  GithubInstallationPayloadSchema,
  GithubPullRequestPayloadSchema,
  type ValidationRunTrigger,
} from "@zod-ai/shared-types";
import {
  auditEventsRepo,
  githubInstallationsRepo,
  pullRequestsRepo,
  repositoriesRepo,
  validationRunsRepo,
  webhookDeliveriesRepo,
  type Queryable,
} from "@zod-ai/db";
import { NextResponse, type NextRequest } from "next/server";
import { getDbPool } from "@/lib/db";
import { getServerEnv } from "@/lib/env.server";

export const dynamic = "force-dynamic";

const HANDLED_PR_ACTIONS = new Set(["opened", "synchronize", "reopened"]);

/**
 * GitHub webhook ingress. Every request is:
 *   1. Signature-verified over the raw body (rejects before any DB write).
 *   2. Idempotency-claimed by delivery id (duplicate deliveries are a no-op).
 *   3. Routed to a narrow, schema-validated handler per event type.
 * Only `pull_request` (opened/synchronize/reopened) and `installation`
 * events are handled in Milestone 1; everything else is acknowledged and
 * ignored.
 */
export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const pool = getDbPool();

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const deliveryId = request.headers.get("x-github-delivery");
  const eventType = request.headers.get("x-github-event");

  if (!deliveryId || !eventType) {
    return NextResponse.json({ error: "Missing X-GitHub-Delivery or X-GitHub-Event header" }, { status: 400 });
  }

  if (!verifyGithubWebhookSignature(rawBody, signature, env.GITHUB_APP_WEBHOOK_SECRET)) {
    await webhookDeliveriesRepo
      .markWebhookDeliveryRejected(pool, deliveryId, eventType, null, "invalid_signature")
      .catch(() => undefined);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const claimed = await webhookDeliveriesRepo.claimWebhookDelivery(pool, deliveryId, eventType, null);
  if (!claimed) {
    return NextResponse.json({ status: "duplicate" });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (eventType === "ping") {
      return NextResponse.json({ status: "ok" });
    }
    if (eventType === "installation") {
      await handleInstallationEvent(pool, payload, deliveryId);
      return NextResponse.json({ status: "ok" });
    }
    if (eventType === "pull_request") {
      await handlePullRequestEvent(pool, payload, deliveryId);
      return NextResponse.json({ status: "ok" });
    }
    return NextResponse.json({ status: "ignored" });
  } catch (error) {
    // A processing failure must not be silently treated as success -- but
    // the delivery is already claimed, so GitHub's automatic retry of the
    // *same* delivery id is expected to also short-circuit as "duplicate".
    // eslint-disable-next-line no-console
    console.error("[webhook] processing failed", { deliveryId, eventType, error });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function handleInstallationEvent(pool: Queryable, payload: unknown, deliveryId: string): Promise<void> {
  const parsed = GithubInstallationPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid installation payload: ${parsed.error.message}`);
  }

  const { action, installation } = parsed.data;
  const existing = await githubInstallationsRepo.getInstallationByInstallationId(pool, installation.id);

  if (!existing) {
    // Not yet linked to an organization -- the install callback
    // (app/api/github/install/callback) performs the initial link and may
    // simply not have completed yet. Nothing to persist.
    return;
  }

  await webhookDeliveriesRepo.attachWebhookDeliveryOrganization(pool, deliveryId, existing.organization_id);

  if (action === "deleted") {
    await githubInstallationsRepo.updateInstallationStatus(pool, existing.organization_id, installation.id, "deleted");
  } else if (action === "suspend") {
    await githubInstallationsRepo.updateInstallationStatus(
      pool,
      existing.organization_id,
      installation.id,
      "suspended",
    );
  } else if (action === "unsuspend") {
    await githubInstallationsRepo.updateInstallationStatus(pool, existing.organization_id, installation.id, "active");
  }

  await auditEventsRepo
    .recordAuditEvent(pool, {
      organizationId: existing.organization_id,
      actorType: "github",
      actorId: String(installation.account.id),
      action: "github_installation.connected",
      targetType: "github_installation",
      targetId: existing.id,
      metadata: { webhookAction: action },
    })
    .catch(() => undefined);
}

async function handlePullRequestEvent(pool: Queryable, payload: unknown, deliveryId: string): Promise<void> {
  const parsed = GithubPullRequestPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid pull_request payload: ${parsed.error.message}`);
  }

  const { action, pull_request: pr, repository, installation } = parsed.data;

  if (!installation || !HANDLED_PR_ACTIONS.has(action)) {
    return;
  }

  const repoRow = await repositoriesRepo.findRepositoryByProviderIds(pool, installation.id, repository.id);
  if (!repoRow) {
    // Not a repository this organization has connected; nothing to do.
    return;
  }

  await webhookDeliveriesRepo.attachWebhookDeliveryOrganization(pool, deliveryId, repoRow.organization_id);

  const prRow = await pullRequestsRepo.upsertPullRequestRevision(pool, {
    organizationId: repoRow.organization_id,
    repositoryId: repoRow.id,
    providerPrNumber: pr.number,
    headSha: pr.head.sha,
    baseSha: pr.base.sha,
    title: pr.title,
    author: pr.user.login,
    state: pr.merged ? "merged" : pr.state,
  });

  const trigger: ValidationRunTrigger =
    action === "opened" ? "pull_request_opened" : action === "reopened" ? "pull_request_reopened" : "pull_request_synchronize";

  const run = await validationRunsRepo.createValidationRun(pool, {
    organizationId: repoRow.organization_id,
    repositoryId: repoRow.id,
    pullRequestId: prRow.id,
    trigger,
  });

  await validationRunsRepo.supersedeOpenRunsForPullRequest(
    pool,
    repoRow.organization_id,
    repoRow.id,
    pr.number,
    prRow.id,
    run.id,
  );

  await auditEventsRepo
    .recordAuditEvent(pool, {
      organizationId: repoRow.organization_id,
      actorType: "github",
      actorId: pr.user.login,
      action: "validation_run.queued",
      targetType: "validation_run",
      targetId: run.id,
      metadata: { prNumber: pr.number, headSha: pr.head.sha, trigger },
    })
    .catch(() => undefined);
}
