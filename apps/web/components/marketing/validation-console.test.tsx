import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationConsole } from "./validation-console";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

const STAGE_DURATION_MS = 2600;

describe("ValidationConsole", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('labels itself "Interactive product preview"', () => {
    mockMatchMedia(true);
    render(<ValidationConsole />);
    expect(screen.getByText("Interactive product preview")).toBeInTheDocument();
  });

  it("is readable in its static initial state before any timer fires", () => {
    mockMatchMedia(true);
    render(<ValidationConsole />);

    expect(screen.getByText("Change intent captured")).toBeInTheDocument();
    expect(
      screen.getByText(/Add an endpoint that lets authenticated customers retrieve one of their orders/),
    ).toBeInTheDocument();
    expect(screen.queryByText("BLOCK MERGE")).not.toBeInTheDocument();
  });

  it('defaults to "Code change" mode with playback controls visible', () => {
    mockMatchMedia(true);
    render(<ValidationConsole />);

    expect(screen.getByRole("button", { name: "Code change" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Agent action — Planned" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next stage" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Replay" })).toBeInTheDocument();
  });

  it('"Agent action — Planned" mode shows a static preview and hides playback controls', () => {
    mockMatchMedia(true);
    render(<ValidationConsole />);

    fireEvent.click(screen.getByRole("button", { name: "Agent action — Planned" }));

    expect(screen.getByText("Planned capability")).toBeInTheDocument();
    expect(screen.getByText(/Run a production database migration/)).toBeInTheDocument();
    expect(screen.getByText("REQUIRE APPROVAL")).toBeInTheDocument();
    expect(screen.getByText(/human-approved execution window/)).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next stage" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Replay" })).not.toBeInTheDocument();
  });

  describe("with motion enabled", () => {
    beforeEach(() => {
      mockMatchMedia(false);
      vi.useFakeTimers();
    });

    // Note: the stage content pane is wrapped in `AnimatePresence`, whose exit
    // transition is driven by Motion's own rAF loop rather than the fake
    // `setInterval` clock, so it doesn't settle inside `act()` here. The
    // `aria-live` status region (plain React state, no Motion) updates
    // synchronously and fully exercises the state machine.
    it("auto-advances through all seven stages on a single interval and stops after the last one", () => {
      render(<ValidationConsole />);
      const status = screen.getByRole("status");

      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS);
      });
      expect(status).toHaveTextContent("Stage 2 of 7: Repository intelligence loaded (passed)");

      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS);
      });
      expect(status).toHaveTextContent("Stage 3 of 7: Deterministic evidence collected (blocked)");

      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS);
      });
      expect(status).toHaveTextContent("Stage 4 of 7: Correctness and architecture evaluated (blocked)");

      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS);
      });
      expect(status).toHaveTextContent("Stage 5 of 7: Hallucination and repository drift checked (warning)");

      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS);
      });
      expect(status).toHaveTextContent("Stage 6 of 7: Independent verifier challenge (blocked)");

      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS);
      });
      expect(status).toHaveTextContent("Stage 7 of 7: Governance decision issued (blocked)");
      expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Next stage" })).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS * 3); // further ticks must be no-ops
      });
      expect(status).toHaveTextContent("Stage 7 of 7: Governance decision issued (blocked)");
    });

    it("pauses and resumes playback from a single Play/Pause control", () => {
      render(<ValidationConsole />);
      const status = screen.getByRole("status");

      fireEvent.click(screen.getByRole("button", { name: "Pause" }));
      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS * 2);
      });
      expect(status).toHaveTextContent("Stage 1 of 7: Change intent captured (passed)");

      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS);
      });
      expect(status).toHaveTextContent("Stage 2 of 7: Repository intelligence loaded (passed)");
    });

    it("replay resets back to the first stage", () => {
      render(<ValidationConsole />);
      const status = screen.getByRole("status");

      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS * 2);
      });
      expect(status).toHaveTextContent("Stage 3 of 7: Deterministic evidence collected (blocked)");

      fireEvent.click(screen.getByRole("button", { name: "Replay" }));
      expect(status).toHaveTextContent("Stage 1 of 7: Change intent captured (passed)");
    });

    it('switching to "Agent action — Planned" pauses the run without losing progress', () => {
      render(<ValidationConsole />);
      const status = screen.getByRole("status");

      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS * 2);
      });
      expect(status).toHaveTextContent("Stage 3 of 7: Deterministic evidence collected (blocked)");

      fireEvent.click(screen.getByRole("button", { name: "Agent action — Planned" }));
      act(() => {
        vi.advanceTimersByTime(STAGE_DURATION_MS * 5);
      });

      fireEvent.click(screen.getByRole("button", { name: "Code change" }));
      expect(status).toHaveTextContent("Stage 3 of 7: Deterministic evidence collected (blocked)");
      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    });

    it("clears its interval on unmount, leaving no dangling timer", () => {
      const { unmount } = render(<ValidationConsole />);
      expect(vi.getTimerCount()).toBeGreaterThan(0);

      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("with reduced motion preferred", () => {
    beforeEach(() => {
      mockMatchMedia(true);
    });

    it("never auto-advances, disables Play/Pause, and only moves via Next Stage", () => {
      render(<ValidationConsole />);

      expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
      expect(screen.getByText("Change intent captured")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
      expect(screen.getByText("Project Brain")).toBeInTheDocument();
    });

    it("announces the current stage and outcome in a live status region for screen readers", () => {
      render(<ValidationConsole />);
      const status = screen.getByRole("status");
      expect(status).toHaveTextContent("Stage 1 of 7: Change intent captured (passed)");

      fireEvent.click(screen.getByRole("button", { name: "Next stage" }));
      expect(status).toHaveTextContent("Stage 2 of 7: Repository intelligence loaded (passed)");
    });

    it("shows deterministic evidence including the failed schema-reference check", () => {
      render(<ValidationConsole />);
      const next = () => fireEvent.click(screen.getByRole("button", { name: "Next stage" }));

      next(); // repository intelligence
      next(); // deterministic evidence
      expect(screen.getByText("Unit tests")).toBeInTheDocument();
      expect(screen.getByText("42 passed")).toBeInTheDocument();
      expect(screen.getByText("Schema references")).toBeInTheDocument();
      expect(screen.getByText("failed")).toBeInTheDocument();
    });

    it("shows the tenant-isolation architecture finding with evidence and requirement coverage", () => {
      render(<ValidationConsole />);
      const next = () => fireEvent.click(screen.getByRole("button", { name: "Next stage" }));

      next();
      next();
      next(); // correctness and architecture evaluated
      expect(screen.getByText("Tenant isolation can be bypassed.")).toBeInTheDocument();
      expect(screen.getByText("app/api/orders/[id]/route.ts \u00b7 lines 42\u201348")).toBeInTheDocument();
      expect(screen.getByText("TENANCY-001")).toBeInTheDocument();
      expect(screen.getByText("missing")).toBeInTheDocument();
    });

    it("shows the repository-drift warning about stale generated types", () => {
      render(<ValidationConsole />);
      const next = () => fireEvent.click(screen.getByRole("button", { name: "Next stage" }));

      next();
      next();
      next();
      next(); // hallucination and repository drift checked
      expect(screen.getByText("Stale")).toBeInTheDocument();
      expect(
        screen.getByText(/Migration adds orders\.fulfillment_status, but generated database types were not updated/),
      ).toBeInTheDocument();
    });

    it("has the independent verifier challenge the primary finding before confirming it", () => {
      render(<ValidationConsole />);
      const next = () => fireEvent.click(screen.getByRole("button", { name: "Next stage" }));

      next();
      next();
      next();
      next();
      next(); // independent verifier challenge
      expect(screen.getByText(/Could authorization be applied by middleware\?/)).toBeInTheDocument();
      expect(screen.getByText(/No matching ownership or tenant filter was found/)).toBeInTheDocument();
      expect(screen.getByText("Finding confirmed")).toBeInTheDocument();
    });

    it("issues a governance BLOCK MERGE decision with reason, remediation, and policy", () => {
      render(<ValidationConsole />);
      const next = () => fireEvent.click(screen.getByRole("button", { name: "Next stage" }));

      next();
      next();
      next();
      next();
      next();
      next(); // governance decision issued
      expect(screen.getByText("BLOCK MERGE")).toBeInTheDocument();
      expect(screen.getByText("A critical tenant-isolation policy is violated.")).toBeInTheDocument();
      expect(
        screen.getByText(/Constrain the order query by organization_id and add a cross-tenant access test/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Human override prohibited for critical tenant-isolation failures/)).toBeInTheDocument();
      expect(screen.getByText(/1 deterministic failure/)).toBeInTheDocument();
    });
  });
});
