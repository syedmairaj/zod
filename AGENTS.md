# AGENTS.md

This file governs AI coding agents working on Zod.ai.

## Product context

Zod.ai validates and governs AI-generated code. Reliability, security, evidence, and auditability are more important than implementation speed.

## Required reading before changes

Read:
1. `PRODUCT_REQUIREMENTS.md`
2. `ARCHITECTURE.md`
3. Relevant domain document
4. `IMPLEMENTATION_STATUS.md`

## Mandatory workflow

Before editing:
1. Restate the acceptance criteria.
2. Identify affected modules.
3. Identify security and multi-tenant risks.
4. Propose the smallest vertical implementation.
5. Identify tests required.

After editing:
1. Run typecheck.
2. Run lint.
3. Run relevant tests.
4. Run production build when practical.
5. Review the diff for unrelated changes.
6. Update `IMPLEMENTATION_STATUS.md`.
7. Report unresolved risks honestly.

## Engineering rules

- Strict TypeScript.
- No `any` without written justification.
- Validate all external input.
- Every tenant-owned query constrains `organization_id`.
- Authorization belongs in service/domain boundaries, not only UI.
- Webhooks require signature verification and idempotency.
- Provider SDKs remain behind adapters.
- Never log tokens, secrets, complete repository credentials, or sensitive source unnecessarily.
- Never execute repository code in web/API processes.
- Background work must be idempotent.
- System errors must not be converted into pass results.
- Every blocking finding requires traceable evidence.
- Avoid premature microservices.

## Change-size rule

Implement one vertical slice per task. Do not build unrelated future modules.

## Database rule

Every migration must include:
- forward migration;
- indexes;
- constraints;
- RLS/policies where relevant;
- rollback considerations;
- generated type update;
- migration test.

## UI rule

- Reuse design tokens and components.
- Support loading, empty, error, partial, and success states.
- Respect reduced motion.
- Do not use fake metrics in production UI.

## Prohibited behavior

- Claiming tests passed without running them.
- Creating placeholders that look complete.
- Silently weakening security checks.
- Adding packages without explaining need.
- Broad refactors during feature delivery.
- Hard-coding model marketing names across domain code.
