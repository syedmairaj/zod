import { describe, expect, it, vi } from "vitest";
import { createInstallState, verifyInstallState } from "./install-state";

const SECRET = "state-signing-secret";

describe("install state token", () => {
  it("round-trips organizationId and userId", () => {
    const token = createInstallState({ organizationId: "org-1", userId: "user-1" }, SECRET);
    const payload = verifyInstallState(token, SECRET);
    expect(payload.organizationId).toBe("org-1");
    expect(payload.userId).toBe("user-1");
  });

  it("rejects a token signed with a different secret", () => {
    const token = createInstallState({ organizationId: "org-1", userId: "user-1" }, SECRET);
    expect(() => verifyInstallState(token, "different-secret")).toThrow(/invalid/i);
  });

  it("rejects a tampered payload", () => {
    const token = createInstallState({ organizationId: "org-1", userId: "user-1" }, SECRET);
    const [encodedPayload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ organizationId: "org-attacker", userId: "user-1", nonce: "x", issuedAtMs: Date.now() }),
      "utf8",
    ).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${signature}`;
    expect(() => verifyInstallState(tamperedToken, SECRET)).toThrow(/invalid/i);
  });

  it("rejects a malformed token", () => {
    expect(() => verifyInstallState("not-a-token", SECRET)).toThrow(/malformed/i);
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    const token = createInstallState({ organizationId: "org-1", userId: "user-1" }, SECRET);

    vi.setSystemTime(new Date("2024-01-01T01:00:00Z")); // +1 hour
    expect(() => verifyInstallState(token, SECRET, 15 * 60 * 1000)).toThrow(/expired/i);
    vi.useRealTimers();
  });
});
