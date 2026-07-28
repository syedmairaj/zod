import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("shows the signed-out CTA pointing at GitHub connect", () => {
    render(<SiteHeader primaryCtaHref="/sign-in" primaryCtaLabel="Connect GitHub" />);

    const ctas = screen.getAllByRole("link", { name: "Connect GitHub" });
    expect(ctas.length).toBeGreaterThan(0);
    expect(ctas[0]).toHaveAttribute("href", "/sign-in");
  });

  it("shows the signed-in CTA pointing at the dashboard", () => {
    render(<SiteHeader primaryCtaHref="/dashboard" primaryCtaLabel="Go to dashboard" />);

    const ctas = screen.getAllByRole("link", { name: "Go to dashboard" });
    expect(ctas[0]).toHaveAttribute("href", "/dashboard");
  });

  it("renders every primary nav link as an in-page anchor (no dead links)", () => {
    render(<SiteHeader primaryCtaHref="/sign-in" primaryCtaLabel="Connect GitHub" />);

    for (const label of ["Product", "How it works", "Security", "Pricing"]) {
      const [link] = screen.getAllByRole("link", { name: label });
      expect(link).toBeDefined();
      expect(link?.getAttribute("href")).toMatch(/^#/);
    }
  });

  it("opens the mobile menu dialog when the menu button is clicked", async () => {
    const user = userEvent.setup();
    render(<SiteHeader primaryCtaHref="/sign-in" primaryCtaLabel="Connect GitHub" />);

    const menuButton = screen.getByRole("button", { name: "Open menu" });
    await user.click(menuButton);

    const dialog = screen.getByRole("dialog", { name: "Mobile navigation" });
    expect(dialog).toHaveAttribute("open");
  });

  it("closes the mobile menu when a nav link inside it is clicked", async () => {
    const user = userEvent.setup();
    render(<SiteHeader primaryCtaHref="/sign-in" primaryCtaLabel="Connect GitHub" />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog", { name: "Mobile navigation" });

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(dialog).not.toHaveAttribute("open");
  });
});
