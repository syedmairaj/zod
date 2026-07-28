# Implementation Status

## Current phase

**Phase 1 — Milestone 1: sign-in, organizations, GitHub App install, connected repositories, verified webhooks, queued runs**, plus a **landing-page milestone** (public marketing homepage; not Milestone 2), followed by landing-page redesign **Phase 1 (Design Foundation)**, **Phase 2 (Navigation and Hero)**, **Phase 3 (Interactive Validation Console)**, and now **Phase 4 (Problem and Validation Pipeline)** per `PHASE_01_DESIGN_FOUNDATION.md` / `PHASE_02_NAVIGATION_AND_HERO.md` / `PHASE_03_INTERACTIVE_VALIDATION_DEMO.md` / `PHASE_04_PROBLEM_AND_PIPELINE.md`. See `LANDING_PAGE_IMPLEMENTATION.md` for the original landing-page build. Stopped after Phase 4 per the brief's explicit "do not start Phase 5" instruction.

## Completed

- Product positioning, MVP scope, architecture, AI validation strategy, security/sandbox principles, initial data model, and design direction documented (Phase 0).
- TypeScript npm-workspaces monorepo (`apps/web`, `packages/shared-types`, `packages/db`, `packages/github`).
- Next.js App Router application with a dark, evidence-oriented UI consistent with `DESIGN_SYSTEM.md`.
- Authentication via Supabase Auth (email magic link/OTP), session refresh middleware.
- Organization + membership model (`owner`/`admin`/`developer`/`reviewer`/`billing`/`read_only` roles), org creation flow, application-level `requireOrganizationAccess` authorization choke point used by every tenant-scoped page/action/route.
- GitHub App installation flow: signed, expiring `state` token; install-callback verification; installation linking; repository listing and selection UI.
- GitHub webhook ingress (`/api/github/webhook`): HMAC-SHA256 signature verification over the raw body, delivery-id idempotency claim (unique constraint), `pull_request` (opened/synchronize/reopened) and `installation` (created/deleted/suspend/unsuspend) event handling.
- Pull request revision persistence (one row per `head_sha`) and validation-run persistence (`status = 'queued'` on webhook receipt; prior revision's run marked `superseded`).
- Dashboard: repositories list, per-repository validation-run history, org-wide recent runs, audit log page.
- Audit events recorded for: user sign-in, organization creation, GitHub installation connect/reject, repository connection, validation run queued/superseded.
- Encrypted-credential-storage primitive (AES-256-GCM envelope) ready for any cached GitHub token; the GitHub App private key itself stays in server environment configuration only, never in the database.
- Row Level Security enabled on every tenant table, with `SELECT`-only grants to `authenticated` (no `authenticated`/`anon` write path exists at all -- all writes go through the server-side service layer after an explicit authorization check).
- `.env.example` (no secrets), `SETUP.md` (Supabase provisioning, GitHub App creation, local dev, testing).
- **Public marketing homepage** (`/`) replacing the temporary milestone screen: full landing page (hero with an interactive, accessible "validation demo" preview, problem statement, validation pipeline, feature bento grid, evidence tabs, workflow integrations, security, product status, pricing preview, FAQ, final CTA) built with Tailwind CSS (scoped to `apps/web`, preflight disabled to protect existing dashboard styling) and the `motion` animation library, with no dead links and no fabricated social proof/metrics. See `LANDING_PAGE_IMPLEMENTATION.md` for the full design/dependency rationale, test results, and known limitations.
- **Landing-page redesign Phase 1 (Design Foundation)**: audited the "looks like unstyled browser HTML" report (see Known issues #10 below for the proven root causes), fixed both, extended `tailwind.config.ts` with the semantic tokens `PHASE_01_DESIGN_FOUNDATION.md` calls for (`surface.panel`/`surface.elevated`, `border.subtle`, `accent.foreground`, `informational`, `focus-ring`, `code-bg`, a `display`/`h1`/`h2`/`h3`/`body-lg`/`body`/`body-sm`/`label`/`metadata` type scale, a `grid` opacity token), added a global `:focus-visible` treatment, and built the 9 layout/UI primitives the phase specifies (`MarketingContainer`, `MarketingSection`, `SectionHeader`, `Surface`, `GlowBorder`, `PrimaryButton`, `SecondaryButton`, `StatusBadge`, `CodeText`) under `components/marketing/primitives/`. Per an explicit scope decision with the user (existing content sections stay as-is; only the shell adopts the primitives — see D-011), `AnnouncementStrip`, `SiteHeader`, `MobileNav`, `SiteFooter`, and the marketing layout were rebuilt on the new primitives; `Hero` and every later section were intentionally left untouched.
- **Landing-page redesign Phase 2 (Navigation and Hero)**: audited the existing nav/hero implementation against `PHASE_02_NAVIGATION_AND_HERO.md` and found it already matched the spec almost exactly (nav links, hero copy, CTA routing) from the prior session's build — remaining work was primitive adoption, a new **static-first** hero visual, and two small real bug fixes surfaced by testing:
  - Replaced the auto-cycling, stateful `ValidationDemo` (setInterval stage loop, `AnimatePresence`, Pause/Play) with a new **static** `ValidationConsole` component inside `Hero` only — a single frozen, fully-readable-without-JS snapshot showing pull-request metadata, all six validation stages (five done, "Final merge recommendation" active), one example finding with its evidence location, and the merge recommendation, all visible at once. Per the brief's explicit "do not begin the Phase 3 animated state machine" instruction, `ValidationDemo` and its passing tests were left in place and simply unused, so Phase 3 can pick the animated version back up without rework (see D-013).
  - `Hero` now uses the Phase 1 `MarketingContainer` primitive instead of hand-rolled container classes (same output, less duplication).
  - Fixed a genuine 360px horizontal-overflow bug in the shared `FindingCard` component: its `file:line` mono text had no `truncate`/`min-w-0`, and since the path has no natural wrap points, it could force horizontal overflow on narrow viewports. Fixed with `min-w-0 flex-1 truncate` (also benefits `EvidenceTabs`, which reuses the same component, without changing that section's content — see D-014).
  - Removed the `SiteHeader`/`MobileNav` duplication where the "Connect GitHub" label was re-hardcoded instead of trusting the already-correct `primaryCtaLabel` prop computed in `app/(marketing)/page.tsx`; the now-fully-unused `isSignedIn` prop was removed from `SiteHeader`.
  - Enlarged the mobile hamburger and dialog-close buttons to a 44&times;44px minimum touch target (pure CSS, no behavior change).
  - Verified (not assumed) at 360/390/768/1024/1440px via CDP device-metrics overrides + direct DOM measurement (not just screenshots) that the header and hero have **zero** horizontal overflow at every width, and that the responsive breakpoints (mobile hamburger &lt; `md`, desktop nav &ge; `md`, hero single-column &lt; `lg`, two-column &ge; `lg`) all switch correctly.
  - Confirmed `/sign-in` (200) and `/dashboard` (307 redirect, unauthenticated) are unaffected — no auth/webhook/dashboard/db files were touched.
  - Did **not** add Lenis, decorative/Phase-9 effects, or a mobile-menu open/close animation (the last is a reasonable, low-risk deferral — see Known issues #12).
- **Landing-page redesign Phase 3 (Interactive Validation Console)**: turned the Phase 2 static hero console into a single deterministic `useReducer` state machine (`stageIndex` + `playback: playing|paused|finished`, actions `PLAY|PAUSE|NEXT|TICK|REPLAY`), driven by exactly one `setInterval` (cleared on every dependency change and on unmount — no scattered timers), with Play/Pause, Next Stage, and Replay controls and auto-stop after the final stage. Mid-implementation the user revised the product positioning to governance/reliability rather than "generic AI PR reviewer," so the final delivered content is the governance version directly (the intermediate 6-stage "PR reviewer" copy was superseded before being screenshotted/committed):
  - Seven stages: Change intent captured &rarr; Repository intelligence loaded ("Project Brain") &rarr; Deterministic evidence collected &rarr; Correctness and architecture evaluated &rarr; Hallucination and repository drift checked &rarr; Independent verifier challenge &rarr; Governance decision issued. Each stage has a fixed, deterministic outcome (`passed`/`warning`/`blocked`) driving `ValidationStageList`'s per-stage status icon (extended with a `statuses: StageStatus[]` prop covering `pending/running/passed/warning/blocked`).
  - Stage content is structured, non-generic evidence: change-intent task + metadata, a "Project Brain" repository-facts panel, a deterministic pass/fail check list (incl. one real failure), a critical tenant-isolation architecture finding with observed/expected/evidence/policy-id and requirement coverage, a repository-drift check list with a stale-generated-types warning, an independent-verifier challenge-then-confirm sequence, and a governance decision panel (outcome legend Allow/Allow with warning/Require approval/Request changes/Block, with "BLOCK MERGE" issued, reason, remediation, approval policy, and decision basis).
  - Added a compact "Validate: Code change / Agent action — Planned" selector (plain `useState`, intentionally outside the reducer since it's a static view toggle, not part of the timed run). "Agent action — Planned" replaces the whole console body with a static, clearly labeled "Planned capability" preview (a production-migration request issued a "REQUIRE APPROVAL" decision) and hides the Play/Next/Replay controls, since there is nothing to play; switching to it dispatches `PAUSE` so no interval is left ticking behind it.
  - `prefers-reduced-motion` is honored by never starting the interval and disabling the Play/Pause control (Next Stage and Replay remain fully functional) — content updates immediately with no transition, verified via a `role="status"` live region that updates synchronously regardless of Motion's own animation timing.
  - Deleted `validation-demo.tsx`/`validation-demo.test.tsx` (the old, unused, auto-cycling-with-no-auto-stop prototype from Phase 2 preparation): fully superseded by this component, so keeping both would have been dead, drifting duplicate logic.
  - Fixed a bug caught during screenshot verification: the change-intent metadata used a viewport-based `sm:grid-cols-4`, but the console's content column is a fixed ~278px regardless of viewport width, so at any width &ge; 640px the 4 columns collided/wrapped illegibly; changed to a plain `grid-cols-2`.
  - `ValidationConsole` no longer uses `FindingCard`/`Finding` (the governance stage content is bespoke per-stage markup instead); `finding-card.tsx` is unchanged and still used by `EvidenceTabs`.
- **Landing-page redesign Phase 4 (Problem and Validation Pipeline)**: rebuilt `ProblemSection` and `ValidationPipeline` — the first two homepage sections after the hero — on the Phase 1 primitives (`MarketingSection`, `SectionHeader`, `Surface`, `StatusBadge`), which no other content section had adopted yet (only the shell did, per D-011). No changes to nav, hero, the Phase 3 state machine, tokens, or primitives themselves.
  - `ProblemSection`: same headline and three problem statements as before, but each card now states a concrete developer example ("Example: ...") and a concrete production consequence ("Production impact: ...") as distinct, explicitly-labeled sentences (previously a single generic sentence), plus a small **visual cue that mirrors the product's own evidence language** instead of a decorative illustration — a `StatusBadge` (e.g. "Requirement mismatch", "Untested branch", "Excessive scope") over a two-row fact strip (e.g. `Ticket: Soft delete` / `Behavior: Hard delete`), deliberately styled like a miniature version of `FindingCard`'s own `dt`/`dd` rows so the problem section itself reads as "this is what Zod.ai would flag."
  - `ValidationPipeline`: same six stages and headline, restructured from a 2-row/3-column card grid into a **single vertical timeline** (numbered circle marker + one continuous connecting rail behind all six markers + a content `Surface` per stage) so the "connection trace" the phase brief asks for works identically at every viewport width, instead of needing separate horizontal/vertical logic for the wrapping grid. Each stage now also carries an explicit tier `StatusBadge` — "Deterministic evidence" (stages 1–3, `success`/green), "AI judgment" (stages 4–5, `informational`/blue), "Human control" (stage 6, `warning`/amber) — directly satisfying the acceptance criterion "deterministic versus AI checks are clearly distinguished" both visually and in the section's new sub-headline description.
  - The connecting rail is a single `motion.div` (`scaleY` 0&rarr;1, `transformOrigin: top`) drawn once via `whileInView` when the section scrolls in — not scroll-linked/pinned (no scroll-jacking), not infinite, and not per-segment (one continuous line, not six small animated pieces). Under `prefers-reduced-motion`, the `initial`/`whileInView` props are omitted entirely so the rail renders fully drawn with no animation, verified with a real reduced-motion screenshot (see below).
  - Fixed a real bug caught in the first screenshot pass: the `<ol>` rendered the browser's native decimal list markers ("1.", "2.", …) stacked directly next to the custom numbered circle markers, because `list-style` isn't reset when Tailwind's `preflight` is disabled. Fixed with `list-none pl-0` on the `<ol>` (same "missing preflight reset" family of bug as Known issues #10, different property).
  - While running the full marketing test suite (not just the two new files) as this phase's own gate, found `hero.test.tsx` was asserting the **old** Phase-2-era H1 copy ("The reliability layer for AI-generated code.") against the **already-updated** Phase-3 H1 ("The reliability and governance layer for AI-generated software—from code creation to agent execution.") — `hero.tsx`'s content itself was correctly updated during the Phase 3 governance revision, but that edit was left uncommitted and its test was never updated to match, so it only surfaced now that this phase ran the full suite instead of a scoped subset. Fixed the one-line test assertion only; `hero.tsx` itself was not touched (out of this phase's scope) — see Known issues #18.

## Not started

- Repository profiling / snapshotting
- Queue / job orchestration
- Sandbox worker and isolated execution
- Deterministic validators (typecheck/lint/test/build/secret-scan/etc.)
- Context builder / retrieval
- AI gateway and primary/independent review
- Finding engine, finding lifecycle, requirement-to-evidence matrix
- GitHub Check publishing
- Policy engine / project rules editor
- Billing and usage metering
- Production deployment and observability (OpenTelemetry/Sentry)

## Files / modules added (landing-page redesign Phase 1: Design Foundation)

```
apps/web/next.config.mjs                              dev-mode webpack watchOptions.ignored (EMFILE mitigation)
apps/web/.eslintrc.json                                added varsIgnorePattern for underscore-prefixed unused vars
apps/web/tailwind.config.ts                            new semantic color/fontSize/opacity tokens (see above)
apps/web/app/globals.css                               @layer base border-width/style/color reset scoped to
                                                        .marketing-root; global :focus-visible; token-split comment
apps/web/app/(marketing)/layout.tsx                    adds the `marketing-root` class hook
apps/web/components/marketing/primitives/
  marketing-container.tsx / .test.tsx
  marketing-section.tsx / .test.tsx
  section-header.tsx / .test.tsx
  surface.tsx / .test.tsx
  glow-border.tsx / .test.tsx
  primary-button.tsx / .test.tsx
  secondary-button.tsx / .test.tsx
  status-badge.tsx / .test.tsx
  code-text.tsx / .test.tsx
apps/web/components/marketing/site-header.tsx          rebuilt on MarketingContainer + PrimaryButton; bg-transparent
                                                        fix on the mobile-menu-toggle button (see Known issues #10)
apps/web/components/marketing/mobile-nav.tsx           rebuilt on PrimaryButton/SecondaryButton; same bg-transparent fix
apps/web/components/marketing/site-footer.tsx          rebuilt on MarketingContainer
apps/web/components/marketing/announcement-strip.tsx   uses surface-panel / metadata tokens
SETUP.md                                                added an EMFILE/"looks unstyled" troubleshooting section
```

## Files / modules added (landing-page redesign Phase 2: Navigation and Hero)

```
apps/web/components/marketing/validation-console.tsx        new: static-first hero visual
apps/web/components/marketing/validation-console.test.tsx   new: 5 tests
apps/web/components/marketing/hero.tsx                       uses MarketingContainer + ValidationConsole
                                                               (ValidationDemo import removed, no longer rendered)
apps/web/components/marketing/finding-card.tsx                360px overflow fix (shrink-0 badge, truncate path)
apps/web/components/marketing/site-header.tsx                 removed unused isSignedIn prop + duplicated CTA
                                                               label logic; 44px hamburger touch target
apps/web/components/marketing/site-header.test.tsx             updated call sites (isSignedIn prop removed)
apps/web/components/marketing/mobile-nav.tsx                   44px close-button touch target
apps/web/app/(marketing)/page.tsx                              SiteHeader call site updated (isSignedIn removed)
```

Not modified (intentionally, per phase scope): `tailwind.config.ts`, any auth/webhook/dashboard/db code.

## Files / modules added (landing-page redesign Phase 3: Interactive Validation Console)

```
apps/web/components/marketing/validation-console.tsx        rewritten: 7-stage governance state machine
apps/web/components/marketing/validation-console.test.tsx   rewritten: 16 tests
apps/web/components/marketing/validation-stage-list.tsx     statuses: StageStatus[] prop (pending/running/
                                                              passed/warning/blocked); replaces the old
                                                              activeIndex-derived done/active/pending model
apps/web/components/marketing/finding-card.tsx                unchanged after a reverted interim edit (see below)
apps/web/components/marketing/validation-demo.tsx              deleted: superseded, was unused
apps/web/components/marketing/validation-demo.test.tsx         deleted: superseded, was unused
```

Not modified: `hero.tsx`, any Phase 1 token/primitive, nav, later marketing sections, auth/webhook/dashboard/db code.

## Files / modules added (landing-page redesign Phase 4: Problem and Validation Pipeline)

```
apps/web/components/marketing/problem-section.tsx         rewritten: Phase 1 primitives, example/consequence
                                                              copy, per-card evidence-style visual cue
apps/web/components/marketing/problem-section.test.tsx     new: 5 tests
apps/web/components/marketing/validation-pipeline.tsx      rewritten: vertical timeline + animated SVG/CSS
                                                              trace + deterministic/AI/human tier badges
apps/web/components/marketing/validation-pipeline.test.tsx new: 10 tests
apps/web/components/marketing/hero.test.tsx                 one assertion updated to match already-shipped
                                                              Phase 3 H1 copy (stale test, not a content change)
```

Not modified: `hero.tsx` content, `validation-console.tsx`/`validation-stage-list.tsx` (Phase 3 state machine), Phase 1 tokens/primitives themselves, nav, later marketing sections, auth/webhook/dashboard/db code.

## Files / modules added (landing page)

See `LANDING_PAGE_IMPLEMENTATION.md` section 8 for the full file list
(`app/(marketing)/*`, `components/marketing/*`, `lib/motion/*`, `lib/cn.ts`,
`tailwind.config.ts`, `app/icon.tsx`/`app/opengraph-image.tsx`/`app/robots.ts`/`app/sitemap.ts`,
plus the `apps/web` component-test harness). `app/page.tsx` was moved into
`app/(marketing)/page.tsx` (route unaffected — a route group adds no URL segment).

## Files / modules added (Milestone 1)

```
package.json, tsconfig.base.json, .gitignore, .env.example, SETUP.md
vitest.integration.config.ts

packages/shared-types/          roles, statuses, domain events, GitHub webhook zod schemas
packages/db/
  migrations/0001_init.sql      core schema (organizations ... webhook_deliveries)
  migrations/0002_rls.sql       RLS policies + grants
  src/client.ts                 pg Pool + transaction helper (Queryable interface)
  src/auth-context.ts           requireOrganizationAccess (application-level authz choke point)
  src/database.types.ts         hand-authored row types (see note below)
  src/repositories/*.ts         org-scoped data access functions (one module per table group)
packages/github/
  src/webhook-verify.ts         HMAC-SHA256 signature verification
  src/crypto.ts                 AES-256-GCM envelope for cached credentials
  src/install-state.ts          signed/expiring state token for the install callback
  src/app-client.ts             GithubAppClient interface + Octokit-App-based implementation
apps/web/
  app/(marketing, sign-in, auth/callback, post-auth, onboarding, dashboard,
       org/[organizationId]/*, api/github/webhook, api/github/install/*)
  lib/ (env.server.ts, db.ts, github.ts, auth.ts, supabase/server.ts, supabase/browser.ts)
  middleware.ts
tests/integration/
  setup/ (postgres-harness.ts, global-setup.ts, connection.ts, fixtures.ts, supabase-shim.sql)
  specs/ (tenant-isolation, rls-policies, webhook-processing)
```

## Migrations

- `0001_init.sql`: creates `organizations`, `organization_members`, `github_installations`, `repositories`, `pull_requests`, `validation_runs`, `audit_events`, `webhook_deliveries`; FK indexes; `(organization_id, created_at)` indexes on activity tables; enum-like `check` constraints; `updated_at` triggers.
  - **Deviation from `DATABASE_SCHEMA.md`**: added `webhook_deliveries` (not in the original table list) because the doc requires "a unique idempotency key for webhook processing" but names no table for it. `organization_id` is nullable there only (operational/idempotency ledger, not user-facing product data).
- `0002_rls.sql`: enables RLS on every tenant table, adds a `security definer` `is_org_member()` helper, `SELECT`-only policies + grants for `authenticated`. No `authenticated`/`anon` write policies exist anywhere; all writes go through the server-side pool after `requireOrganizationAccess`.
- Rollback: both are additive (new tables/policies only); rollback is `drop table ... cascade` in reverse dependency order, not scripted, since no data exists yet to migrate down safely in a running environment.
- Generated types: `packages/db/src/database.types.ts` is hand-authored today (no live Supabase project was available to run `supabase gen types typescript` against in this environment). **Must** be regenerated and diffed against this file whenever a migration changes, per `SETUP.md` section 3.6.

## Tests run (actually executed in this environment)

- `npm run test:unit` — 79 tests, all passing (32 Milestone-1 + 17 original landing-page + 25 Design Foundation primitive tests + **5 new** `ValidationConsole` tests, see below):
  - `packages/github`: webhook signature verification (valid/invalid/tampered/missing/malformed/empty-secret), AES-256-GCM round-trip + tamper/wrong-key rejection, install-state token sign/verify/tamper/expiry.
  - `packages/db`: `requireOrganizationAccess` authorization matrix (member, non-member, wrong org, wrong role, right role, missing ids).
  - `apps/web` (landing page): `SiteHeader`/`MobileNav` (auth-aware CTA hrefs, in-page-anchor-only nav, dialog open/close), `Hero` (single `<h1>`, CTA target), `Faq` (accordion open/close), `EvidenceTabs` (click + arrow-key switching, `aria-selected`), `ValidationDemo` (interactive-preview label, reduced-motion manual stepping, auto-play/pause via fake timers — kept passing even though unused by `Hero` now), `useReducedMotion`. See `LANDING_PAGE_IMPLEMENTATION.md` for detail.
  - `apps/web` (Design Foundation primitives): `PrimaryButton`/`SecondaryButton` (href-vs-button polymorphism, focus-ring class, disabled state, onClick forwarding), `StatusBadge` (status-specific styling, decorative dot is `aria-hidden`), `Surface` (panel/elevated variants, optional border), `GlowBorder` (renders children, no animation classes), `MarketingContainer`/`MarketingSection` (shared width/spacing, `id` for anchors, `contained`/`tinted` toggles), `SectionHeader` (heading level, optional eyebrow/description, center alignment).
  - `apps/web` (Phase 2, historical): the now-superseded static `ValidationConsole` test file has been replaced by the Phase 3 version below.
  - `apps/web` (Phase 3, `validation-console.test.tsx`, 16 tests): the "Interactive product preview" label; readable static initial state before any timer fires; the Code change/Agent action selector's default state, content swap, and control hiding; auto-advance through all seven stages via `role="status"` (proven against real fake-timer ticks, since the stage/finding pane's Motion exit transition doesn't settle under fake timers — see Known issues #14); pause/resume; replay; switching to Agent-action mode pausing the run without losing progress; interval cleanup on unmount (`vi.getTimerCount()` before/after); and, under mocked reduced motion (synchronous, no Motion delay), manual Next-Stage-only advancement with Play/Pause disabled, live-region announcements, and the actual rendered content of every stage (deterministic evidence incl. the failed check, the tenant-isolation finding incl. requirement coverage, the drift warning, the verifier challenge-then-confirm sequence, and the full governance decision).
- `apps/web` (Phase 4, `problem-section.test.tsx`, 5 tests; `validation-pipeline.test.tsx`, 10 tests): headline text; all three/six card/stage titles present; each problem card's `Example:`/`Production impact:` labels and copy; each card's evidence-style visual cue (`StatusBadge` label + fact rows, e.g. "Requirement mismatch" / "Soft delete" / "Hard delete"); the `#problem` and `#how-it-works` anchor ids (the latter is the exact target the header nav's "How it works" link points at); all six pipeline stage bodies verified against the phase brief's six explanatory points verbatim (deterministic facts, structural contracts, runtime behavior "where available", AI "intent, logic, and architectural fit", the independent verifier challenging "unsupported conclusions", humans retaining control "when evidence is incomplete or risk is high"); and the tier-badge counts (`Deterministic evidence` &times;3, `AI judgment` &times;2, `Human control` &times;1) proving deterministic-vs-AI-vs-human is structurally, not just visually, distinguished. Full `components/marketing` suite (16 files, 68 tests) re-run as this phase's gate, not just the two new files.
- Manual verification actually executed, Phase 4: `rm -rf .next && npm run build` (clean rebuild); `next start` on an isolated port; screenshots via the same scratch `puppeteer-core` script pattern as Phase 3 (`cursor-ide-browser` MCP still unavailable this session — see Known issues #15) at 1440px (Problem section, Pipeline section incl. scrolled to the final "Human control" stage) and 390px (both sections); a 360px in-page DOM sweep of every descendant of `#problem`/`#how-it-works` confirmed zero elements exceed the viewport width (`bounding-rect.right > document.documentElement.clientWidth`), i.e. no repeat of the pre-existing `CodeDiff` overflow (Known issues #17) in the new sections; and one screenshot with `prefers-reduced-motion: reduce` emulated via real CDP `Emulation.setEmulatedMedia`, confirming the connecting rail renders fully drawn immediately (no partial/animating state) since its `initial`/`whileInView` motion props are omitted entirely in that mode. The first screenshot pass caught the native-list-marker bug (see Completed section above and Known issues #10's family); fixed and re-verified with a second clean build + screenshot pass.
- Manual verification actually executed, Phase 3: `rm -rf .next && npm run build` (clean rebuild); the in-IDE browser MCP tool was unavailable in this session (see Known issues #15), so verification instead used a scratch Puppeteer-core script (`puppeteer-core`, installed in `/tmp`, not part of the repo) driving the actual installed Chrome against a real `next start` server — captured a desktop screenshot (1440px, mid-run at the drift-check stage), a mobile screenshot (390px, same stage), a reduced-motion screenshot (static stage 1, `Play` button confirmed `.disabled === true` via `Runtime.evaluate`), plus supplementary screenshots of the governance-decision stage and the "Agent action — Planned" mode. Also re-confirmed the pre-existing 360px `CodeDiff` overflow (Known issues #17) is unchanged/unrelated to this phase, by walking the DOM for the first elements wider than the viewport and finding only `EvidenceTabs`' code-diff `<span>`s. Along the way, hit and resolved Known issues #16 (a stray `next start` process from this same session, discovered via `lsof`, corrupting `.next` again).
- Manual verification actually executed (not simulated), Phase 1: `rm -rf .next && npm run build` (clean rebuild, verified route sizes unchanged); grepped the emitted CSS bundle for new/fixed rules (`.bg-surface-panel`, `.text-h2`, `.focus-visible\:ring-focus-ring`, and confirmed `h1 { border-width: 0 }` while `.text-critical`'s parent kept `border-color: rgba(240,104,96,.4)`); loaded the rebuilt homepage in a real browser (`next start`) and took desktop + mobile-emulated screenshots before/after each fix; opened the mobile nav dialog and confirmed the close button no longer shows the native-button white-background artifact; loaded `/sign-in` (a Milestone-1 dashboard route, not in `.marketing-root`) to confirm zero visual regression from the new global CSS.
- Manual verification actually executed, Phase 2: `rm -rf .next && npm run build` (clean rebuild); started `next start` on an isolated port and, via real CDP `Emulation.setDeviceMetricsOverride` (not just screenshots, which can misrepresent viewport width under emulation in this sandbox — see Known issues #8/#12), measured `getBoundingClientRect()` on `header`/`main > div` and every descendant at **360, 390, 768, 1024, and 1440px**, confirming zero elements exceed the viewport width in the header/hero and that the responsive breakpoints switch correctly at each width; took screenshots at all five widths plus an opened-mobile-menu screenshot; exercised the mobile menu open/close via real click and confirmed via the DOM (`dialog.open`, `aria-expanded`) that it opens and closes correctly; curl-verified `/sign-in` (200) and `/dashboard` (307) are unaffected. Mid-verification, `curl`ing the page's own CSS asset URL returned `500`/`Cannot find module '.../pages/_error.js'` — traced to a **stray `next dev` process left running from earlier in this session on port 3000, sharing and concurrently mutating the same `apps/web/.next` directory** that the `next start` server (port 3100) was reading from. Killed all four stray Node listeners (ports 3000/3001/3002/plus the corrupted 3100 instance), rebuilt clean, and re-verified from scratch — see Known issues #13.
- `npm run test:integration` — 15 tests, all passing, against a real, disposable local PostgreSQL 18 cluster (own data dir, Unix-socket-only, destroyed after the run):
  - Tenant isolation: repositories/validation runs/audit events never cross `organization_id` boundaries; `requireOrganizationAccess` denies cross-org access.
  - Row Level Security: connecting as `authenticated` with a `request.jwt.claims` session variable returns only the caller's organization's rows; a user with no membership sees zero rows; `INSERT`/`UPDATE` are denied outright (`permission denied`) for `authenticated`, proving there is no write path outside the service layer.
  - Webhook idempotency: a repeated delivery id is a no-op, including under concurrent duplicate claims; a new PR revision creates a new `queued` run and marks the prior revision's run `superseded`; re-upserting the same revision does not duplicate the row.
- `npm run typecheck` — clean across all 4 packages.
- `npm run lint` — clean (`eslint .` in `apps/web`, `@typescript-eslint/no-explicit-any` enforced).
- `npm run build` — `next build` succeeds; all dynamic routes correctly marked (`force-dynamic` on the four routes that must never be statically evaluated: webhook ingress, install start/callback, auth callback).

Not executed (infrastructure not available in this environment): a live Supabase project, a real GitHub App, and therefore no live webhook delivery or install-callback round trip against real GitHub. See `SETUP.md` for how to provision both and verify the end-to-end flow manually.

## Known issues / unresolved risks

1. **No live Supabase or GitHub App was provisioned or exercised end-to-end.** Everything downstream of "does GitHub actually deliver a webhook / complete an install callback to this exact code" is unverified against the real services. The webhook signature verification, idempotency, and persistence logic *are* verified against real Postgres; the HTTP layer wiring them together is not integration-tested against a running Next.js server in this pass.
2. **`packages/db/src/database.types.ts` is hand-maintained**, not generated from a linked Supabase project. It must be kept in sync with migrations by hand until a real project exists and CI can regenerate it.
3. **`npm audit` reports vulnerabilities in the `next`/`postcss` dependency chain** even at the latest Next.js 14.2.x patch (14.2.35). Some advisories are only fixed in Next 15/16, which is a major-version migration (React 19, breaking changes) intentionally out of scope for this milestone. Tracked as a risk to revisit; recommend adding Dependabot/`npm audit` to CI.
4. **`installation.created` webhook races the install callback.** If GitHub's `installation` webhook arrives before our own `/api/github/install/callback` finishes linking the installation to an organization, the webhook handler correctly no-ops (there's nothing to update yet) rather than guessing an organization -- the callback, which always fires for a user-initiated install, is the source of truth. If a user installs the App directly from GitHub without going through our "Install GitHub App" button (e.g. from the GitHub Marketplace/App page), no organization link is ever created and the installation is invisible to Zod.ai until they connect it through the app.
5. **Repository disconnect / uninstall UI is not implemented.** The schema and repository functions support `status = 'disconnected'`/`'deleted'`, but no UI/action sets them yet in Milestone 1.
6. **No email deliverability configuration documented** beyond enabling Supabase's default magic-link email; production sending limits/custom SMTP are a pre-launch task, not addressed here.
7. **No rate limiting on the webhook or install-callback endpoints.** Signature verification prevents forged payloads, but there's no throttling against a compromised/misbehaving installation or replayed valid deliveries at volume.
8. **Landing page: Lighthouse/Core Web Vitals were not measured** (no headless Chrome + Lighthouse CLI in this environment) and multi-breakpoint (360–1440px) screenshots were not captured (the in-IDE browser tool's viewport emulation didn't resize the render surface here). See `LANDING_PAGE_IMPLEMENTATION.md` sections 5 and 10 for what was verified instead.
9. **`next dev`'s file watcher hits `EMFILE: too many open files` in this sandbox.** `next.config.mjs` now excludes `node_modules`/`.git`/`.next` from the dev watcher, which made 3/3 cold-start test runs succeed in this pass (previously non-deterministic, occasionally 404ing on `/`), but `EMFILE` log lines still appear, so this is a mitigation, not a guaranteed fix — see the `ulimit -n` guidance added to `SETUP.md`. This is a dev-server-only issue; `next build`/`next start` are unaffected in every test run.
10. **Root cause of "looks like unstyled browser HTML" (Design Foundation phase, proven via computed-style inspection, not assumed):** with `preflight: false`, Tailwind's `border`/`border-b`/`border-t` utilities set `border-width`/`border-color` but not `border-style`, which defaults to `none` on most elements — so **every border on the marketing page rendered invisibly** (cards, dividers, the header/footer separators, badges) regardless of dev vs. production. Fixed with a `@layer base` rule (`border-width: 0; border-style: solid; border-color: #22262d`) scoped to a new `.marketing-root` class, so `border-*` utilities render while colored-border utilities (e.g. `border-critical/40`) still correctly win via normal cascade order — verified both ways via computed style. Separately, several native `<button>` elements (missing preflight's `button { background-color: transparent }` reset) rendered with the browser's default light-gray button chrome despite `appearance-none`; fixed with an explicit `bg-transparent` on the two shell-scope instances (`SiteHeader`'s mobile-menu toggle, `MobileNav`'s close button) and on `SecondaryButton`. **Not yet fixed**: the tab buttons in `EvidenceTabs` likely have the same missing-background issue — flagged for whichever phase next touches that content. (The other component originally flagged here, `ValidationDemo`'s `Next stage`/`Pause`/`Play` buttons, no longer exists — its buttons were rewritten from scratch, with an explicit `bg-transparent`, as part of Phase 3's `validation-console.tsx`; see D-015.)
11. **The EMFILE dev-server flakiness (#9) and the border-style bug (#10) are unrelated root causes that can each independently produce a "this doesn't look right" report** — #9 only when the dev server's route resolution actually fails (intermittent, environment-dependent), #10 on every single load, every environment, dev or prod. #10 is the one directly proven to have been silently active in the previously-shipped landing page.
12. **Mobile-menu open/close has no entrance/exit animation** (Phase 2). `PHASE_02_NAVIGATION_AND_HERO.md` asks for an "accessible animated menu"; the existing native-`<dialog>`-based implementation is fully accessible (focus trap, Escape-to-close, body scroll lock, now with 44px touch targets) but shows/hides instantly. Animating a native `<dialog>`'s open/close reliably (it toggles `display: none` outside `@starting-style`/`transition-behavior: allow-discrete`, which have inconsistent support) adds real cross-browser risk to an accessibility-critical, already-tested component for a cosmetic gain; deferred rather than risk breaking focus/keyboard/scroll-lock behavior. Flagged for whichever phase next revisits mobile nav polish.
13. **A stray `next dev` process from earlier in this session was found still running (port 3000) and sharing/corrupting the same `apps/web/.next` build directory used by a fresh `next start`** during Phase 2 screenshot verification — this produced a real `500` on the page's own CSS asset and an apparently "unstyled" page that was not caused by any Phase 2 code change (confirmed by diffing the manifest's expected CSS filename against what was actually on disk, and by the server log's `Cannot find module '.../pages/_error.js'`). Resolved by killing all stray Node listeners and rebuilding from a clean `.next`. This is a process-hygiene risk for this sandboxed environment specifically (dev and start servers must not share a build directory while both are alive), not a product bug — noted here so a future session recognizes the symptom immediately instead of re-diagnosing it.
14. **`ValidationConsole`'s stage/finding pane (wrapped in `AnimatePresence`) doesn't settle under Vitest's fake timers.** Motion's own exit/enter transition is driven by `requestAnimationFrame`, not `setInterval`/`setTimeout`, so `vi.advanceTimersByTime` correctly advances the state machine but the animated pane's DOM doesn't update inside the same `act()`. Worked around (not avoided) by asserting the state machine itself via the `role="status"` live region (plain React state, updates synchronously) for the "with motion enabled" tests, and by asserting full stage content under mocked `prefers-reduced-motion: reduce` (where there's no `exit` animation at all, so the DOM updates synchronously). This is the same root cause as the original Phase 1 `ValidationDemo` timing issue (see the original Known issues list in `LANDING_PAGE_IMPLEMENTATION.md`), recurring here because the pattern (Motion + fake timers) is the same.
15. **The `cursor-ide-browser` MCP tool was unavailable in this session** (present in earlier Phase 1/2 sessions per this doc's history, but not connected this time). Screenshot/manual verification for Phase 3 was done instead with a scratch `puppeteer-core` script driving the real, already-installed Chrome — functionally equivalent (real browser, real CDP-backed automation) but external to this repo and not reusable by a future agent unless it's re-created. If browser MCP tooling isn't available for a future phase either, recreate the same pattern: `npm install puppeteer-core` in a scratch directory outside the repo, launch with `executablePath` pointing at the local Chrome binary.
16. **A second occurrence of the Known issues #13 process-hygiene bug happened again during this phase**, this time from the agent's own earlier `next start` instance being left running (via a detached `&`/`disown` shell backgrounding pattern that didn't get tracked/cleaned up) rather than a leftover `next dev`. Recovering required finding the actual PID via `lsof -i :PORT` and killing it directly, then a clean `rm -rf .next && next build`. Fix going forward: prefer the Shell tool's own native backgrounding (`block_until_ms: 0`), which is tracked and easy to check/kill via its shell id, over manual `&`/`disown`/`nohup`.
17. **Pre-existing 360px horizontal-overflow bug found (not introduced by, and out of scope for, Phase 2) in `CodeDiff`/`EvidenceTabs`.** Direct DOM measurement during Phase 2's breakpoint testing found `<span>` elements holding literal code-diff lines (e.g. `` `select * from pull_requests where organization_id = $1` ``) with no wrapping/truncation, up to ~477px wide at a 360px viewport — these have no spaces near the overflow point for the browser to wrap on. This inflates `document.documentElement.scrollWidth` for the whole page even though the header/hero (Phase 2's actual scope) measure at exactly the viewport width with zero overflowing descendants. Left untouched per the phase's "Navigation and Hero only" scope and Phase 1's "existing content sections stay as-is" decision (D-011); flagged for whichever phase next touches `EvidenceTabs`. Still unfixed as of Phase 4 (out of this phase's two-section scope too); re-confirmed still isolated to `EvidenceTabs` via the 360px DOM sweep described above.
18. **`hero.test.tsx` was stale against `hero.tsx`'s own already-shipped content**, discovered only because Phase 4 ran the full `components/marketing` suite (68 tests) as its own gate rather than a scoped subset. The H1 copy was correctly updated to the governance-positioning headline during the Phase 3 revision, but that specific edit — along with this test file — was apparently never committed (`git status` at the start of Phase 4 showed `hero.tsx` as modified-but-uncommitted, despite the user's confirmation that "Phase 3 is approved and committed"). Fixed the one stale assertion so the full suite is green; did not touch `hero.tsx` itself (no content change made by Phase 4) and did not investigate the commit-history gap further, since it predates this phase. Flagged here so the next session double-checks `git log`/`git status` before assuming "approved and committed" fully captured every file from the prior phase.

## Decision log

### D-001
Use a modular monorepo initially.

### D-002
Separate control plane and execution plane.

### D-003
Launch with TypeScript/Next.js/Supabase focus.

### D-004
Use deterministic checks before semantic AI review.

### D-005
Use independent model-family verification for material AI findings.

### D-006
Do not promise zero defects.

### D-007
Use npm workspaces instead of pnpm (pnpm was unavailable in the build environment; functionally equivalent for this milestone).

### D-008
Data access from the Next.js server uses a direct Postgres connection (`pg`) rather than PostgREST/`@supabase/supabase-js`, so the application-level `organization_id` scoping is explicit, type-safe, and directly integration-testable against a real Postgres instance without standing up the full Supabase platform. Supabase is still used for Auth. RLS remains enabled as defense-in-depth for any future direct client-side reads.

### D-009
`webhook_deliveries` was added beyond `DATABASE_SCHEMA.md`'s table list to satisfy its own idempotency requirement; see the migrations note above.

### D-010
Landing page: added Tailwind CSS (scoped to `apps/web`, `preflight` disabled) and `motion`, but did not install Animate UI's registry/CLI, shadcn's CLI, or Lenis — native `<dialog>`/`<details>` and a small hand-built tablist covered the interactive needs without expanding the dependency surface, and Lenis's risk/verification burden wasn't justified given it's explicitly optional. See `LANDING_PAGE_IMPLEMENTATION.md` section 2.

### D-011
`PHASE_01_DESIGN_FOUNDATION.md` assumes a green-field page ("implement only... empty main sections with spacing guides... do not build full content sections yet"), but a full, tested landing page already existed from the prior session. Asked the user directly rather than guessing: confirmed scope is "keep all existing section content untouched; this phase only adds tokens/primitives and rebuilds the shell (header, footer, announcement strip, page background)". `Hero` and every later section were left byte-for-byte content-unchanged (two of their buttons have the same background bug fixed elsewhere in this phase — see Known issues #10 — intentionally left for a later phase that actually touches that content).

### D-012
Rather than re-enabling Tailwind's global `preflight` (which would have risked regressing the Milestone-1 dashboard's hand-written CSS, the whole reason it was disabled — see D-010's context), the border-width/style/color reset it would have provided was reimplemented as a single `@layer base` rule scoped to a new `.marketing-root` class. `@layer base` (not a plain trailing rule) was required so the reset sits *before* the utilities layer in cascade order — a plain rule placed later in the source file was tried first and, at equal selector specificity, incorrectly overrode later utility classes' border colors (e.g. `border-critical/40`) because of source order, which was caught by re-checking computed styles after the change rather than assuming the fix worked.

### D-013
`PHASE_02_NAVIGATION_AND_HERO.md`'s "Hero visual" spec (static console showing PR metadata + all six stages + active stage + one finding + merge recommendation + evidence location, all visible at once) describes a different UI than the existing `ValidationDemo` (auto-cycling through stages one at a time, gating the finding/recommendation behind stage progression) — and the brief explicitly says not to build the Phase 3 animated state machine yet. Rather than mutating `ValidationDemo` in place (which would have meant rewriting logic Phase 3 is explicitly slated to need, and risked the already-passing `validation-demo.test.tsx` suite), added a new, separate `ValidationConsole` component for `Hero` and left `ValidationDemo` completely untouched and simply unused. Phase 3 can either resume using it as-is or extend it.

### D-014
`FindingCard`'s 360px overflow bug (Known issues #10 already flagged the *button-background* variant of this "missing preflight reset" family of bugs; this is a distinct wrapping/truncation bug) was fixed even though `FindingCard` is also used by `EvidenceTabs`, a later section nominally out of Phase 2's "Navigation and Hero" scope. Treated as in-scope because (a) it's a real, provable bug directly inside the Phase 2 hero visual's acceptance criterion ("No overflow at 360px"), (b) the fix is purely additive CSS (`min-w-0 flex-1 truncate`) with no content or behavior change to `EvidenceTabs` itself, and (c) duplicating `FindingCard` just to avoid touching a shared file would have been worse for maintainability than fixing the shared bug once.

### D-015
Deleted `validation-demo.tsx`/`validation-demo.test.tsx` (left unused since Phase 2, per D-013) instead of resurrecting them for Phase 3. They implemented an infinite `% STAGES.length` auto-replay loop with no auto-stop and only 3 controls conditioned on reduced motion — incompatible with this phase's explicit "auto-stop after the final stage" and "add Play/Pause, Replay, and Next Stage controls" (all three, unconditionally) requirements. Rewriting `validation-console.tsx` directly (the component `Hero` actually renders) and removing the now-fully-superseded dead file was simpler and lower-risk than trying to reconcile two divergent designs.

### D-016
The "Validate: Code change / Agent action — Planned" selector is a plain `useState`, deliberately kept out of the `useReducer` state machine that drives stage timing. It's an orthogonal, non-timed view toggle (which console body to show), not a state the timed run needs to know about — folding it into the reducer would have coupled an unrelated concern into "the one deterministic state machine" the brief explicitly asked for. Switching to Agent-action mode does dispatch `PAUSE` into that reducer, which is the one deliberate interaction point between the two.

### D-017
`ValidationPipeline`'s six stages were laid out as a single vertical timeline at every breakpoint, rather than the previous responsive card grid (`sm:grid-cols-2 lg:grid-cols-3`) with a per-viewport connection trace. A horizontal trace across a grid that itself reflows from 1 to 2 to 3 columns would need three different trace geometries (or would need to hide/fake the trace below a breakpoint), which conflicts with the phase's "mobile pipeline remains clear" acceptance criterion and "restrained" instruction more than a layout change does. A single vertical rail behind numbered markers reads identically and correctly at 360px through 1440px with one implementation, needs no responsive branching in the trace itself, and reuses the same `Reveal`/`whileInView` motion pattern already used elsewhere on the page.

## Update instructions

Every Cursor task must update:
- completed work;
- files/modules added;
- migrations;
- tests run;
- known issues;
- next recommended vertical slice.

## Next recommended vertical slice

The landing page (and these redesign phases within it) is a self-contained detour and doesn't change the underlying product recommendation below. Per `PHASE_04_PROBLEM_AND_PIPELINE.md`'s stop condition and the user's explicit instruction, **Phase 5 of the landing-page redesign has not been started** and should not begin without a separate go-ahead. If/when it does, it should: finish migrating `EvidenceTabs`'s tab buttons off the missing-background bug noted in Known issues #10 (still not done — `ValidationDemo`, the other component that bug mentioned, no longer exists after D-015); and fix the pre-existing `CodeDiff`/`EvidenceTabs` 360px overflow bug noted in Known issues #17, since `EvidenceTabs`/`FeatureBento` are the most likely next sections to be migrated onto the Phase 1 primitives (per this phase's precedent of adopting them section-by-section) and to get touched for content work.

Repository profiling (Milestone 2 groundwork): on repository connection, enqueue a job (in-process for now, no queue infra yet) that clones the default branch via a short-lived installation token, detects language/framework/package manager/test runner/lint/build commands and `AGENTS.md`-equivalent instruction files, and persists a `repository_profiles` row. This is the first slice that requires *reading* repository content (still not executing it) and sets up the inputs the validation engine will need later, while staying inside "no code execution" boundaries.

Separately, Milestone 2 proper (isolated sandbox worker) is still pending your input on sandbox tech/Docker access, job-queue choice, and placeholder-command scope — see the questions raised earlier in this session.
