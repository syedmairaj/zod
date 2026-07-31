# Milestone 2 — Webhook ingestion test guide

Manual verification for Gate 2 after automated unit/integration tests pass.

## Prerequisites

- Migrations through `0004_webhook_ingestion_queue.sql` applied
- GitHub App webhook URL: `${NEXT_PUBLIC_APP_URL}/api/github/webhook`
- Webhook secret matches `GITHUB_APP_WEBHOOK_SECRET`
- At least one connected (`active`) repository for the installation

## Checklist

1. **Ping** — From GitHub App → Advanced → Recent Deliveries (or “Send ping”). Expect HTTP 200 and `{ "status": "ok" }`.
2. **Valid PR** — Open or push a commit to a PR on a connected repo. Expect HTTP 200 with `queueJobId` + `commitSha`; a `validation_runs` row with `status=queued`, matching `webhook_delivery_id`, and `commit_sha` = PR head.
3. **Invalid signature** — Replay with a wrong secret (or tamper body). Expect HTTP 401; no new queue row.
4. **Replay** — Redeliver the same `X-GitHub-Delivery` from GitHub. Expect `{ "status": "duplicate" }` and still exactly one queue row for that delivery+trigger.
5. **Unsupported event** — Deliver an `issues` (or similar) event. Expect `{ "status": "ignored" }`; no queue row.
6. **Missing / disconnected repo** — Event for a repo not connected (or disconnected). Expect ignored; no queue row.
7. **Push** — Push to a connected repo. Expect queued run with `trigger=push`, `pull_request_id` null, `commit_sha` = `after`.
8. **installation_repositories removed** — Remove repo access in GitHub. Expect connected Zod.ai repo becomes `disconnected` (adds do not auto-connect).
9. **Secrets** — Confirm logs never contain the webhook secret, PEM, or installation tokens; `encrypted_credentials_reference` stays null.

## Evidence to capture

- Delivery IDs and HTTP statuses from GitHub Recent Deliveries
- Corresponding `validation_runs` / `webhook_deliveries` rows (ids only; no secrets)
