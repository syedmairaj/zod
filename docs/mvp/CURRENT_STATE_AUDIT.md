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
| Webhook verification | Implemented (Milestone 2 surface) | `api/github/webhook`, HMAC raw body | Out of M1 scope | Leave unchanged in M1 |
| Webhook idempotency | Implemented (Milestone 2 surface) | `webhook_deliveries` unique delivery_id | Out of M1 scope | — |
| Validation queue | Partial | `validation_runs` queued on webhook | Worker/lease | Not M1 |
| Worker lifecycle | Missing | — | Milestone 3+ | — |
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
4. Is every run tied to an exact commit SHA? **N/A for Gate 1** (validation runs are later milestones).
5. Does any repository command receive credentials or production secrets? **No** (no execution in M1).
6. Can infrastructure failure accidentally produce a passing decision? **N/A for Gate 1**.
7. Can a stale run overwrite a newer GitHub check? **N/A for Gate 1**.
