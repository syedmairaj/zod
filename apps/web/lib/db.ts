import "server-only";
import { createDbPool } from "@zod-ai/db";
import type { Pool } from "pg";
import { getServerEnv } from "./env.server";

/**
 * Singleton connection pool for the running server process. Next.js may
 * hot-reload this module in dev; we stash the pool on `globalThis` to avoid
 * leaking connections across reloads.
 */
const globalForDb = globalThis as unknown as { __zodAiDbPool__?: Pool };

export function getDbPool(): Pool {
  if (!globalForDb.__zodAiDbPool__) {
    const env = getServerEnv();
    globalForDb.__zodAiDbPool__ = createDbPool({ connectionString: env.DATABASE_URL });
  }
  return globalForDb.__zodAiDbPool__;
}
