import { describe, expect, it } from "vitest";
import { DEFAULT_SCHEDULER_CONFIG, schedulerConfigFromEnv } from "./scheduler";

describe("schedulerConfigFromEnv", () => {
  it("applies defaults when env vars are absent", () => {
    const config = schedulerConfigFromEnv({});
    expect(config.pollIntervalMs).toBe(DEFAULT_SCHEDULER_CONFIG.pollIntervalMs);
    expect(config.leaseDurationMs).toBe(DEFAULT_SCHEDULER_CONFIG.leaseDurationMs);
    expect(config.maxAttempts).toBe(DEFAULT_SCHEDULER_CONFIG.maxAttempts);
  });

  it("parses overrides from env", () => {
    const config = schedulerConfigFromEnv({
      QUEUE_POLL_INTERVAL_MS: "1000",
      RUN_MAX_ATTEMPTS: "5",
      WORKER_ID_PREFIX: "w",
    });
    expect(config.pollIntervalMs).toBe(1000);
    expect(config.maxAttempts).toBe(5);
    expect(config.workerIdPrefix).toBe("w");
  });
});
