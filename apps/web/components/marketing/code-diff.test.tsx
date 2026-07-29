import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodeDiff } from "./code-diff";

vi.mock("@/lib/motion/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));

describe("CodeDiff", () => {
  it("renders the filename and diff markers", () => {
    render(
      <CodeDiff
        filename="auth.ts"
        lines={[
          { type: "context", content: "export function check() {", lineNumber: 1 },
          { type: "remove", content: "  return true;", lineNumber: 2 },
          { type: "add", content: "  return verified;", lineNumber: 2 },
        ]}
      />,
    );

    expect(screen.getByText("auth.ts")).toBeInTheDocument();
    expect(screen.getByText("export function check() {")).toBeInTheDocument();
    expect(screen.getByText("return true;")).toBeInTheDocument();
    expect(screen.getByText("return verified;")).toBeInTheDocument();
  });

  it("keeps the panel constrained so long lines do not expand layout", () => {
    const { container } = render(
      <CodeDiff
        filename="long.ts"
        lines={[{ type: "add", content: "x".repeat(200) }]}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("min-w-0");
    expect(root.className).toContain("overflow-hidden");
  });
});
