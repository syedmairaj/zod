import "server-only";
import { requireOrganizationAccess, type AuthContext } from "@zod-ai/db";
import type { OrganizationRole } from "@zod-ai/shared-types";
import { redirect } from "next/navigation";
import { getDbPool } from "./db";
import { createSupabaseServerClient } from "./supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
}

/** Returns the signed-in user, or null if there is no valid session. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { id: user.id, email: user.email ?? null };
}

/** Returns the signed-in user or redirects to /sign-in. Use at the top of protected pages/actions. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

/**
 * Verifies the current user is signed in AND is a member of `organizationId`
 * (optionally with one of `allowedRoles`). This is the single choke point
 * every tenant-scoped page/action must call before touching organization
 * data, per AGENTS.md ("Authorization belongs in service/domain boundaries").
 * Redirects (rather than throwing) so it's convenient to call directly from
 * Server Components.
 */
export async function requireOrgAccess(
  organizationId: string,
  allowedRoles?: readonly OrganizationRole[],
): Promise<AuthContext> {
  const user = await requireCurrentUser();
  try {
    return await requireOrganizationAccess(getDbPool(), user.id, organizationId, allowedRoles);
  } catch {
    redirect("/dashboard");
  }
}
