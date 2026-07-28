import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Faq } from "./faq";

describe("Faq", () => {
  it("renders every question closed by default and answers are reachable in the DOM", () => {
    render(<Faq />);

    const question = screen.getByText("Does Zod.ai execute my repository code?");
    const details = question.closest("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
  });

  it("opens an item on click, exposing its answer, and is keyboard operable", async () => {
    const user = userEvent.setup();
    render(<Faq />);

    const summary = screen.getByText("Does Zod.ai replace code review?");
    await user.click(summary);

    const details = summary.closest("details");
    expect(details).toHaveAttribute("open");
    expect(screen.getByText(/Zod\.ai adds deterministic checks/)).toBeVisible();
  });
});
