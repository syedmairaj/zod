import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionHeader } from "./section-header";

describe("SectionHeader", () => {
  it("renders the title as an h2 and an optional eyebrow/description", () => {
    render(<SectionHeader eyebrow="How it works" title="Evidence first." description="Some detail." />);
    expect(screen.getByRole("heading", { level: 2, name: "Evidence first." })).toBeInTheDocument();
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.getByText("Some detail.")).toBeInTheDocument();
  });

  it("renders without an eyebrow or description", () => {
    render(<SectionHeader title="Pricing" />);
    expect(screen.getByRole("heading", { level: 2, name: "Pricing" })).toBeInTheDocument();
  });

  it("centers content when align is 'center'", () => {
    const { container } = render(<SectionHeader title="Pricing" align="center" />);
    expect(container.firstElementChild?.className).toContain("text-center");
  });
});
