import {
  GithubInstallationPayloadSchema,
  GithubInstallationRepositoriesPayloadSchema,
  GithubPingPayloadSchema,
  GithubPullRequestPayloadSchema,
  GithubPushPayloadSchema,
} from "@zod-ai/shared-types";

export type ParsedWebhookEvent =
  | { kind: "ping"; payload: unknown }
  | { kind: "pull_request"; payload: ReturnType<typeof GithubPullRequestPayloadSchema.parse> }
  | { kind: "push"; payload: ReturnType<typeof GithubPushPayloadSchema.parse> }
  | { kind: "installation"; payload: ReturnType<typeof GithubInstallationPayloadSchema.parse> }
  | {
      kind: "installation_repositories";
      payload: ReturnType<typeof GithubInstallationRepositoriesPayloadSchema.parse>;
    }
  | { kind: "unsupported"; eventType: string };

/** Max length for persisted `webhook_deliveries.action` (GitHub actions are short enums). */
const MAX_ACTION_LENGTH = 64;

/**
 * Reads the top-level GitHub `action` string when present. Does not store or
 * return the rest of the payload. Returns null for push/ping and other events
 * without an action field.
 */
export function extractGithubWebhookAction(payload: unknown): string | null {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  if (!("action" in payload)) {
    return null;
  }
  const action = (payload as { action: unknown }).action;
  if (typeof action !== "string") {
    return null;
  }
  const trimmed = action.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_ACTION_LENGTH) {
    return null;
  }
  return trimmed;
}

/**
 * Validates and narrows a GitHub webhook JSON payload for Milestone 2 events.
 * Unsupported event types return `{ kind: "unsupported" }` without throwing.
 */
export function parseGithubWebhookEvent(eventType: string, payload: unknown): ParsedWebhookEvent {
  if (eventType === "ping") {
    GithubPingPayloadSchema.safeParse(payload);
    return { kind: "ping", payload };
  }

  if (eventType === "pull_request") {
    const parsed = GithubPullRequestPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error(`Invalid pull_request payload: ${parsed.error.message}`);
    }
    return { kind: "pull_request", payload: parsed.data };
  }

  if (eventType === "push") {
    const parsed = GithubPushPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error(`Invalid push payload: ${parsed.error.message}`);
    }
    return { kind: "push", payload: parsed.data };
  }

  if (eventType === "installation") {
    const parsed = GithubInstallationPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error(`Invalid installation payload: ${parsed.error.message}`);
    }
    return { kind: "installation", payload: parsed.data };
  }

  if (eventType === "installation_repositories") {
    const parsed = GithubInstallationRepositoriesPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error(`Invalid installation_repositories payload: ${parsed.error.message}`);
    }
    return { kind: "installation_repositories", payload: parsed.data };
  }

  return { kind: "unsupported", eventType };
}

/** Extracts the commit SHA used for validation binding. */
export function extractCommitSha(event: ParsedWebhookEvent): string | null {
  if (event.kind === "pull_request") {
    return event.payload.pull_request.head.sha;
  }
  if (event.kind === "push") {
    if (event.payload.deleted || event.payload.after === "0".repeat(40)) {
      return null;
    }
    return event.payload.after;
  }
  return null;
}
