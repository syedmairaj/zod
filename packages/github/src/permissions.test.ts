import { describe, expect, it } from "vitest";
import {
  formatPermissionSummary,
  missingRecommendedPermissions,
  missingRequiredPermissions,
  permissionSatisfies,
} from "./permissions";

describe("permissions helpers", () => {
  it("treats write as satisfying read", () => {
    expect(permissionSatisfies("write", "read")).toBe(true);
    expect(permissionSatisfies("read", "write")).toBe(false);
  });

  it("reports missing required Milestone 1 permissions", () => {
    expect(missingRequiredPermissions({})).toEqual(["metadata:read"]);
    expect(missingRequiredPermissions({ metadata: "read" })).toEqual([]);
  });

  it("reports missing recommended MVP permissions", () => {
    expect(missingRecommendedPermissions({ metadata: "read" })).toEqual([
      "pull_requests:read",
      "checks:write",
    ]);
  });

  it("formats a stable permission summary", () => {
    expect(formatPermissionSummary({ checks: "write", metadata: "read" })).toEqual([
      "checks: write",
      "metadata: read",
    ]);
  });
});
