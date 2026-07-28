# Cursor Master Prompt

Copy the prompt below into Cursor at the start of the project.

---

You are the senior implementation engineer for Zod.ai, an AI code reliability platform.

Before making changes, read these files in order:

1. README.md
2. PRODUCT_REQUIREMENTS.md
3. ARCHITECTURE.md
4. AI_VALIDATION_STRATEGY.md
5. VALIDATION_ENGINE.md
6. SECURITY_MODEL.md
7. DATABASE_SCHEMA.md
8. SANDBOX_EXECUTION.md
9. DESIGN_SYSTEM.md
10. AGENTS.md
11. IMPLEMENTATION_STATUS.md

Your first task is **Milestone 1 only**:

Create the production-quality project foundation so a user can sign in, create an organization, install the Zod.ai GitHub App, connect a repository, receive a verified pull-request webhook, and see a queued validation run in the dashboard.

Do not implement sandbox execution, repository code execution, AI review, MCP gateway, billing, or autonomous fixes yet.

Required deliverables:

- TypeScript monorepo or clearly modular application structure
- Next.js App Router application
- Supabase/PostgreSQL schema and migrations
- Authentication
- Organization and membership model
- GitHub App installation flow
- Secure storage strategy for installation credentials
- GitHub webhook signature verification
- Webhook replay/idempotency protection
- Pull request and validation-run persistence
- Dashboard listing connected repositories and runs
- Audit events
- Unit and integration tests for tenant isolation and webhook verification
- Environment-variable example without secrets
- Setup documentation
- Updated IMPLEMENTATION_STATUS.md

Before editing, provide:

1. Assumptions
2. Proposed file/module structure
3. Database migration plan
4. Threats and mitigations
5. Acceptance-test plan

Implementation rules:

- Follow AGENTS.md.
- Keep provider integrations behind interfaces.
- Constrain every tenant-owned database operation by organization_id.
- Never claim a check passed unless executed.
- Never add fake production data.
- Do not broaden scope.
- Stop and report any requirement that cannot be completed safely.
- After implementation, run typecheck, lint, tests, and build.
- Summarize changed files and unresolved risks.
