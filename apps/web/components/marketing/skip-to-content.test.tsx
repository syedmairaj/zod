import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkipToContent } from "./skip-to-content";

describe("SkipToContent", () => {
  it("links to the main landmark target", () => {
    render(<SkipToContent />);
    const link = screen.getByRole("link", { name: "Skip to content" });
    expect(link).toHaveAttribute("href", "#main");
  });
});
