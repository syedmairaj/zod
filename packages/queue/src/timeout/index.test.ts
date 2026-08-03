import { describe, expect, it } from "vitest";
import { hasTimedOut } from "./index";

describe("hasTimedOut", () => {
  it("returns false when timeout_at is null", () => {
    expect(hasTimedOut(null, new Date())).toBe(false);
  });

  it("returns true when now is at/after deadline", () => {
    const now = new Date("2026-08-02T12:00:00.000Z");
    expect(hasTimedOut("2026-08-02T11:59:59.000Z", now)).toBe(true);
    expect(hasTimedOut(now, now)).toBe(true);
  });

  it("returns false when deadline is in the future", () => {
    const now = new Date("2026-08-02T12:00:00.000Z");
    expect(hasTimedOut("2026-08-02T12:00:01.000Z", now)).toBe(false);
  });
});
