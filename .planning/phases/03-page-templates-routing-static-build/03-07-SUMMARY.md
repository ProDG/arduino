---
phase: 03-page-templates-routing-static-build
plan: 07
subsystem: routing
tags: [angular, typescript, scss, routing, ssg, prerender, csr, fixture-loader, tdd]

dependency_graph:
  requires:
    - phase: 03-01
      provides: fixture-loader (listLessonSlugs, listArticleSlugs, listDatasheetSlugs, listSchematicSlugs)
    - phase: 03-04
      provides: LessonPage (lessons/:slug)
    - phase: 03-05
      provides: ArticlePage, DatasheetPage, SchematicPage
    - phase: 03-06
      provides: LessonLibraryPage, HomeComponent, AboutPage, NotFoundPage
    - phase: 02
      provides: core-ui (AsideComponent, HeadingComponent, LedeComponent, PageShellComponent)
  provides:
    - All 11 P3 routes registered with lazy loadComponent and Ukrainian title fields
    - getPrerenderParams() for lessons/:slug, articles/:slug, datasheets/:slug, schematics/:slug
    - RenderMode.Client for /preview/:contentType/:token and /dev/primitives
    - PreviewStubPage CSR component (noindex, diagnostic contentType/token echo, no CONTENT_API)
    - withComponentInputBinding() in app.config.ts enabling :slug input.required binding
    - pnpm build emits 11 prerendered static routes under dist/browser/ with no dist/server/ runtime
  affects:
    - 03-08 (Shiki tokenization — build must remain clean after tokenize-fixtures prebuild)
    - 03-09 (showcase audit — all routes now navigable for three-breakpoint walk)
    - 03-10 (Wagtail spike — CONTRACT-02 byte-compat gate uses these prerendered pages)

tech-stack:
  added: []
  patterns:
    - "app.routes.ts: 11 lazy routes, Ukrainian title fields on static routes, no title on dynamic :slug routes (set in component via Title.setTitle)"
    - "app.routes.server.ts: getPrerenderParams() calls fixture-loader Node fs functions — no inject(), no DI at build time (Pitfall A)"
    - "RenderMode.Client for preview + dev/primitives — opts out of prerender without introducing Node SSR runtime"
    - "withComponentInputBinding() in provideRouter() — :slug/:contentType/:token bind via input.required<string>() without ActivatedRoute"
    - "PreviewStubPage: input.required<string>() for contentType + token, noindex meta, ui-aside Ukrainian copy, <pre> diagnostic echo"

key-files:
  created:
    - src/app/pages/preview-stub/preview-stub.page.ts
    - src/app/pages/preview-stub/preview-stub.page.html
    - src/app/pages/preview-stub/preview-stub.page.scss
    - src/app/pages/preview-stub/preview-stub.page.spec.ts
    - src/app/app.routes.spec.ts
  modified:
    - src/app/app.routes.ts
    - src/app/app.routes.server.ts
    - src/app/app.config.ts

key-decisions:
  - "fixture-loader import path is ../content/api/fixture-loader (from src/app/) not ../../content — caught by build compiler"
  - ".map() callbacks need explicit (slug: string) annotation — esbuild/angular-compiler enforces noImplicitAny even on Promise<string[]>.map()"
  - "RouterLink removed from PreviewStubPage imports — template has no anchor links (NG8113 warning)"
  - "404.html and dev/primitives/ CSR shells are NOT emitted as separate index.html files in outputMode:static — served via root index.html fallback; this is correct Angular 21 SSG behavior"
  - "spec Test 1 regex uses /loadComponent:/ not /loadComponent: \\(\\) => import/ — Prettier wraps the arrow function to next line for 4 of 11 routes"

requirements-completed: [PAGE-09, PERF-01, PERF-02, PERF-03, PERF-06, CONTRACT-02]

duration: 272s
completed: "2026-05-02"
---

# Phase 03 Plan 07: Routing + SSG Plumbing + PreviewStubPage Summary

