---
phase: 03-page-templates-routing-static-build
verified: 2026-05-02T09:26:46Z
status: gaps_found
score: 12/17 must-haves verified
overrides_applied: 0
gaps:
  - truth: "A reader can visit /lessons, /lessons/:slug, /articles/:slug, /datasheets/:slug, /schematics/:slug in the prerendered build and see editorial-quality typography with real content"
    status: failed
    reason: "All dynamic-slug routes (/lessons/:slug, /articles/:slug, /datasheets/:slug, /schematics/:slug) prerender as empty loading shells. Angular prerender does not await async ngOnInit before snapshotting; the FixtureContentApi data-load never completes during SSG. The prerendered HTML contains lesson-page--loading / article-page--loading CSS class and empty article elements."
    artifacts:
      - path: "src/app/pages/lesson/lesson.page.ts"
        issue: "async ngOnInit fetches data; Angular SSG does not await it — renders empty shell"
      - path: "src/app/pages/article/article.page.ts"
        issue: "same pattern — empty shell in prerender"
      - path: "src/app/pages/datasheet/datasheet.page.ts"
        issue: "same pattern — empty shell in prerender"
      - path: "src/app/pages/schematic/schematic.page.ts"
        issue: "same pattern — empty shell in prerender"
    missing:
      - "Migrate data loading from async ngOnInit to Angular ResolveFn (router resolver) — resolvers are awaited by Angular prerender before snapshotting"
      - "After resolver migration, verify dist/browser/lessons/pershyi-blymayuchyi-svitlodiod/index.html contains lesson title and body content"

  - truth: "The lesson library page (/lessons) prerender contains the typographic ToC with real lesson rows"
    status: failed
    reason: "LessonLibraryPage uses async ngOnInit to call api.listLessons(). Prerendered dist/browser/lessons/index.html shows the empty state ('Уроки готуються') with no lesson rows. Same async ngOnInit SSG bug."
    artifacts:
      - path: "src/app/pages/lesson-library/lesson-library.page.ts"
        issue: "async ngOnInit; sortedLessons() computed signal is empty at prerender snapshot"
      - path: "dist/arduino-hub/browser/lessons/index.html"
        issue: "Contains empty state aside 'Уроки готуються' instead of lesson ToC rows"
    missing:
      - "Move listLessons() call to a ResolveFn; wire to the /lessons route in app.routes.server.ts"

  - truth: "The home page / prerender shows real recent lessons/articles"
    status: failed
    reason: "HomeComponent uses async ngOnInit with Promise.all([listLessons, listArticles]). Prerendered index.html shows empty <ol> (<!--->) for both the 'Останні уроки' and 'Статті' sections. Same root cause."
    artifacts:
      - path: "src/app/pages/home/home.component.ts"
        issue: "async ngOnInit — lessons/articles arrays are empty at prerender snapshot"
      - path: "dist/arduino-hub/browser/index.html"
        issue: "home-page__toc lists are empty (<!---->) in the prerendered output"
    missing:
      - "Move home page data loading to a ResolveFn or use signal-based deferred loading pattern that Angular SSG respects"

  - truth: "All public page headings (h1) are non-empty in the prerendered HTML"
    status: failed
    reason: "The ui-heading component uses ng-content projection. Text-node children of <ui-heading [level]='1'>Текст</ui-heading> do not materialize into the h1/h2/h3 during SSR/prerender, resulting in empty <h1 id='undefined'></h1> in every prerendered page that uses ui-heading. Affected: /lessons (h1 'Уроки'), /about (h1 'Про проєкт'), /home (h1), plus every article/datasheet/schematic/lesson title that flows through ui-heading in BlockRenderer."
    artifacts:
      - path: "projects/core-ui/src/lib/heading/heading.component.ts"
        issue: "ng-content projection of text nodes does not survive Angular SSG prerender — content is empty in built HTML"
      - path: "dist/arduino-hub/browser/lessons/index.html"
        issue: "<h1 id='undefined'></h1> — empty; should read 'Уроки'"
      - path: "dist/arduino-hub/browser/about/index.html"
        issue: "<h1 id='undefined'></h1> — empty; should read 'Про проєкт'"
    missing:
      - "Investigate why ng-content text-node projection produces empty output in Angular 21 SSG and fix the HeadingComponent or switch all callsites to use a string input (e.g. [text]='...' input.required<string>()) instead of ng-content"
      - "After fix, verify all prerendered h1/h2/h3 elements are non-empty"

  - truth: "Lighthouse gate is measured and PASSES on a representative lesson page (PERF-04)"
    status: failed
    reason: "scripts/lighthouse-lesson.mjs was NOT built. PERF-04 was deferred in plan 03-09 with the explicit rationale that measuring Lighthouse against empty SSG shells would be misleading. No LCP/CLS/INP numbers exist for P3. The typography-checklist.md has no P3 Performance section."
    artifacts:
      - path: "scripts/lighthouse-lesson.mjs"
        issue: "File does not exist"
      - path: "docs/typography-checklist.md"
        issue: "No P3 Performance section (only Wagtail spike row)"
    missing:
      - "First fix the async ngOnInit SSG bug (truth #1) so prerendered pages have real content"
      - "Then build scripts/lighthouse-lesson.mjs runner per plan 03-09 Task 1 spec"
      - "Run pnpm build:prod && pnpm lighthouse:lesson; append results to docs/typography-checklist.md"

  - truth: "docs/force-en-audit.md has a completed P3 run record covering all public routes"
    status: failed
    reason: "The P3 section in docs/force-en-audit.md is a placeholder ('Add checklist items as page templates land.'). No run record exists for Phase 3 routes. The checklist items for Phase 3 were never written, and no P3 row appears in the run record table."
    artifacts:
      - path: "docs/force-en-audit.md"
        issue: "Contains only placeholder text for Phase 3 scope; no P3 checklist items and no P3 run record row"
    missing:
      - "Write P3 checklist items for every public route (home, /lessons, /lessons/:slug, /articles/:slug, /datasheets/:slug, /schematics/:slug, /about, /preview/:contentType/:token, 404)"
      - "Run the force-en audit and append a P3 run record row"

