import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      exchangeCodeForSession,
      verifyOtp,
    },
  }),
}));

vi.mock("@/lib/env.public", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  }),
}));

vi.mock("@/lib/auth-events", () => ({
  emitAuthEvent: vi.fn(),
}));

describe("auth callback route", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    verifyOtp.mockReset();
    vi.resetModules();
  });

  it("exchanges OAuth code and redirects to safe next", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost:3000/auth/callback?code=abc&next=/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
  });

  it("verifies token_hash magic-link flow", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost:3000/auth/callback?token_hash=hash&type=magiclink"),
    );
    expect(response.headers.get("location")).toBe("http://localhost:3000/post-auth");
    expect(verifyOtp).toHaveBeenCalledWith({ type: "magiclink", token_hash: "hash" });
  });

  it("rejects missing code safely", async () => {
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost:3000/auth/callback"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in?error=missing_code");
  });

  it("rejects provider errors generically", async () => {
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost:3000/auth/callback?error=access_denied"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in?error=provider_error");
  });

  it("rejects unsafe next and falls back to /post-auth on success", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost:3000/auth/callback?code=abc&next=https://evil.example"),
    );
    expect(response.headers.get("location")).toBe("http://localhost:3000/post-auth");
  });

  it("maps exchange failures to auth_failed", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "nope" } });
    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost:3000/auth/callback?code=bad"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in?error=auth_failed");
  });
});
