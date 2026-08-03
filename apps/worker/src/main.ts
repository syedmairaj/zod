import { createDbPool } from "@zod-ai/db";
import { runWorkerLoop, ShutdownController } from "@zod-ai/worker";
import { logStructured } from "@zod-ai/shared";
import { getWorkerEnv } from "./env";

async function main(): Promise<void> {
  const env = getWorkerEnv();
  const pool = createDbPool({ connectionString: env.databaseUrl, max: 5 });
  const shutdown = new ShutdownController();
  const removeHandlers = shutdown.installProcessHandlers();

  try {
    await runWorkerLoop({
      pool,
      config: env.scheduler,
      shutdown,
    });
  } finally {
    removeHandlers();
    // Bound exit: stop claiming already done; release pool.
    const close = pool.end();
    const timeout = new Promise<void>((resolve) => {
      setTimeout(resolve, env.scheduler.shutdownTimeoutMs).unref?.();
    });
    await Promise.race([close, timeout]);
    logStructured("info", "worker_stopped", { reason: shutdown.shutdownReason ?? "loop_exit" });
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown_error";
  logStructured("error", "worker_failed", { error_code: "worker_boot_failed", message });
  process.exitCode = 1;
});
