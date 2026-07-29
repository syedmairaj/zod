# Zod.ai MVP Scope

## Product vision

**Generate with any AI. Trust only what Zod.ai can verify.**

## MVP operational promise

Validate TypeScript and Next.js pull requests with deterministic checks, traceable evidence, and safe governance outcomes.

## In scope

1. GitHub App onboarding
2. Authorized repository selection
3. Verified webhook ingestion
4. Idempotent validation runs
5. Exact commit checkout
6. Controlled repository execution
7. Deterministic validators
   - TypeScript
   - ESLint
   - Tests
   - Production build
   - Secret scanning
   - Dependency scanning
8. Structured evidence
9. Deterministic governance outcome
10. GitHub check result
11. Minimal dashboard
12. Audit and operational logging

## Out of scope

- GitLab
- MCP Firewall
- Autonomous agent actions
- Billing
- Enterprise approval workflows
- Automatic merging
- Support for every language or framework
- Broad execution of arbitrary public repositories
- Claims of perfect bug detection

## MVP success criteria

A developer can install Zod.ai, authorize one repository, open a pull request, receive deterministic validation results, inspect evidence-backed findings, fix the issue, push again, and see the finding disappear.

## Product truth rules

- Deterministic evidence is the source of truth.
- AI must never override deterministic failures.
- Infrastructure failure must never produce approval.
- Every run is bound to an exact commit SHA.
- Repository code is untrusted.
- All access is organization-scoped.
