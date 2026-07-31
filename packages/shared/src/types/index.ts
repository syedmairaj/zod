/**
 * Normalized webhook / queue types used across github + queue packages.
 * Payload Zod schemas for GitHub wire format remain in @zod-ai/shared-types.
 */

export type WebhookProcessStatus =
  | "ok"
  | "duplicate"
  | "ignored"
  | "rejected"
  | "error";

export interface WebhookProcessResult {
  status: WebhookProcessStatus;
  httpStatus: number;
  error?: string;
  /** Safe internal codes only — never raw provider bodies. */
  errorCode?: string;
  queueJobId?: string;
  commitSha?: string;
}

export type QueueJobTrigger =
  | "pull_request_opened"
  | "pull_request_synchronize"
  | "pull_request_reopened"
  | "push"
  | "manual";

export interface EnqueueValidationJobInput {
  organizationId: string;
  repositoryId: string;
  /** Null for push events that are not tied to a pull request revision. */
  pullRequestId: string | null;
  commitSha: string;
  trigger: QueueJobTrigger;
  deliveryId: string;
}

export interface EnqueuedValidationJob {
  id: string;
  organizationId: string;
  repositoryId: string;
  pullRequestId: string | null;
  commitSha: string;
  trigger: QueueJobTrigger;
  status: "queued";
}
