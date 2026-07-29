# Release Gates

## Gate 0 — Authentication experience

Pass when GitHub OAuth, Google OAuth, and magic-link fallback work safely with
modal + standalone `/sign-in`, allowlisted redirects, and no token leakage.

| Requirement | Status |
|---|---|
| Shared AuthPanel (modal + standalone) | Passed (code + unit) |
| Intercepted `@auth/(.)sign-in` + hard `/sign-in` | Passed (code + unit) |
| Safe redirect helper rejects open redirects | Passed (unit) |
| Middleware does not forward arbitrary `/?code=` | Passed (unit + middleware policy) |
| OAuth start uses GitHub/Google via Supabase (not GitHub App) | Passed (code + unit) |
| Magic-link generic success / rate-limit handling | Passed (unit) |
| Callback exchange + token_hash + safe errors | Passed (unit) |
| `/terms` and `/privacy` resolve (beta policies) | Passed (routes) |
| Custom SMTP before public magic-link launch | Documented (not verified live) |
| Live GitHub / Google OAuth matrix | Not tested in this environment (requires provider credentials) |
| Professional legal review before paid launch | Documented requirement |

**Gate 0 overall:** Partially passed — automated/code requirements met; live IdP
and SMTP remain operator-run per `docs/mvp/testing/AUTHENTICATION_AND_SIGNIN_TEST_GUIDE.md`.

## Gate 1 — GitHub onboarding

Pass when installation, repository selection, revocation, refresh, permission snapshotting, and tenant isolation work correctly.

### Gate 1 status (Milestone 1 implementation)

| Requirement | Status |
|---|---|
| Signed-in member can start install | Passed (code + unit/integration) |
| Signed-out / non-member rejected | Passed (auth choke points; covered by existing auth tests + route guards) |
| Callback links installation to correct org | Passed (code + integration) |
| Duplicate same-org callback idempotent | Passed (integration) |
| Cross-org installation conflict (409 / redirect, no reassignment) | Passed (integration + callback) |
| DB blocks organization_id reassignment | Passed (trigger + integration) |
| DB blocks repository org/installation move | Passed (trigger + integration) |
| Repo listing uses installation token server-side | Passed (code review: token never returned) |
| Selection persists; deselect disconnects | Passed (integration + UI actions) |
| Refresh: rename / visibility / access loss | Passed (integration) |
| Permissions snapshot stored and refreshed | Passed (integration + UI) |
| Installation tokens never persisted | Passed (code + integration assert null envelope) |
| Manual live GitHub matrix (install/refresh/conflict/disconnect) | Not tested in this environment (requires real App credentials) |
| Marketing unchanged | Passed |
| Webhook code unmodified in this milestone | Passed |

**Gate 1 overall:** Partially passed — automated and code-path requirements met; live GitHub manual matrix remains **Not tested** until operators run `docs/mvp/testing/MILESTONE_01_GITHUB_ONBOARDING_TEST_GUIDE.md`.

## Gate 2 — Webhook ingestion

Pass when signatures, raw-body handling, idempotency, replay protection, and installation mapping are proven.

## Gate 3 — Run orchestration

Pass when jobs are durable, lease-safe, retry-safe, exact-SHA bound, and stale-safe.

## Gate 4 — Execution boundary

Pass when credentials are removed before execution, resources are bounded, cleanup works, and hostile fixtures cannot reach host or tenant secrets.

## Gate 5 — Deterministic validators

Pass when validators are reproducible, structured, regression-tested, and distinguish code failure from infrastructure failure.

## Gate 6 — Evidence

Pass when every important finding is traceable to its source, SHA, file, line range, rule, and tool version where relevant.

## Gate 7 — Repository intelligence

Pass when supported repository shapes are recognized accurately and uncertainty is exposed instead of guessed.

## Gate 8 — AI semantic review

Pass when AI findings cite evidence, expose uncertainty, resist prompt injection, and cannot override deterministic evidence.

## Gate 9 — Independent verification

Pass when the verifier measurably reduces unsupported findings using a labeled evaluation set.

## Gate 10 — Governance

Pass when identical inputs and policy version always produce the same outcome.

## Gate 11 — GitHub reporting

Pass when check results are commit-correct, stale-safe, retry-safe, and permission-safe.

## Gate 12 — Dashboard

Pass when authorized users can inspect runs and evidence, and unauthorized users cannot.

## Gate 13 — Operations

Pass when failures are observable, retriable, attributable, and supported by incident procedures.

## Private-alpha gate

Private alpha can begin only after Gates 1–7, 10–13 pass for the reduced MVP scope. AI review and independent verification may remain disabled behind feature flags until Gates 8–9 pass.
