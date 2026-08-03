/**
 * Bounded exponential backoff with full jitter.
 * attempt 1 → ~base, attempt 2 → ~4×base (capped), never unbounded.
 */

export function computeRetryDelayMs(attemptCount: number, baseDelayMs: number): number {
  const safeAttempt = Math.max(1, attemptCount);
  const exp = Math.min(safeAttempt - 1, 4);
  const maxDelay = baseDelayMs * 2 ** exp;
  // Full jitter in [0, maxDelay]
  return Math.floor(Math.random() * (maxDelay + 1));
}

/** Deterministic delay for unit tests (no jitter). */
export function computeRetryDelayMsDeterministic(attemptCount: number, baseDelayMs: number): number {
  const safeAttempt = Math.max(1, attemptCount);
  const exp = Math.min(safeAttempt - 1, 4);
  return baseDelayMs * 2 ** exp;
}
