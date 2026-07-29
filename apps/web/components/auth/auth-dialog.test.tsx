import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthDialog } from "./auth-dialog";

const back = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back }),
}));

vi.mock("@/app/sign-in/actions", () => ({
  startOAuthProvider: vi.fn(),
  requestMagicLink: vi.fn(async () => ({ status: "idle" })),
}));

describe("AuthDialog", () => {
  beforeEach(() => {
    back.mockReset();
  });

  it("exposes an accessible dialog with title and close control", () => {
    render(<AuthDialog />);
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).toHaveAttribute("aria-labelledby", "auth-panel-title");
    expect(dialog).toHaveAttribute("aria-describedby", "auth-panel-desc");
    expect(screen.getByRole("button", { name: "Close sign in", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sign in to Zod.ai", hidden: true })).toBeInTheDocument();
  });

  it("closes via the close button using router.back", async () => {
    const user = userEvent.setup();
    render(<AuthDialog />);
    await user.click(screen.getByRole("button", { name: "Close sign in", hidden: true }));
    expect(back).toHaveBeenCalled();
  });
});
