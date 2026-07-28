import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EvidenceTabs } from "./evidence-tabs";

vi.mock("@/lib/motion/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));

const TAB_LABELS = [
  "Missing tenant constraint",
  "Schema and generated-type drift",
  "Unsafe webhook verification order",
];

describe("EvidenceTabs", () => {
  it("renders the headline and #evidence anchor", () => {
    const { container } = render(<EvidenceTabs />);
    expect(
      screen.getByRole("heading", { name: /Every decision should be traceable to evidence\./ }),
    ).toBeInTheDocument();
    expect(container.querySelector("section#evidence")).toBeInTheDocument();
  });

  it("renders all three evidence tabs with the first selected by default", () => {
    render(<EvidenceTabs />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(TAB_LABELS);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");
  });

  it("exposes file, line range, verifier status, and remediation for the default tab", () => {
    render(<EvidenceTabs />);
    expect(screen.getByText(/Tenant-owned order query is missing organization_id/)).toBeInTheDocument();
    expect(screen.getByText(/app\/api\/orders\/\[id\]\/route\.ts:42–48/)).toBeInTheDocument();
    expect(screen.getByText("TENANCY-001")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText(/Confirmed after checking middleware and route wrappers/)).toBeInTheDocument();
    expect(
      screen.getByText(/Add organization_id to the query and add a cross-tenant access test/),
    ).toBeInTheDocument();
  });

  it("switches panels on click and shows schema-drift evidence", async () => {
    const user = userEvent.setup();
    render(<EvidenceTabs />);

    await user.click(screen.getByRole("tab", { name: "Schema and generated-type drift" }));

    expect(screen.getByRole("tab", { name: "Schema and generated-type drift" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByText(/Database migration and generated application types are out of sync/),
    ).toBeInTheDocument();
    expect(screen.getByText(/supabase\/migrations\/2026xxxx_add_fulfillment_status\.sql/)).toBeInTheDocument();
    expect(screen.getByText(/Regenerate database types and rerun typecheck/)).toBeInTheDocument();
  });

  it("shows webhook verification evidence including policy and line range", async () => {
    const user = userEvent.setup();
    render(<EvidenceTabs />);

    await user.click(screen.getByRole("tab", { name: "Unsafe webhook verification order" }));

    expect(screen.getByText(/Webhook body is parsed before signature verification/)).toBeInTheDocument();
    expect(screen.getByText(/app\/api\/webhooks\/github\/route\.ts:18–31/)).toBeInTheDocument();
    expect(screen.getByText("WEBHOOK-002")).toBeInTheDocument();
    expect(
      screen.getByText(/Verify the signature before parsing or transforming the body/),
    ).toBeInTheDocument();
  });

  it("supports Arrow Right / Arrow Left navigation between tabs", async () => {
    const user = userEvent.setup();
    render(<EvidenceTabs />);

    screen.getByRole("tab", { name: "Missing tenant constraint" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Schema and generated-type drift" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Missing tenant constraint" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("supports Home and End to jump to first and last tabs", async () => {
    const user = userEvent.setup();
    render(<EvidenceTabs />);

    screen.getByRole("tab", { name: "Missing tenant constraint" }).focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Unsafe webhook verification order" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Missing tenant constraint" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("wires aria-controls / aria-labelledby between the active tab and panel", () => {
    render(<EvidenceTabs />);
    const tab = screen.getByRole("tab", { name: "Missing tenant constraint" });
    const panel = screen.getByRole("tabpanel");
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
  });

  it("keeps all critical finding content visible without hover", () => {
    render(<EvidenceTabs />);
    expect(screen.getByText(/The route fetches an order using only the order ID/)).toBeVisible();
    expect(screen.getByText(/The query must also constrain organization_id/)).toBeVisible();
    expect(screen.getByText(/Recommended remediation:/)).toBeVisible();
  });
});
