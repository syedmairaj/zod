import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PricingPreview } from "./pricing-preview";

vi.mock("@/lib/motion/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));

describe("PricingPreview", () => {
  it("uses Pricing coming soon and keeps the #pricing anchor", () => {
    const { container } = render(<PricingPreview />);
    expect(screen.getByRole("heading", { name: /Pricing coming soon/ })).toBeInTheDocument();
    expect(container.querySelector("section#pricing")).toBeInTheDocument();
  });

  it("shows three Planned tiers with no dollar amounts", () => {
    const { container } = render(<PricingPreview />);
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Business")).toBeInTheDocument();
    expect(screen.getAllByText("Planned")).toHaveLength(3);
    expect(container.textContent).not.toMatch(/\$\d/);
    expect(container.textContent).not.toMatch(/USD|per month|\/mo|\/seat/i);
  });

  it("includes the early-access pricing disclaimer", () => {
    render(<PricingPreview />);
    expect(
      screen.getByText(/Plans, limits, and availability may change during early access\./),
    ).toBeInTheDocument();
  });

  it("does not render checkout, billing, or most-popular chrome", () => {
    const { container } = render(<PricingPreview />);
    expect(container.textContent).not.toMatch(/subscribe|stripe|buy now|most popular/i);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    // "checkout" appears only inside the explicit "not a … checkout" disclaimer.
    expect(screen.getByText(/not a price list, contract, or checkout/)).toBeInTheDocument();
  });
});
