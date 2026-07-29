import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Surface } from "./surface";

describe("Surface", () => {
  it("renders children inside a panel surface by default", () => {
    render(<Surface>content</Surface>);
    const el = screen.getByText("content");
    expect(el.className).toContain("bg-surface-panel");
    expect(el.className).toContain("border");
  });

  it("switches to the elevated surface variant", () => {
    render(<Surface variant="elevated">content</Surface>);
    expect(screen.getByText("content").className).toContain("bg-surface-elevated");
  });

  it("omits the border when bordered is false", () => {
    render(<Surface bordered={false}>content</Surface>);
    expect(screen.getByText("content").className).not.toContain("border-border");
  });

  it("adds soft elevation utilities when interactive", () => {
    render(<Surface interactive>content</Surface>);
    expect(screen.getByText("content").className).toContain("hover:shadow-edge");
  });
});
