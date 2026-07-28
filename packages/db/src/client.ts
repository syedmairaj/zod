import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

/**
 * Minimal structural interface satisfied by both `pg.Pool` and
 * `pg.PoolClient`, so repository functions can run either as a one-off query
 * against the pool or inside a caller-managed transaction.
 */
export interface Queryable {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface DbConfig {
  connectionString: string;
  ssl?: boolean;
  max?: number;
}

/**
 * Creates the server-only connection pool used for all privileged reads and
 * writes. This connects directly to Postgres (Supabase's connection string,
 * or a local instance in tests/dev) rather than through PostgREST, so it
 * bypasses RLS the same way the Supabase service-role key would. It must
 * never be used from client/browser code, and every query built on top of it
 * must still explicitly filter by `organization_id`
 * (see auth-context.ts and each function in ./repositories).
 */
export function createDbPool(config: DbConfig): Pool {
  if (!config.connectionString) {
    throw new Error("createDbPool requires a connectionString");
  }

  return new Pool({
    connectionString: config.connectionString,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    max: config.max ?? 10,
  });
}

/**
 * Runs `fn` inside a single transaction, committing on success and rolling
 * back on any thrown error. Use for any operation that writes to more than
 * one table and must be atomic (e.g. creating an organization plus its first
 * membership row).
 */
export async function withTransaction<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
