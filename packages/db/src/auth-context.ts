import type { OrganizationRole } from "@zod-ai/shared-types";
import type { Queryable } from "./client";
import { ForbiddenError } from "./errors";

/**
 * Verified authorization context for a single request. Every service-layer
 * function that touches tenant-owned data must be handed one of these
 * (obtained via `requireOrganizationAccess`) rather than trusting a
 * client-supplied organizationId directly. This is the application-level
 * enforcement point required by ARCHITECTURE.md 7 and AGENTS.md
 * ("Authorization belongs in service/domain boundaries, not only UI").
 */
export interface AuthContext {
  readonly userId: string;
  readonly organizationId: string;
  readonly role: OrganizationRole;
}

/**
 * Verifies that `userId` is a member of `organizationId` and, if
 * `allowedRoles` is provided, that their role is one of them. Throws
 * `ForbiddenError` otherwise. This performs a real database read against
 * `organization_members` scoped by both columns of the composite key -- it
 * never trusts a role passed in by the caller.
 */
export async function requireOrganizationAccess(
  db: Queryable,
  userId: string,
  organizationId: string,
  allowedRoles?: readonly OrganizationRole[],
): Promise<AuthContext> {
  if (!userId || !organizationId) {
    throw new ForbiddenError("Missing user or organization identifier");
  }

  const result = await db.query<{ role: OrganizationRole }>(
    `select role from organization_members where organization_id = $1 and user_id = $2`,
    [organizationId, userId],
  );

  const row = result.rows[0];

  if (!row) {
    throw new ForbiddenError("User is not a member of this organization");
  }

  const role = row.role;

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    throw new ForbiddenError(`Role '${role}' is not permitted to perform this action`);
  }

  return { userId, organizationId, role };
}
