import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renders the text label (color is never the only signal)", () => {
    render(<StatusBadge status="beta">Beta</StatusBadge>);
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("applies status-specific styling", () => {
    render(<StatusBadge status="critical">Critical</StatusBadge>);
    expect(screen.getByText("Critical").className).toContain("text-critical");
  });

  it("hides the decorative dot from assistive technology", () => {
    const { container } = render(<StatusBadge status="available">Available</StatusBadge>);
    const dot = container.querySelector("[aria-hidden='true']");
    expect(dot).toBeInTheDocument();
  });
});
