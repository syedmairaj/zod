# Authentication and sign-in test guide

Manual and configuration verification for the production-quality auth experience
(GitHub OAuth, Google OAuth, email magic link, intercepted modal, standalone
`/sign-in`). This is **not** Milestone 2.

Never paste client secrets, private keys, service-role keys, or access tokens
into this document or tickets.

## Product methods (display order)

1. Continue with GitHub (human OAuth login)
2. Continue with Google
3. Email magic link (fallback)

**GitHub OAuth App ≠ GitHub App.** OAuth is for human sign-in only (identity).
The existing GitHub App remains the only path for repository authorization.
Do not reuse GitHub App credentials for OAuth. Do not request repository
scopes on the OAuth App.

## Route behavior

| Entry | Expected |
|---|---|
| Soft nav from marketing to `/sign-in` | Modal (`@auth/(.)sign-in`) over current page |
| Browser Back | Closes modal, restores marketing URL |
| Browser Forward | Reopens modal |
| Direct visit / refresh `/sign-in` | Standalone page (`app/sign-in/page.tsx`) |
| Already signed in visits `/sign-in` | Redirect `/post-auth` |
| OAuth / magic-link return | `/auth/callback` only (configured Redirect URL) |

Middleware **does not** forward arbitrary `/?code=` to `/auth/callback`.
Configure Supabase Redirect URLs to include `${NEXT_PUBLIC_APP_URL}/auth/callback`.

## Supabase configuration

1. **Site URL:** `${NEXT_PUBLIC_APP_URL}` (e.g. `http://localhost:3000`)
2. **Redirect URLs** allow-list must include:
   - `${NEXT_PUBLIC_APP_URL}/auth/callback`
3. Enable providers: Email, GitHub, Google
4. Rate limits: keep provider defaults; observe magic-link throttling in UI
5. **Custom SMTP:** required before public magic-link launch (Supabase default
   email is not suitable for production deliverability)
6. CAPTCHA / bot protection: recommended before public launch

### Google provider

1. Create a Google Cloud / Auth Platform OAuth client (Web application)
2. Consent screen: app name Zod.ai (or your operator branding); scopes
   `openid`, `email`, `profile`
3. Authorized JavaScript origins: local and production app origins
4. Authorized redirect URI: copy **exactly** from Supabase → Authentication →
   Providers → Google (Supabase callback URL), not the Zod.ai `/auth/callback`
5. Paste Client ID / Client Secret into Supabase Google provider settings
6. Prefer a custom auth domain (e.g. `auth.zod.ai`) when available

### GitHub OAuth App (human login)

1. Create a **separate** OAuth App at GitHub Developer Settings (not the
   repository GitHub App)
2. Homepage URL: `${NEXT_PUBLIC_APP_URL}`
3. Authorization callback URL: copy **exactly** from Supabase → Providers →
   GitHub
4. Minimal scopes: identity / email only (`read:user`, `user:email`). No repo
5. Paste Client ID / Client Secret into Supabase GitHub provider settings

## Environment

See `.env.example`. Auth requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

No additional OAuth client secrets belong in the Next.js app when using
Supabase-hosted provider exchange.

## Legal

- `/terms` and `/privacy` are initial **beta** policies with a visible
  Last updated date
- Professional legal review is required before public paid launch
- Auth panel links to both routes

## Automated checks

From repo root:

```bash
npm run test:unit -w @zod-ai/web -- lib/safe-redirect.test.ts lib/middleware-auth.test.ts components/auth app/sign-in/actions.test.ts app/auth/callback/route.test.ts app/@auth/auth-slot.test.ts
npm run test:integration
```

## Manual matrix

1. GitHub sign-in — new user → `/post-auth` → onboarding or org
2. GitHub sign-in — existing user
3. Google sign-in — new user
4. Google sign-in — existing user
5. Magic link (custom SMTP or controlled test project)
6. Invalid email
7. Rate-limited magic link
8. Provider cancellation
9. Provider callback error → `/sign-in?error=…`
10. Back closes modal
11. Forward restores modal
12. Direct `/sign-in`
13. Refresh on `/sign-in`
14. Mobile keyboard / 320–390px
15. Keyboard-only + screen reader dialog
16. Reduced motion
17. After Google login, existing GitHub App repo connection still works
18. Same user second provider does not create unsafe duplicate org ownership
19. Network tab: no provider tokens in app responses
20. Logs: no tokens / secrets / raw emails in auth events
21. Open-redirect `next=` cases fall back to `/post-auth`

## Distinction reminder

| Concern | Mechanism |
|---|---|
| Human authentication | Supabase Auth (GitHub OAuth / Google / email) |
| Repository authorization | Zod.ai GitHub App installation + connect UI |
