import { describe, expect, it } from "vitest";
import {
  PlaceholderFatalError,
  PlaceholderRetryableError,
  PlaceholderTimeoutError,
  resolvePlaceholderMode,
  runPlaceholderTask,
} from "./placeholder";

describe("placeholder task", () => {
  it("returns scheduler-ok for success", async () => {
    const result = await runPlaceholderTask({
      workerId: "worker-1",
      attempt: 1,
      mode: "success",
      durationMs: 1,
    });
    expect(result).toEqual({
      status: "scheduler-ok",
      workerId: "worker-1",
      attempt: 1,
      mode: "success",
    });
  });

  it("throws retryable / fatal / timeout modes", async () => {
    await expect(
      runPlaceholderTask({ workerId: "w", attempt: 1, mode: "retryable_failure" }),
    ).rejects.toBeInstanceOf(PlaceholderRetryableError);
    await expect(
      runPlaceholderTask({ workerId: "w", attempt: 1, mode: "non_retryable_failure" }),
    ).rejects.toBeInstanceOf(PlaceholderFatalError);
    await expect(
      runPlaceholderTask({ workerId: "w", attempt: 1, mode: "timeout", durationMs: 1 }),
    ).rejects.toBeInstanceOf(PlaceholderTimeoutError);
  });

  it("defaults placeholder mode to success", () => {
    expect(resolvePlaceholderMode({})).toBe("success");
    expect(resolvePlaceholderMode({ WORKER_PLACEHOLDER_MODE: "timeout" })).toBe("timeout");
  });
});
