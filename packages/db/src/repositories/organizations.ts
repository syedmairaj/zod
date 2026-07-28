import type { PoolClient } from "pg";
import type { Queryable } from "../client";
import type { OrganizationRow } from "../database.types";
import { ConflictError, NotFoundError } from "../errors";

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  ownerUserId: string;
}

const UNIQUE_VIOLATION = "23505";

/**
 * Creates an organization and its first membership row (as `owner`).
 * Callers MUST invoke this inside `withTransaction` so both inserts commit
 * or roll back together. `ownerUserId` must come from the verified session
 * on the server, never from client-supplied input.
 */
export async function createOrganizationWithOwner(
  client: PoolClient,
  input: CreateOrganizationInput,
): Promise<OrganizationRow> {
  let orgResult;
  try {
    orgResult = await client.query<OrganizationRow>(
      `insert into organizations (name, slug) values ($1, $2) returning *`,
      [input.name, input.slug],
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError(`Organization slug '${input.slug}' is already taken`);
    }
    throw error;
  }

  const org = orgResult.rows[0];
  if (!org) {
    throw new Error("Organization insert returned no row");
  }

  await client.query(
    `insert into organization_members (organization_id, user_id, role) values ($1, $2, 'owner')`,
    [org.id, input.ownerUserId],
  );

  return org;
}

export async function listOrganizationsForUser(db: Queryable, userId: string): Promise<OrganizationRow[]> {
  const result = await db.query<OrganizationRow>(
    `select o.*
     from organizations o
     join organization_members m on m.organization_id = o.id
     where m.user_id = $1
     order by o.created_at asc`,
    [userId],
  );
  return result.rows;
}

export async function getOrganizationById(db: Queryable, organizationId: string): Promise<OrganizationRow> {
  const result = await db.query<OrganizationRow>(`select * from organizations where id = $1`, [organizationId]);
  const row = result.rows[0];
  if (!row) {
    throw new NotFoundError(`Organization ${organizationId} not found`);
  }
  return row;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === UNIQUE_VIOLATION;
}
