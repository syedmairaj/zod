# Zod.ai — Cursor Build Pack

Zod.ai is the independent reliability layer for AI-generated code.

## Product promise

Zod.ai validates agent-written changes against:

- Compilers, tests, linters, and security scanners
- Repository architecture and project-specific rules
- Database and API contracts
- Product requirements and acceptance criteria
- Permission and deployment policies
- Independent AI reviewers

Zod.ai does **not** promise zero defects. It provides evidence-based risk reduction, measurable precision, safe failure, and human approval for high-risk changes.

## Recommended initial market

TypeScript, Next.js, and Supabase teams using Cursor, Claude Code, Codex, or similar coding agents.

## First commercial product

A GitHub App that analyzes pull requests, executes deterministic validation in an isolated sandbox, performs semantic review, and posts a concise evidence-backed GitHub Check.

## Getting started (Milestone 1 build)

This repository now contains a working Milestone 1 implementation (sign-in,
organizations, GitHub App install, connected repositories, verified
webhooks, queued validation runs). See `SETUP.md` to provision Supabase and
the GitHub App and run it locally, and `IMPLEMENTATION_STATUS.md` for what's
built, what isn't, and known risks.

## Documents

1. `PRODUCT_REQUIREMENTS.md`
2. `ARCHITECTURE.md`
3. `AI_VALIDATION_STRATEGY.md`
4. `VALIDATION_ENGINE.md`
5. `SECURITY_MODEL.md`
6. `DATABASE_SCHEMA.md`
7. `SANDBOX_EXECUTION.md`
8. `DESIGN_SYSTEM.md`
9. `AGENTS.md`
10. `IMPLEMENTATION_STATUS.md`
11. `CURSOR_MASTER_PROMPT.md`

## Non-negotiable engineering rules

- Never execute customer repositories in the web application process.
- Never expose production secrets to validation sandboxes.
- Every tenant-owned record contains `organization_id`.
- Every finding includes evidence, location, rule, severity, confidence, and validation source.
- AI-only findings cannot silently block high-impact work without policy support or corroborating evidence.
- Model providers are adapters, not architectural dependencies.
- Store model name, prompt version, rule version, and evidence for every review.
worker test 1
worker test 2
