import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SecondaryButton } from "./secondary-button";

describe("SecondaryButton", () => {
  it("renders as a link with the given href when href is provided", () => {
    render(<SecondaryButton href="/sign-in">Sign in</SecondaryButton>);
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link).toHaveAttribute("href", "/sign-in");
  });

  it("renders as a native button when no href is provided", () => {
    render(<SecondaryButton>Cancel</SecondaryButton>);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("applies the visible focus-ring utility classes", () => {
    render(<SecondaryButton>Cancel</SecondaryButton>);
    expect(screen.getByRole("button", { name: "Cancel" }).className).toContain("focus-visible:ring-2");
  });

  it("uses tactile press and fine-pointer hover elevation", () => {
    render(<SecondaryButton>Cancel</SecondaryButton>);
    const button = screen.getByRole("button", { name: "Cancel" });
    expect(button.className).toContain("active:scale-[0.98]");
    expect(button.className).toContain("hover:-translate-y-px");
  });
});
