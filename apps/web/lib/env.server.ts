import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_SLUG: z.string().min(1),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1),
  GITHUB_APP_WEBHOOK_SECRET: z.string().min(1),
  GITHUB_INSTALL_STATE_SECRET: z.string().min(16),
  CREDENTIALS_ENCRYPTION_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

/**
 * Validates and returns server-only environment variables. Throws a clear,
 * actionable error listing exactly what's missing/invalid rather than
 * failing later with a confusing runtime error deep in a provider SDK.
 */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid or missing environment variables:\n${issues}\n\nSee .env.example / SETUP.md.`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export { normalizePemPrivateKey } from "./pem";

