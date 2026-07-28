import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EvidenceTabs } from "./evidence-tabs";

describe("EvidenceTabs", () => {
  it("shows the first example's evidence by default with correct aria-selected state", () => {
    render(<EvidenceTabs />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Tenant-owned query is missing organization_id")).toBeInTheDocument();
  });

  it("switches panels on click and updates aria-selected", async () => {
    const user = userEvent.setup();
    render(<EvidenceTabs />);

    await user.click(screen.getByRole("tab", { name: "Schema drift" }));

    expect(screen.getByRole("tab", { name: "Schema drift" })).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByText("Migration changed schema but generated types were not updated"),
    ).toBeInTheDocument();
  });

  it("supports arrow-key navigation between tabs", async () => {
    const user = userEvent.setup();
    render(<EvidenceTabs />);

    const firstTab = screen.getByRole("tab", { name: "Tenant isolation" });
    firstTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Schema drift" })).toHaveAttribute("aria-selected", "true");
  });
});
