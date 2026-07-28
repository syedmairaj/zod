# Product Requirements

## 1. Product

**Name:** Zod.ai  
**Category:** AI code reliability and agent governance  
**Initial surface:** GitHub pull-request validation  
**Primary users:** Solo developers and small engineering teams using AI coding agents

## 2. Problem

AI coding agents increase output, but developers cannot reliably determine whether generated changes:

- satisfy the requested functionality;
- preserve existing behavior;
- comply with project architecture;
- introduce authorization or tenant-isolation failures;
- invent APIs, database fields, dependencies, or environment variables;
- include meaningful tests;
- are safe to merge or deploy.

Existing linters and tests catch syntax and known assertions, but they do not fully evaluate intent, architecture, or missing behavior.

## 3. Product promise

For every proposed change, Zod.ai produces:

- a merge recommendation;
- deterministic test and analysis results;
- semantic logic review;
- affected-system analysis;
- evidence-backed findings;
- risk classification;
- suggested remediation;
- an auditable execution trace.

## 4. Initial user journey

1. User signs in.
2. User creates or joins an organization.
3. User installs the Zod.ai GitHub App.
4. User selects a repository.
5. Zod.ai performs repository onboarding and creates a project profile.
6. A pull request is opened or updated.
7. GitHub sends a signed webhook.
8. Zod.ai creates a validation run.
9. An isolated worker checks out the exact commit.
10. Deterministic checks run.
11. Relevant architecture context is retrieved.
12. Primary semantic review runs.
13. Independent verification challenges material findings.
14. Zod.ai publishes a GitHub Check and dashboard report.
15. Developer accepts, dismisses, fixes, or converts findings into project rules.

## 5. MVP requirements

### GitHub integration
- GitHub App installation
- Signed webhook verification
- Repository selection
- Pull request opened, synchronize, and reopened events
- Check Run creation and update
- Installation-token handling with short-lived credentials

### Repository profiling
- Detect language, framework, package manager, test runner, linter, and build command
- Detect Supabase migrations and generated database types
- Detect project instruction files
- Create a versioned repository snapshot
- Allow users to edit detected commands and rules

### Validation
- Diff parsing
- Changed-file classification
- Risk scoring
- Typecheck, lint, test, and build execution
- Secret scan
- Dependency-change inspection
- Schema and migration checks
- Semantic functionality review
- Architecture-rule review
- Security review
- Test-quality review
- Finding deduplication and corroboration

### Findings
Every finding must include:
- title;
- severity;
- category;
- status;
- file and line/range when applicable;
- concise explanation;
- evidence;
- violated rule or expected behavior;
- confidence score and confidence basis;
- source: deterministic, structural, AI, or combined;
- suggested fix;
- blocking decision;
- stable fingerprint.

### Dashboard
- Repositories
- Pull requests
- Validation runs
- Findings
- Run timeline
- Rule management
- Usage
- Organization settings

## 6. Explicitly out of scope for MVP

- Full IDE
- Autonomous production deployment
- Automatic database writes to customer infrastructure
- Support for every programming language
- Enterprise SSO
- Public MCP marketplace
- Automatic merging
- Guaranteed defect-free code

## 7. Success metrics

- Useful-finding acceptance rate
- False-positive rate
- Critical issue confirmation rate
- Median validation duration
- Cost per validation
- Suggested-fix acceptance rate
- Weekly active repositories
- Paid conversion
- Four-week repository retention

## 8. Initial targets

- More than 70% of surfaced high-severity findings judged useful
- Less than 15% false-positive rate for blocking findings
- Median small-PR validation under 8 minutes
- Complete trace for 100% of validation runs
- No cross-tenant data exposure
