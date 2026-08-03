import type { ValidationRunRow } from "@zod-ai/db";
import type { ValidationRunStatus } from "../contracts/statuses";

export interface ClaimedValidationRun {
  id: string;
  organizationId: string;
  repositoryId: string;
  pullRequestId: string | null;
  commitSha: string | null;
  status: ValidationRunStatus;
  trigger: ValidationRunRow["trigger"];
  decision: ValidationRunRow["decision"];
  attemptCount: number;
  maxAttempts: number;
  claimedBy: string;
  claimedAt: string;
  leaseExpiresAt: string;
  heartbeatAt: string;
  timeoutAt: string | null;
  cancellationRequestedAt: string | null;
  runVersion: number;
  availableAt: string;
  supersededBy: string | null;
  startedAt: string | null;
  completedAt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  schedulerResultJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function mapValidationRunRow(row: ValidationRunRow): ClaimedValidationRun {
  return {
    id: row.id,
    organizationId: row.organization_id,
    repositoryId: row.repository_id,
    pullRequestId: row.pull_request_id,
    commitSha: row.commit_sha,
    status: row.status,
    trigger: row.trigger,
    decision: row.decision,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    claimedBy: row.claimed_by ?? "",
    claimedAt: row.claimed_at ?? row.created_at,
    leaseExpiresAt: row.lease_expires_at ?? row.created_at,
    heartbeatAt: row.heartbeat_at ?? row.created_at,
    timeoutAt: row.timeout_at,
    cancellationRequestedAt: row.cancellation_requested_at,
    runVersion: row.run_version,
    availableAt: row.available_at,
    supersededBy: row.superseded_by,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    failureCode: row.failure_code,
    failureMessage: row.failure_message,
    schedulerResultJson: row.scheduler_result_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
