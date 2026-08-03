# Milestone 3 — Validation Scheduler Manual Test Guide

## Prerequisites

- Migrations `0001`–`0005` applied (`packages/db/migrations/`)
- `DATABASE_URL` set (same as web)
- Dependencies installed (`npm install`)
- Optional: web app running so webhooks can enqueue runs

## Migration

```bash
psql "$DATABASE_URL" -f packages/db/migrations/0005_validation_scheduler.sql
```

Verify columns/indexes:

```sql
select column_name from information_schema.columns
where table_name = 'validation_runs'
  and column_name in ('claimed_by','lease_expires_at','available_at','attempt_count');

select indexname from pg_indexes
where tablename = 'validation_runs'
  and indexname in ('validation_runs_claim_idx','validation_runs_stale_lease_idx');
```

## Worker start

```bash
# from repo root, with DATABASE_URL in env
npm run worker
```

Smoke (one poll cycle, releases any accidental claim):

```bash
npm run worker:smoke
```

Expected logs: `worker_started`, optional `validation_run_claimed`, `worker_stopped`.

## Happy path

1. Enqueue via GitHub PR webhook or insert a queued row with `commit_sha`.
2. Start worker.
3. Observe statuses: `queued` → `claimed` → `preparing` → `running` →
   `collecting` → `completed`.
4. Confirm `scheduler_result_json.status = 'scheduler-ok'`.
5. Confirm `decision` is still null (scheduler completion ≠ code pass).
6. Confirm `commit_sha` unchanged.

## Heartbeat

With a long `RUN_TIMEOUT_MS` and short placeholder, watch debug heartbeats
(`LOG_LEVEL=debug`) updating `lease_expires_at` / `heartbeat_at`.

## Two workers

Start two workers with different `WORKER_ID_PREFIX`. Enqueue three runs.
Each run’s `claimed_by` / `attempt_count` shows a single owner per attempt.

## Crash / lease recovery

1. Claim a run (or start worker and kill -9 after claim).
2. Wait until `lease_expires_at` passes (or set it in the past).
3. Start another worker — run requeues then reclaims, or fails if attempts
   exhausted.
4. Stale worker finalize must not overwrite (`run_version` / `claimed_by`).

## Retry

```bash
WORKER_PLACEHOLDER_MODE=retryable_failure RUN_MAX_ATTEMPTS=3 npm run worker
```

Expect retry scheduling then eventual `failed` with `attempts_exhausted`.

## Cancellation

```sql
-- after claim
update validation_runs
set cancellation_requested_at = now()
where id = '<run_id>';
```

Or call `requestCancellation` from a script. Final status: `cancelled`.

## Timeout

```bash
WORKER_PLACEHOLDER_MODE=timeout RUN_TIMEOUT_MS=1000 npm run worker
```

Final status: `timed_out`. Late complete ignored.

## Superseding

Open PR, push a new commit (synchronize). Older run → `superseded`; newest
remains claimable. Push events must not supersede unrelated PRs.

## Graceful shutdown

`Ctrl+C` / `SIGTERM`: logs `worker_stopping` / `worker_stopped`; no new claims;
no false `completed` for unfinished work.

## Rollback considerations

`0005` is additive. Rollback = drop new columns/indexes/trigger and restore
prior status check (only safe if no rows use new statuses).

## Pass / fail checklist

- [ ] Worker separate from Next.js
- [ ] Atomic claim / no duplicate ownership
- [ ] Heartbeat renews lease
- [ ] Crash recovery works
- [ ] Stale finalize rejected
- [ ] Bounded retries
- [ ] Cancel / timeout / supersede work
- [ ] Commit SHA unchanged
- [ ] `completed` not treated as code correctness
- [ ] No repository code executed
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build`
- [ ] `npm run worker:smoke`
