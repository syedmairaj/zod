import type { Queryable } from "@zod-ai/db";
import type { SchedulerConfig } from "@zod-ai/shared";
import { renewLease } from "../lease/heartbeat";
import type { ClaimedValidationRun } from "../repository/mappers";

export type HeartbeatLostHandler = () => void;

/**
 * Owns the periodic lease renewal for a single claimed run.
 * Stops itself if renewal fails (ownership lost / cancelled / superseded).
 */
export class HeartbeatSession {
  private timer: ReturnType<typeof setInterval> | null = null;
  private stopped = false;
  private lost = false;

  constructor(
    private readonly db: Queryable,
    private readonly run: ClaimedValidationRun,
    private readonly config: Pick<SchedulerConfig, "heartbeatIntervalMs" | "leaseDurationMs">,
    private readonly onLost?: HeartbeatLostHandler,
  ) {}

  start(): void {
    if (this.timer || this.stopped) {
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, this.config.heartbeatIntervalMs);
    // Unref so heartbeat alone cannot keep the process alive during tests/shutdown.
    this.timer.unref?.();
  }

  async tick(): Promise<boolean> {
    if (this.stopped || this.lost) {
      return false;
    }
    const renewed = await renewLease(this.db, {
      runId: this.run.id,
      organizationId: this.run.organizationId,
      workerId: this.run.claimedBy,
      runVersion: this.run.runVersion,
      leaseDurationMs: this.config.leaseDurationMs,
    });
    if (!renewed) {
      this.lost = true;
      this.stop();
      this.onLost?.();
      return false;
    }
    return true;
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  get ownershipLost(): boolean {
    return this.lost;
  }
}
