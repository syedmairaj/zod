import { z } from "zod";
import { schedulerConfigFromEnv, type SchedulerConfig } from "@zod-ai/shared";

const workerAppEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

export interface WorkerAppEnv {
  databaseUrl: string;
  scheduler: SchedulerConfig;
}

/**
 * Validates worker process environment. Never use process.env.X! in business logic.
 */
export function getWorkerEnv(env: NodeJS.ProcessEnv = process.env): WorkerAppEnv {
  const parsed = workerAppEnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid or missing worker environment variables:\n${issues}\n\nSee .env.example / SETUP.md.`);
  }

  return {
    databaseUrl: parsed.data.DATABASE_URL,
    scheduler: schedulerConfigFromEnv(env),
  };
}
