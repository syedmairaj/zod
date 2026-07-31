import { afterEach, describe, expect, it, vi } from "vitest";
import { logStructured } from "./index";

describe("logStructured", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redacts secret-like field keys", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logStructured("info", "test_event", {
      delivery_id: "d1",
      webhook_secret: "super-secret",
      token: "abc",
    });
    expect(info).toHaveBeenCalledOnce();
    const line = String(info.mock.calls[0]?.[0]);
    expect(line).toContain("d1");
    expect(line).toContain("[redacted]");
    expect(line).not.toContain("super-secret");
    expect(line).not.toContain('"token":"abc"');
  });
});
