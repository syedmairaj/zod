/**
 * Lightweight shared config helpers. Package-specific env validation remains
 * in apps (getServerEnv / worker env); this module holds constants and
 * scheduler config parsing used by the queue/worker control plane.
 */

export const GITHUB_WEBHOOK_SIGNATURE_HEADER = "x-hub-signature-256";
export const GITHUB_DELIVERY_HEADER = "x-github-delivery";
export const GITHUB_EVENT_HEADER = "x-github-event";

/** Events Milestone 2 actively processes. Others are acknowledged and ignored. */
export const MILESTONE_2_WEBHOOK_EVENTS = [
  "ping",
  "push",
  "pull_request",
  "installation",
  "installation_repositories",
] as const;

export type Milestone2WebhookEvent = (typeof MILESTONE_2_WEBHOOK_EVENTS)[number];

export {
  DEFAULT_SCHEDULER_CONFIG,
  schedulerConfigFromEnv,
  schedulerEnvSchema,
  type SchedulerConfig,
  type SchedulerEnv,
} from "./scheduler";
