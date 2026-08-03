import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  assertCanTransition,
  canTransition,
  isActiveStatus,
  isFinalStatus,
  VALIDATION_RUN_STATUSES,
} from "./statuses";

describe("validation run state machine", () => {
  it("declares every status exactly once", () => {
    expect(new Set(VALIDATION_RUN_STATUSES).size).toBe(VALIDATION_RUN_STATUSES.length);
  });

  it("allows every documented happy-path transition", () => {
    expect(canTransition("queued", "claimed")).toBe(true);
    expect(canTransition("claimed", "preparing")).toBe(true);
    expect(canTransition("preparing", "running")).toBe(true);
    expect(canTransition("running", "collecting")).toBe(true);
    expect(canTransition("collecting", "completed")).toBe(true);
  });

  it("allows cancellation from active and queued states", () => {
    for (const from of ["queued", "claimed", "preparing", "running", "collecting"] as const) {
      expect(canTransition(from, "cancelled")).toBe(true);
    }
  });

  it("allows superseding only through preparing (not collecting→queued freely as product)", () => {
    expect(canTransition("queued", "superseded")).toBe(true);
    expect(canTransition("claimed", "superseded")).toBe(true);
    expect(canTransition("preparing", "superseded")).toBe(true);
    expect(canTransition("running", "superseded")).toBe(true);
  });

  it("forbids final states from becoming completed or queued", () => {
    for (const from of ["completed", "failed", "timed_out", "cancelled", "superseded"] as const) {
      expect(canTransition(from, "completed")).toBe(from === "completed");
      expect(canTransition(from, "queued")).toBe(false);
      expect(isFinalStatus(from)).toBe(true);
      expect(ALLOWED_TRANSITIONS[from]).toEqual([]);
    }
  });

  it("forbids timed_out → completed and cancelled → completed", () => {
    expect(canTransition("timed_out", "completed")).toBe(false);
    expect(canTransition("cancelled", "completed")).toBe(false);
    expect(canTransition("superseded", "queued")).toBe(false);
  });

  it("assertCanTransition throws on forbidden edges", () => {
    expect(() => assertCanTransition("completed", "failed")).toThrow(/Invalid validation run transition/);
  });

  it("marks lease-holding statuses as active", () => {
    expect(isActiveStatus("claimed")).toBe(true);
    expect(isActiveStatus("running")).toBe(true);
    expect(isActiveStatus("queued")).toBe(false);
    expect(isActiveStatus("completed")).toBe(false);
  });
});
