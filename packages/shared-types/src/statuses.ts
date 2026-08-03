/**
 * Status/enum vocabularies shared across the control plane.
 * Only statuses reachable in Milestone 1 are actively produced by application
 * code today; the fuller vocabulary is declared up front so the schema does
 * not need a breaking migration when later milestones (sandbox execution,
 * AI review, decisioning) are implemented.
 */

export const GITHUB_INSTALLATION_STATUSES = ["active", "suspended", "deleted"] as const;
export type GithubInstallationStatus = (typeof GITHUB_INSTALLATION_STATUSES)[number];

export const REPOSITORY_STATUSES = ["active", "disconnected"] as const;
export type RepositoryStatus = (typeof REPOSITORY_STATUSES)[number];

export const PULL_REQUEST_STATES = ["open", "closed", "merged"] as const;
export type PullRequestState = (typeof PULL_REQUEST_STATES)[number];

/**
 * Scheduler / worker lifecycle statuses (Milestone 3).
 * Code-correctness outcomes live on `decision`, not here.
 * `completed` means the scheduler placeholder finished — not that code is correct.
 */
export const VALIDATION_RUN_STATUSES = [
  "queued",
  "claimed",
  "preparing",
  "running",
  "collecting",
  "completed",
  "failed",
  "timed_out",
  "cancelled",
  "superseded",
] as const;
export type ValidationRunStatus = (typeof VALIDATION_RUN_STATUSES)[number];

/** Statuses that still own (or may own) a worker lease. */
export const VALIDATION_RUN_ACTIVE_STATUSES = [
  "claimed",
  "preparing",
  "running",
  "collecting",
] as const;
export type ValidationRunActiveStatus = (typeof VALIDATION_RUN_ACTIVE_STATUSES)[number];

/** Terminal statuses that must not be casually rewritten. */
export const VALIDATION_RUN_FINAL_STATUSES = [
  "completed",
  "failed",
  "timed_out",
  "cancelled",
  "superseded",
] as const;
export type ValidationRunFinalStatus = (typeof VALIDATION_RUN_FINAL_STATUSES)[number];

export const VALIDATION_RUN_TRIGGERS = [
  "pull_request_opened",
  "pull_request_synchronize",
  "pull_request_reopened",
  "push",
  "manual",
] as const;
export type ValidationRunTrigger = (typeof VALIDATION_RUN_TRIGGERS)[number];

/** Per VALIDATION_ENGINE.md section 8. Not produced until decisioning exists. */
export const VALIDATION_RUN_DECISIONS = [
  "pass",
  "pass_with_warnings",
  "changes_requested",
  "inconclusive",
  "system_error",
] as const;
export type ValidationRunDecision = (typeof VALIDATION_RUN_DECISIONS)[number];
