# Validation Engine

## 1. Pipeline

```text
Ingest PR
→ Verify identity and webhook
→ Fetch diff and metadata
→ Classify affected areas
→ Build validation plan
→ Execute deterministic checks
→ Build relevant context
→ Perform semantic review
→ Challenge findings
→ Deduplicate and score
→ Apply organization policy
→ Publish report
```

## 2. Change classification

Classify files into:
- documentation;
- UI/style;
- application logic;
- API;
- authentication;
- authorization;
- database;
- migration;
- billing;
- infrastructure;
- CI/CD;
- dependency;
- test;
- secrets/configuration.

Classification influences checks and risk.

## 3. Risk scoring

Example weighted signals:
- auth/authorization modified: +35
- migration modified: +30
- billing modified: +30
- CI workflow modified: +25
- dependency added: +15
- public API modified: +20
- tests added: -5
- deterministic tests fail: force high
- security policy violation: force critical

Keep the formula explainable and versioned.

## 4. Deterministic checks

Minimum TypeScript/Next.js pack:
- install with locked dependencies;
- typecheck;
- lint;
- unit tests;
- integration tests when configured;
- production build;
- secret scan;
- dependency audit;
- Semgrep rule pack;
- changed API route inspection;
- server/client boundary checks;
- environment variable reference validation.

Supabase pack:
- migration ordering;
- destructive migration detection;
- RLS presence;
- policy change detection;
- generated type drift;
- organization-scoping checks;
- service-role usage checks.

## 5. Functionality validation

The system should derive a requirement-to-evidence matrix:

| Requirement | Code evidence | Test evidence | Runtime evidence | Status |
|---|---|---|---|---|
| Unauthorized users receive 403 | middleware branch | integration test | test run passed | verified |
| Ticket created from AI webchat | event handler | missing | none | incomplete |

AI proposes the mapping, but deterministic evidence confirms executable claims.

## 6. Test generation

Generated tests are proposals, not proof by themselves.

Rules:
- run generated tests in sandbox;
- verify they fail against a known-bad baseline when feasible;
- check that assertions target externally observable behavior;
- prevent tests from simply reproducing implementation internals;
- mark AI-generated test provenance.

## 7. Finding lifecycle

Statuses:
- open;
- confirmed;
- disputed;
- fixed;
- dismissed;
- accepted_risk;
- duplicate.

A stable fingerprint should combine:
- rule/category;
- normalized file path;
- relevant symbol;
- normalized claim.

## 8. Merge recommendation

Outcomes:
- `pass`
- `pass_with_warnings`
- `changes_requested`
- `inconclusive`
- `system_error`

Never map system error to pass.

## 9. Performance

- Analyze diff first.
- Retrieve only affected context.
- Run independent checks in parallel.
- Cache repository profile by commit.
- Cache dependency installation safely.
- Stream progress.
- Cancel superseded PR runs.
