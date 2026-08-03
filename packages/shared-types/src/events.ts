/**
 * Domain event names, per ARCHITECTURE.md section 6.
 * Only a subset is emitted in Milestone 1; the rest are declared for forward
 * compatibility with later milestones' audit trail and orchestration.
 */
export const DOMAIN_EVENTS = [
  "repository.connected",
  "repository.profiled",
  "pull_request.received",
  "validation.queued",
  "sandbox.started",
  "deterministic_check.completed",
  "semantic_review.completed",
  "finding.created",
  "finding.challenged",
  "validation.completed",
  "github_check.published",
  "finding.feedback_received",
] as const;

export type DomainEvent = (typeof DOMAIN_EVENTS)[number];

/** Audit event actions actually recorded by Milestone 1. */
export const AUDIT_ACTIONS = [
  "user.signed_in",
  "organization.created",
  "organization_member.added",
  "github_installation.started",
  "github_installation.connected",
  "github_installation.refreshed",
  "github_installation.callback_rejected",
  "github_installation.conflict_rejected",
  "github_installation.revoked",
  "github_installation.webhook",
  "github_installation.repositories_changed",
  "repository.connected",
  "repository.disconnected",
  "repository.deselected",
  "webhook.received",
  "webhook.rejected",
  "validation_run.queued",
  "validation_run.claimed",
  "validation_run.started",
  "validation_run.retry_scheduled",
  "validation_run.lease_expired",
  "validation_run.cancel_requested",
  "validation_run.cancelled",
  "validation_run.superseded",
  "validation_run.timed_out",
  "validation_run.completed",
  "validation_run.failed",
  "github_api.failed",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
