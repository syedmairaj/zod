/**
 * Worker startup smoke test: validate config, connect to DB, claim zero-or-more
 * jobs for one poll cycle, then exit. Does not require queued work.
 */
import { createDbPool } from "@zod-ai/db";
import { pollAndClaimNextRun } from "@zod-ai/queue";
import { createWorkerId, ShutdownController } from "@zod-ai/worker";
import { logStructured } from "@zod-ai/shared";
import { getWorkerEnv } from "./env";

async function smoke(): Promise<void> {
  const env = getWorkerEnv();
  const pool = createDbPool({ connectionString: env.databaseUrl, max: 2 });
  const workerId = createWorkerId(`${env.scheduler.workerIdPrefix}-smoke`);
  const shutdown = new ShutdownController();

  try {
    logStructured("info", "worker_started", { worker_id: workerId, mode: "smoke" });
    const { run, recovered } = await pollAndClaimNextRun(pool, workerId, env.scheduler);
    logStructured("info", "worker_smoke_ok", {
      worker_id: workerId,
      claimed: Boolean(run),
      validation_run_id: run?.id,
      recovered_requeued: recovered.requeuedIds.length,
      recovered_failed: recovered.failedIds.length,
    });
    // If we claimed a run during smoke, release it back to queued without fake success.
    if (run) {
      await pool.query(
        `update validation_runs
         set status = 'queued', claimed_by = null, claimed_at = null,
             heartbeat_at = null, lease_expires_at = null, timeout_at = null,
             attempt_count = greatest(attempt_count - 1, 0),
             available_at = now()
         where id = $1 and claimed_by = $2 and run_version = $3`,
        [run.id, workerId, run.runVersion],
      );
    }
    shutdown.requestShutdown("manual");
    logStructured("info", "worker_stopped", { worker_id: workerId, mode: "smoke" });
  } finally {
    await pool.end();
  }
}

smoke().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown_error";
  logStructured("error", "worker_failed", { error_code: "worker_smoke_failed", message });
  process.exitCode = 1;
});
