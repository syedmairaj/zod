import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Faq } from "./faq";

const QUESTIONS = [
  "Does Zod.ai replace human code review?",
  "Which coding agents does Zod.ai support?",
  "Does Zod.ai execute repository code?",
  "Can Zod.ai access production secrets?",
  "How are AI findings verified?",
  "What happens when a validator fails?",
  "Which technology stacks are supported first?",
  "Does Zod.ai block every AI finding?",
  "How is repository data handled?",
  "Is Zod.ai already production-ready?",
];

describe("Faq", () => {
  it("renders all ten questions with buttons collapsed by default", () => {
    render(<Faq />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(10);
    QUESTIONS.forEach((q) => {
      expect(screen.getByRole("button", { name: q })).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("toggles aria-expanded and exposes the panel via aria-controls", async () => {
    const user = userEvent.setup();
    render(<Faq />);

    const button = screen.getByRole("button", { name: "Does Zod.ai replace human code review?" });
    const panelId = button.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(panelId!);
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel).toHaveTextContent(/complements human review/i);

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("hidden");
  });

  it("is keyboard operable via Enter/Space on the focused button", async () => {
    const user = userEvent.setup();
    render(<Faq />);

    const button = screen.getByRole("button", { name: "Is Zod.ai already production-ready?" });
    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/do not mean the full validator platform/i)).toBeVisible();
  });

  it("answers execution, secrets, and production-readiness honestly", async () => {
    const user = userEvent.setup();
    render(<Faq />);

    await user.click(screen.getByRole("button", { name: "Does Zod.ai execute repository code?" }));
    expect(screen.getByText(/Isolated sandbox execution of untrusted repository code is planned architecture/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Can Zod.ai access production secrets?" }));
    expect(screen.getByText(/Absolute guarantees that secrets can never be exposed are not claimed/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Is Zod.ai already production-ready?" }));
    expect(screen.getByText(/No\. The marketing site and interactive product preview/)).toBeInTheDocument();
  });

  it("contains no fake social proof or urgency language", () => {
    const { container } = render(<Faq />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/testimonial/i);
    expect(text).not.toMatch(/spots left/i);
    expect(text).not.toMatch(/join \d+/i);
    expect(text).not.toMatch(/guaranteed bug/i);
  });
});
