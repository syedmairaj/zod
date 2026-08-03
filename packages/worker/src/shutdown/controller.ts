/**
 * Graceful shutdown controller for the long-running worker process.
 * Stops claiming new work; never falsely completes unfinished work.
 */

export type ShutdownReason = "SIGTERM" | "SIGINT" | "manual";

export class ShutdownController {
  private shuttingDown = false;
  private reason: ShutdownReason | null = null;
  private readonly abort = new AbortController();
  private readonly waiters: Array<() => void> = [];

  get isShuttingDown(): boolean {
    return this.shuttingDown;
  }

  get signal(): AbortSignal {
    return this.abort.signal;
  }

  get shutdownReason(): ShutdownReason | null {
    return this.reason;
  }

  requestShutdown(reason: ShutdownReason): void {
    if (this.shuttingDown) {
      return;
    }
    this.shuttingDown = true;
    this.reason = reason;
    this.abort.abort(reason);
    for (const resolve of this.waiters.splice(0)) {
      resolve();
    }
  }

  waitUntilShutdown(): Promise<void> {
    if (this.shuttingDown) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }

  installProcessHandlers(): () => void {
    const onTerm = (): void => this.requestShutdown("SIGTERM");
    const onInt = (): void => this.requestShutdown("SIGINT");
    process.on("SIGTERM", onTerm);
    process.on("SIGINT", onInt);
    return () => {
      process.off("SIGTERM", onTerm);
      process.off("SIGINT", onInt);
    };
  }
}
