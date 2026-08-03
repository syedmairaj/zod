# Implementation Sequence

## Phase A — Audit and foundations

1. Complete `CURRENT_STATE_AUDIT.md` from repository evidence.
2. Confirm organization authorization model.
3. Confirm GitHub App permissions and callback flow.
4. Define database schema for installations, repositories, deliveries, runs, attempts, validator results, evidence, policies, and checks.
5. Add feature flags for unfinished capabilities.

## Phase B — Safe event pipeline

6. Implement GitHub App onboarding.
7. Implement repository authorization and selection.
8. Implement raw-body webhook verification.
9. Add delivery idempotency.
10. Create exact-SHA validation runs.
11. Add durable queue, lease, retry, and superseding logic. **(Milestone 3 — implemented; Gate 3 Partially passed pending operator live matrix)**

## Phase C — Controlled execution

12. Implement exact commit checkout. **(next: Milestone 4 — not started)**
13. Remove credentials before command execution.
14. Add workspace isolation and cleanup.
15. Add CPU, memory, PID, disk, time, network, and log limits.
16. Run malicious fixture tests.

## Phase D — Deterministic product value

17. Add TypeScript validator.
18. Add ESLint validator.
19. Add test validator.
20. Add build validator.
21. Add secret scanner.
22. Add dependency scanner.
23. Normalize structured validator results.
24. Build evidence records.
25. Implement deterministic governance.
26. Publish GitHub Checks.
27. Build minimal run-detail dashboard.

## Phase E — Intelligence and AI

28. Add repository-shape detection.
29. Add command and workspace discovery.
30. Add routes, schema, migration, and dependency extraction.
31. Add AI semantic review behind a feature flag.
32. Add prompt-injection and hallucination evaluation.
33. Add independent verifier behind a feature flag.
34. Build labeled quality dataset and thresholds.

## Phase F — Operations and alpha

35. Add metrics, logs, alerts, and retry controls.
36. Add retention and deletion behavior.
37. Add incident and rollback procedures.
38. Run controlled E2E repositories.
39. Conduct security review.
40. Launch private alpha.

## Smallest safe first implementation milestone

Build only GitHub App onboarding and authorized repository selection. Do not create repository execution or pretend validation works until its own milestones and release gates pass.
