# Current State Audit

## Purpose

Classify the repository's current capabilities before and during MVP backend implementation.

## Classification labels

- **Implemented** — production code exists and is test-covered.
- **Partial** — foundation exists but the workflow is incomplete.
- **Missing** — no usable implementation exists.
- **Unsafe** — behavior exists but fails a security or tenancy requirement.
- **Marketing demo only** — represented in the landing page but not backed by product behavior.

## Audit table

| Capability | Status | Repository evidence | Missing work | Risk |
|---|---|---|---|---|
| Authentication | Implemented | Supabase Auth (GitHub/Google OAuth + magic link), `@auth` modal + `/sign-in`, `/auth/callback`, `safe-redirect` | Live IdP E2E; custom SMTP before public email | Misconfigured Redirect URLs; provider secrets in Supabase only |
| Organization tenancy | Implemented | `organization_members`, `requireOrganizationAccess` | — | Role mistakes |
| GitHub App foundation | Implemented | `packages/github`, install start/callback, `0001`+`0003` | Live App E2E | Key handling |
| Repository authorization | Implemented | Connect UI, server-side listing via installation token, select/deselect/refresh | Live GitHub matrix | Stale grants until refresh |
| Installation org immutability | Implemented | App conflict + DB trigger in `0003` | — | — |
| Webhook verification | Implemented (Gate 2 live-passed) | Thin `api/github/webhook` → `processGithubWebhook`; HMAC raw body in `packages/github/signature` | — | Tampered body must keep failing closed |
| Webhook idempotency | Implemented (Gate 2 live-passed) | `webhook_deliveries` unique delivery_id claim; `action` persisted when present | — | Race covered by unique constraint |
| Event parsing / SHA extract | Implemented (Gate 2 live-passed) | `packages/github/event-parser` for ping/PR/push/installation/installation_repositories | Broader event types later | Invalid handled events throw → 500 (fail closed) |
| Validation queue enqueue | Implemented (Gate 2 live-passed) | `packages/queue/publisher` inserts `validation_runs` (`queued`) with `commit_sha` + `webhook_delivery_id` | — | Do not treat enqueue as execution |
| Worker lifecycle / scheduler | Implemented (Gate 3 automated; manual matrix pending) | `packages/queue` claim/lease/retry/cancel/timeout; `packages/worker` lifecycle; `apps/worker` process; migration `0005` | Operator live two-worker/crash matrix | `completed` is scheduler-ok only, not code pass |
| Exact SHA checkout | Missing | — | Milestone 4 | — |
| Sandbox execution | Missing | — | Milestone 4 | — |
| Deterministic validators | Missing | — | Milestone 5 | — |
| Evidence engine | Missing | — | Milestone 6 | — |
| Governance engine | Missing | — | Milestone 10 | — |
| GitHub Checks integration | Missing | Permissions recommended in SETUP | Milestone 11 | — |
| Dashboard | Partial | Org repos, connect, audit, runs list | Rich evidence UI | — |
| Audit logs | Implemented | `audit_events` + M1 actions | — | Silent catch on some writes |
| Observability | Partial | `emitOpsEvent` structured logs | Metrics/traces | — |
| AI semantic review | Marketing demo only | Landing copy | Milestone 8 | — |
| Independent verifier | Marketing demo only | Landing copy | Milestone 9 | — |

## Canonical GitHub onboarding field model (Milestone 1)

- Repository display name = `owner` + `/` + `name` (no `full_name` column)
- Visibility = `is_private` (no `visibility` column)
- Connection/selection state = `status` (`active` | `disconnected`); `disconnected_at` timestamps disconnects
- Installation tokens are ephemeral (never persisted; `encrypted_credentials_reference` deprecated for tokens)
- One GitHub `installation_id` ↔ exactly one Zod.ai `organization_id` (immutable)
- `account_id` / `installed_by_user_id` nullable only for legacy rows until refreshed

## Critical audit questions

1. Can a user access another organization's installation or repository by changing an ID? **Mitigated** by membership checks + org-scoped queries + immutability triggers; covered by integration tests.
2. Is webhook verification performed against the untouched raw request body? **Yes** (existing); not modified in M1.
3. Are duplicate webhook deliveries idempotent? **Yes** (existing); not modified in M1.
4. Is every run tied to an exact commit SHA? **Yes for enqueue/claim** (`commit_sha` required on enqueue; unchanged across retry/lease reclaim). Checkout of that SHA is Milestone 4.
5. Does any repository command receive credentials or production secrets? **No** (Milestone 3 placeholder executes no repository commands).
6. Can infrastructure failure accidentally produce a passing decision? **Mitigated for scheduler** — failures become `failed`/`timed_out`/`cancelled`; `completed` is scheduler-ok only and does not set `decision`.
7. Can a stale run overwrite a newer GitHub check? **N/A until Milestone 11**; stale workers cannot overwrite reclaimed/superseded run rows (ownership + `run_version`).
