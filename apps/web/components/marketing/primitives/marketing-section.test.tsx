import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarketingSection } from "./marketing-section";

describe("MarketingSection", () => {
  it("renders a <section> with the given id for in-page anchor links", () => {
    const { container } = render(
      <MarketingSection id="product">
        <p>content</p>
      </MarketingSection>,
    );
    const section = container.querySelector("section#product");
    expect(section).toBeInTheDocument();
  });

  it("wraps children in the shared content container by default", () => {
    render(
      <MarketingSection>
        <p>content</p>
      </MarketingSection>,
    );
    expect(screen.getByText("content").parentElement?.className).toContain("max-w-content");
  });

  it("skips the content container when contained is false", () => {
    render(
      <MarketingSection contained={false}>
        <p>content</p>
      </MarketingSection>,
    );
    expect(screen.getByText("content").parentElement?.className).not.toContain("max-w-content");
  });

  it("applies the tinted background when requested", () => {
    const { container } = render(
      <MarketingSection tinted>
        <p>content</p>
      </MarketingSection>,
    );
    expect(container.querySelector("section")?.className).toContain("bg-surface/40");
  });
});
