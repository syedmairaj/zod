import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkflowIntegrations } from "./workflow-integrations";

vi.mock("@/lib/motion/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));

describe("WorkflowIntegrations", () => {
  it("renders the headline and agent-agnostic supporting copy", () => {
    render(<WorkflowIntegrations />);
    expect(
      screen.getByRole("heading", { name: /Keep your coding agent\. Add independent verification\./ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Zod\.ai does not replace your coding agent\. It independently checks the work before it reaches production\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/Zod\.ai is agent-agnostic/)).toBeInTheDocument();
  });

  it("lists the six workflow tools and marks GitLab and MCP as Planned", () => {
    render(<WorkflowIntegrations />);
    ["Cursor", "Claude Code", "Codex", "GitHub", "GitLab", "MCP"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.getAllByText("Planned")).toHaveLength(2);

    const gitlab = screen.getByText("GitLab").closest("span");
    const mcp = screen.getByText("MCP").closest("span");
    expect(gitlab).toHaveTextContent("Planned");
    expect(mcp).toHaveTextContent("Planned");
  });

  it("does not imply partnership or endorsement", () => {
    const { container } = render(<WorkflowIntegrations />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/official partner/i);
    expect(text).not.toMatch(/endorsed by/i);
    expect(text).not.toMatch(/in partnership with/i);
    expect(screen.getByText(/no claim of partnership or endorsement/)).toBeInTheDocument();
  });

  it("shows the agent → evidence → governance workflow steps", () => {
    render(<WorkflowIntegrations />);
    expect(screen.getByText("Coding agent")).toBeInTheDocument();
    expect(screen.getByText("Pull request or proposed action")).toBeInTheDocument();
    expect(screen.getByText("Zod.ai evidence pipeline")).toBeInTheDocument();
    expect(screen.getByText("Governance decision")).toBeInTheDocument();
    expect(screen.getByText("Outcome")).toBeInTheDocument();
    expect(screen.getByText(/Merge, approval, request changes, or block/)).toBeInTheDocument();
  });

  it("keeps all workflow labels visible without hover", () => {
    render(<WorkflowIntegrations />);
    expect(screen.getByText("Cursor")).toBeVisible();
    expect(screen.getByText("Zod.ai evidence pipeline")).toBeVisible();
  });
});
