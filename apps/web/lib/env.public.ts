import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cached: PublicEnv | null = null;

/**
 * Validates the public auth/app URL env vars used by middleware, browser
 * clients, and auth routes. Does not require GitHub/DB secrets so Edge
 * middleware can call it safely.
 */
export function getPublicEnv(): PublicEnv {
  if (cached) return cached;

  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid or missing public environment variables:\n${issues}\n\nSee .env.example / SETUP.md.`);
  }

  cached = parsed.data;
  return cached;
}

/** Auth callback URL that must be allowlisted in Supabase Redirect URLs. */
export function getAuthCallbackUrl(nextPath?: string): string {
  const { NEXT_PUBLIC_APP_URL } = getPublicEnv();
  const base = `${NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/auth/callback`;
  if (!nextPath) return base;
  const params = new URLSearchParams({ next: nextPath });
  return `${base}?${params.toString()}`;
}
