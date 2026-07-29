# Test Strategy

## Test pyramid

### Unit tests

Use for:

- parsers
- validators
- policy rules
- state transitions
- authorization helpers
- evidence normalization
- governance decisions

### Integration tests

Use for:

- GitHub API adapters
- webhook verification
- database persistence
- queue and lease behavior
- repository checkout
- validator orchestration
- GitHub Check creation

### End-to-end tests

Use for the complete workflow:

GitHub installation → repository selection → pull request webhook → validation run → evidence → governance result → GitHub Check → dashboard.

## Mandatory test categories for every milestone

1. Functional tests
2. Security tests
3. Failure and retry tests
4. Concurrency and idempotency tests
5. Tenant-isolation tests
6. Observability checks
7. Rollback verification

## Invariants

- One logical webhook delivery produces one logical run.
- Every result belongs to the exact commit SHA validated.
- Completed records are immutable.
- Deterministic failures cannot be changed to pass by AI.
- Missing required evidence produces review-required or failed, never pass.
- A user cannot read or mutate another organization's data.
- Repository output is bounded and sanitized.
- Stale runs cannot overwrite newer results.

## Coverage expectations

Each validator must have:

- passing fixture
- failing fixture
- malformed-input fixture
- timeout fixture
- parser-failure fixture
- false-positive regression fixture
- tool-version compatibility fixture where applicable

## Release philosophy

A milestone is not complete because code compiles. It is complete only after its release gate passes with evidence.
