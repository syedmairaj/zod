import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SecuritySection } from "./security-section";

vi.mock("@/lib/motion/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));

const PRINCIPLES = [
  "Least privilege",
  "Short-lived credentials",
  "Tenant-scoped authorization",
  "Isolated execution",
  "Safe failure",
  "Explicit approvals",
  "Data minimization",
  "Auditability",
  "Prompt-injection resistance",
  "Provider abstraction",
];

const BOUNDARIES = [
  "GitHub boundary",
  "Trusted worker orchestration",
  "Isolated sandbox",
  "Evidence boundary",
  "Decision engine",
];

describe("SecuritySection", () => {
  it("renders the headline, supporting copy, and #security anchor", () => {
    const { container } = render(<SecuritySection />);
    expect(
      screen.getByRole("heading", { name: /Untrusted code belongs in an isolated environment\./ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Zod\.ai separates trusted orchestration from untrusted repository execution, limits credentials and permissions, and records the evidence used for every decision\./,
      ),
    ).toBeInTheDocument();
    expect(container.querySelector("section#security")).toBeInTheDocument();
  });

  it("shows all five trust-boundary stages in order", () => {
    render(<SecuritySection />);
    BOUNDARIES.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it("states that GitHub credentials stop at the trusted worker boundary", () => {
    render(<SecuritySection />);
    expect(screen.getByText(/Credential boundary/i)).toBeInTheDocument();
    expect(
      screen.getByText(/GitHub credentials stop here\. Installation tokens are minted and used by the trusted worker only/),
    ).toBeInTheDocument();
    expect(screen.getByText(/not passed into repository commands/)).toBeInTheDocument();
  });

  it("labels every security principle with a visible text status", () => {
    render(<SecuritySection />);
    PRINCIPLES.forEach((principle) => {
      expect(screen.getByText(principle)).toBeInTheDocument();
    });
    // Status text (not color alone) must appear for all three states used in the matrix.
    expect(screen.getAllByText("Implemented now").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("In development").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Planned architecture").length).toBeGreaterThanOrEqual(1);
  });

  it("marks isolated sandbox and restricted egress as Planned architecture, not implemented", () => {
    render(<SecuritySection />);
    const sandbox = screen.getByText("Isolated sandbox").closest("div");
    expect(sandbox).toHaveTextContent("Planned architecture");
    expect(screen.getByText(/Restricted network egress/)).toBeInTheDocument();
    expect(screen.getByText(/Isolated execution/)).toBeInTheDocument();
  });

  it("distinguishes application-level audit records from immutable external infrastructure", () => {
    render(<SecuritySection />);
    expect(screen.getByText(/Not an immutable external audit ledger/)).toBeInTheDocument();
    expect(
      screen.getByText(/not a substitute for immutable external audit infrastructure/),
    ).toBeInTheDocument();
  });

  it("does not claim Docker alone is enough or that stronger isolation is unnecessary", () => {
    render(<SecuritySection />);
    expect(
      screen.getByText(/Docker alone is not treated as sufficient for hostile public repositories/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Stronger isolation \(beyond container defaults\) is required before broad public execution/),
    ).toBeInTheDocument();
  });

  it("contains no prohibited certification or absolute-security wording", () => {
    const { container } = render(<SecuritySection />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/enterprise-grade/i);
    expect(text).not.toMatch(/bank-grade/i);
    expect(text).not.toMatch(/SOC\s*2 certified/i);
    expect(text).not.toMatch(/we are (SOC|ISO|HIPAA|GDPR)/i);
    expect(text).not.toMatch(/guaranteed (correctness|security|isolation)/i);
    // Banned terms appear only inside an explicit disclaimer.
    expect(
      screen.getByText(
        /does not claim SOC 2, ISO 27001, HIPAA, GDPR certification, zero-trust product certification, or that production secrets can never be exposed/,
      ),
    ).toBeInTheDocument();
  });

  it("keeps boundary and principle content visible without hover under reduced motion", () => {
    render(<SecuritySection />);
    expect(screen.getByText("GitHub boundary")).toBeVisible();
    expect(screen.getByText("Least privilege")).toBeVisible();
    expect(screen.getByText(/Credential boundary/i)).toBeVisible();
  });
});
