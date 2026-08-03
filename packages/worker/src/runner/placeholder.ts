import type { PlaceholderMode, SchedulerPlaceholderResult } from "@zod-ai/shared";
import { sleep } from "@zod-ai/shared";

export interface PlaceholderTaskInput {
  workerId: string;
  attempt: number;
  mode: PlaceholderMode;
  /** Artificial duration for success/cancel/timeout paths (ms). */
  durationMs?: number;
  signal?: AbortSignal;
}

export class PlaceholderRetryableError extends Error {
  readonly code = "retryable_placeholder_failure" as const;
  constructor(message = "Controlled retryable placeholder failure") {
    super(message);
    this.name = "PlaceholderRetryableError";
  }
}

export class PlaceholderFatalError extends Error {
  readonly code = "non_retryable_placeholder_failure" as const;
  constructor(message = "Controlled non-retryable placeholder failure") {
    super(message);
    this.name = "PlaceholderFatalError";
  }
}

export class PlaceholderTimeoutError extends Error {
  readonly code = "timed_out" as const;
  constructor(message = "Controlled placeholder timeout") {
    super(message);
    this.name = "PlaceholderTimeoutError";
  }
}

export class PlaceholderCancelledError extends Error {
  readonly code = "cancelled" as const;
  constructor(message = "Placeholder stopped due to cancellation") {
    super(message);
    this.name = "PlaceholderCancelledError";
  }
}

/**
 * Fixed deterministic scheduler task. No shell, no arbitrary commands,
 * no repository code execution.
 */
export async function runPlaceholderTask(
  input: PlaceholderTaskInput,
): Promise<SchedulerPlaceholderResult> {
  const durationMs = input.durationMs ?? 25;

  switch (input.mode) {
    case "crash":
      throw new Error("Simulated worker crash");
    case "retryable_failure":
      throw new PlaceholderRetryableError();
    case "non_retryable_failure":
      throw new PlaceholderFatalError();
    case "timeout":
      await sleep(durationMs, input.signal);
      throw new PlaceholderTimeoutError();
    case "cancellation":
      await sleep(durationMs, input.signal);
      if (input.signal?.aborted) {
        throw new PlaceholderCancelledError();
      }
      throw new PlaceholderCancelledError();
    case "success":
    default:
      await sleep(durationMs, input.signal);
      if (input.signal?.aborted) {
        throw new PlaceholderCancelledError();
      }
      return {
        status: "scheduler-ok",
        workerId: input.workerId,
        attempt: input.attempt,
        mode: "success",
      };
  }
}

export function resolvePlaceholderMode(env: NodeJS.ProcessEnv = process.env): PlaceholderMode {
  const raw = env.WORKER_PLACEHOLDER_MODE?.trim();
  if (
    raw === "success" ||
    raw === "retryable_failure" ||
    raw === "non_retryable_failure" ||
    raw === "timeout" ||
    raw === "cancellation" ||
    raw === "crash"
  ) {
    return raw;
  }
  return "success";
}
