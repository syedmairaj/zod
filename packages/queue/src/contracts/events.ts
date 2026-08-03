/**
 * Structured ops event names for the scheduler / worker control plane.
 * Field safety: never log tokens, keys, raw webhook bodies, or DB credentials.
 */

export const SCHEDULER_OPS_EVENTS = [
  "worker_started",
  "worker_stopping",
  "worker_stopped",
  "validation_run_claimed",
  "validation_run_started",
  "validation_run_heartbeat",
  "validation_run_retry_scheduled",
  "validation_run_lease_expired",
  "validation_run_cancel_requested",
  "validation_run_cancelled",
  "validation_run_superseded",
  "validation_run_timed_out",
  "validation_run_completed",
  "validation_run_failed",
] as const;

export type SchedulerOpsEvent = (typeof SCHEDULER_OPS_EVENTS)[number];

export interface SchedulerLogFields {
  organization_id?: string;
  repository_id?: string;
  validation_run_id?: string;
  worker_id?: string;
  attempt?: number;
  status?: string;
  trigger?: string;
  commit_sha_prefix?: string;
  duration_ms?: number;
  error_code?: string;
  [key: string]: unknown;
}

export function commitShaPrefix(sha: string | null | undefined): string | undefined {
  if (!sha) return undefined;
  return sha.slice(0, 12);
}
