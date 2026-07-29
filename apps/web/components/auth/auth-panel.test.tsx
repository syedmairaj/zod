import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPanel } from "./auth-panel";

const startOAuthProvider = vi.fn();
const requestMagicLink = vi.fn();

vi.mock("@/app/sign-in/actions", () => ({
  startOAuthProvider: (...args: unknown[]) => startOAuthProvider(...args),
  requestMagicLink: (...args: unknown[]) => requestMagicLink(...args),
}));

describe("AuthPanel", () => {
  beforeEach(() => {
    startOAuthProvider.mockReset();
    requestMagicLink.mockReset();
    requestMagicLink.mockResolvedValue({
      status: "sent",
      message: "If that address can receive mail, a sign-in link is on the way. Check your inbox.",
    });
  });

  it("renders shared heading, provider CTAs, and legal links", () => {
    render(<AuthPanel />);
    expect(screen.getByRole("heading", { name: "Sign in to Zod.ai" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Email me a sign-in link" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  });

  it("starts GitHub OAuth with the github provider", async () => {
    const user = userEvent.setup();
    startOAuthProvider.mockResolvedValue({ status: "ok", url: "https://example.test/oauth/github" });
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });

    render(<AuthPanel />);
    await user.click(screen.getByRole("button", { name: "Continue with GitHub" }));

    expect(startOAuthProvider).toHaveBeenCalledWith("github", undefined);
    expect(assign).toHaveBeenCalledWith("https://example.test/oauth/github");
    vi.unstubAllGlobals();
  });

  it("starts Google OAuth with the google provider", async () => {
    const user = userEvent.setup();
    startOAuthProvider.mockResolvedValue({ status: "ok", url: "https://example.test/oauth/google" });
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });

    render(<AuthPanel />);
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(startOAuthProvider).toHaveBeenCalledWith("google", undefined);
    vi.unstubAllGlobals();
  });

  it("prevents duplicate provider submits while redirecting", async () => {
    const user = userEvent.setup();
    let resolveOAuth: (value: { status: "ok"; url: string }) => void = () => undefined;
    startOAuthProvider.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOAuth = resolve;
        }),
    );

    render(<AuthPanel />);
    const github = screen.getByRole("button", { name: "Continue with GitHub" });
    await user.click(github);
    await user.click(github);
    expect(startOAuthProvider).toHaveBeenCalledTimes(1);
    resolveOAuth({ status: "ok", url: "https://example.test/oauth/github" });
  });

  it("shows a generic provider error without raw details", async () => {
    const user = userEvent.setup();
    startOAuthProvider.mockResolvedValue({
      status: "error",
      message: "Could not start provider sign-in. Please try again.",
    });

    render(<AuthPanel />);
    await user.click(screen.getByRole("button", { name: "Continue with GitHub" }));
    expect(await screen.findByText(/Could not start provider sign-in/i)).toBeInTheDocument();
  });

  it("renders callback error codes generically", () => {
    render(<AuthPanel errorCode="auth_failed" />);
    expect(screen.getByText(/Sign-in could not be completed/i)).toBeInTheDocument();
  });

  it("rejects invalid email client-side via required email input", () => {
    render(<AuthPanel />);
    const email = screen.getByLabelText("Work email");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toHaveAttribute("inputmode", "email");
  });
});
