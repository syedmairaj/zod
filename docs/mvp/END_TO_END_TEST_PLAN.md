# End-to-End Test Plan

## Controlled repositories

Use at least five repositories:

1. Clean Next.js application
2. Next.js + Supabase tenant-isolation defects
3. Migration and generated-type drift
4. Unsafe webhook verification order
5. Malformed or hostile repository

## Golden-path test

1. Sign in.
2. Install the GitHub App.
3. Authorize one repository.
4. Open a clean pull request.
5. Confirm webhook receipt.
6. Confirm one validation run is created.
7. Confirm exact commit SHA is stored.
8. Confirm deterministic validators execute.
9. Confirm the GitHub Check reports pass.
10. Confirm dashboard evidence matches the run.

## Defect-detection test

1. Introduce one known defect.
2. Push a new commit.
3. Confirm old queued or running work is superseded safely.
4. Confirm the new run is tied to the new SHA.
5. Confirm the expected validator fails.
6. Confirm evidence contains the correct file and line range.
7. Confirm governance does not return pass.
8. Fix the defect.
9. Push again.
10. Confirm the finding disappears.

## Failure-path tests

- GitHub API timeout
- queue unavailable
- worker crash
- checkout failure
- validator timeout
- malformed tool output
- GitHub Check publishing failure
- installation removed mid-run
- repository permissions revoked
- stale run attempts to publish after a newer run

## Removal test

1. Remove repository authorization.
2. Confirm it disappears from the dashboard.
3. Confirm future events are rejected or ignored safely.
4. Confirm historical authorized evidence follows retention policy.

## E2E release gate

All golden, defect, failure, and removal paths must pass repeatedly without cross-tenant leakage or false approval.
