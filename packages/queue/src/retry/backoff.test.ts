import { describe, expect, it } from "vitest";
import { computeRetryDelayMs, computeRetryDelayMsDeterministic } from "./backoff";

describe("retry backoff", () => {
  it("increases deterministic delay across attempts", () => {
    const a1 = computeRetryDelayMsDeterministic(1, 5_000);
    const a2 = computeRetryDelayMsDeterministic(2, 5_000);
    const a3 = computeRetryDelayMsDeterministic(3, 5_000);
    expect(a1).toBe(5_000);
    expect(a2).toBe(10_000);
    expect(a3).toBe(20_000);
  });

  it("jittered delay stays within [0, max]", () => {
    for (let i = 0; i < 20; i += 1) {
      const delay = computeRetryDelayMs(2, 5_000);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(10_000);
    }
  });
});
