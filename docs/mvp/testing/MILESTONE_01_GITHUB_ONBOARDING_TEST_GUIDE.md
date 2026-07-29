# Milestone 1 — GitHub App onboarding test guide

Manual verification for Gate 1. Never paste real secrets into this document or tickets.

## Prerequisites

- Local app running (`npm run dev -w @zod-ai/web`) with a valid `apps/web/.env.local`
- Migrations applied through `0003_github_onboarding_hardening.sql`
- A GitHub account that can install Apps
- Optional second Zod.ai organization (different owner) for conflict tests
- Tunnel (e.g. ngrok) if GitHub must reach a non-public callback host

## GitHub App settings required

Documented in `SETUP.md`. Confirm:

| Setting | Value |
|---|---|
| Setup URL (Post installation) | `${NEXT_PUBLIC_APP_URL}/api/github/install/callback` |
| Redirect on update | Enabled |
| Webhook URL | `${NEXT_PUBLIC_APP_URL}/api/github/webhook` (present; Milestone 2 — do not expand in M1) |
| Permissions | Repository: Metadata (Read), Pull requests (Read), Checks (Read & write) |
| Events | `Pull request`, `Installation` |

Local callback URL example: `http://localhost:3000/api/github/install/callback`  
Production callback URL placeholder: `https://YOUR_PRODUCTION_HOST/api/github/install/callback`

## Environment variables

Use placeholders only. See `.env.example`:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `GITHUB_APP_ID` / `GITHUB_APP_SLUG` / `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_APP_WEBHOOK_SECRET`
- `GITHUB_INSTALL_STATE_SECRET`
- `CREDENTIALS_ENCRYPTION_KEY` (required by env validation; **not** used to store installation tokens)

## Canonical field meanings

- Repository display name = `owner` + `/` + `name`
- Visibility = `is_private`
- Connection state = `status` (`active` | `disconnected`)
- Installation tokens are ephemeral and never persisted
- Installation → organization ownership is immutable
- `encrypted_credentials_reference` is deprecated for installation tokens
- `account_id` / `installed_by_user_id` may be null only on legacy rows until refreshed

## Test cases

### Personal account installation

1. Sign in as an org owner/admin.
2. Click Install GitHub App.
3. Install on a personal account with selected repositories.
4. Expect redirect to `/org/{id}/connect` with account login and permission summary.

### Organization installation

1. Install on a GitHub organization you administer.
2. Confirm `account_login` matches the org and permissions render.

### Single-repository / all-repositories installation

1. Grant one repo vs all repos in the GitHub UI.
2. Confirm the connect page lists only authorized repos.
3. Select and connect; confirm rows in `repositories` with `status=active`, `disconnected_at` null.

### Cancel flow

1. Start install, cancel on GitHub.
2. Expect no new active installation for the org (or unchanged state).

### Uninstall / disconnect flow

1. Use **Disconnect installation** in Zod.ai.
2. Confirm `status=deleted`, `revoked_at` set; connected repos become `disconnected`.
3. Optionally uninstall the App in GitHub settings and Refresh — expect disconnected/revoked handling.

### Repository access change

1. Remove one connected repo from the App’s repository access in GitHub.
2. Refresh in Zod.ai.
3. Expect that repo `status=disconnected` and `disconnected_at` set; no duplicate row.

### Repository rename

1. Rename a connected repo on GitHub.
2. Refresh.
3. Expect `owner`/`name` updated on the **same** row (`provider_repository_id` unchanged).

### Re-add repository

1. After access removal, re-grant the same GitHub repository.
2. Refresh (metadata only — stays disconnected until selected).
3. Select again → same row reactivated (`disconnected_at` cleared).

### Permission reduction

1. Reduce App permissions in GitHub (or install with fewer scopes).
2. Refresh.
3. Confirm `permissions_json` replaced and UI shows missing required/recommended warnings.
4. If `metadata:read` missing, selection must be blocked.

### Cross-tenant attack attempts

1. Complete install for Org A.
2. As Org B owner, attempt to complete a callback/link for the same `installation_id`.
3. Expect conflict (`installation_org_conflict`), **no** org reassignment, audit `github_installation.conflict_rejected` without naming Org A.
4. Attempt URL/action ID swaps for another org’s installation/repo IDs → redirect/deny; no cross-tenant rows.

### Expected database records

- `github_installations`: one row per GitHub `installation_id`; `organization_id` never changes
- New links: non-null `account_id`, `permissions_json`, `installed_by_user_id`
- `repositories`: unique `(github_installation_id, provider_repository_id)`
- `audit_events`: started/connected/refreshed/revoked/conflict/selected/deselected as applicable
- `encrypted_credentials_reference` remains null for this flow

### Expected logs

Structured `console.info` JSON events (`installation_*`, `repository_*`, `github_api_failed`) with org/installation ids and error codes only. No tokens, PEM material, Authorization headers, or signed `state` values.

### Rollback (disposable DB)

1. Restore DB from backup, or drop added columns/triggers only in a disposable environment.
2. Do not edit `0001`/`0002`. Prefer forward-fix migrations in production.

## Pass/fail checklist

- [ ] Install maps to correct Zod.ai organization
- [ ] Authorized repos listed; unauthorized never visible
- [ ] Selection persists; deselect sets `disconnected_at`
- [ ] Refresh handles rename / access loss / permission reduction
- [ ] Cross-org link returns conflict; DB unchanged
- [ ] Disconnect sets `revoked_at`; same-org reconnect clears it
- [ ] No installation token in DB, browser, or logs
- [ ] Automated M1 + tenant tests green
- [ ] Production build green