deferred:
  - truth: "docs/typography-checklist.md has a P3 three-breakpoint walk section"
    addressed_in: "Phase 4"
    evidence: "Plan 03-09 SUMMARY explicitly defers three-breakpoint walk doc rows to early P4: 'Deferred to early P4: docs/typography-checklist.md P3 three-breakpoint walk rows — not appended'"
---

# Phase 3: Page Templates, Routing & Static Build — Verification Report

**Phase Goal:** Every public route is a real, prerendered page consuming the ContentApi; the build ships as a static folder of HTML/JS/CSS/woff2 with no runtime Node dependency; the Wagtail spike at phase exit confirms the locked contract is buildable in Wagtail 7.3 before any BE work starts.
**Verified:** 2026-05-02T09:26:46Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All public routes exist as prerendered HTML files | ✓ VERIFIED | 11 index.html files in dist/browser: /, /lessons, 3×/lessons/:slug, /articles/chomu-arduino, 2×/datasheets/:slug, /schematics/..., /about, /dev/glyph-audit |
| 2 | Dynamic-slug routes prerender with real content (lesson/article/datasheet/schematic bodies) | ✗ FAILED | All 4 slug-based page types render as empty loading shells (--loading CSS class, empty article element) due to async ngOnInit not being awaited by Angular prerender |
| 3 | Lesson library page prerender contains real lesson rows | ✗ FAILED | dist/browser/lessons/index.html shows empty state "Уроки готуються" — no lesson links rendered |
| 4 | Home page prerender shows recent lessons and articles | ✗ FAILED | dist/browser/index.html shows empty <ol> lists for "Останні уроки" and "Статті" sections |
| 5 | All page h1/h2/h3 headings are non-empty in prerendered HTML | ✗ FAILED | Every prerendered page using ui-heading shows <h1 id="undefined"></h1>. Lesson page works (uses literal <h1>), but lesson-library, about, home h1, and all heading blocks in article/datasheet/schematic content fail |
| 6 | Prev/next lesson navigation is wired and rendered | ? UNCERTAIN | Code is present in lesson.page.html/ts and uses CONTENT_API. Cannot verify in prerendered HTML because lesson pages are empty shells. Needs human verification after SSG fix. |
| 7 | ng build produces static HTML/JS/CSS/woff2 with no Node SSR runtime | ✓ VERIFIED | No dist/arduino-hub/server/ directory; no main.*.js in server path; only browser static assets present |
| 8 | /preview/:contentType/:token is a CSR-only stub in the same bundle | ✓ VERIFIED | app.routes.server.ts: RenderMode.Client for preview route; PreviewStubPage exists with noindex meta and diagnostic <pre> echo of params |
| 9 | Shiki tokens are in fixture JSON but the Shiki library is absent from the client bundle | ✓ VERIFIED | scripts/tokenize-fixtures.mjs exists and ran; grep for bundledLanguages/createHighlighter returns zero matches in browser JS bundle; .shiki CSS class refs are correct CSS-only usage |
| 10 | NgOptimizedImage is used for figures in all page templates | ✓ VERIFIED | BlockRenderer uses [ngSrc] with explicit width/height for figure and pinout; SchematicPage uses NgOptimizedImage directly; lint-fixtures.mjs enforces explicit dimensions |
| 11 | PERF-04: Lighthouse gates met (LCP < 2.5s, CLS < 0.1, INP < 200ms) | ✗ FAILED | scripts/lighthouse-lesson.mjs does not exist; no LH numbers recorded; deferred in plan 03-09 pending SSG fix |
| 12 | BlockRenderer dispatches all Block discriminated union types to correct primitives | ✓ VERIFIED | block-renderer.component.ts has @switch covering all block types: heading, paragraph, lede, aside, figure, code, diff, pinout, sidenote, parts-list |
| 13 | All pages consume content via CONTENT_API injection (PAGE-11) | ✓ VERIFIED | All pages inject CONTENT_API token; app.config.ts uses provideContentApi(); app.config.server.ts overrides with FixtureContentApi for SSG |
| 14 | The build is pure SSG (outputMode: "static") with no zone.js | ✓ VERIFIED | angular.json: outputMode: "static"; app.config.ts: provideZonelessChangeDetection(); no provideClientHydration() |
| 15 | docs/force-en-audit.md has a completed P3 run record | ✗ FAILED | Only placeholder text in P3 section; no checklist items, no run record |
| 16 | CONTRACT-02: Wagtail 7.3 spike confirms CodeBlock StructBlock shape matches FE model | ✓ VERIFIED | wagtail-spike-report.md: full API response captured; field-name deltas documented (note→html, image_src→src resolved as P4 conform-to-FE rules); spike signed off |
| 17 | SiteHeader, SiteFooter, SiteNav chrome renders on all page templates | ✓ VERIFIED | src/app/chrome/ contains all three components; all page templates include chrome slots; header renders in prerendered HTML |

