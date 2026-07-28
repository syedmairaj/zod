import type { OrganizationRole } from "@zod-ai/shared-types";
import type { Queryable } from "../client";
import type { OrganizationMemberRow } from "../database.types";

export async function listMembers(db: Queryable, organizationId: string): Promise<OrganizationMemberRow[]> {
  const result = await db.query<OrganizationMemberRow>(
    `select * from organization_members where organization_id = $1 order by created_at asc`,
    [organizationId],
  );
  return result.rows;
}

export async function addMember(
  db: Queryable,
  organizationId: string,
  userId: string,
  role: OrganizationRole,
): Promise<OrganizationMemberRow> {
  const result = await db.query<OrganizationMemberRow>(
    `insert into organization_members (organization_id, user_id, role)
     values ($1, $2, $3)
     on conflict (organization_id, user_id) do update set role = excluded.role
     returning *`,
    [organizationId, userId, role],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Membership insert returned no row");
  }
  return row;
}