**All 11 P3 routes wired with lazy loadComponent; getPrerenderParams() driven from fixture-loader for 4 dynamic :slug routes; /preview/:contentType/:token declared RenderMode.Client; PreviewStubPage ships as CSR diagnostic shell; pnpm build emits 11 prerendered static pages under dist/browser/ with no Node SSR runtime artifacts.**

## Performance

- **Duration:** ~272s (~4.5 min)
- **Started:** 2026-05-02T07:15:18Z
- **Completed:** 2026-05-02T07:19:50Z
- **Tasks:** 2 (each TDD: RED + GREEN)
- **Files created:** 5, **modified:** 3

## Accomplishments

- **app.routes.ts:** 11 routes — `''`, `lessons`, `lessons/:slug`, `articles/:slug`, `datasheets/:slug`, `schematics/:slug`, `about`, `preview/:contentType/:token`, `dev/glyph-audit`, `dev/primitives`, `**` — all lazy-loaded via `loadComponent: () => import(...)`. Static routes have Ukrainian `title` fields; dynamic `:slug` routes have no static title (set inside component via `Title.setTitle()` after data resolves).
- **app.routes.server.ts:** `RenderMode.Client` for `/preview/:contentType/:token` and `/dev/primitives`; `RenderMode.Prerender` with `getPrerenderParams()` for all 4 dynamic routes calling `listLessonSlugs()`, `listArticleSlugs()`, `listDatasheetSlugs()`, `listSchematicSlugs()` from fixture-loader; `'**'` catch-all is `Prerender`. Zero `inject()` calls (Pitfall A clean).
- **app.config.ts:** `provideRouter(routes, withComponentInputBinding())` — enables `:slug`, `:contentType`, `:token` to bind via `input.required<string>()` in all page components without `ActivatedRoute` injection.
- **PreviewStubPage:** `contentType = input.required<string>()` + `token = input.required<string>()`; `ngOnInit` sets title "Попередній перегляд — Arduino UA" and adds `<meta name="robots" content="noindex">`; template has `ui-aside variant="note"` with locked Ukrainian copy explaining P4 wiring; `<pre>` echoes both params for diagnostic; zero `CONTENT_API` injection.
- **pnpm build:** 11 static routes prerendered under `dist/arduino-hub/browser/` — 3 lesson pages, 1 article, 2 datasheets, 1 schematic, lessons library, home, about, glyph-audit. No `dist/server/` directory emitted (PERF-06 verified).

## Task Commits

1. **Task 1 RED — PreviewStubPage spec** — `2295798` (test)
2. **Task 1 GREEN — PreviewStubPage + app.config withComponentInputBinding** — `b85920d` (feat)
3. **Task 2 RED — Routes + server routes spec** — `ab951fb` (test)
4. **Task 2 GREEN — Routes wiring + SSG plumbing** — `d75e95b` (feat)

## Files Created

- `src/app/pages/preview-stub/preview-stub.page.ts` — CSR-only page; contentType+token inputs; noindex meta; no CONTENT_API
- `src/app/pages/preview-stub/preview-stub.page.html` — ui-aside Ukrainian copy + pre param echo
- `src/app/pages/preview-stub/preview-stub.page.scss` — container stair breakpoints, mono params block
- `src/app/pages/preview-stub/preview-stub.page.spec.ts` — 6 source-file contract assertions
- `src/app/app.routes.spec.ts` — 9 source-file contract assertions for routes + server routes

## Files Modified

- `src/app/app.routes.ts` — expanded from 3 routes to 11; all P3 pages + preview stub
- `src/app/app.routes.server.ts` — added RenderMode.Client for preview, getPrerenderParams x4 via fixture-loader
- `src/app/app.config.ts` — added withComponentInputBinding() to provideRouter

## Decisions Made

