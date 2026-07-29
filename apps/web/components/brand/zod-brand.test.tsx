import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ZodBrandLink } from "./zod-brand-link";
import { ZodSymbol } from "./zod-symbol";

describe("ZodSymbol", () => {
  it("renders a decorative SVG mark by default", () => {
    const { container } = render(<ZodSymbol />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});

describe("ZodBrandLink", () => {
  it("places the mark beside the Zod.ai wordmark", () => {
    const { container, getByRole } = render(<ZodBrandLink />);
    const link = getByRole("link", { name: /Zod\.ai/i });
    expect(link).toHaveAttribute("href", "/");
    expect(container.querySelector("svg")).toBeTruthy();
    expect(link.textContent).toContain("Zod.ai");
  });
});