**Score: 12/17 truths verified**

---

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | docs/typography-checklist.md P3 three-breakpoint walk section | Phase 4 | Plan 03-09 SUMMARY decision: "Deferred to early P4: docs/typography-checklist.md P3 three-breakpoint walk rows — not appended" |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/pages/lesson/lesson.page.ts` | LessonPage with TwoColumn, TOC, parts-list, prev/next | ✓ VERIFIED | File exists; 27 spec tests pass; compiles |
| `src/app/pages/article/article.page.ts` | ArticlePage editorial layout, no prev/next | ✓ VERIFIED | File exists |
| `src/app/pages/datasheet/datasheet.page.ts` | DatasheetPage with Pinout, spec dl, Виробник meta | ✓ VERIFIED | File exists |
| `src/app/pages/schematic/schematic.page.ts` | SchematicPage with full-bleed figure, zoom link | ✓ VERIFIED | File exists; uses NgOptimizedImage |
| `src/app/pages/lesson-library/lesson-library.page.ts` | Typographic ToC (not card grid) | ✓ VERIFIED | File exists; uses grid-template-areas, renders <ol> with numbered rows in client |
| `src/app/pages/home/home.component.ts` | Editorial hero + recent lessons/articles | ✓ VERIFIED | File exists; but prerendered output is empty shell for dynamic sections |
| `src/app/pages/about/about.page.ts` | Static editorial prose | ✓ VERIFIED | Renders correctly in SSG (sync ngOnInit) |
| `src/app/pages/not-found/not-found.page.ts` | 404 page in editorial aesthetic | ✓ VERIFIED | File exists |
| `src/app/pages/preview-stub/preview-stub.page.ts` | CSR-only preview stub with noindex, param echo | ✓ VERIFIED | File exists; RenderMode.Client in app.routes.server.ts |
| `src/app/app.routes.ts` | 11 routes lazy-loaded | ✓ VERIFIED | All 11 routes present with loadComponent |
| `src/app/app.routes.server.ts` | getPrerenderParams for 4 slug routes; RenderMode.Client for preview | ✓ VERIFIED | Exact pattern confirmed in file |
| `src/app/blocks/block-renderer/block-renderer.component.ts` | Dispatches all Block types | ✓ VERIFIED | @switch covers all discriminated union variants |
| `scripts/tokenize-fixtures.mjs` | Shiki prebuild tokenizer | ✓ VERIFIED | Exists; idempotent; Shiki absent from client bundle |
| `src/assets/shiki/arduino-paper.json` | Hand-authored paper/ink Shiki theme | ✓ VERIFIED | Exists; no chromatic colors |
| `src/app/app.config.server.ts` | FixtureContentApi override for SSG prerender | ✓ VERIFIED | CONTENT_API overridden with FixtureContentApi (node:fs-backed) |
| `scripts/lighthouse-lesson.mjs` | Lighthouse gate runner | ✗ MISSING | Not created; PERF-04 not measured |
| `docs/force-en-audit.md` (P3 row) | P3 run record covering all public routes | ✗ MISSING | Only placeholder text |
| `.planning/phases/.../wagtail-spike-report.md` | CONTRACT-02 spike report | ✓ VERIFIED | Full report with captured API JSON and remediation decisions |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app.routes.server.ts` | `fixture-loader.ts` | `listLessonSlugs()` etc. | ✓ WIRED | Import verified; getPrerenderParams drives dynamic route prerender |
| `app.config.server.ts` | `FixtureContentApi` | DI override on CONTENT_API | ✓ WIRED | Verified in file; defect #1 from P3 walk was adding this exact override |
| `LessonPage.ngOnInit` | `CONTENT_API` | `inject(CONTENT_API)` | ✓ WIRED | DI wired; but async not awaited by Angular prerender — renders empty shell |
| `BlockRenderer` | `core-ui` primitives | imports array | ✓ WIRED | All 9 primitive imports confirmed in block-renderer.component.ts |
| `BlockRenderer` | `NgOptimizedImage` | `[ngSrc]` binding | ✓ WIRED | Priority/lazy branches with explicit width+height |
| `PreviewStubPage` | `RenderMode.Client` | `app.routes.server.ts` | ✓ WIRED | CSR-only confirmed |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data in SSG | Status |
|----------|---------------|--------|--------------------------|--------|
| `lesson.page.ts` | `lesson` signal (Lesson\|null) | `FixtureContentApi.getLesson(slug)` via async ngOnInit | No — async not awaited by Angular SSG prerender | ✗ HOLLOW — code loads correctly client-side, but SSG snapshot is empty |
| `lesson-library.page.ts` | `sortedLessons()` computed signal | `FixtureContentApi.listLessons()` via async ngOnInit | No — same issue | ✗ HOLLOW |
| `home.component.ts` | `recentLessons`, `articles` signals | `FixtureContentApi.listLessons/listArticles()` via async ngOnInit | No — same issue | ✗ HOLLOW |
| `about.page.ts` | `paragraphs` readonly const | Inline TypeScript constant `about-prose.const.ts` | Yes — compile-time constant, no async | ✓ FLOWING |
| `not-found.page.ts` | n/a | Static template | Yes | ✓ FLOWING |
| `BlockRenderer` (code block) | `tokens` input | Fixture JSON pre-tokenized by `pnpm tokenize` | Yes — JSON read at build-time | ✓ FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build produces static bundle (no server runtime) | `ls dist/arduino-hub/server/` | Directory absent | ✓ PASS |
| 11 routes prerendered as index.html | `find dist/arduino-hub/browser -name index.html \| wc -l` | 11 files | ✓ PASS |
| Shiki library absent from client JS bundle | `grep -l "bundledLanguages" dist/arduino-hub/browser/*.js` | No matches | ✓ PASS |
| Lesson page is an empty shell in prerender | Check `--loading` class in prerendered HTML | `article-page--loading` found in lesson/article/datasheet/schematic pages | ✗ FAIL — SSG produces empty shells |
| Lesson library shows real lessons in prerender | Check for `/lessons/pershyi-blymayuchyi-svitlodiod` href in lessons/index.html | Not found; "Уроки готуються" shown instead | ✗ FAIL |
| About page has real prose in prerender | Check for "Цей сайт" in about/index.html | Found — about page renders correctly | ✓ PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PAGE-01 | 03-04 | Lesson page template (title + parts-list-in-margin + TOC + body + prev/next) | ✓ SATISFIED | Component exists with all required features; manually verified by user in plan 03-09 |
| PAGE-02 | 03-05 | Article page template | ✓ SATISFIED | Component exists; editorial layout confirmed |
| PAGE-03 | 03-05 | Datasheet page template | ✓ SATISFIED | Component exists with Виробник meta, Pinout, spec dl |
| PAGE-04 | 03-05 | Schematic page template | ✓ SATISFIED | Component exists with full-bleed figure, zoom, download link |
| PAGE-05 | 03-06 | Lesson library as typographic ToC (NOT card grid) | ✓ SATISFIED | Ordered list with numbered rows, no card surfaces in source; client-side renders correctly |
| PAGE-06 | 03-06 | Home page editorial | ⚠ PARTIAL | Component exists and renders structure; but prerendered lesson/article lists are empty shells |
| PAGE-07 | 03-06 | About page editorial prose | ✓ SATISFIED | Static prose renders correctly in SSG |
| PAGE-08 | 03-06 | 404 page editorial | ✓ SATISFIED | NotFoundPage exists with 404 numeral + accent hairline |
| PAGE-09 | 03-07 | Routing covers all required routes | ✓ SATISFIED | app.routes.ts has all 8 public routes + preview + dev routes |
| PAGE-10 | 03-03 | BlockRenderer dispatches Block discriminated union | ✓ SATISFIED | @switch on all block.type variants confirmed |
| PAGE-11 | 03-04 | All pages use CONTENT_API injection (not direct HTTP) | ✓ SATISFIED | CONTENT_API token used across all pages; DI-swappable |
| CONTRACT-02 | 03-10 | CodeBlock shape verified by 30-60 min Wagtail 7.3 spike | ✓ SATISFIED | Spike executed; API JSON captured; field-name deltas documented; signed off |
| PERF-01 | 03-07 | Angular 21 zoneless SSG with outputMode:"static" | ✓ SATISFIED | Confirmed in angular.json and app.config.ts |
| PERF-02 | 03-07 | All public routes prerendered via getPrerenderParams | ✓ SATISFIED | Routes structure correct; 11 files emitted. NOTE: content of dynamic pages is empty until SSG bug is fixed |
| PERF-03 | 03-07 | /preview CSR-only stub | ✓ SATISFIED | RenderMode.Client confirmed; PreviewStubPage functional |
| PERF-04 | 03-09 | Lighthouse gates: LCP < 2.5s, CLS < 0.1, INP < 200ms | ✗ BLOCKED | scripts/lighthouse-lesson.mjs not built; no measurements exist; deferred to early P4 |
| PERF-05 | 03-08 | All imagery uses NgOptimizedImage with explicit dimensions | ✓ SATISFIED | BlockRenderer, PinoutComponent, SchematicPage all use [ngSrc]; lint-fixtures.mjs enforces dimensions |
| PERF-06 | 03-07 | Static build — no Node runtime dependency | ✓ SATISFIED | No dist/server/ directory; no arduino-ssr.service |