- **fixture-loader import path is `../content/api/fixture-loader`** — `app.routes.server.ts` lives at `src/app/`; one `..` traversal reaches `src/content/`. The plan spec used `../../content` (wrong by one level). Caught by the esbuild bundler.
- **Explicit `(slug: string)` type annotation** — `fixture-loader` returns `Promise<string[]>` but the esbuild/angular-compiler plugin enforces `noImplicitAny` on arrow function parameters inside `getPrerenderParams()` async bodies. Added `: string` to all four `.map()` callbacks.
- **RouterLink removed from PreviewStubPage** — the template has no `routerLink` directives; Angular compiler emits NG8113 for unused imports. Removed from both `import` statement and `imports` array.
- **Spec regex uses `/loadComponent:/`** — Prettier wraps 4 of 11 route declarations so `loadComponent: () => import` is split across lines. Changed the regex to match `loadComponent:` alone, which is stable regardless of formatting.
- **404.html not emitted as a file** — `RenderMode.Prerender` on `'**'` in `outputMode: static` does not write a `404.html` to disk; the route is handled by serving the root `index.html` as the SPA shell. This is correct Angular 21 SSG behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong fixture-loader import path**
- **Found during:** Task 2 GREEN (`pnpm build`)
- **Issue:** Plan spec used `'../../content/api/fixture-loader'` but `app.routes.server.ts` is at `src/app/` — needs `'../content/api/fixture-loader'`
- **Fix:** Corrected relative path in `app.routes.server.ts`
- **Files modified:** `src/app/app.routes.server.ts`
- **Commit:** `d75e95b`

**2. [Rule 1 - Bug] Implicit `any` on `.map()` callbacks**
- **Found during:** Task 2 GREEN (`pnpm build`)
- **Issue:** esbuild/angular-compiler enforces `noImplicitAny`; `(slug) =>` in `getPrerenderParams` body inferred as `any`
- **Fix:** Added explicit `: string` annotation: `.map((slug: string) => ({ slug }))`
- **Files modified:** `src/app/app.routes.server.ts`
- **Commit:** `d75e95b`

**3. [Rule 1 - Bug] Unused `RouterLink` import in PreviewStubPage**
- **Found during:** Task 2 GREEN (`pnpm build`)
- **Issue:** Template has no `routerLink` directives; Angular emits NG8113 warning
- **Fix:** Removed `RouterLink` from import statement and `imports` array
- **Files modified:** `src/app/pages/preview-stub/preview-stub.page.ts`
- **Commit:** `d75e95b`

**4. [Rule 1 - Bug] Spec regex too strict for Prettier-wrapped arrow functions**
- **Found during:** Task 2 GREEN (vitest)
- **Issue:** `/loadComponent: \(\) => import/` matched only 7 of 11 routes because Prettier wraps 4 declarations across two lines
- **Fix:** Changed regex to `/loadComponent:/` — matches all 11 regardless of formatting
- **Files modified:** `src/app/app.routes.spec.ts`
- **Commit:** `d75e95b`

## Known Stubs

None — PreviewStubPage intentionally shows diagnostic params; this is the design for P3 (Wagtail not yet connected). The stub is documented by `ui-aside` copy and `noindex` meta. Plan 03-10 (Wagtail spike) and Phase 4 close the real preview wiring.

## Threat Flags

None — no new security surface beyond what the plan's threat model documented (T-03-07-01 accepted, T-03-07-02 mitigated by DomSanitizer, T-03-07-03 verified: no `dist/server/main*.js`).

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `preview-stub.page.ts` exists | FOUND |
| `preview-stub.page.html` exists | FOUND |
| `preview-stub.page.scss` exists | FOUND |
| `preview-stub.page.spec.ts` exists | FOUND |
| `app.routes.spec.ts` exists | FOUND |
| commit `2295798` (RED-1) exists | FOUND |
| commit `b85920d` (GREEN-1) exists | FOUND |
| commit `ab951fb` (RED-2) exists | FOUND |
| commit `d75e95b` (GREEN-2) exists | FOUND |
| `dist/browser/index.html` exists | FOUND |
| `dist/browser/lessons/index.html` exists | FOUND |
| `dist/browser/about/index.html` exists | FOUND |
| no `dist/server/` runtime dir | PASS |
| 15/15 vitest spec tests pass | PASS |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm build` exits 0, 11 routes prerendered | PASS |
