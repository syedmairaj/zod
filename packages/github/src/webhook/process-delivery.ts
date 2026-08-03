import {
  auditEventsRepo,
  githubInstallationsRepo,
  pullRequestsRepo,
  repositoriesRepo,
  webhookDeliveriesRepo,
  type Queryable,
} from "@zod-ai/db";
import { enqueueValidationJob, supersedeOpenRunsForPullRequest } from "@zod-ai/queue";
import {
  BadRequestError,
  UnauthorizedError,
  logStructured,
  type WebhookProcessResult,
} from "@zod-ai/shared";
import type {
  GithubInstallationPayload,
  GithubInstallationRepositoriesPayload,
  GithubPullRequestPayload,
  GithubPushPayload,
  ValidationRunTrigger,
} from "@zod-ai/shared-types";
import {
  extractCommitSha,
  extractGithubWebhookAction,
  parseGithubWebhookEvent,
} from "../event-parser/index";
import { verifyGithubWebhookSignature } from "../signature/index";

const HANDLED_PR_ACTIONS = new Set(["opened", "synchronize", "reopened"]);

export interface ProcessGithubWebhookInput {
  rawBody: string;
  signatureHeader: string | null;
  deliveryId: string | null;
  eventType: string | null;
  webhookSecret: string;
}