---

### Anti-Patterns Found

| File | Issue | Severity | Impact |
|------|-------|----------|--------|
| `src/app/pages/lesson/lesson.page.ts` | `async ngOnInit()` — data not available at SSG snapshot time | 🛑 Blocker | Lesson pages prerender as empty HTML shells; SEO/SSG promise broken |
| `src/app/pages/article/article.page.ts` | `async ngOnInit()` — same pattern | 🛑 Blocker | Article pages prerender as empty shells |
| `src/app/pages/datasheet/datasheet.page.ts` | `async ngOnInit()` — same pattern | 🛑 Blocker | Datasheet pages prerender as empty shells |
| `src/app/pages/schematic/schematic.page.ts` | `async ngOnInit()` — same pattern | 🛑 Blocker | Schematic pages prerender as empty shells |
| `src/app/pages/lesson-library/lesson-library.page.ts` | `async ngOnInit()` — same pattern | 🛑 Blocker | Lesson library prerender shows empty state instead of lesson list |
| `src/app/pages/home/home.component.ts` | `async ngOnInit()` — same pattern | ⚠ Warning | Home page skeleton renders; recent-lessons/articles sections are empty |
| All pages using `<ui-heading [level]="N">text</ui-heading>` | `ng-content` text-node projection produces empty h1/h2/h3 in SSG prerender | 🛑 Blocker | Page headings are empty in built HTML; `id="undefined"` on all affected h1/h2/h3; SEO impact; accessibility failure |
| `docs/force-en-audit.md` | P3 scope section is placeholder; no run record | ⚠ Warning | Phase 3 locale audit not documented; requirement UKR-06 cross-phase obligation unfulfilled |

