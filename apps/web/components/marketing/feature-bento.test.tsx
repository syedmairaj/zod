import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeatureBento } from "./feature-bento";

// `Reveal` (used by every card) renders a `motion.div` with `initial={{opacity:0}}`
// gated by `whileInView`; jsdom's mocked `IntersectionObserver` never fires,
// so without this mock every card would stay inline `opacity: 0` forever and
// `toBeVisible()` assertions below would fail for reasons unrelated to what
// they're actually testing (same pattern as hero.test.tsx).
vi.mock("@/lib/motion/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));

const TITLES = [
  "Pull-request validator",
  "Project Brain",
  "Independent verification",
  "Agent Guard",
  "MCP Firewall",
  "Evidence-backed findings",
];

describe("FeatureBento", () => {
  it("renders the headline and the #product anchor used by the header nav", () => {
    const { container } = render(<FeatureBento />);
    expect(screen.getByRole("heading", { name: /A governance layer, not a review bot\./ })).toBeInTheDocument();
    expect(container.querySelector("section#product")).toBeInTheDocument();
  });

  it("renders all six capability cards in the specified order", () => {
    render(<FeatureBento />);
    const headings = screen.getAllByText(/^(Pull-request validator|Project Brain|Independent verification|Agent Guard|MCP Firewall|Evidence-backed findings)$/);
    expect(headings.map((el) => el.textContent)).toEqual(TITLES);
  });

  it("labels every card with an accurate, non-hover-dependent status", () => {
    render(<FeatureBento />);
    expect(screen.getByText("In development")).toBeInTheDocument();
    expect(screen.getAllByText("Planned")).toHaveLength(5);
    expect(screen.queryByText("Available")).not.toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("marks MCP Firewall as Planned specifically, not Available or Beta", () => {
    render(<FeatureBento />);
    const card = screen.getByText("MCP Firewall").closest("div");
    expect(card).not.toBeNull();
    expect(card?.parentElement).toHaveTextContent("Planned");
  });

  it("does not claim perfect repository understanding for Project Brain", () => {
    render(<FeatureBento />);
    expect(screen.getByText(/not a claim of perfect or complete understanding/)).toBeInTheDocument();
  });

  it("states all five Agent Guard policy outcomes", () => {
    render(<FeatureBento />);
    expect(screen.getByText("Allow", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Allow with warning")).toBeInTheDocument();
    expect(screen.getByText("Require approval")).toBeInTheDocument();
    expect(screen.getByText("Request changes")).toBeInTheDocument();
    expect(screen.getByText("Block", { selector: "span" })).toBeInTheDocument();
  });

  it("lists all seven evidence-backed finding attributes across the card body and microvisual", () => {
    render(<FeatureBento />);
    expect(
      screen.getByText(/file, line, policy, severity, evidence source, confidence basis, and a concrete remediation/),
    ).toBeInTheDocument();
    expect(screen.getByText("webhook.ts:42")).toBeInTheDocument();
    expect(screen.getByText("POL-TENANT-01")).toBeInTheDocument();
    expect(screen.getByText("Add organization_id")).toBeInTheDocument();
  });

  it("names all six deterministic checks in the validator microvisual", () => {
    render(<FeatureBento />);
    ["Typecheck", "Lint", "Test", "Build", "Security", "Contracts"].forEach((check) => {
      expect(screen.getByText(check)).toBeInTheDocument();
    });
  });

  it("shows MCP Firewall scope, approval, budget, and audit in the microvisual", () => {
    render(<FeatureBento />);
    expect(screen.getByText("filesystem.write")).toBeInTheDocument();
    expect(screen.getByText("repo-only")).toBeInTheDocument();
    expect(screen.getByText("50 calls / hour")).toBeInTheDocument();
    expect(screen.getByText("Logged")).toBeInTheDocument();
  });

  it("shows the independent-verifier challenge as confirm/downgrade/reject language plus a live example", () => {
    render(<FeatureBento />);
    expect(screen.getByText(/confirming, downgrading, or rejecting/)).toBeInTheDocument();
    expect(screen.getByText("Primary reviewer")).toBeInTheDocument();
    expect(screen.getByText("Independent verifier")).toBeInTheDocument();
  });

  it("renders every card's critical content in plain text, not inside a hover-only element", () => {
    // jsdom never applies `:hover`/CSS opacity, so if these assertions pass
    // without simulating any pointer event, the title/status/body text is
    // not gated behind hover -- only the decorative spotlight div is.
    render(<FeatureBento />);
    TITLES.forEach((title) => {
      expect(screen.getByText(title)).toBeVisible();
    });
    expect(screen.getByText(/Deterministic checks/)).toBeVisible();
  });

  it("hides the decorative hover spotlight from assistive technology", () => {
    const { container } = render(<FeatureBento />);
    const spotlights = container.querySelectorAll('[aria-hidden="true"].pointer-events-none');
    expect(spotlights.length).toBeGreaterThanOrEqual(6);
  });

  it("uses reduced-motion-safe Reveal (no opacity-0 stuck state under mocked reduce)", () => {
    // useReducedMotion is mocked true at the top of this file; Reveal then
    // renders a plain element with no Motion initial={{opacity:0}}, so
    // every card title remains visible without IntersectionObserver firing.
    render(<FeatureBento />);
    TITLES.forEach((title) => {
      expect(screen.getByText(title)).toBeVisible();
    });
  });
});
