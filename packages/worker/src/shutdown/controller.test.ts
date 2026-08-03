import { describe, expect, it } from "vitest";
import { ShutdownController } from "./controller";

describe("ShutdownController", () => {
  it("is idempotent and exposes abort signal", async () => {
    const shutdown = new ShutdownController();
    expect(shutdown.isShuttingDown).toBe(false);
    const waiting = shutdown.waitUntilShutdown();
    shutdown.requestShutdown("SIGTERM");
    shutdown.requestShutdown("SIGINT");
    await waiting;
    expect(shutdown.isShuttingDown).toBe(true);
    expect(shutdown.shutdownReason).toBe("SIGTERM");
    expect(shutdown.signal.aborted).toBe(true);
  });
});
