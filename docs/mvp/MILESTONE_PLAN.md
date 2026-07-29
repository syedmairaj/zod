# Milestone Plan

## Milestone 1 — GitHub App onboarding

Install app, map installation to organization, list authorized repositories, select repository, handle removal.

## Milestone 2 — Webhook ingestion

Verify signatures, persist delivery IDs, map events to installations and exact SHAs, enforce idempotency.

## Milestone 3 — Validation job queue

Implement durable run states, leases, retries, cancellation, timeout, and superseding behavior.

## Milestone 4 — Repository checkout and execution boundary

Clone exact commit, isolate workspace, remove credentials, limit resources, clean up safely.

## Milestone 5 — Deterministic validation engine

Add TypeScript, ESLint, tests, build, secret, and dependency validators.

## Milestone 6 — Evidence engine

Normalize findings into traceable, immutable evidence records.

## Milestone 7 — Repository intelligence

Detect framework, commands, workspaces, routes, migrations, schema/types, policies, and dependency relationships.

## Milestone 8 — AI semantic review

Add evidence-grounded requirement, logic, convention, and hallucination analysis.

## Milestone 9 — Independent verifier

Challenge AI findings and classify them as confirmed, partial, unsupported, contradicted, or insufficient evidence.

## Milestone 10 — Governance engine

Produce deterministic pass, pass-with-warnings, review-required, or failed outcomes.

## Milestone 11 — GitHub check reporting

Publish pending and final commit-specific checks with links to evidence.

## Milestone 12 — Minimal dashboard

Provide repositories, runs, findings, evidence, policies, and settings views.

## Milestone 13 — Observability and operations

Add metrics, logs, traces, alerts, retry tooling, run diagnostics, and incident procedures.

## Milestone 14 — Private alpha readiness

Run complete controlled-repository E2E tests and invite a small group of approved testers.

## Important sequencing note

Milestones 8 and 9 are not required for the first deterministic private alpha if the product clearly labels them unavailable and the governance engine does not rely on them.
