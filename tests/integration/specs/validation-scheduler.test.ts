import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { pullRequestsRepo, withTransaction } from "@zod-ai/db";
import {
  claimNextValidationRun,
  enqueueValidationJob,
  getValidationRunById,
  pollAndClaimNextRun,
  recoverExpiredLeases,
  renewLease,
  requestCancellation,
  scheduleRetryOrFail,
  supersedeOpenRunsForPullRequest,
  transitionOwnedRun,
} from "@zod-ai/queue";
import { DEFAULT_SCHEDULER_CONFIG, type SchedulerConfig } from "@zod-ai/shared";
import {
  createWorkerId,
  executeClaimedRun,
  runWorkerLoop,
  ShutdownController,
} from "@zod-ai/worker";
import type { Pool } from "pg";
import { createTestPool } from "../setup/connection";
import {
  createTestInstallation,
  createTestOrganization,
  createTestRepository,
  createTestUser,
} from "../setup/fixtures";

const fastConfig: SchedulerConfig = {
  ...DEFAULT_SCHEDULER_CONFIG,
  pollIntervalMs: 50,
  leaseDurationMs: 2_000,
  heartbeatIntervalMs: 200,
  maxAttempts: 3,
  retryBaseDelayMs: 10,
  runTimeoutMs: 5_000,
  shutdownTimeoutMs: 2_000,
};

