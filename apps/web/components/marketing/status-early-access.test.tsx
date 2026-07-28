import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StatusEarlyAccess } from "./status-early-access";

vi.mock("@/lib/motion/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));

describe("StatusEarlyAccess", () => {
  it("renders the early-access headline and honest product state", () => {
    render(<StatusEarlyAccess primaryCtaHref="/sign-in" primaryCtaLabel="Connect GitHub" />);
    expect(
      screen.getByRole("heading", {
        name: /Built for teams adopting AI-generated code before their review process is ready\./,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Honest product state/i)).toBeInTheDocument();
    expect(screen.getByText(/Sandbox execution, deterministic check engines, AI review, and billing are not production-ready/)).toBeInTheDocument();
  });

  it("lists ideal users and early-access benefits without over-promising", () => {
    render(<StatusEarlyAccess primaryCtaHref="/sign-in" primaryCtaLabel="Connect GitHub" />);
    expect(screen.getByText(/Cursor, Claude Code, Codex/)).toBeInTheDocument();
    expect(screen.getByText(/Connect one repository/)).toBeInTheDocument();
    // Promises appear only inside the explicit "does not include" disclaimer.
    expect(
      screen.getByText(
        /Early access does not include unlimited repositories, guaranteed bug detection, enterprise SLAs, instant support, or full CI\/CD coverage/,
      ),
    ).toBeInTheDocument();
  });

  it("uses real CTA destinations only", () => {
    render(<StatusEarlyAccess primaryCtaHref="/sign-in" primaryCtaLabel="Connect GitHub" />);
    expect(screen.getByRole("link", { name: "Connect GitHub" })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: "See pricing preview" })).toHaveAttribute("href", "#pricing");
  });

  it("contains no fake social proof or urgency language", () => {
    const { container } = render(
      <StatusEarlyAccess primaryCtaHref="/sign-in" primaryCtaLabel="Connect GitHub" />,
    );
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/customers?/i);
    expect(text).not.toMatch(/joining now/i);
    expect(text).not.toMatch(/spots left/i);
    expect(text).not.toMatch(/countdown/i);
    expect(text).not.toMatch(/\d+\+?\s*(teams|users|developers)/i);
  });
});
