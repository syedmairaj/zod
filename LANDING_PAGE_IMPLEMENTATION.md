# Landing Page Implementation

This documents the premium public marketing homepage that replaced the temporary
Milestone 1 placeholder screen. It is a **landing-page milestone**, not Milestone 2
(sandbox execution) — no execution, queueing, or validator work was touched.

## 1. Architecture

- Route: `app/(marketing)/page.tsx` + `app/(marketing)/layout.tsx`. The `(marketing)`
  route group changes no URLs — `/` still resolves to this page — and keeps marketing
  layout concerns isolated from `app/layout.tsx` (which stays a minimal, shared root
  layout used by every route, including the dashboard/auth routes).
- The page itself (`MarketingPage`) is an `async` Server Component. It calls the
  existing `getCurrentUser()` helper once, server-side, to decide the CTA target:
  - Signed out → `Connect GitHub` → `/sign-in`
  - Signed in → `Go to dashboard` → `/dashboard`
- Every section is a separate component under `components/marketing/`. Static
  sections (problem statement, pipeline, bento grid, security, FAQ, footer) are
  Server Components and ship no client JS. Only the interactive pieces are client
  islands: `SiteHeader`/`MobileNav` (scroll state + dialog), `ValidationDemo` +
  `ValidationStageList` (animated state machine), `EvidenceTabs` (tablist), and
  `Reveal` (viewport-triggered fade/lift, used across many sections).
- `lib/motion/` holds shared motion tokens (`tokens.ts`), a `prefers-reduced-motion`
  hook (`use-reduced-motion.ts`), and the `Reveal` wrapper so every animated
  component uses the same durations/easings instead of inventing new ones.

## 2. Dependency decisions

