# Setup

This covers Milestone 1: sign-in, organization creation, GitHub App
installation, repository connection, verified webhook ingestion, and the
dashboard. It does not cover sandbox execution, deterministic checks, or AI
review (not implemented yet).

## 1. Prerequisites

- Node.js 20+
- npm 10+ (this repo uses npm workspaces)
- A Supabase project (free tier is fine) -- for Auth and Postgres hosting
- A GitHub account that can create a GitHub App (personal or org-owned)
- For local webhook delivery: a tunnel tool (e.g. `ngrok http 3000`,
  `cloudflared tunnel --url http://localhost:3000`, or the Supabase/GitHub
  CLI equivalents). GitHub cannot reach `localhost` directly.

## 2. Install dependencies

```bash
npm install
```

## 3. Provision Postgres (Supabase)

1. Create a project at https://supabase.com.
2. In the Supabase dashboard, go to Project Settings -> Database and copy the
   **connection string** (URI form, session pooler or direct connection).
   Put it in `DATABASE_URL`.
3. Go to Project Settings -> API and copy the **Project URL** and **anon
   public key** into `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Apply the migrations in order against your project (via the SQL editor,
   `psql`, or the Supabase CLI):
   - `packages/db/migrations/0001_init.sql`
   - `packages/db/migrations/0002_rls.sql`

   Example with `psql`:

   ```bash
   psql "$DATABASE_URL" -f packages/db/migrations/0001_init.sql
   psql "$DATABASE_URL" -f packages/db/migrations/0002_rls.sql
   ```

   Do **not** apply `tests/integration/setup/supabase-shim.sql` to a real
   Supabase project -- it exists only to approximate Supabase's `auth` schema
   for local integration tests against plain Postgres, and a real Supabase
   project already has a real `auth` schema managed by the platform.

5. In Supabase Auth settings, enable **Email** provider with magic
   link/OTP sign-in (this is the default), and add
   `${NEXT_PUBLIC_APP_URL}/auth/callback` to the redirect URL allow-list.

6. After any future migration change, regenerate types:

   ```bash
   supabase gen types typescript --linked > packages/db/src/database.types.ts
   ```

   (No live project is linked in this environment, so this file is currently
   maintained by hand -- keep it in sync manually until CI does this.)

## 4. Create the GitHub App

1. Go to https://github.com/settings/apps/new (or your org's equivalent).
2. **GitHub App name**: anything unique; note the **slug** from the app's
   settings URL (`https://github.com/settings/apps/<slug>`) for
   `GITHUB_APP_SLUG`.
3. **Homepage URL**: `${NEXT_PUBLIC_APP_URL}`.
4. **Callback URL**: not required for this flow (we don't use GitHub user
   OAuth login).
5. **Setup URL** (under "Post installation"): set to
   `${NEXT_PUBLIC_APP_URL}/api/github/install/callback` and check "Redirect
   on update" so re-installs/permission updates also hit the callback.
6. **Webhook URL**: `${NEXT_PUBLIC_APP_URL}/api/github/webhook` (use your
   tunnel URL in development).
7. **Webhook secret**: generate a long random value and put it in both the
   GitHub App settings and `GITHUB_APP_WEBHOOK_SECRET`.
8. **Permissions**:
   - Repository: Pull requests (Read-only), Metadata (Read-only), Checks
     (Read & write -- not used until a later milestone, safe to grant now)
   - Subscribe to events: `Pull request`, `Installation`
9. **Where can this GitHub App be installed?**: your choice (this app only
   ever acts within the installations users explicitly connect).
10. Create the app, then:
    - Copy the **App ID** into `GITHUB_APP_ID`.
    - Generate a **private key** (PEM download) and put its contents in
      `GITHUB_APP_PRIVATE_KEY` (escape newlines as `\n` if stored as a single
      line in `.env.local`).

## 5. Generate internal secrets

```bash
openssl rand -hex 32     # -> GITHUB_INSTALL_STATE_SECRET
openssl rand -base64 32  # -> CREDENTIALS_ENCRYPTION_KEY (must decode to 32 bytes)
```

## 6. Configure environment variables

```bash
cp .env.example apps/web/.env.local
# edit apps/web/.env.local with the values collected above
```

## 7. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign in with a magic link, create an
organization, then use "Install GitHub App" from the dashboard. In
development, run your tunnel first and point the GitHub App's Webhook URL and
`NEXT_PUBLIC_APP_URL` at the tunnel's HTTPS URL so the install callback and
webhook deliveries can reach your machine.

### Troubleshooting: homepage looks unstyled, or `next dev` 404s on `/`

If `npm run dev` serves a bare, unstyled "404: This page could not be found"
page instead of the marketing homepage, check the terminal for repeated
`Watchpack Error (watcher): Error: EMFILE: too many open files, watch` lines.
This is a file-descriptor exhaustion issue in Next's dev-mode file watcher on
large monorepos (common on macOS, whose default per-process open-file limit
is often 256), not a CSS or Tailwind problem -- `next build && next start`
is unaffected because it doesn't run a persistent file watcher. `next.config.mjs`
already excludes `node_modules`/`.git`/`.next` from the dev watcher to reduce
this, but if it still occurs, raise your shell's limit before running `npm run
dev`:

```bash
ulimit -n 65536
npm run dev
```

(macOS persists this per-shell only; add it to your shell profile, e.g.
`~/.zshrc`, to avoid repeating it.)

## 8. Verify the end-to-end flow

1. Sign in -> create organization -> "Install GitHub App" -> pick a repo on
   GitHub -> you're redirected back to "Connect a repository" -> select the
   repo.
2. Open (or push to) a pull request on that repository.
3. GitHub sends a `pull_request` webhook; it should appear within seconds as
   a `queued` validation run on the organization dashboard and on the
   repository detail page.
4. Check the "Audit log" page for `repository.connected`,
   `github_installation.connected`, and `validation_run.queued` entries.

## 9. Running tests

```bash
npm run test:unit          # pure-logic unit tests, no infrastructure needed
npm run test:integration   # spins up a disposable local Postgres cluster,
                            # applies real migrations + RLS, runs real
                            # queries, tears it down. Requires a local
                            # PostgreSQL installation (initdb/pg_ctl on PATH,
                            # e.g. `brew install postgresql`). Does not touch
                            # your Supabase project.
npm run test               # both
```

## 10. Checks before shipping a change

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```