describe("Milestone 3 validation scheduler", () => {
  let pool: Pool;
  let organizationId: string;
  let repositoryId: string;
  let pullRequestId: string;

  beforeAll(async () => {
    pool = createTestPool();
    const userId = await createTestUser(pool);
    const org = await createTestOrganization(pool, userId, "Scheduler Org");
    organizationId = org.id;
    const installation = await createTestInstallation(pool, organizationId);
    const repo = await createTestRepository(pool, organizationId, installation.id);
    repositoryId = repo.id;
    const pr = await pullRequestsRepo.upsertPullRequestRevision(pool, {
      organizationId,
      repositoryId,
      providerPrNumber: 42,
      headSha: "a".repeat(40),
      baseSha: "b".repeat(40),
      title: "scheduler pr",
      author: "dev",
      state: "open",
    });
    pullRequestId = pr.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Keep each claim test deterministic despite shared DB state.
    await pool.query(
      `update validation_runs
       set
         status = 'cancelled',
         cancelled_at = coalesce(cancelled_at, now()),
         completed_at = coalesce(completed_at, now()),
         claimed_by = null,
         lease_expires_at = null
       where organization_id = $1
         and status in ('queued', 'claimed', 'preparing', 'running', 'collecting')`,
      [organizationId],
    );
  });

  async function enqueue(commitSha = randomUUID().replace(/-/g, "").slice(0, 40)): Promise<string> {
    const job = await enqueueValidationJob(pool, {
      organizationId,
      repositoryId,
      pullRequestId,
      commitSha,
      trigger: "pull_request_synchronize",
      deliveryId: randomUUID(),
      maxAttempts: fastConfig.maxAttempts,
    });
    return job.id;
  }

  it("atomically claims one run; two workers cannot claim the same row", async () => {
    const runId = await enqueue();
    const w1 = "worker-claim-1";
    const w2 = "worker-claim-2";

    const [a, b] = await Promise.all([
      withTransaction(pool, (client) =>
        claimNextValidationRun(client, {
          workerId: w1,
          leaseDurationMs: fastConfig.leaseDurationMs,
          runTimeoutMs: fastConfig.runTimeoutMs,
        }),
      ),
      withTransaction(pool, (client) =>
        claimNextValidationRun(client, {
          workerId: w2,
          leaseDurationMs: fastConfig.leaseDurationMs,
          runTimeoutMs: fastConfig.runTimeoutMs,
        }),
      ),
    ]);

    const claimed = [a, b].filter(Boolean);
    // At least the enqueued run is claimed once; concurrent claim may pick other queued rows.
    const owners = claimed.filter((run) => run?.id === runId);
    expect(owners).toHaveLength(1);
    expect(owners[0]?.attemptCount).toBe(1);
    expect(owners[0]?.status).toBe("claimed");
  });

  it("respects available_at and skips final states", async () => {
    const futureId = await enqueue("c".repeat(40));
    await pool.query(`update validation_runs set available_at = now() + interval '1 hour' where id = $1`, [
      futureId,
    ]);
    const finalId = await enqueue("d".repeat(40));
    await pool.query(`update validation_runs set status = 'completed', completed_at = now() where id = $1`, [
      finalId,
    ]);

    const claimed = await withTransaction(pool, (client) =>
      claimNextValidationRun(client, {
        workerId: "worker-available",
        leaseDurationMs: fastConfig.leaseDurationMs,
        runTimeoutMs: fastConfig.runTimeoutMs,
      }),
    );
    expect(claimed?.id).not.toBe(futureId);
    expect(claimed?.id).not.toBe(finalId);
  });

  it("renews lease for owner only; stale worker cannot finalize after reclaim", async () => {
    const runId = await enqueue();
    const staleWorker = "worker-stale";
    const claimed = await withTransaction(pool, (client) =>
      claimNextValidationRun(client, {
        workerId: staleWorker,
        leaseDurationMs: 100,
        runTimeoutMs: fastConfig.runTimeoutMs,
      }),
    );
    expect(claimed?.id).toBe(runId);

    await pool.query(`update validation_runs set lease_expires_at = now() - interval '1 second' where id = $1`, [
      runId,
    ]);
    const recovered = await withTransaction(pool, (client) =>
      recoverExpiredLeases(client, { retryBaseDelayMs: 1 }),
    );
    expect(recovered.requeuedIds).toContain(runId);

    await pool.query(`update validation_runs set available_at = now() where id = $1`, [runId]);
    const freshWorker = "worker-fresh";
    const reclaimed = await withTransaction(pool, (client) =>
      claimNextValidationRun(client, {
        workerId: freshWorker,
        leaseDurationMs: fastConfig.leaseDurationMs,
        runTimeoutMs: fastConfig.runTimeoutMs,
      }),
    );
    expect(reclaimed?.id).toBe(runId);
    expect(reclaimed?.claimedBy).toBe(freshWorker);
    expect(reclaimed?.attemptCount).toBe(2);

    const staleFinalize = await transitionOwnedRun(pool, {
      runId,
      organizationId,
      workerId: staleWorker,
      runVersion: claimed!.runVersion,
      from: "claimed",
      to: "preparing",
    });
    expect(staleFinalize).toBeNull();

    const wrongHeartbeat = await renewLease(pool, {
      runId,
      organizationId,
      workerId: staleWorker,
      runVersion: claimed!.runVersion,
      leaseDurationMs: fastConfig.leaseDurationMs,
    });
    expect(wrongHeartbeat).toBeNull();
  });

  it("completes placeholder successfully without implying code correctness", async () => {
    const commitSha = "e".repeat(40);
    const runId = await enqueue(commitSha);
    const workerId = createWorkerId("success");
    const claimed = await withTransaction(pool, (client) =>
      claimNextValidationRun(client, {
        workerId,
        leaseDurationMs: fastConfig.leaseDurationMs,
        runTimeoutMs: fastConfig.runTimeoutMs,
      }),
    );
    expect(claimed?.id).toBe(runId);

    const outcome = await executeClaimedRun({
      db: pool,
      run: claimed!,
      config: fastConfig,
      mode: "success",
      placeholderDurationMs: 5,
    });
    expect(outcome).toBe("completed");

    const row = await getValidationRunById(pool, organizationId, runId);
    expect(row?.status).toBe("completed");
    expect(row?.commitSha).toBe(commitSha);
    expect(row?.decision).toBeNull();
    expect(row?.schedulerResultJson?.status).toBe("scheduler-ok");
  });

  it("schedules retry for retryable failure and fails when attempts exhausted", async () => {
    const runId = await enqueue();
    await pool.query(`update validation_runs set max_attempts = 1 where id = $1`, [runId]);
    const workerId = "worker-retry";
    const claimed = await withTransaction(pool, (client) =>
      claimNextValidationRun(client, {
        workerId,
        leaseDurationMs: fastConfig.leaseDurationMs,
        runTimeoutMs: fastConfig.runTimeoutMs,
      }),
    );
    expect(claimed?.maxAttempts).toBe(1);

    const outcome = await executeClaimedRun({
      db: pool,
      run: claimed!,
      config: { ...fastConfig, maxAttempts: 1 },
      mode: "retryable_failure",
    });
    expect(outcome).toBe("failed");
    const row = await getValidationRunById(pool, organizationId, runId);
    expect(row?.status).toBe("failed");
    expect(row?.failureCode).toBe("attempts_exhausted");
  });

  it("cancels queued and running runs; cancellation beats late completion", async () => {
    const queuedId = await enqueue();
    const cancelledQueued = await requestCancellation(pool, { organizationId, runId: queuedId });
    expect(cancelledQueued?.status).toBe("cancelled");

    const runningId = await enqueue();
    const workerId = "worker-cancel";
    const claimed = await withTransaction(pool, (client) =>
      claimNextValidationRun(client, {
        workerId,
        leaseDurationMs: fastConfig.leaseDurationMs,
        runTimeoutMs: fastConfig.runTimeoutMs,
      }),
    );
    expect(claimed?.id).toBe(runningId);
    await requestCancellation(pool, { organizationId, runId: runningId });

    const outcome = await executeClaimedRun({
      db: pool,
      run: claimed!,
      config: fastConfig,
      mode: "success",
      placeholderDurationMs: 5,
    });
    expect(outcome).toBe("cancelled");

    const late = await transitionOwnedRun(pool, {
      runId: runningId,
      organizationId,
      workerId,
      runVersion: claimed!.runVersion,
      from: "running",
      to: "completed",
    });
    expect(late).toBeNull();
  });

  it("finalizes timeout and ignores late completion", async () => {
    const runId = await enqueue();
    const workerId = "worker-timeout";
    const claimed = await withTransaction(pool, (client) =>
      claimNextValidationRun(client, {
        workerId,
        leaseDurationMs: fastConfig.leaseDurationMs,
        runTimeoutMs: 1,
      }),
    );
    expect(claimed?.id).toBe(runId);
    await pool.query(`update validation_runs set timeout_at = now() - interval '1 second' where id = $1`, [runId]);
    const refreshed = await getValidationRunById(pool, organizationId, runId);

    const outcome = await executeClaimedRun({
      db: pool,
      run: refreshed!,
      config: fastConfig,
      mode: "success",
    });
    expect(outcome).toBe("timed_out");

    const late = await transitionOwnedRun(pool, {
      runId,
      organizationId,
      workerId,
      runVersion: claimed!.runVersion,
      from: "timed_out",
      to: "completed",
    });
    expect(late).toBeNull();
  });

  it("supersedes older PR runs; unrelated PR is untouched; newest remains claimable", async () => {
    const olderSha = "1".repeat(40);
    const newerSha = "2".repeat(40);
    const otherSha = "3".repeat(40);

    const older = await enqueueValidationJob(pool, {
      organizationId,
      repositoryId,
      pullRequestId,
      commitSha: olderSha,
      trigger: "pull_request_opened",
      deliveryId: randomUUID(),
    });

    const otherPr = await pullRequestsRepo.upsertPullRequestRevision(pool, {
      organizationId,
      repositoryId,
      providerPrNumber: 99,
      headSha: otherSha,
      baseSha: "b".repeat(40),
      title: "other",
      author: "dev",
      state: "open",
    });
    const unrelated = await enqueueValidationJob(pool, {
      organizationId,
      repositoryId,
      pullRequestId: otherPr.id,
      commitSha: otherSha,
      trigger: "pull_request_opened",
      deliveryId: randomUUID(),
    });

    const newerPr = await pullRequestsRepo.upsertPullRequestRevision(pool, {
      organizationId,
      repositoryId,
      providerPrNumber: 42,
      headSha: newerSha,
      baseSha: "b".repeat(40),
      title: "scheduler pr v2",
      author: "dev",
      state: "open",
    });
    const newer = await enqueueValidationJob(pool, {
      organizationId,
      repositoryId,
      pullRequestId: newerPr.id,
      commitSha: newerSha,
      trigger: "pull_request_synchronize",
      deliveryId: randomUUID(),
    });

    const supersededIds = await supersedeOpenRunsForPullRequest(
      pool,
      organizationId,
      repositoryId,
      42,
      newerPr.id,
      newer.id,
    );
    expect(supersededIds).toContain(older.id);

    const olderRow = await getValidationRunById(pool, organizationId, older.id);
    const unrelatedRow = await getValidationRunById(pool, organizationId, unrelated.id);
    const newerRow = await getValidationRunById(pool, organizationId, newer.id);
    expect(olderRow?.status).toBe("superseded");
    expect(olderRow?.supersededBy).toBe(newer.id);
    expect(unrelatedRow?.status).toBe("queued");
    expect(newerRow?.status).toBe("queued");

    // Stale worker cannot complete a superseded run.
    await pool.query(
      `update validation_runs
       set status = 'claimed', claimed_by = 'stale', run_version = run_version + 1,
           claimed_at = now(), heartbeat_at = now(),
           lease_expires_at = now() + interval '1 minute'
       where id = $1`,
      [older.id],
    );
    // Force status back path: supersede already final — transition from claimed won't apply on superseded.
    await pool.query(`update validation_runs set status = 'superseded' where id = $1`, [older.id]);
    const staleComplete = await transitionOwnedRun(pool, {
      runId: older.id,
      organizationId,
      workerId: "stale",
      runVersion: (await getValidationRunById(pool, organizationId, older.id))!.runVersion,
      from: "claimed",
      to: "preparing",
    });
    expect(staleComplete).toBeNull();
  });

  it("worker loop claims and completes; shutdown stops new claims", async () => {
    const runId = await enqueue("f".repeat(40));
    const shutdown = new ShutdownController();
    const workerId = createWorkerId("loop");

    await runWorkerLoop({
      pool,
      config: { ...fastConfig, pollIntervalMs: 20 },
      shutdown,
      workerId,
      placeholderMode: "success",
      maxJobs: 1,
      placeholderDurationMs: 5,
    });

    const row = await getValidationRunById(pool, organizationId, runId);
    expect(row?.status).toBe("completed");

    const secondId = await enqueue("aa".repeat(20));
    const shutdown2 = new ShutdownController();
    shutdown2.requestShutdown("manual");
    await runWorkerLoop({
      pool,
      config: { ...fastConfig, pollIntervalMs: 10 },
      shutdown: shutdown2,
      workerId: createWorkerId("stopped"),
      maxJobs: 5,
    });
    const untouched = await getValidationRunById(pool, organizationId, secondId);
    expect(untouched?.status).toBe("queued");
  });

  it("org scoping: cannot mutate another org's run by id", async () => {
    const runId = await enqueue();
    const otherUser = await createTestUser(pool);
    const otherOrg = await createTestOrganization(pool, otherUser, "Other Org");
    const found = await getValidationRunById(pool, otherOrg.id, runId);
    expect(found).toBeNull();

    const workerId = "worker-tenant";
    const claimed = await withTransaction(pool, (client) =>
      claimNextValidationRun(client, {
        workerId,
        leaseDurationMs: fastConfig.leaseDurationMs,
        runTimeoutMs: fastConfig.runTimeoutMs,
      }),
    );
    if (claimed?.id === runId) {
      const crossed = await transitionOwnedRun(pool, {
        runId,
        organizationId: otherOrg.id,
        workerId,
        runVersion: claimed.runVersion,
        from: "claimed",
        to: "preparing",
      });
      expect(crossed).toBeNull();
    }
  });

  it("pollAndClaimNextRun recovers expired leases then claims", async () => {
    const runId = await enqueue();
    await pool.query(
      `update validation_runs
       set status = 'running', claimed_by = 'dead', attempt_count = 1,
           claimed_at = now(), heartbeat_at = now(),
           lease_expires_at = now() - interval '5 seconds',
           run_version = 2
       where id = $1`,
      [runId],
    );

    const { run, recovered } = await pollAndClaimNextRun(pool, "worker-recover", {
      ...fastConfig,
      retryBaseDelayMs: 1,
    });
    expect(recovered.requeuedIds).toContain(runId);
    // Immediate reclaim may miss due to backoff; force available and claim.
    await pool.query(`update validation_runs set available_at = now() where id = $1`, [runId]);
    const claimed = run?.id === runId
      ? run
      : await withTransaction(pool, (client) =>
          claimNextValidationRun(client, {
            workerId: "worker-recover-2",
            leaseDurationMs: fastConfig.leaseDurationMs,
            runTimeoutMs: fastConfig.runTimeoutMs,
          }),
        );
    expect(claimed?.id).toBe(runId);
  });

  it("scheduleRetryOrFail keeps commit sha unchanged", async () => {
    const sha = "ab".repeat(20);
    const runId = await enqueue(sha);
    const workerId = "worker-sha";
    const claimed = await withTransaction(pool, (client) =>
      claimNextValidationRun(client, {
        workerId,
        leaseDurationMs: fastConfig.leaseDurationMs,
        runTimeoutMs: fastConfig.runTimeoutMs,
      }),
    );
    const result = await scheduleRetryOrFail(pool, {
      runId,
      organizationId,
      workerId,
      runVersion: claimed!.runVersion,
      fromStatus: "claimed",
      attemptCount: 1,
      maxAttempts: 3,
      retryBaseDelayMs: 1,
      failureCode: "retryable_placeholder_failure",
      failureMessage: "boom",
    });
    expect(result.outcome).toBe("requeued");
    expect(result.run?.commitSha).toBe(sha);
  });

  it("migration columns and constraints exist for scheduler fields", async () => {
    const cols = await pool.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_name = 'validation_runs'
         and column_name in (
           'claimed_by', 'lease_expires_at', 'heartbeat_at', 'attempt_count',
           'max_attempts', 'available_at', 'cancellation_requested_at',
           'timeout_at', 'failure_code', 'run_version', 'scheduler_result_json'
         )`,
    );
    expect(cols.rows.length).toBe(11);

    const idx = await pool.query<{ indexname: string }>(
      `select indexname from pg_indexes
       where tablename = 'validation_runs'
         and indexname in ('validation_runs_claim_idx', 'validation_runs_stale_lease_idx')`,
    );
    expect(idx.rows.length).toBe(2);
  });
});
