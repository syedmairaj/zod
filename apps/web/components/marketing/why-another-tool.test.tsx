import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WhyAnotherTool } from "./why-another-tool";

vi.mock("@/lib/motion/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));

describe("WhyAnotherTool", () => {
  it("renders the positioning headline and supporting copy", () => {
    render(<WhyAnotherTool />);
    expect(screen.getByRole("heading", { name: "Why another AI tool?" })).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => {
        const text = element?.textContent ?? "";
        return (
          element?.tagName === "P" &&
          text.includes("AI coding assistants generate code.") &&
          text.includes("Zod.ai independently verifies whether that code should reach production.")
        );
      }),
    ).toBeInTheDocument();
  });

  it("keeps the #why anchor for in-page navigation", () => {
    const { container } = render(<WhyAnotherTool />);
    expect(container.querySelector("section#why")).toBeInTheDocument();
  });

  it("renders both comparison columns", () => {
    render(<WhyAnotherTool />);
    expect(screen.getByRole("heading", { name: "Traditional AI workflow" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Zod.ai workflow" })).toBeInTheDocument();
  });

  it("renders the traditional workflow steps", () => {
    render(<WhyAnotherTool />);
    expect(screen.getAllByText("Cursor / Claude Code")).toHaveLength(2);
    expect(screen.getByText("Generated code")).toBeInTheDocument();
    expect(screen.getByText("Human review")).toBeInTheDocument();
    expect(screen.getByText("Production")).toBeInTheDocument();
  });

  it("renders the Zod.ai workflow steps including validation and merge", () => {
    render(<WhyAnotherTool />);
    expect(screen.getByText("Zod.ai Validation")).toBeInTheDocument();
    expect(screen.getByText("Evidence Collection")).toBeInTheDocument();
    expect(screen.getByText("Independent Verification")).toBeInTheDocument();
    expect(screen.getByText("Governance Decision")).toBeInTheDocument();
    expect(screen.getByText("Merge")).toBeInTheDocument();
  });

  it("marks the traditional path as ungated and the Zod path as evidence-gated", () => {
    render(<WhyAnotherTool />);
    expect(screen.getByText("Ungated")).toBeInTheDocument();
    expect(screen.getByText("Evidence-gated")).toBeInTheDocument();
  });
});
