import { describe, expect, it } from "vitest";
import { DEFAULT_POST_AUTH_PATH, resolveSafeRedirect } from "./safe-redirect";

describe("resolveSafeRedirect", () => {
  it("defaults empty or missing values to /post-auth", () => {
    expect(resolveSafeRedirect(null)).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafeRedirect(undefined)).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafeRedirect("")).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafeRedirect("   ")).toBe(DEFAULT_POST_AUTH_PATH);
  });

  it("accepts allowlisted internal paths", () => {
    expect(resolveSafeRedirect("/post-auth")).toBe("/post-auth");
    expect(resolveSafeRedirect("/dashboard")).toBe("/dashboard");
    expect(resolveSafeRedirect("/onboarding")).toBe("/onboarding");
    expect(resolveSafeRedirect("/org/abc-123")).toBe("/org/abc-123");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(resolveSafeRedirect("https://evil.example/phish")).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafeRedirect("http://evil.example")).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafeRedirect("//evil.example")).toBe(DEFAULT_POST_AUTH_PATH);
  });

  it("rejects javascript and data schemes", () => {
    expect(resolveSafeRedirect("javascript:alert(1)")).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafeRedirect("data:text/html;base64,aaaa")).toBe(DEFAULT_POST_AUTH_PATH);
  });

  it("rejects backslash and traversal bypasses", () => {
    expect(resolveSafeRedirect("/\\evil.example")).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafeRedirect("/org/../admin")).toBe(DEFAULT_POST_AUTH_PATH);
  });

  it("rejects encoded external redirects", () => {
    expect(resolveSafeRedirect(encodeURIComponent("https://evil.example"))).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafeRedirect("/%2f%2fevil.example")).toBe(DEFAULT_POST_AUTH_PATH);
  });

  it("rejects paths outside the allowlist", () => {
    expect(resolveSafeRedirect("/sign-in")).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafeRedirect("/api/github/webhook")).toBe(DEFAULT_POST_AUTH_PATH);
  });
});