| Library | Decision | Why |
|---|---|---|
| **Tailwind CSS** (`tailwindcss`, `postcss`, `autoprefixer`) | Added, scoped to `apps/web` | Needed for the utility-first design system the spec calls for (bento grids, tabs, responsive layout). `corePlugins.preflight` is **disabled** in `tailwind.config.ts` so the existing hand-styled dashboard/org pages (in `app/globals.css`) are not visually affected — marketing components use explicit reset utilities (`appearance-none`, etc.) instead of relying on preflight. |
| **`motion`** (the current Framer Motion package) | Added | Used only inside client islands for the hero reveal, validation-demo stage transitions, and the shared-layout tab indicator. Not loaded by any server-rendered section. |
| **Animate UI / shadcn CLI** | **Not installed** | The only interactive primitives needed were a mobile menu, a tablist, and an accordion. Native HTML covers two of these for free (see below), so pulling in a registry/CLI and its component set for one remaining custom piece (the tablist) wasn't justified. |
| **Inspira UI** | **Not installed** (Vue/Nuxt-only, per instructions) | Used only as conceptual inspiration for the validation-trace motif; everything was reimplemented natively in React/Tailwind/Motion. |
| **Lenis** | **Not adopted** | It's explicitly optional, and the list of things that all have to keep working (reduced-motion fallback, anchors, back/forward, keyboard scroll keys, modal scroll-locking, HMR teardown, cross-browser behavior) is long for a reliability-branded product. Native scrolling is zero-risk. |
| **Testing Library + Vitest (jsdom)** | Added to `apps/web` (didn't exist there before) | `apps/web` had no component-level tests prior to this change; the spec requires testing the new interactive components. |

### Native-HTML component choices

- **Mobile menu** → `<dialog>` element (`components/marketing/mobile-nav.tsx`).
  Modern browsers give `showModal()` a built-in focus trap and Escape-to-close for
  free; the component only manages the `open` boolean and body-scroll locking.
- **FAQ accordion** → `<details>`/`<summary>` (`components/marketing/faq.tsx`).
  Keyboard operability and semantics come from the browser, no JS needed.
- **Evidence tabs** → hand-built `role="tablist"`/`role="tab"` pattern with
  arrow-key navigation and a `motion` shared-layout indicator
  (`components/marketing/evidence-tabs.tsx`) — the one place a small custom
  implementation was justified over pulling in Radix/shadcn tabs.

No third-party component source code was copied, so no `THIRD_PARTY_NOTICES.md`
was needed.

## 3. Content honesty / no-dead-link decisions

The spec itself forbids invented destinations and dead links, so two deviations
from its literal copy were made:

- The desktop nav's **"Docs"** link was omitted — there is no docs site yet.
- The final CTA's secondary link and the footer only point at real destinations:
  in-page anchors (`#security`, `#product`) and `/sign-in`. `Status`/`Privacy`/
  `Terms`/a public GitHub repo are omitted from the footer for the same reason.
- Feature-status badges (`Available` / `Beta` / `Planned`) reflect what's actually
  implemented per `IMPLEMENTATION_STATUS.md` — e.g. **MCP firewall** is marked
  `Planned`, **Agent Guard** is marked `Beta`.
- No fake logos, testimonials, star ratings, or customer counts were added
  anywhere, per instructions.

## 4. Accessibility

- Exactly one `<h1>` on the page (the hero headline) — verified by a component test.
- The mobile menu, FAQ, and evidence tabs are keyboard-operable natively or via
  explicit `role`/`aria-*` wiring and arrow-key handling.
- `ValidationDemo` (the auto-playing hero preview) has:
  - a visually-hidden `role="status" aria-live="polite"` region announcing stage
    changes for screen readers, decoupled from the visual animation;
  - a **Pause/Play** control for users who don't prefer reduced motion;
  - for `prefers-reduced-motion: reduce`, auto-play is disabled entirely and
    replaced with a manual **"Next stage"** button, so reduced-motion users can
    still see the full demo instead of it freezing on stage one forever.
- All animated components fall back to non-animated instant transitions under
  `prefers-reduced-motion: reduce` (`lib/motion/use-reduced-motion.ts`,
  `lib/motion/reveal.tsx`).
- It's explicitly labeled **"Interactive product preview"**, never presented as
  live customer data.

## 5. Performance

- Static marketing sections (problem statement, pipeline, bento grid, security,
  status, pricing, FAQ, footer) are Server Components — zero client JS for them.
- `motion` and all interactivity are isolated to named client islands, not the
  whole page.
- Icon and Open Graph image are generated at request time via `next/og`
  (`app/icon.tsx`, `app/opengraph-image.tsx`) — no binary placeholder assets
  were committed.
- **Lighthouse/Core Web Vitals were not run** in this environment (no headless
  Chrome + Lighthouse CLI available in the sandbox). This is reported honestly
  rather than fabricating scores, per instructions. The production route size
  was measured directly from the real `next build` output instead (see below).

## 6. SEO / metadata

- `app/layout.tsx`: `metadataBase`, title template, description, canonical,
  Open Graph, Twitter card, robots — all driven by `NEXT_PUBLIC_APP_URL`.
- `app/robots.ts` and `app/sitemap.ts` (Next's file-convention route handlers).
- `app/icon.tsx` and `app/opengraph-image.tsx` generate real (non-placeholder)
  images via `ImageResponse`.

## 7. Route/architecture safety

Not touched: `/sign-in`, `/auth/callback`, `/onboarding`, `/post-auth`,
`/dashboard`, `/org/[organizationId]/**`, `/api/github/**`, `middleware.ts`,
`lib/auth.ts`, `lib/db.ts`, `lib/github.ts`, `lib/env.server.ts`, and every
package under `packages/`. The only pre-existing files modified were
`app/layout.tsx` (metadata only) and `app/globals.css` (Tailwind directives +
CSS variable additions, appended — no existing rules removed/changed).
`app/page.tsx` was moved (not edited) into `app/(marketing)/page.tsx`.

## 8. Files added/changed

```
apps/web/
  tailwind.config.ts, postcss.config.js         (new)
  vitest.config.ts, vitest.setup.ts             (new — component test harness)
  package.json                                  (added tailwindcss/postcss/autoprefixer/motion,
                                                  testing-library/jsdom/vitest devDeps, test:unit script)
  app/layout.tsx                                (metadata expanded)
  app/globals.css                               (Tailwind directives + design tokens appended)
  app/page.tsx                                  (deleted — moved)
  app/(marketing)/layout.tsx                    (new)
  app/(marketing)/page.tsx                      (new — assembles all sections)
  app/icon.tsx, app/opengraph-image.tsx         (new — next/og generated assets)
  app/robots.ts, app/sitemap.ts                 (new)
  lib/cn.ts                                     (new — tiny classnames helper)
  lib/motion/tokens.ts                          (new)
  lib/motion/use-reduced-motion.ts (+.test.ts)  (new)
  lib/motion/reveal.tsx                         (new)
  components/marketing/
    announcement-strip.tsx
    site-header.tsx (+.test.tsx)
    mobile-nav.tsx
    hero.tsx (+.test.tsx)
    validation-demo.tsx (+.test.tsx)
    validation-stage-list.tsx
    finding-card.tsx
    code-diff.tsx
    problem-section.tsx
    validation-pipeline.tsx
    feature-bento.tsx
    evidence-tabs.tsx (+.test.tsx)
    workflow-integrations.tsx
    security-section.tsx
    status-early-access.tsx
    pricing-preview.tsx
    faq.tsx (+.test.tsx)
    final-cta.tsx
    site-footer.tsx
```

## 9. Commands run and results (this environment)

- `npm install` — succeeded. `npm audit` shows pre-existing Next.js 14.2.x /
  `postcss` advisories (already tracked as a known risk in
  `IMPLEMENTATION_STATUS.md`, requires a Next 15/16 major bump, out of scope
  here) plus dev-only `vitest`/`vite`/`esbuild` advisories that pre-date this
  change (vitest was already a monorepo dependency from Milestone 1's
  integration tests) — none are new production-dependency regressions from
  this task.
- `npm run typecheck` (root, all 4 workspaces) — **clean**.
- `npm run lint` (root, all workspaces) — **clean**.
- `npm run test:unit` (root, all workspaces) — **all passing**:
  - `apps/web`: **17/17** new tests across 6 files (`SiteHeader`, `MobileNav`
    integration via `SiteHeader`, `Hero`, `Faq`, `EvidenceTabs`,
    `ValidationDemo`, `useReducedMotion`).
  - `packages/db`, `packages/github`, `packages/shared-types`: unchanged,
    **32/32** still passing (untouched by this work).
- `npm run build` (`apps/web`) — **succeeds**. `/` builds as a dynamic
  (`ƒ`) route at **42.2 kB route / 138 kB First Load JS**, comparable to the
  other authenticated routes' shared JS budget.
- Manual browser verification (via an in-IDE Chromium tab against the real
  `next build` output on a local port, using CDP): confirmed the homepage
  renders with exactly one `<h1>`, the validation demo auto-plays and cycles
  through all 6 stages then loops, the evidence-tabs switch and update
  `aria-selected`, the FAQ accordion opens/closes (`<details open>` verified
  directly), and the mobile nav `<dialog>` opens with `showModal()`,
  correctly sets `body { overflow: hidden }`, and closes via `close()`.
- **Not run**: `next dev` in this sandbox hit `EMFILE: too many open files`
  from its file watcher (a sandbox/environment file-descriptor limitation
  unrelated to this code — confirmed because `next build` recognizes and
  compiles the same route correctly). Verification instead used
  `next build && next start`, which is arguably a more representative check
  anyway. Multi-breakpoint (360/390/768/1024/1440) visual screenshots were not
  reliably obtainable — the embedded browser tool's device-viewport emulation
  didn't resize the actual render surface in this environment — so responsive
  behavior was instead confirmed by (a) consistent use of Tailwind's standard
  `sm:`/`md:`/`lg:` breakpoints throughout every component, and (b)
  programmatically driving the mobile-only `<dialog>` menu and confirming it
  opens/closes/locks scroll correctly regardless of the CSS breakpoint that
  normally reveals its trigger button. Lighthouse was not run (not installed
  in this environment) — no performance/accessibility/SEO scores are claimed.

## 10. Known limitations / unresolved risks

1. Lighthouse/Core Web Vitals scores are not measured — only static-analysis-level
   performance practices (server-rendered static content, client islands,
   generated-not-committed images, no unused UI libraries) are verified.
2. Multi-breakpoint screenshots (360–1440px) were not captured due to the
   in-IDE browser tool's viewport emulation limitation in this environment;
   responsive behavior relies on Tailwind's standard breakpoint system and was
   not independently screenshot-verified at each named width.
3. `next dev`'s file watcher hits `EMFILE` in this sandbox; this is an
   environment limitation (raise the shell's `ulimit -n`, or note that
   `next build && next start` is unaffected), not a defect in the code.
4. The hero's sample findings (tenant-isolation gap, schema-drift, webhook
   ordering) are illustrative, clearly labeled as an "Interactive product
   preview," and mirror real classes of issues the architecture docs describe
   — they are not fabricated as live/historical customer data.
