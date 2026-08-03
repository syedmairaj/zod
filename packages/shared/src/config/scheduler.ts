/**
 * Validated scheduler / worker configuration defaults and parsing.
 * Business logic must receive SchedulerConfig — never raw process.env.
 */

import { z } from "zod";

export const DEFAULT_SCHEDULER_CONFIG = {
  workerIdPrefix: "worker",
  pollIntervalMs: 3_000,
  leaseDurationMs: 120_000,
  heartbeatIntervalMs: 20_000,
  maxAttempts: 3,
  retryBaseDelayMs: 5_000,
  runTimeoutMs: 60_000,
  shutdownTimeoutMs: 30_000,
  failureMessageMaxLength: 500,
} as const;

const positiveInt = z.coerce.number().int().positive();

export const schedulerEnvSchema = z.object({
  WORKER_ID_PREFIX: z.string().min(1).default(DEFAULT_SCHEDULER_CONFIG.workerIdPrefix),
  QUEUE_POLL_INTERVAL_MS: positiveInt.default(DEFAULT_SCHEDULER_CONFIG.pollIntervalMs),
  RUN_LEASE_DURATION_MS: positiveInt.default(DEFAULT_SCHEDULER_CONFIG.leaseDurationMs),
  RUN_HEARTBEAT_INTERVAL_MS: positiveInt.default(DEFAULT_SCHEDULER_CONFIG.heartbeatIntervalMs),
  RUN_MAX_ATTEMPTS: positiveInt.default(DEFAULT_SCHEDULER_CONFIG.maxAttempts),
  RUN_RETRY_BASE_DELAY_MS: positiveInt.default(DEFAULT_SCHEDULER_CONFIG.retryBaseDelayMs),
  RUN_TIMEOUT_MS: positiveInt.default(DEFAULT_SCHEDULER_CONFIG.runTimeoutMs),
  WORKER_SHUTDOWN_TIMEOUT_MS: positiveInt.default(DEFAULT_SCHEDULER_CONFIG.shutdownTimeoutMs),
});

export type SchedulerEnv = z.infer<typeof schedulerEnvSchema>;

export interface SchedulerConfig {
  workerIdPrefix: string;
  pollIntervalMs: number;
  leaseDurationMs: number;
  heartbeatIntervalMs: number;
  maxAttempts: number;
  retryBaseDelayMs: number;
  runTimeoutMs: number;
  shutdownTimeoutMs: number;
  failureMessageMaxLength: number;
}

export function schedulerConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  overrides: Partial<SchedulerConfig> = {},
): SchedulerConfig {
  const parsed = schedulerEnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid scheduler environment variables:\n${issues}`);
  }

  const data = parsed.data;
  return {
    workerIdPrefix: overrides.workerIdPrefix ?? data.WORKER_ID_PREFIX,
    pollIntervalMs: overrides.pollIntervalMs ?? data.QUEUE_POLL_INTERVAL_MS,
    leaseDurationMs: overrides.leaseDurationMs ?? data.RUN_LEASE_DURATION_MS,
    heartbeatIntervalMs: overrides.heartbeatIntervalMs ?? data.RUN_HEARTBEAT_INTERVAL_MS,
    maxAttempts: overrides.maxAttempts ?? data.RUN_MAX_ATTEMPTS,
    retryBaseDelayMs: overrides.retryBaseDelayMs ?? data.RUN_RETRY_BASE_DELAY_MS,
    runTimeoutMs: overrides.runTimeoutMs ?? data.RUN_TIMEOUT_MS,
    shutdownTimeoutMs: overrides.shutdownTimeoutMs ?? data.WORKER_SHUTDOWN_TIMEOUT_MS,
    failureMessageMaxLength:
      overrides.failureMessageMaxLength ?? DEFAULT_SCHEDULER_CONFIG.failureMessageMaxLength,
  };
}
