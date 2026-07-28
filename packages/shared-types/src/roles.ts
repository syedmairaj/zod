/**
 * Organization membership roles.
 * Source: SECURITY_MODEL.md ("Authorization" section).
 */
export const ORGANIZATION_ROLES = [
  "owner",
  "admin",
  "developer",
  "reviewer",
  "billing",
  "read_only",
] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

/** Roles allowed to manage org settings, members, and GitHub App installations. */
export const ADMIN_ROLES: readonly OrganizationRole[] = ["owner", "admin"];

/** Roles allowed to connect/disconnect repositories. */
export const REPOSITORY_MANAGER_ROLES: readonly OrganizationRole[] = ["owner", "admin"];

export function isAdminRole(role: OrganizationRole): boolean {
  return ADMIN_ROLES.includes(role);
}
