import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.fn();
const signInWithOtp = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    auth: {
      signInWithOAuth,
      signInWithOtp,
    },
  }),
}));

vi.mock("@/lib/env.public", async () => {
  const actual = await vi.importActual<typeof import("@/lib/env.public")>("@/lib/env.public");
  return {
    ...actual,
    getPublicEnv: () => ({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    }),
    getAuthCallbackUrl: (next?: string) =>
      next
        ? `http://localhost:3000/auth/callback?next=${encodeURIComponent(next)}`
        : "http://localhost:3000/auth/callback",
  };
});

vi.mock("@/lib/auth-events", () => ({
  emitAuthEvent: vi.fn(),
}));

describe("sign-in actions", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    signInWithOtp.mockReset();
    vi.resetModules();
  });

  it("starts GitHub OAuth with login scopes only and safe callback", async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: "https://github.com/login/oauth/authorize" }, error: null });
    const { startOAuthProvider } = await import("./actions");
    const result = await startOAuthProvider("github", "/dashboard");
    expect(result.status).toBe("ok");
    expect(signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "github",
        options: expect.objectContaining({
          redirectTo: expect.stringContaining("/auth/callback"),
          scopes: "read:user user:email",
        }),
      }),
    );
  });

  it("starts Google OAuth with google provider", async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: "https://accounts.google.com/o" }, error: null });
    const { startOAuthProvider } = await import("./actions");
    const result = await startOAuthProvider("google");
    expect(result.status).toBe("ok");
    expect(signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
      }),
    );
  });

  it("rejects invalid email server-side", async () => {
    const { requestMagicLink } = await import("./actions");
    const form = new FormData();
    form.set("email", "not-an-email");
    const result = await requestMagicLink({ status: "idle" }, form);
    expect(result.status).toBe("error");
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("returns a generic success message for magic link", async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    const { requestMagicLink } = await import("./actions");
    const form = new FormData();
    form.set("email", "you@company.com");
    const result = await requestMagicLink({ status: "idle" }, form);
    expect(result.status).toBe("sent");
    expect(result.message).not.toContain("you@company.com");
    expect(signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining("/auth/callback"),
        }),
      }),
    );
  });

  it("maps Supabase rate limits without revealing account existence", async () => {
    signInWithOtp.mockResolvedValue({ error: { status: 429, message: "rate limit" } });
    const { requestMagicLink } = await import("./actions");
    const form = new FormData();
    form.set("email", "you@company.com");
    const result = await requestMagicLink({ status: "idle" }, form);
    expect(result.status).toBe("rate_limited");
  });

  it("does not use unsafe next destinations for magic-link redirect", async () => {
    signInWithOtp.mockResolvedValue({ error: null });
    const { requestMagicLink } = await import("./actions");
    const form = new FormData();
    form.set("email", "you@company.com");
    form.set("next", "https://evil.example");
    await requestMagicLink({ status: "idle" }, form);
    expect(signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining("next=%2Fpost-auth"),
        }),
      }),
    );
  });
});