**Notes:**
- The Shiki CSS class `.shiki` in the client bundle is NOT the Shiki library — it is component-scoped CSS generated by Angular for the CodeBlock's `::ng-deep .shiki` styles. Shiki library code is confirmed absent from the client bundle.
- The `lesson-page--loading` / `article-page--loading` CSS classes in built HTML are from SCSS that uses these classes for conditional display during data load. Their presence in prerendered HTML is the symptom of the empty-shell bug.

---

### Human Verification Required

#### 1. Prev/Next Lesson Navigation

**Test:** After fixing the async ngOnInit SSG bug, build the project and visit `/lessons/pershyi-blymayuchyi-svitlodiod` in a browser. Scroll to the bottom of the page.
**Expected:** Prev/Next nav renders with Ukrainian labels "← Попередній урок" / "Наступний урок →" and the adjacent lesson titles link to the correct slugs.
**Why human:** The feature is implemented in lesson.page.ts/html but cannot be verified in the current prerendered output because lesson pages are empty shells.

#### 2. Three-breakpoint visual walk of all page templates

**Test:** Run `pnpm start`, visit every route at <768px / 768–1199px / ≥1200px. Check editorial typography, sidenote behaviour, TwoColumn layout, parts-list redistribution on lesson page.
**Expected:** All routes render with editorial-quality typography; sidenotes appear in margin rail at ≥1200px, inline at tablet, as `<details>` at mobile. No broken layouts, no horizontal scroll.
**Why human:** Visual breakpoint behavior requires a browser; cannot be verified from prerendered HTML or grep.

