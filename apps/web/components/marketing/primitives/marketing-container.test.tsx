import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarketingContainer } from "./marketing-container";

describe("MarketingContainer", () => {
  it("applies the shared max-width and padding classes", () => {
    render(<MarketingContainer>content</MarketingContainer>);
    const el = screen.getByText("content");
    expect(el.className).toContain("max-w-content");
    expect(el.className).toContain("mx-auto");
  });

  it("merges a caller-provided className", () => {
    render(<MarketingContainer className="flex items-center">content</MarketingContainer>);
    expect(screen.getByText("content").className).toContain("flex");
  });
});
