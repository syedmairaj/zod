/**
 * Run-timeout helpers. Lease timeout is handled by lease recovery.
 */

export function hasTimedOut(timeoutAt: Date | string | null | undefined, now: Date): boolean {
  if (!timeoutAt) {
    return false;
  }
  const deadline = typeof timeoutAt === "string" ? new Date(timeoutAt) : timeoutAt;
  return deadline.getTime() <= now.getTime();
}

export { finalizeTimedOut } from "./finalize";
