/**
 * Scheduler failure codes. Never put secrets or raw provider payloads in messages.
 */

export const SCHEDULER_FAILURE_CODES = [
  "retryable_placeholder_failure",
  "non_retryable_placeholder_failure",
  "lease_expired",
  "attempts_exhausted",
  "invalid_run_data",
  "missing_relationship",
  "invalid_transition",
  "cancelled",
  "superseded",
  "timed_out",
  "stale_worker",
  "ownership_mismatch",
  "transient_db_error",
] as const;

export type SchedulerFailureCode = (typeof SCHEDULER_FAILURE_CODES)[number];

const RETRYABLE: ReadonlySet<SchedulerFailureCode> = new Set([
  "retryable_placeholder_failure",
  "lease_expired",
  "transient_db_error",
]);

export function isRetryableFailureCode(code: SchedulerFailureCode): boolean {
  return RETRYABLE.has(code);
}

export function sanitizeFailureMessage(message: string, maxLength: number): string {
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}
