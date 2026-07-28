import { describe, expect, it } from "vitest";
import { requireOrganizationAccess } from "./auth-context";
import { ForbiddenError } from "./errors";
import type { Queryable } from "./client";

/** Minimal fake Queryable that simulates the `organization_members` table. */
function fakeDb(rows: Array<{ organization_id: string; user_id: string; role: string }>): Queryable {
  return {
    async query(_text: string, params: unknown[] = []) {
      const [organizationId, userId] = params as [string, string];
      const row = rows.find((r) => r.organization_id === organizationId && r.user_id === userId);
      return { rows: row ? [{ role: row.role }] : [] } as never;
    },
  };
}

describe("requireOrganizationAccess", () => {
  it("returns the auth context for a real member", async () => {
    const db = fakeDb([{ organization_id: "org-1", user_id: "user-1", role: "owner" }]);
    const auth = await requireOrganizationAccess(db, "user-1", "org-1");
    expect(auth).toEqual({ userId: "user-1", organizationId: "org-1", role: "owner" });
  });

  it("throws ForbiddenError for a non-member", async () => {
    const db = fakeDb([{ organization_id: "org-1", user_id: "user-1", role: "owner" }]);
    await expect(requireOrganizationAccess(db, "user-2", "org-1")).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when the user belongs to a different organization", async () => {
    const db = fakeDb([{ organization_id: "org-1", user_id: "user-1", role: "owner" }]);
    await expect(requireOrganizationAccess(db, "user-1", "org-2")).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when the member's role is not in allowedRoles", async () => {
    const db = fakeDb([{ organization_id: "org-1", user_id: "user-1", role: "read_only" }]);
    await expect(requireOrganizationAccess(db, "user-1", "org-1", ["owner", "admin"])).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("succeeds when the member's role is in allowedRoles", async () => {
    const db = fakeDb([{ organization_id: "org-1", user_id: "user-1", role: "admin" }]);
    const auth = await requireOrganizationAccess(db, "user-1", "org-1", ["owner", "admin"]);
    expect(auth.role).toBe("admin");
  });

  it("throws ForbiddenError for missing userId or organizationId", async () => {
    const db = fakeDb([]);
    await expect(requireOrganizationAccess(db, "", "org-1")).rejects.toThrow(ForbiddenError);
    await expect(requireOrganizationAccess(db, "user-1", "")).rejects.toThrow(ForbiddenError);
  });
});
