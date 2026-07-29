import { describe, expect, it } from "vitest";
import { hasBareRootAuthCode, shouldForwardToAuthCallback } from "./middleware-auth";

describe("shouldForwardToAuthCallback", () => {
  it("never forwards arbitrary root ?code= as an auth callback", () => {
    const params = new URLSearchParams("code=not-an-auth-code");
    expect(shouldForwardToAuthCallback("/", params)).toBe(false);
  });

  it("never forwards ?code= on unrelated paths", () => {
    const params = new URLSearchParams("code=abc123");
    expect(shouldForwardToAuthCallback("/org/demo", params)).toBe(false);
    expect(shouldForwardToAuthCallback("/pricing", params)).toBe(false);
  });

  it("never forwards token_hash combinations automatically", () => {
    const params = new URLSearchParams("token_hash=abc&type=magiclink");
    expect(shouldForwardToAuthCallback("/", params)).toBe(false);
  });

  it("does not forward when already on /auth/callback", () => {
    const params = new URLSearchParams("code=real");
    expect(shouldForwardToAuthCallback("/auth/callback", params)).toBe(false);
  });
});

describe("hasBareRootAuthCode", () => {
  it("detects accidental root code landings without treating them as auth", () => {
    expect(hasBareRootAuthCode("/", new URLSearchParams("code=xyz"))).toBe(true);
    expect(hasBareRootAuthCode("/", new URLSearchParams("token_hash=a&type=magiclink"))).toBe(false);
    expect(hasBareRootAuthCode("/sign-in", new URLSearchParams("code=xyz"))).toBe(false);
  });
});
