import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool, PoolClient } from "pg";
import { createTestPool } from "../setup/connection";
import { createTestInstallation, createTestOrganization, createTestRepository, createTestUser } from "../setup/fixtures";

/**
 * Exercises the actual Postgres Row Level Security policies from
 * packages/db/migrations/0002_rls.sql -- not just the application-layer
 * `organization_id` filters. This simulates how PostgREST/Supabase would
 * run a query on behalf of a signed-in end user: connect, `SET ROLE
 * authenticated`, and set the `request.jwt.claims` session variable so
 * `auth.uid()` resolves, then run a plain (unfiltered) SELECT.
 */
describe("row level security policies (real Postgres)", () => {
  let pool: Pool;
  let orgA: { id: string };
  let orgB: { id: string };
  let userA: string;
  let repoAId: string;
  let repoBId: string;

  beforeAll(async () => {
    pool = createTestPool();
    userA = await createTestUser(pool);
    const userB = await createTestUser(pool);
    orgA = await createTestOrganization(pool, userA, "RLS Org A");
    orgB = await createTestOrganization(pool, userB, "RLS Org B");

    const installationA = await createTestInstallation(pool, orgA.id);
    const installationB = await createTestInstallation(pool, orgB.id);
    repoAId = (await createTestRepository(pool, orgA.id, installationA.id)).id;
    repoBId = (await createTestRepository(pool, orgB.id, installationB.id)).id;
  });

  afterAll(async () => {
    await pool.end();
  });

  async function withAuthenticatedSession<T>(userId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(`set local request.jwt.claims = '{"sub": "${userId}"}'`);
      await client.query("set local role authenticated");
      return await fn(client);
    } finally {
      await client.query("rollback").catch(() => undefined);
      client.release();
    }
  }

  it("only returns organization A's repository when queried as a member of organization A", async () => {
    const rows = await withAuthenticatedSession(userA, async (client) => {
      const result = await client.query<{ id: string }>("select id from repositories");
      return result.rows;
    });

    const ids = rows.map((row) => row.id);
    expect(ids).toContain(repoAId);
    expect(ids).not.toContain(repoBId);
  });

  it("returns zero rows for a user with no organization membership at all", async () => {
    const strangerId = await createTestUser(pool);
    const rows = await withAuthenticatedSession(strangerId, async (client) => {
      const result = await client.query("select id from repositories");
      return result.rows;
    });
    expect(rows).toHaveLength(0);
  });

  it("denies INSERT into repositories for the authenticated role (no write policy/grant exists)", async () => {
    await expect(
      withAuthenticatedSession(userA, async (client) => {
        await client.query(
          `insert into repositories (organization_id, github_installation_id, provider_repository_id, owner, name)
           values ($1, (select id from github_installations limit 1), 999999999, 'attacker', 'malicious-repo')`,
          [orgA.id],
        );
      }),
    ).rejects.toThrow(/permission denied/i);
  });

  it("denies UPDATE on audit_events for the authenticated role (append-only enforcement)", async () => {
    await expect(
      withAuthenticatedSession(userA, async (client) => {
        await client.query("update audit_events set action = 'tampered' where organization_id = $1", [orgA.id]);
      }),
    ).rejects.toThrow(/permission denied/i);
  });
});
