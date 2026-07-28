import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProblemSection } from "./problem-section";

describe("ProblemSection", () => {
  it("renders the headline", () => {
    render(<ProblemSection />);
    expect(screen.getByRole("heading", { name: /AI writes code faster than teams can verify it\./ })).toBeInTheDocument();
  });

  it("renders exactly three problem cards", () => {
    render(<ProblemSection />);
    expect(screen.getByText(/Logic can look correct while violating requirements\./)).toBeInTheDocument();
    expect(screen.getByText(/Tests may pass while important branches remain untested\./)).toBeInTheDocument();
    expect(
      screen.getByText(/Agents can modify sensitive code or tools with excessive permissions\./),
    ).toBeInTheDocument();
  });

  it("gives each card a realistic example and a production consequence", () => {
    render(<ProblemSection />);
    expect(screen.getAllByText("Example:").length).toBe(3);
    expect(screen.getAllByText("Production impact:").length).toBe(3);
    expect(screen.getByText(/discount-code path ships/)).toBeInTheDocument();
    expect(screen.getByText(/riskiest branch in the change has zero coverage/)).toBeInTheDocument();
  });

  it("renders a restrained, product-oriented visual cue per card instead of an illustration", () => {
    render(<ProblemSection />);
    expect(screen.getByText("Requirement mismatch")).toBeInTheDocument();
    expect(screen.getByText("Untested branch")).toBeInTheDocument();
    expect(screen.getByText("Excessive scope")).toBeInTheDocument();

    expect(screen.getByText("Soft delete")).toBeInTheDocument();
    expect(screen.getByText("Hard delete")).toBeInTheDocument();
  });

  it("uses the shared #problem anchor id", () => {
    const { container } = render(<ProblemSection />);
    expect(container.querySelector("section#problem")).toBeInTheDocument();
  });
});
