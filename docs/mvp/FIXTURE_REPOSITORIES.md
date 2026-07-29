# Fixture Repositories

## Required fixtures

| Fixture | Expected result |
|---|---|
| clean-nextjs-app | All required checks pass |
| typescript-error | TypeScript validator fails |
| eslint-error | ESLint validator fails |
| failing-test | Test validator fails |
| build-error | Production build fails |
| leaked-secret | Secret scanner fails |
| vulnerable-dependency | Dependency scanner warns or fails by policy |
| migration-type-drift | Drift finding generated |
| unsafe-webhook | Webhook-order rule fails |
| missing-tenant-filter | Tenant-query rule fails |
| malicious-lifecycle-script | Execution is blocked, isolated, or safely failed |
| timeout-repository | Run times out safely |
| fork-bomb-simulation | PID/resource limits stop execution |
| huge-output | Logs are truncated safely |
| monorepo-nextjs | Workspace and command discovery works |
| no-tests-project | Test validator reports skipped according to policy |

## Fixture rules

- Each fixture should target one principal failure.
- Expected outputs must be versioned.
- Fixtures must never contain real secrets.
- Malicious fixtures must run only in dedicated test infrastructure.
- Every validator bug should add a regression fixture.

## Golden dataset

Maintain a machine-readable manifest containing:

- fixture ID
- expected validators
- expected statuses
- expected evidence paths
- expected governance outcome
- maximum duration
- network expectation
