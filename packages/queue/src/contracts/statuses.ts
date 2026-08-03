import {
  VALIDATION_RUN_ACTIVE_STATUSES,
  VALIDATION_RUN_FINAL_STATUSES,
  VALIDATION_RUN_STATUSES,
  type ValidationRunStatus,
} from "@zod-ai/shared-types";

export {
  VALIDATION_RUN_ACTIVE_STATUSES,
  VALIDATION_RUN_FINAL_STATUSES,
  VALIDATION_RUN_STATUSES,
  type ValidationRunStatus,
};

export function isFinalStatus(status: ValidationRunStatus): boolean {
  return (VALIDATION_RUN_FINAL_STATUSES as readonly string[]).includes(status);
}

export function isActiveStatus(status: ValidationRunStatus): boolean {
  return (VALIDATION_RUN_ACTIVE_STATUSES as readonly string[]).includes(status);
}

/**
 * Allowed scheduler transitions. Invalid transitions must leave data unchanged.
 *
 * Notes:
 * - `completed` means scheduler placeholder finished — not code correctness.
 * - `queued` ← active only via expired-lease recovery or controlled retry.
 * - Final states have no outbound transitions.
 */
export const ALLOWED_TRANSITIONS: Readonly<Record<ValidationRunStatus, readonly ValidationRunStatus[]>> = {
  queued: ["claimed", "cancelled", "superseded"],
  claimed: ["preparing", "cancelled", "superseded", "queued", "failed", "timed_out"],
  preparing: ["running", "cancelled", "superseded", "queued", "failed", "timed_out"],
  running: ["collecting", "cancelled", "superseded", "queued", "failed", "timed_out"],
  collecting: ["completed", "cancelled", "superseded", "failed", "timed_out", "queued"],
  completed: [],
  failed: [],
  timed_out: [],
  cancelled: [],
  superseded: [],
};

export function canTransition(from: ValidationRunStatus, to: ValidationRunStatus): boolean {
  if (from === to) {
    return true;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertCanTransition(from: ValidationRunStatus, to: ValidationRunStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid validation run transition: ${from} → ${to}`);
  }
}
