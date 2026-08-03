# Milestone 3 — Scheduler Architecture

## Purpose

Durable validation-run scheduling and worker control plane. No repository
checkout, sandbox, or code validation yet.

```text
GitHub webhook
  → packages/queue publisher (queued row)
  → apps/worker poll loop
  → atomic claim (FOR UPDATE SKIP LOCKED)
  → lease + heartbeat
  → lifecycle: claimed → preparing → running → collecting → completed
  → retry / timeout / cancel / supersede recovery
```

## Package boundaries

| Package | Responsibility |
|---|---|
| `packages/queue/contracts` | Statuses, transitions, failure codes, ops events |
| `packages/queue/publisher` | Enqueue only |
| `packages/queue/scheduler` | Poll + recover + claim orchestration |
| `packages/queue/lease` | Ownership-scoped lease renewal |
| `packages/queue/heartbeat` | Heartbeat session |
| `packages/queue/retry` | Backoff |
| `packages/queue/timeout` | Deadline helpers + timed_out finalize |
| `packages/queue/cancellation` | Cancel request + detect |
| `packages/queue/repository` | SQL for claim/transition/retry/supersede |
| `packages/worker/runner` | Poll loop + placeholder task |
| `packages/worker/lifecycle` | Stage progression for a claimed run |
| `packages/worker/shutdown` | SIGTERM/SIGINT, stop claiming |
| `apps/worker` | Process entry (`@zod-ai/worker-app`) |

Next.js routes never contain scheduler SQL.

## State machine

Statuses: `queued`, `claimed`, `preparing`, `running`, `collecting`,
`completed`, `failed`, `timed_out`, `cancelled`, `superseded`.

`completed` means the **scheduler placeholder** finished. It is **not** a
code-correctness verdict (`decision` remains null until later milestones).

## Claim query

Eligible: `status = 'queued' AND available_at <= now() AND attempt_count < max_attempts`,
ordered by `created_at`, `FOR UPDATE SKIP LOCKED LIMIT 1`, then update lease
fields and increment `attempt_count` / `run_version` in the same transaction.

## Lease and heartbeat

Defaults: lease 120s, heartbeat 20s, poll 2–5s, max attempts 3. Only
`claimed_by` + matching `run_version` may renew or finalize. Expired leases
requeue with backoff or fail when attempts are exhausted.

## Retry / timeout / cancel / supersede

- Retryable failures set `available_at` with jittered exponential backoff.
- Run timeout → `timed_out` (never later `completed`).
- Cancellation: queued cancels immediately; active sets
  `cancellation_requested_at` and worker finalizes `cancelled`.
- PR supersede marks older open runs `superseded` (push does not supersede
  unrelated PRs). Stale workers cannot overwrite.

## Worker boundary

`npm run worker` starts a long-running Node process. Placeholder modes are
deterministic and never execute repository code.

## Transition to Milestone 4

Replace the placeholder in `packages/worker/runner` with exact-SHA checkout
behind the existing claim/lease/finalize contract. Do not move claim SQL into
the sandbox layer.