function tryParseJsonBody(rawBody: string): unknown | null {
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

/**
 * Domain entrypoint for GitHub webhook ingestion. Route handlers should only
 * extract headers/body and map this result to an HTTP response.
 */
export async function processGithubWebhook(
  db: Queryable,
  input: ProcessGithubWebhookInput,
): Promise<WebhookProcessResult> {
  const { rawBody, signatureHeader, deliveryId, eventType, webhookSecret } = input;

  if (!deliveryId || !eventType) {
    throw new BadRequestError("Missing X-GitHub-Delivery or X-GitHub-Event header");
  }

  // Peek action for rejected-delivery rows only when the body is valid JSON.
  // Full event normalization happens after a successful signature check.
  const peekedPayload = tryParseJsonBody(rawBody);
  const peekedAction = extractGithubWebhookAction(peekedPayload);

  if (!verifyGithubWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
    await webhookDeliveriesRepo
      .markWebhookDeliveryRejected(db, deliveryId, eventType, peekedAction, "invalid_signature")
      .catch(() => undefined);
    logStructured("warn", "webhook_signature_rejected", {
      delivery_id: deliveryId,
      event_type: eventType,
      result: "error",
      error_code: "invalid_signature",
    });
    throw new UnauthorizedError("Invalid signature");
  }

  if (peekedPayload === null) {
    throw new BadRequestError("Invalid JSON body");
  }

  const payload = peekedPayload;
  const action = extractGithubWebhookAction(payload);

  // Persist event action at claim time (was previously hard-coded null).
  const claimed = await webhookDeliveriesRepo.claimWebhookDelivery(db, deliveryId, eventType, action);
  if (!claimed) {
    logStructured("info", "webhook_duplicate", {
      delivery_id: deliveryId,
      event_type: eventType,
      result: "ok",
    });
    return { status: "duplicate", httpStatus: 200 };
  }

  try {
    const event = parseGithubWebhookEvent(eventType, payload);

    if (event.kind === "ping") {
      return { status: "ok", httpStatus: 200 };
    }

    if (event.kind === "unsupported") {
      logStructured("info", "webhook_ignored", {
        delivery_id: deliveryId,
        event_type: eventType,
        result: "ok",
      });
      return { status: "ignored", httpStatus: 200 };
    }

    if (event.kind === "installation") {
      await handleInstallationEvent(db, event.payload, deliveryId);
      return { status: "ok", httpStatus: 200 };
    }

    if (event.kind === "installation_repositories") {
      await handleInstallationRepositoriesEvent(db, event.payload, deliveryId);
      return { status: "ok", httpStatus: 200 };
    }

    if (event.kind === "pull_request") {
      return await handlePullRequestEvent(db, event.payload, deliveryId);
    }

    if (event.kind === "push") {
      return await handlePushEvent(db, event.payload, deliveryId);
    }

    return { status: "ignored", httpStatus: 200 };
  } catch (error) {
    logStructured("error", "webhook_processing_failed", {
      delivery_id: deliveryId,
      event_type: eventType,
      result: "error",
      error_code: error instanceof Error ? error.name : "unknown",
    });
    throw error;
  }
}

async function handleInstallationEvent(
  db: Queryable,
  payload: GithubInstallationPayload,
  deliveryId: string,
): Promise<void> {
  const { action, installation } = payload;
  const existing = await githubInstallationsRepo.getInstallationByInstallationId(db, installation.id);

  if (!existing) {
    return;
  }

  await webhookDeliveriesRepo.attachWebhookDeliveryOrganization(db, deliveryId, existing.organization_id);

  if (action === "deleted") {
    await githubInstallationsRepo.updateInstallationStatus(db, existing.organization_id, installation.id, "deleted");
  } else if (action === "suspend") {
    await githubInstallationsRepo.updateInstallationStatus(
      db,
      existing.organization_id,
      installation.id,
      "suspended",
    );
  } else if (action === "unsuspend") {
    await githubInstallationsRepo.updateInstallationStatus(db, existing.organization_id, installation.id, "active");
  }

  await auditEventsRepo
    .recordAuditEvent(db, {
      organizationId: existing.organization_id,
      actorType: "github",
      actorId: String(installation.account.id),
      action: "github_installation.webhook",
      targetType: "github_installation",
      targetId: existing.id,
      metadata: { webhookAction: action },
    })
    .catch(() => undefined);
}

async function handleInstallationRepositoriesEvent(
  db: Queryable,
  payload: GithubInstallationRepositoriesPayload,
  deliveryId: string,
): Promise<void> {
  const existing = await githubInstallationsRepo.getInstallationByInstallationId(db, payload.installation.id);
  if (!existing) {
    return;
  }

  await webhookDeliveriesRepo.attachWebhookDeliveryOrganization(db, deliveryId, existing.organization_id);

  if (payload.action === "removed") {
    for (const repo of payload.repositories_removed) {
      const row = await repositoriesRepo.findRepositoryByProviderIds(db, payload.installation.id, repo.id);
      if (row && row.status === "active") {
        await repositoriesRepo.disconnectRepository(db, row.organization_id, row.id);
      }
    }
  }

  await auditEventsRepo
    .recordAuditEvent(db, {
      organizationId: existing.organization_id,
      actorType: "github",
      actorId: String(payload.installation.id),
      action: "github_installation.repositories_changed",
      targetType: "github_installation",
      targetId: existing.id,
      metadata: {
        webhookAction: payload.action,
        added: payload.repositories_added.map((r) => r.id),
        removed: payload.repositories_removed.map((r) => r.id),
      },
    })
    .catch(() => undefined);
}

async function handlePullRequestEvent(
  db: Queryable,
  payload: GithubPullRequestPayload,
  deliveryId: string,
): Promise<WebhookProcessResult> {
  const { action, pull_request: pr, repository, installation } = payload;

  if (!installation || !HANDLED_PR_ACTIONS.has(action)) {
    return { status: "ignored", httpStatus: 200 };
  }

  const repoRow = await repositoriesRepo.findRepositoryByProviderIds(db, installation.id, repository.id);
  if (!repoRow || repoRow.status !== "active") {
    return { status: "ignored", httpStatus: 200 };
  }

  await webhookDeliveriesRepo.attachWebhookDeliveryOrganization(db, deliveryId, repoRow.organization_id);

  const prRow = await pullRequestsRepo.upsertPullRequestRevision(db, {
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
    action === "opened"
      ? "pull_request_opened"
      : action === "reopened"
        ? "pull_request_reopened"
        : "pull_request_synchronize";

  const job = await enqueueValidationJob(db, {
    organizationId: repoRow.organization_id,
    repositoryId: repoRow.id,
    pullRequestId: prRow.id,
    commitSha: pr.head.sha,
    trigger,
    deliveryId,
  });

  await supersedeOpenRunsForPullRequest(
    db,
    repoRow.organization_id,
    repoRow.id,
    pr.number,
    prRow.id,
    job.id,
  );

  await auditEventsRepo
    .recordAuditEvent(db, {
      organizationId: repoRow.organization_id,
      actorType: "github",
      actorId: pr.user.login,
      action: "validation_run.queued",
      targetType: "validation_run",
      targetId: job.id,
      metadata: { prNumber: pr.number, headSha: pr.head.sha, trigger },
    })
    .catch(() => undefined);

  return {
    status: "ok",
    httpStatus: 200,
    queueJobId: job.id,
    commitSha: pr.head.sha,
  };
}

async function handlePushEvent(
  db: Queryable,
  payload: GithubPushPayload,
  deliveryId: string,
): Promise<WebhookProcessResult> {
  const commitSha = extractCommitSha({ kind: "push", payload });
  if (!payload.installation || !commitSha) {
    return { status: "ignored", httpStatus: 200 };
  }

  const repoRow = await repositoriesRepo.findRepositoryByProviderIds(
    db,
    payload.installation.id,
    payload.repository.id,
  );
  if (!repoRow || repoRow.status !== "active") {
    return { status: "ignored", httpStatus: 200 };
  }

  await webhookDeliveriesRepo.attachWebhookDeliveryOrganization(db, deliveryId, repoRow.organization_id);

  const job = await enqueueValidationJob(db, {
    organizationId: repoRow.organization_id,
    repositoryId: repoRow.id,
    pullRequestId: null,
    commitSha,
    trigger: "push",
    deliveryId,
  });

  await auditEventsRepo
    .recordAuditEvent(db, {
      organizationId: repoRow.organization_id,
      actorType: "github",
      actorId: payload.sender?.login ?? "github",
      action: "validation_run.queued",
      targetType: "validation_run",
      targetId: job.id,
      metadata: { commitSha, trigger: "push", ref: payload.ref },
    })
    .catch(() => undefined);

  return {
    status: "ok",
    httpStatus: 200,
    queueJobId: job.id,
    commitSha,
  };
}
