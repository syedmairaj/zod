/**
 * Permissions required for Milestone 1 onboarding (list/select repositories).
 * Planned MVP validators/checks need additional scopes later — those are
 * recommended, not mandatory for Gate 1.
 */
export const REQUIRED_MILESTONE_1_PERMISSIONS: Readonly<Record<string, string>> = {
  metadata: "read",
};

/** Documented in SETUP.md for the broader MVP path; warn when absent. */
export const RECOMMENDED_MVP_PERMISSIONS: Readonly<Record<string, string>> = {
  pull_requests: "read",
  checks: "write",
};

const PERMISSION_RANK: Record<string, number> = {
  read: 1,
  write: 2,
  admin: 3,
};

export function permissionSatisfies(granted: string | undefined, required: string): boolean {
  if (!granted) {
    return false;
  }
  return (PERMISSION_RANK[granted] ?? 0) >= (PERMISSION_RANK[required] ?? 0);
}

export function missingRequiredPermissions(
  permissions: Record<string, string> | null | undefined,
): string[] {
  const granted = permissions ?? {};
  return Object.entries(REQUIRED_MILESTONE_1_PERMISSIONS)
    .filter(([key, level]) => !permissionSatisfies(granted[key], level))
    .map(([key, level]) => `${key}:${level}`);
}

export function missingRecommendedPermissions(
  permissions: Record<string, string> | null | undefined,
): string[] {
  const granted = permissions ?? {};
  return Object.entries(RECOMMENDED_MVP_PERMISSIONS)
    .filter(([key, level]) => !permissionSatisfies(granted[key], level))
    .map(([key, level]) => `${key}:${level}`);
}

export function formatPermissionSummary(permissions: Record<string, string> | null | undefined): string[] {
  if (!permissions) {
    return [];
  }
  return Object.entries(permissions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, level]) => `${key}: ${level}`);
}
