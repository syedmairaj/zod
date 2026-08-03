import type { Pool } from "pg";
import { withTransaction } from "@zod-ai/db";
import type { SchedulerConfig } from "@zod-ai/shared";
import { claimNextValidationRun } from "../repository/claim";
import { recoverExpiredLeases } from "../repository/lease-recovery";
import type { ClaimedValidationRun } from "../repository/mappers";

export interface PollClaimResult {
  run: ClaimedValidationRun | null;
  recovered: { requeuedIds: string[]; failedIds: string[] };
}

/**
 * Recover stale leases, then atomically claim one eligible run.
 * All queue lifecycle SQL stays in packages/queue — not in the worker entrypoint.
 */
export async function pollAndClaimNextRun(
  pool: Pool,
  workerId: string,
  config: SchedulerConfig,
): Promise<PollClaimResult> {
  return withTransaction(pool, async (client) => {
    const recovered = await recoverExpiredLeases(client, {
      retryBaseDelayMs: config.retryBaseDelayMs,
    });
    const run = await claimNextValidationRun(client, {
      workerId,
      leaseDurationMs: config.leaseDurationMs,
      runTimeoutMs: config.runTimeoutMs,
    });
    return { run, recovered };
  });
}
