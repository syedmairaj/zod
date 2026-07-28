import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyGithubWebhookSignature } from "./webhook-verify";

const SECRET = "test-webhook-secret";

function sign(body: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

describe("verifyGithubWebhookSignature", () => {
  it("accepts a correctly signed payload", () => {
    const body = JSON.stringify({ hello: "world" });
    const signature = sign(body, SECRET);
    expect(verifyGithubWebhookSignature(body, signature, SECRET)).toBe(true);
  });

  it("rejects a payload signed with the wrong secret", () => {
    const body = JSON.stringify({ hello: "world" });
    const signature = sign(body, "wrong-secret");
    expect(verifyGithubWebhookSignature(body, signature, SECRET)).toBe(false);
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ hello: "world" });
    const signature = sign(body, SECRET);
    const tamperedBody = JSON.stringify({ hello: "world!" });
    expect(verifyGithubWebhookSignature(tamperedBody, signature, SECRET)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    const body = JSON.stringify({ hello: "world" });
    expect(verifyGithubWebhookSignature(body, null, SECRET)).toBe(false);
    expect(verifyGithubWebhookSignature(body, undefined, SECRET)).toBe(false);
  });

  it("rejects a malformed signature header", () => {
    const body = JSON.stringify({ hello: "world" });
    expect(verifyGithubWebhookSignature(body, "not-a-valid-signature", SECRET)).toBe(false);
    expect(verifyGithubWebhookSignature(body, "sha1=deadbeef", SECRET)).toBe(false);
  });

  it("rejects when webhook secret is empty", () => {
    const body = JSON.stringify({ hello: "world" });
    const signature = sign(body, SECRET);
    expect(verifyGithubWebhookSignature(body, signature, "")).toBe(false);
  });

  it("rejects a signature of different length without throwing", () => {
    const body = JSON.stringify({ hello: "world" });
    expect(() => verifyGithubWebhookSignature(body, "sha256=abcd", SECRET)).not.toThrow();
    expect(verifyGithubWebhookSignature(body, "sha256=abcd", SECRET)).toBe(false);
  });
});
