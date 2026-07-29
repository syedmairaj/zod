import { describe, expect, it } from "vitest";
import AuthSlotDefault from "@/app/@auth/default";
import InterceptedSignInPage from "@/app/@auth/(.)sign-in/page";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock("@/lib/auth-events", () => ({
  emitAuthEvent: vi.fn(),
}));

vi.mock("@/app/sign-in/actions", () => ({
  startOAuthProvider: vi.fn(),
  requestMagicLink: vi.fn(async () => ({ status: "idle" })),
}));

describe("auth route slots", () => {
  it("provides a null @auth default fallback for hard navigation", () => {
    expect(AuthSlotDefault()).toBeNull();
  });

  it("intercepted sign-in route renders the modal AuthPanel", () => {
    render(<InterceptedSignInPage />);
    expect(screen.getByRole("heading", { name: "Sign in to Zod.ai", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument();
  });
});
