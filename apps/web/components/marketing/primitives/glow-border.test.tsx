import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GlowBorder } from "./glow-border";

describe("GlowBorder", () => {
  it("renders children inside the gradient-border wrapper", () => {
    render(<GlowBorder>content</GlowBorder>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("uses no animation classes (static, controlled accent per the design system)", () => {
    const { container } = render(<GlowBorder>content</GlowBorder>);
    expect(container.innerHTML).not.toContain("animate-");
  });
});
