# Sandbox Execution

## 1. Requirement

Customer repository code must never execute in the Next.js/Vercel application runtime.

## 2. Worker lifecycle

1. Receive signed internal job.
2. Create isolated ephemeral environment.
3. Obtain short-lived repository token.
4. Clone exact base and head commits.
5. Disable unnecessary network access.
6. Install dependencies using lockfile.
7. Execute approved validation commands.
8. Collect structured results and redacted logs.
9. Upload artifacts.
10. Destroy environment.

## 3. Command policy

Commands come from:
- verified repository profile;
- Zod.ai framework preset;
- explicit user configuration.

Do not allow the AI reviewer to execute arbitrary shell commands directly.

## 4. Network policy

Default deny.

Temporary allowlists may include:
- package registry during dependency installation;
- GitHub during checkout;
- explicitly approved test dependencies.

Production databases, cloud metadata, internal control-plane networks, and arbitrary internet targets remain blocked.

## 5. Resource limits

Configure:
- wall-clock timeout;
- CPU quota;
- memory limit;
- process limit;
- disk quota;
- output/log limit;
- maximum artifact size.

## 6. Caching

Safe caches:
- package archives keyed by lockfile hash;
- immutable base images;
- repository metadata.

Never cache:
- secrets;
- writable customer workspaces;
- credentials;
- unredacted logs.

## 7. Result schema

Each command returns:
- command identifier;
- tool version;
- start/end time;
- exit code;
- timeout flag;
- stdout/stderr artifact references;
- redacted summary;
- pass/fail/inconclusive;
- machine-readable findings.

## 8. Fork pull requests

Treat forks as higher risk:
- no repository write token;
- no secrets;
- strict egress;
- no deployment tests requiring credentials;
- clearly report skipped checks.
