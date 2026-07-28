import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeText } from "./code-text";

describe("CodeText", () => {
  it("renders children inside a <code> element with the mono font family", () => {
    render(<CodeText>organization_id</CodeText>);
    const el = screen.getByText("organization_id");
    expect(el.tagName).toBe("CODE");
    expect(el.className).toContain("font-mono");
  });
});