#### 3. Force-en locale audit for all Phase 3 routes

**Test:** Set browser locale to en-US (Chrome DevTools → Sensors → Locale). Visit every public route. Verify: `<html lang="uk">` on each, Ukrainian month names, Ukrainian number formatting, all UI strings remain Ukrainian.
**Expected:** Zero English leakage across home, /lessons, /lessons/:slug, /articles/:slug, /datasheets/:slug, /schematics/:slug, /about, /preview/lesson/abc123, and 404.
**Why human:** Requires browser with forced locale; visual DOM inspection.

#### 4. Lighthouse performance audit

**Test:** After SSG fix (async ngOnInit → ResolveFn), run `pnpm build:prod && pnpm lighthouse:lesson` (once lighthouse-lesson.mjs is built per plan 03-09 Task 1).
**Expected:** Desktop and mobile profiles both pass LCP < 2.5s, CLS < 0.1, TBT < 200ms. Numbers appended to docs/typography-checklist.md.
**Why human:** Requires Chrome headless + local http-server; lab measurement.

---

### Gaps Summary

**Root cause: One architecture defect causes four of the five FAILED truths.**

Angular's SSG prerender does not await async lifecycle hooks (`ngOnInit: async`). When `FixtureContentApi.getLesson()` (an async file read) is called in `ngOnInit`, the Angular prerender engine snapshots the DOM immediately — before the Promise resolves — and writes an empty shell to HTML. The correct fix is to move data fetching from `ngOnInit` to Angular router `ResolveFn` functions, which ARE awaited during prerender.

