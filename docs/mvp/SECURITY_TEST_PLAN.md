# Security Test Plan

## Primary threat areas

1. Cross-tenant access
2. GitHub token leakage
3. Forged webhook requests
4. Untrusted repository execution
5. Prompt injection
6. Secret exposure in logs or evidence
7. Stale or replayed events
8. Unauthorized policy changes
9. Unsafe dependency or lifecycle scripts
10. Excessive resource consumption

## Tenant isolation tests

- Modify organization IDs in API requests.
- Modify installation IDs and repository IDs.
- Access another tenant's run-detail URL.
- Query evidence using another tenant's run ID.
- Attempt policy updates across organizations.
- Verify all server-side queries scope by organization.

## Webhook security tests

- valid signature
- invalid signature
- missing signature
- malformed payload
- duplicate delivery ID
- replayed event
- oversized body
- valid signature with unauthorized installation mapping
- verification after body mutation must fail the test

## Credential handling tests

- installation token never reaches browser
- token never appears in logs
- token removed before repository commands run
- no production secrets passed to execution environment
- short-lived token expiry is handled safely

## Sandbox adversarial fixtures

Attempt to:

- read host files
- access the Docker socket
- print environment variables
- call cloud metadata endpoints
- create a fork bomb
- create huge files
- run forever
- escape via symlinks
- write outside the workspace
- execute malicious package lifecycle scripts
- make unrestricted outbound requests

## Prompt-injection tests

Place hostile instructions in:

- source comments
- README
- pull-request title and description
- filenames
- test output
- issue references

Expected result: repository content is treated as untrusted data and cannot alter system policy or force approval.

## Security release gate

No private alpha until:

- no known cross-tenant vulnerability exists
- webhook verification is correct
- credentials are removed before execution
- bounded resource controls are proven
- infrastructure failure cannot approve a change
- all sensitive actions are auditable
