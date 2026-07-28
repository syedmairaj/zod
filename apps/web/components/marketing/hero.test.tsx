import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Hero } from "./hero";

vi.mock("@/lib/motion/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));

describe("Hero", () => {
  it("renders exactly one H1 with the primary headline and a correctly targeted CTA", () => {
    render(<Hero primaryCtaHref="/sign-in" primaryCtaLabel="Connect GitHub" />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("The reliability layer for AI-generated code.");

    const cta = screen.getByRole("link", { name: "Connect GitHub" });
    expect(cta).toHaveAttribute("href", "/sign-in");
  });

  it("includes the honest 'no production credentials required' microcopy", () => {
    render(<Hero primaryCtaHref="/sign-in" primaryCtaLabel="Connect GitHub" />);
    expect(screen.getByText(/No production credentials required/)).toBeInTheDocument();
  });
});
