import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ValidationPipeline } from "./validation-pipeline";

describe("ValidationPipeline", () => {
  it("renders the headline", () => {
    render(<ValidationPipeline />);
    expect(screen.getByRole("heading", { name: /Evidence first\. AI judgment second\./ })).toBeInTheDocument();
  });

  it("keeps the #how-it-works anchor used by the header nav", () => {
    const { container } = render(<ValidationPipeline />);
    expect(container.querySelector("section#how-it-works")).toBeInTheDocument();
  });

  it("renders all six pipeline stages in order", () => {
    render(<ValidationPipeline />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(6);

    const titles = [
      "Deterministic checks",
      "Structural analysis",
      "Runtime evidence",
      "Primary semantic review",
      "Independent challenge",
      "Human approval for high-risk ambiguity",
    ];
    titles.forEach((title, index) => {
      expect(items[index]).toHaveTextContent(title);
    });
  });

  it("explains that compilers, linters, tests, schema checks, and scanners establish facts", () => {
    render(<ValidationPipeline />);
    expect(
      screen.getByText(/Compilers, linters, test runners, schema checks, and security scanners establish/),
    ).toBeInTheDocument();
  });

  it("explains structural analysis against architecture and contracts", () => {
    render(<ValidationPipeline />);
    expect(screen.getByText(/architecture, routes, contracts, and dependency graph/)).toBeInTheDocument();
  });

  it("explains runtime evidence confirms actual behavior where available", () => {
    render(<ValidationPipeline />);
    expect(screen.getByText(/Where available, sandboxed execution confirms what the change actually does/)).toBeInTheDocument();
  });

  it("explains the AI reviewer evaluates intent, logic, and architectural fit", () => {
    render(<ValidationPipeline />);
    expect(screen.getByText(/evaluates intent, logic, and architectural fit/)).toBeInTheDocument();
  });

  it("explains the independent verifier challenges unsupported conclusions", () => {
    render(<ValidationPipeline />);
    expect(screen.getByText(/challenges any conclusion the first review can't fully support/)).toBeInTheDocument();
  });

  it("explains humans retain control when evidence is incomplete or risk is high", () => {
    render(<ValidationPipeline />);
    expect(screen.getByText(/unresolved, or judged high-risk, is routed to a human/)).toBeInTheDocument();
  });

  it("clearly distinguishes deterministic evidence stages from AI-judgment and human stages", () => {
    render(<ValidationPipeline />);
    expect(screen.getAllByText("Deterministic evidence")).toHaveLength(3);
    expect(screen.getAllByText("AI judgment")).toHaveLength(2);
    expect(screen.getAllByText("Human control")).toHaveLength(1);
  });
});
