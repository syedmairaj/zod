# Risk Register

| Risk | Severity | Likelihood | Mitigation | Release blocker? |
|---|---:|---:|---|---|
| Cross-tenant repository access | Critical | Medium | Mandatory server-side organization scoping and adversarial authorization tests | Yes |
| GitHub token leakage | Critical | Medium | Short-lived tokens, log redaction, credential removal before execution | Yes |
| Sandbox escape | Critical | Medium | Restrict alpha repositories, hardened isolation, hostile fixtures, independent review | Yes for broad public execution |
| False approval after infrastructure failure | Critical | Medium | Fail-safe governance and required-validator policy | Yes |
| Stale run overwrites newer check | High | Medium | Exact SHA checks and compare-before-publish | Yes |
| Duplicate webhook creates duplicate work | High | High | Delivery ID idempotency and active-run uniqueness | Yes |
| AI hallucinated critical finding | High | High | Evidence requirement, verifier, no AI override of deterministic results | No if AI disabled |
| Excessive false positives | High | Medium | Regression fixtures, feedback labels, precision metrics | Yes for public beta |
| Large repository cost and latency | Medium | High | Size limits, caching, timeouts, alpha allowlist | No for controlled alpha |
| Dependency scanner instability | Medium | Medium | Tool pinning, error classification, optional policy mode | No |
| Secret exposure in evidence excerpts | Critical | Low | Redaction, hashing, bounded excerpts, secret scanner integration | Yes |
| GitHub outage | Medium | Medium | Durable queue, retries, clear operational status | No |
| AI provider outage | Medium | Medium | Feature flags and deterministic-only fallback | No |
| Unclear pricing before validation | Low | High | Keep pricing planned; collect usage and willingness-to-pay data | No |