This single bug manifests as:
1. All dynamic `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug` pages rendering as empty loading shells.
2. The `/lessons` library page showing "Уроки готуються" (empty state) in prerender instead of lesson rows.
3. The home page `/` showing empty "Останні уроки" and "Статті" lists in prerender.

Additionally, a separate known defect — `ui-heading` text-node content not being projected in SSG — causes all `<h1>/<h2>/<h3>` rendered via `<ui-heading>Текст</ui-heading>` to be empty in prerendered HTML. The lesson page worked around this with a literal `<h1>`, but every other page template still uses `<ui-heading>` and is affected.

Both defects were identified and documented during the plan 03-09 manual walk and deferred to early P4. The current phase exit state is: the code structure is correct, the routing is wired correctly, the SSG configuration is correct — but the prerendered output is hollow because async data loads do not complete before the snapshot is taken.

The PERF-04 Lighthouse gate and force-en-audit P3 row are secondary gaps following naturally from the above: Lighthouse was correctly deferred (measuring against empty shells would produce misleading numbers), and the force-en audit was deferred alongside the other observational docs.

**What needs to happen in early P4 before Wagtail backend work starts:**
1. Fix async ngOnInit → ResolveFn migration across all 5 affected page components
2. Fix ui-heading text-node projection bug (or migrate all callsites to a string input)
3. Build and run scripts/lighthouse-lesson.mjs; capture numbers
4. Run force-en audit across all P3 routes; append P3 row to docs/force-en-audit.md
5. Append P3 three-breakpoint walk rows to docs/typography-checklist.md

These are clean-up items for the FE before connecting the Wagtail backend, not architectural blockers. The ContentApi DI contract is correct, the route structure is correct, and the static build mechanism works.

---

_Verified: 2026-05-02T09:26:46Z_
_Verifier: Claude (gsd-verifier)_
