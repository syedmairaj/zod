import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PrimaryButton } from "./primary-button";

describe("PrimaryButton", () => {
  it("renders as a link with the given href when href is provided", () => {
    render(<PrimaryButton href="/sign-in">Connect GitHub</PrimaryButton>);
    const link = screen.getByRole("link", { name: "Connect GitHub" });
    expect(link).toHaveAttribute("href", "/sign-in");
  });

  it("renders as a native button and forwards onClick when no href is provided", async () => {
    const onClick = vi.fn();
    render(<PrimaryButton onClick={onClick}>Submit</PrimaryButton>);
    const button = screen.getByRole("button", { name: "Submit" });
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies the visible focus-ring utility classes", () => {
    render(<PrimaryButton href="/sign-in">Connect GitHub</PrimaryButton>);
    const link = screen.getByRole("link", { name: "Connect GitHub" });
    expect(link.className).toContain("focus-visible:ring-2");
  });

  it("uses tactile press instead of hover scale", () => {
    render(<PrimaryButton href="/sign-in">Connect GitHub</PrimaryButton>);
    const link = screen.getByRole("link", { name: "Connect GitHub" });
    expect(link.className).toContain("active:scale-[0.98]");
    expect(link.className).not.toContain("hover:scale-");
  });

  it("disables the native button variant when disabled is set", () => {
    render(<PrimaryButton disabled>Submit</PrimaryButton>);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });
});
