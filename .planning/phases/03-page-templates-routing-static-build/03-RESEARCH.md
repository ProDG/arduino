# Phase 3: Page Templates, Routing & Static Build — Research

**Researched:** 2026-05-01
**Domain:** Angular 21 SSG (`outputMode: "static"`) + parameterized prerender + zoneless page templates + build-time Shiki + NgOptimizedImage + Lighthouse gate + Wagtail 7.4 StreamField spike
**Confidence:** HIGH on Angular 21 SSG mechanics, NgOptimizedImage, Shiki integration, force-en audit pattern; MEDIUM on exact Wagtail 7.4 REST v2 nested-StreamField JSON shape (resolved empirically by the phase-exit spike — that is its purpose); HIGH on every guardrail because P1+P2 already proved them.

## Summary

Phase 3 is mostly **glue** on a foundation that's already locked. The hard work is done:
- Angular 21 SSG with `outputMode: "static"` is wired (P1).
- `core-ui` primitives + `TwoColumn`/`MarginRail`/`Sidenote` JS measurement work at three breakpoints (P2).
- `Block` discriminated union + `MockContentApi` + 7 Ukrainian fixtures + lint script exist (P2).
- Force-en audit and typography checklist accumulate per phase (P1+P2).
- `_typography.scss` is the single font-pairing swap target; `src/lib/intl.ts` is the only `Intl.*` callsite.

What Phase 3 actually adds: (1) `getPrerenderParams()` on each dynamic route — which requires a build-time fixture loader because `inject(ContentApi)` is unavailable in a static-prerender callback when the API does network I/O; (2) a tiny **CSR opt-out** for `/preview/*` matching the existing `/dev/primitives` pattern; (3) `BlockRenderer` as an `@switch (block().type)` dispatcher with sidenote/parts-list extraction handled by the parent template (locked in 03-UI-SPEC); (4) `<img ngSrc>` with explicit `width`/`height` (a `Block` model amendment, not a redesign); (5) build-time Shiki tokenization writing a `code.tokens` cache field into fixtures (no client bundle); (6) a manual `pnpm lighthouse:lesson` script as the phase-exit gate; (7) a 30–60 min Wagtail 7.4 StreamField throwaway spike on/after 2026-05-04.

**Primary recommendation:** Keep Phase 3 prescriptive and additive. The 03-UI-SPEC + 03-CONTEXT have already eliminated almost all design optionality. Researcher's job here is to nail the Angular 21 SSG mechanics, document the byte-level prerender output expectation, lock the `getPrerenderParams` plumbing pattern, and pre-cache the Wagtail spike protocol so the executor can run it inside the 60-minute timebox.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Plan sequencing (D-SEQ-01 .. D-SEQ-04):**
- 9 plans, foundation-first linear order:
  1. Block model amendment (`width`/`height` on figure + pinout) + fixture migration + lint extension — isolated, single CONTRACT-bumping commit
  2. Chrome (`SiteHeader`, `SiteFooter`, `SiteNav`) slotted into P2 `PageShell`
  3. `BlockRenderer` dispatcher
  4. Page templates — `LessonPage` first (heaviest), then `ArticlePage`, `DatasheetPage`, `SchematicPage`, `LessonLibraryPage`, `HomePage`, `AboutPage`, `NotFoundPage`, `PreviewStubPage`
  5. SSG prerender wiring (`getPrerenderParams()` on every dynamic route, `app.routes.server.ts` updates, `outputMode: "static"` verification)
  6. Shiki build-time integration (theme + tokenize script + prebuild hook)
  7. `NgOptimizedImage` swap on `Figure` + `Pinout`
  8. Phase-exit audits — own plan: 3-breakpoint walk, typography-checklist P3 rows, force-en P3 row, Lighthouse gate
  9. Wagtail 7.4 StreamField spike (CONTRACT-02) — last, blocks phase exit, cannot run before 2026-05-04
- `LessonPage` built before siblings (de-risks the whole template group).
- Phase-exit audits are their own plan (P1+P2 pattern).
- Wagtail spike is the **last plan** and **blocks phase exit**.

**Shiki integration (D-SHIKI-01 .. D-SHIKI-05):**
- `tokenize(code, language) → tokensHtml` is a small reusable TypeScript module.
- Invoked from `scripts/tokenize-fixtures.mjs` registered as a `prebuild` step in `package.json`.
- Theme `arduino-paper.json` is **hand-authored** TextMate JSON (background `--color-paper`, foreground `--color-ink`, comments italic `--color-ink-muted`, keywords weight 600, no chromatic alarm).
- `code.tokens` is an **optional cache field** in fixtures; lint ignores it; `CodeBlock` falls back to plain `<pre>` rendering when absent. Tokenization is regeneratable, never load-bearing.
- Forward-compatible with P4 Wagtail editor flow — same theme file, same logic shape.
- Languages: `cpp`, `arduino` (alias/variant of cpp), `plaintext`, `diff`. **No client-side Shiki bundle ever.**

**Block model amendment + prerender plumbing (D-AMEND-01..02, D-PRERENDER-01..02):**
- `width: number` + `height: number` (required) on `figure` and `pinout` Block variants — single CONTRACT-bumping commit in Plan 03-01.
- `lint-fixtures.mjs` extension reads each referenced image's header (`image-size` or equivalent pure-JS parser, no full decode) and **verifies fixture `width`/`height` matches actual image dimensions on disk** — catches CLS-causing dimension drift at commit time.
- `src/content/api/fixture-loader.ts` exports pure functions (`loadAllLessons()`, `getLesson(slug)`, etc.) that read JSON via Node `fs` at build time. Both `MockContentApi` (runtime) and `getPrerenderParams()` (build) consume this single source of truth.
- `ContentSource` interface defined in P3 (e.g., `listLessonSlugs()`, `getLesson(slug)`, …). P3 ships `FixtureContentSource` only. P4 will add `WagtailContentSource` as a single new file + a single DI registration change. The prerender helper accepts a `ContentSource` so P4 can prerender against Wagtail without rewriting `getPrerenderParams()`.

**Lighthouse gate (D-LH-01 .. D-LH-05):**
- Runs **locally as a manual phase-exit step** via `pnpm lighthouse:lesson`. Static file server (e.g., `pnpm exec http-server` or `npx serve`) + `lighthouse` CLI against `/lessons/pershyi-blymayuchyi-svitlodiod`. **Not in CI.**
- Both desktop and mobile profiles. Gate fails if either misses thresholds.
- LCP < 2.5s, CLS < 0.1, INP < 200ms — **hard pass/fail, no tolerance band.**
- On miss: executor halts phase exit; remediation triage order locked (LCP → priority + preloads + woff2 budget; CLS → unmeasured `<img>` + Fontaine; INP → TwoColumn debounce + Shiki node count).
- Numbers + PASS/FAIL recorded in `docs/typography-checklist.md` Performance section.

**Locked from 03-UI-SPEC (consume verbatim):**
- 8 page templates + chrome composition.
- Routing table: `/`, `/lessons`, `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug`, `/about`, `/preview/:contentType/:token` (CSR), wildcard 404, `/dev/primitives` (CSR, P2).
- `BlockRenderer` `@switch` dispatch table; sidenote + parts-list **NOT** rendered in body slot (parent template extracts and forwards to margin rail).
- Shiki theme principle: no chromatic alarm. Differentiation by weight + italic + rule.
- NgOptimizedImage: `priority=true` on first figure of lesson/article/datasheet/schematic; default lazy on the rest. No `placeholder="blur"`. No `sizes` attribute in P3 (single rendition).
- Lighthouse target lesson: `pershyi-blymayuchyi-svitlodiod`.
- 12 "Open Decisions Carried Forward" in UI-SPEC §Open Decisions are flagged for re-validation, not re-litigation.

### Claude's Discretion

- Exact filenames + class names (per existing P2 conventions: `<name>.page.ts`, `site-header.component.ts`).
- Test coverage scope per template (P2 chose showcase + targeted DOM tests for `CodeBlock` + `measure.ts`; P3 likely follows similar proportion).
- Exact `image-size`-equivalent library (any small pure-JS or zero-dep PNG/JPG/SVG header reader; planner picks based on supply-chain footprint).
- Whether `cpp`/`arduino` use Shiki built-in TextMate grammar or a tiny aliasing config.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed strictly within phase scope. The 12 "Open Decisions Carried Forward" in UI-SPEC §Open Decisions cover all execution-time revisits.

**Hard non-goals for Phase 3** (from 03-CONTEXT and 03-UI-SPEC):
- Real Wagtail backend (P4)
- Real preview-token wiring (P4)
- `WagtailContentSource` impl (P4 — interface ships in P3)
- MinIO image renditions, `sizes` attribute (P4/P5)
- Drop caps, hanging punctuation, glossary tooltips, pin/figure cross-refs (P6)
- RSS, JSON-LD, OG tags, print stylesheet (P6)
- Dark mode (out for v1)
- `/articles` library page (considered for P6)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAGE-01 | Lesson page template — title + deck + parts-list-in-margin + in-page TOC + prose + figures + code + prev/next | §Routing & Per-Route Data Loading; §Prev/Next Navigation; §Page-by-Page Template Notes |
| PAGE-02 | Article page template — editorial layout, no parts list, no prev/next | §Page-by-Page Template Notes |
| PAGE-03 | Datasheet page template — metadata + pinout + specifications + peripheral notes | §Page-by-Page Template Notes |
| PAGE-04 | Schematic page template — large schematic + click-to-zoom + download link | §Page-by-Page Template Notes |
| PAGE-05 | Lesson library = typographic ToC, NOT card grid; difficulty + read time | §Read-Time Formatting; §Page-by-Page Template Notes |
| PAGE-06 | Home page editorial — recent lessons/articles, entry points to library/about | §Page-by-Page Template Notes |
| PAGE-07 | About page editorial prose | §Page-by-Page Template Notes |
| PAGE-08 | 404 page editorial | §Routing & 404 Emission |
| PAGE-09 | Routing covers `/`, `/lessons`, `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug`, `/about` | §Standard Stack (Angular 21 SSR) + §Architecture Patterns |
| PAGE-10 | `BlockRenderer` dispatches `Block` discriminated union to right primitive | §Block-Rendering Dispatch |
| PAGE-11 | All pages consume content via `ContentApi` (no direct HTTP) | §Content Source Architecture |
| CONTRACT-02 | `CodeBlock` model `{language, code, annotations: {line, html}[]}` verified by Wagtail 7.4 spike | §Wagtail 7.4 StreamField Spike Protocol |
| PERF-01 | Angular 21.2.x zoneless, Signal Forms, Vitest, `@angular/ssr` `outputMode: "static"` | §Standard Stack |
| PERF-02 | All public routes prerendered; `getPrerenderParams()` for dynamic; no Node SSR | §Routing & Per-Route Data Loading |
| PERF-03 | `/preview/<contentType>/<token>` CSR-only | §CSR Opt-Out for `/preview/*` |
| PERF-04 | Lighthouse: LCP<2.5s, CLS<0.1, INP<200ms on representative lesson | §Lighthouse Gate Mechanics |
| PERF-05 | All in-page imagery uses `NgOptimizedImage` with explicit dimensions | §NgOptimizedImage Discipline |
| PERF-06 | Static build: HTML/JS/CSS/woff2 only — no Node runtime | §Build-Output Verification |

## Project Constraints (from CLAUDE.md)

- **Ukrainian only.** No i18n infrastructure ever. `<html lang="uk">`, `LOCALE_ID = 'uk-UA'`, `TIME_ZONE = 'Europe/Kyiv'`. Force-en audit at every phase exit.
- **Real Ukrainian prose for design calibration.** Never Lorem Ipsum.
- **Ragged-right body**, no `text-align: justify`, no `hyphens: auto`.
- **No Tailwind.** Hand-authored SCSS with token system.
- **FE owns the contract.** Wagtail (P4) conforms to TS models, not the inverse.
- **No Node SSR ever.** SSG only. `/preview/*` CSR-only inside the same static bundle.
- **NgOptimizedImage on every figure** with explicit dimensions.
- **No comments by default** — only when WHY is non-obvious.
- **Prefer editing existing files** over creating new ones.
- **Match existing P1+P2 patterns** before inventing new ones.
- **Three-breakpoint manual walk** at every layout-touching phase exit (<768 / 768–1199 / ≥1200).
- **Commit messages:** lowercase imperative, reference REQ-IDs.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Page-template rendering | Browser (CSR after hydration is N/A — SSG only) / Build-time prerender | — | All eight templates are SSG-prerendered to HTML at build; client picks up only inert HTML + minimal interactive islands (`CodeBlock` copy button, `TwoColumn` measurement). |
| Route data loading | Build-time (`getPrerenderParams` + `fixture-loader`) | Runtime (`MockContentApi` for CSR-only `/preview/*` and dev) | At build time, `fs`-based fixture loader feeds prerender. At runtime, the same ContentApi DI token is used by `/preview/*` (CSR) and any dev pages — but production prerendered routes never call it post-build. |
| Block dispatch | Browser (static HTML output of compiled `@switch` template) | — | `BlockRenderer` is an Angular template; the prerender step compiles `@switch (block().type)` into the static HTML. No runtime dispatch overhead in production. |
| Syntax highlighting | **Build-time** (Shiki Node script) | — | `prebuild` script writes `code.tokens` HTML into fixtures. Runtime ships zero Shiki bytes. |
| Image optimization | Browser (`NgOptimizedImage` directive emits `<img>` with `loading`, `fetchpriority`, sizes) | Build-time (verifies dimensions via `lint-fixtures.mjs`) | Directive runs in the prerender pass; lint runs at commit time. |
| Locale formatting | Browser-rendered HTML (frozen at prerender time) | Runtime (`formatDateUk`, `formatNumberUk` resolve at SSG render) | All Ukrainian formatting happens once during prerender; HTML output is static. |
| 404 emission | Build-time | Browser (CSR fallback for `/preview/*`) | Wildcard route emits `dist/browser/404.html` at build. Static file server (Caddy in P5) returns it for unknown paths. |

## Standard Stack

### Core (already installed; verify versions)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@angular/core` | 21.2.x | Zoneless change detection, signal-based components | Locked in P1; PERF-01 |
| `@angular/router` | 21.2.x | `provideRouter`, lazy `loadComponent`, `:slug` params | Standard Angular routing, no third-party needed |
| `@angular/ssr` | 21.2.9 | `outputMode: "static"` SSG, `ServerRoute`, `RenderMode.Prerender`/`Client`, `getPrerenderParams` | The official SSG path; no alternative for Angular 21 |
| `@angular/common` | 21.2.x | `NgOptimizedImage` directive | PERF-05 mandatory |
| `@angular/build` | 21.2.9 | `application` builder honors `outputMode: "static"` | Already configured in `angular.json` |

[VERIFIED: `package.json`] All five present at correct versions.

### Net-new in P3

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `shiki` | 3.x latest | Build-time syntax highlighting | In `scripts/tokenize-fixtures.mjs` only — never imported into Angular code |
| `@shikijs/transformers` | 3.x latest | (Optional) `transformerNotationDiff`/`transformerNotationHighlight` for code annotations | Per UI-SPEC §Shiki: **not** used in P3 — `CodeBlock` already handles diff/highlight via component inputs. Skip unless tokenize script needs them later. |
| `image-size` (or equivalent zero-dep header reader) | latest | Pure-JS image-dimension verification in `lint-fixtures.mjs` | Build-time only, dev dependency |
| Lighthouse runner — choose `lighthouse` CLI **or** `lighthouse-ci` (`@lhci/cli`) | latest | Phase-exit gate on representative lesson | `pnpm lighthouse:lesson` script; manual run, **not** in CI (D-LH-01) |
| Static file server for Lighthouse run — `http-server` (or `npx serve`) | latest | Serves `dist/browser/` over loopback for Lighthouse | Dev dependency only |

[CITED: https://github.com/shikijs/shiki] Shiki 3.x is the current major; ships ESM-first, fine for Node `prebuild` script invocation.
[ASSUMED] Final versions resolved by `pnpm add -D shiki@latest …` at install time.

**Verification command for the planner before locking versions:**

```bash
npm view shiki version
npm view @shikijs/transformers version
npm view image-size version
npm view lighthouse version
npm view http-server version
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shiki at build time | Prism / highlight.js client-side | Rejected by PRIM-04 (no client-side highlighting JS). Already locked in P2. |
| `image-size` for header reading | `probe-image-size`, `sharp` | `sharp` adds native dep + 60MB binary; `probe-image-size` is decent but slightly heavier. `image-size` is pure JS, ~15KB, dev-dep-only. Planner's call. |
| `lighthouse` CLI | `lighthouse-ci` (`@lhci/cli`) | LHCI's superpower is CI integration with budget assertions. D-LH-01 explicitly says **not** in CI for v1, so the plain CLI is sufficient. LHCI carries no harm but no benefit either. |
| `http-server` | `serve`, Caddy locally | All equivalent. `http-server` is the smallest dep. |
| `@angular/router` resolvers (data-loading guards) | Signal-based `inject(ContentApi)` in component constructor | At prerender time, the router resolvers and component-init both run synchronously through the Angular SSG pipeline; either works. P2 chose component-init signals (matches zoneless idiom). Stay consistent. |

**Installation:**

```bash
pnpm add -D shiki image-size lighthouse http-server
# Optionally: pnpm add -D @shikijs/transformers   # only if planner finds tokenize script needs them
```

**Version verification:** Run the four `npm view` commands above before writing the install command into the plan.

## Architecture Patterns

### System Architecture Diagram

```
                       Build Time (pnpm build)
                              │
                              ▼
   ┌──────────────────────────────────────────────────────┐
   │  prebuild: scripts/tokenize-fixtures.mjs             │
   │  reads src/assets/mock-data/**/*.json,               │
   │  Shiki(theme: src/assets/shiki/arduino-paper.json),  │
   │  writes back code.tokens HTML cache field            │
   └──────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌──────────────────────────────────────────────────────┐
   │  ng build (outputMode: "static", Angular 21)         │
   │                                                      │
   │   For each ServerRoute in app.routes.server.ts:      │
   │     RenderMode.Prerender + getPrerenderParams() ──┐  │
   │     RenderMode.Client (no prerender, CSR shell) ──┤  │
   │                                                   │  │
   │   getPrerenderParams() calls FixtureContentSource │  │
   │   (reads JSON via Node `fs` from src/assets/      │  │
   │    mock-data/{lessons,articles,datasheets,        │  │
   │    schematics}/*.json) → returns [{slug:'…'},…]   │  │
   │                                                   │  │
   │   For each (route × params) tuple, Angular        │  │
   │   prerenders the page → emits dist/browser/       │  │
   │   <path>/index.html                               │  │
   └──────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌──────────────────────────────────────────────────────┐
   │  dist/browser/ — static folder, no Node runtime      │
   │   index.html, lessons/index.html,                    │
   │   lessons/<slug>/index.html × N,                     │
   │   articles/<slug>/index.html × N,                    │
   │   datasheets/<slug>/index.html × N,                  │
   │   schematics/<slug>/index.html × N,                  │
   │   about/index.html, 404.html,                        │
   │   preview/index.html (CSR shell, hydrates on nav),   │
   │   dev/primitives/index.html (CSR shell, P2),         │
   │   *.js, *.css, fonts/*.woff2, assets/*               │
   └──────────────────────────────────────────────────────┘

                       Runtime (in browser)
                              │
                              ▼
   ┌──────────────────────────────────────────────────────┐
   │  Static file server (Caddy in P5; pnpm exec          │
   │  http-server in P3 Lighthouse gate)                  │
   │   /lessons/<slug>/   →  serves prerendered HTML       │
   │   /preview/<ct>/<tok>/ → serves CSR shell;            │
   │      Angular bootstraps client-side and renders       │
   │      PreviewStubPage (no ContentApi call in P3)       │
   │   any unknown path → serves 404.html                  │
   └──────────────────────────────────────────────────────┘
```

### Recommended Project Structure (additions for P3)

```
src/
├── app/
│   ├── app.routes.ts            # extended with all P3 routes
│   ├── app.routes.server.ts     # /preview/* added as RenderMode.Client; dynamic routes get getPrerenderParams
│   ├── app.config.ts            # provider unchanged; provideContentApi() may gain a build-time variant
│   ├── chrome/                  # NEW
│   │   ├── site-header.component.ts
│   │   ├── site-header.component.scss
│   │   ├── site-footer.component.ts
│   │   ├── site-footer.component.scss
│   │   └── site-nav.component.ts
│   ├── blocks/                  # NEW
│   │   └── block-renderer/
│   │       ├── block-renderer.component.ts
│   │       └── block-renderer.component.scss
│   └── pages/
│       ├── home/                # extended (existing component reshaped to UI-SPEC HomePage)
│       ├── glyph-audit/         # P1, untouched
│       ├── dev-primitives/      # P2, untouched
│       ├── lesson/              # NEW — lesson.page.ts, lesson.page.scss
│       ├── article/             # NEW
│       ├── datasheet/           # NEW
│       ├── schematic/           # NEW
│       ├── lesson-library/      # NEW
│       ├── about/               # NEW
│       ├── not-found/           # NEW
│       └── preview-stub/        # NEW
├── content/
│   ├── api/
│   │   ├── content-api.ts             # existing; abstract class
│   │   ├── content-api.token.ts       # existing; provider
│   │   ├── mock-content-api.ts        # existing; refactored to consume ContentSource
│   │   ├── content-source.ts          # NEW — interface
│   │   ├── fixture-content-source.ts  # NEW — fs-backed impl, build-time + runtime via static asset
│   │   └── fixture-loader.ts          # NEW — pure fs reader functions
│   └── models/
│       └── block.ts                   # AMENDED — width/height on figure + pinout
├── assets/
│   ├── mock-data/             # existing fixtures, gain optional code.tokens after prebuild
│   └── shiki/                 # NEW
│       └── arduino-paper.json # hand-authored TM theme JSON
└── lib/
    └── intl.ts                # existing; per-template usage from lesson/article/library

scripts/
├── lint-fixtures.mjs              # extended — image-dimension verification
├── normalize-fixture-nbsp.mjs     # existing
├── tokenize-fixtures.mjs          # NEW — prebuild Shiki tokenization
└── lighthouse-lesson.mjs          # NEW (or inline pnpm script) — Lighthouse gate runner
```

### Pattern 1: Static Server Routes Config (PERF-02, PERF-03, PERF-06)

**What:** Per-route render-mode declaration via `@angular/ssr` `ServerRoute[]`. `outputMode: "static"` strips the server bundle entirely after prerender; `RenderMode.Client` opts a route out of prerender and ships a CSR shell only.

**When to use:** All Phase 3 routes are configured here.

**Example:**

```ts
// src/app/app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';
import { listLessonSlugs, listArticleSlugs, listDatasheetSlugs, listSchematicSlugs }
  from '../content/api/fixture-loader';

export const serverRoutes: ServerRoute[] = [
  // CSR-only opt-outs — no prerender, ship a thin CSR shell
  { path: 'preview/:contentType/:token', renderMode: RenderMode.Client },
  { path: 'dev/primitives',              renderMode: RenderMode.Client },

  // Parameterized prerender
  {
    path: 'lessons/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return (await listLessonSlugs()).map((slug) => ({ slug }));
    },
  },
  {
    path: 'articles/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return (await listArticleSlugs()).map((slug) => ({ slug }));
    },
  },
  {
    path: 'datasheets/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return (await listDatasheetSlugs()).map((slug) => ({ slug }));
    },
  },
  {
    path: 'schematics/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return (await listSchematicSlugs()).map((slug) => ({ slug }));
    },
  },

  // Static prerendered routes
  { path: '',         renderMode: RenderMode.Prerender },
  { path: 'lessons',  renderMode: RenderMode.Prerender },
  { path: 'about',    renderMode: RenderMode.Prerender },
  { path: 'dev/glyph-audit', renderMode: RenderMode.Prerender },

  // Wildcard 404 — emitted as dist/browser/404.html when last
  { path: '**',       renderMode: RenderMode.Prerender },
];
```

[CITED: https://angular.dev/guide/ssr] `RenderMode` enum and `ServerRoute` type are part of `@angular/ssr`. `getPrerenderParams` returns `Promise<Record<string, string>[]>`. **Constraint:** `inject()` calls inside `getPrerenderParams` must be synchronous (not after `await`). The example above sidesteps this by calling pure `fs`-based loader functions instead of the DI ContentApi — which is the right pattern for build-time and matches D-PRERENDER-01.

[VERIFIED: existing `src/app/app.routes.server.ts`] The current P2 file uses `{ path: 'dev/primitives', renderMode: RenderMode.Client }` followed by `{ path: '**', renderMode: RenderMode.Prerender }`. Phase 3 extends this exact shape — no architectural new ground.

### Pattern 2: Build-Time Fixture Loader (D-PRERENDER-01, D-PRERENDER-02)

**What:** Pure Node `fs` functions that read JSON fixtures synchronously enough for `getPrerenderParams` and reusable inside `MockContentApi` for CSR/dev paths.

**When to use:** Anywhere the build needs to enumerate slugs or load a fixture by slug.

**Example:**

```ts
// src/content/api/fixture-loader.ts
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Lesson } from '../models/lesson';

const MOCK_ROOT = 'src/assets/mock-data';

async function listSlugs(folder: string): Promise<string[]> {
  const dir = join(MOCK_ROOT, folder);
  const entries = await readdir(dir);
  return entries.filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
}

export const listLessonSlugs    = () => listSlugs('lessons');
export const listArticleSlugs   = () => listSlugs('articles');
export const listDatasheetSlugs = () => listSlugs('datasheets');
export const listSchematicSlugs = () => listSlugs('schematics');

export async function loadLesson(slug: string): Promise<Lesson> {
  const path = join(MOCK_ROOT, 'lessons', `${slug}.json`);
  return JSON.parse(await readFile(path, 'utf8')) as Lesson;
}
// … sibling load* functions
```

```ts
// src/content/api/content-source.ts
export interface ContentSource {
  listLessonSlugs(): Promise<string[]>;
  getLesson(slug: string): Promise<Lesson>;
  listArticleSlugs(): Promise<string[]>;
  getArticle(slug: string): Promise<Article>;
  listDatasheetSlugs(): Promise<string[]>;
  getDatasheet(slug: string): Promise<Datasheet>;
  listSchematicSlugs(): Promise<string[]>;
  getSchematic(slug: string): Promise<Schematic>;
}
```

P3 ships `FixtureContentSource` (wraps `fixture-loader.ts`). P4 will add `WagtailContentSource` (HTTP). Single DI swap point.

**Why pure fs and not `inject(ContentApi)` at build time:** The current `MockContentApi.getLesson` uses `fetch('/assets/...')` which works in the browser at runtime but **does not** work inside an Angular SSG prerender callback running in Node — `fetch` against a relative URL has no base. The build-time path must be `fs.readFile`. This is the canonical reason the P3 plan splits `ContentSource` from `ContentApi` and introduces `fixture-loader.ts`.

### Pattern 3: Page Template — Standalone, Lazy, Signal-Resolved

**What:** Each page template is a standalone component, lazy-loaded per route, resolves data via `inject(ContentApi)` and Angular signals.

**When to use:** All eight P3 page templates.

**Example (LessonPage skeleton):**

```ts
// src/app/pages/lesson/lesson.page.ts
import { Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentApi } from '../../../content/api/content-api';

@Component({
  standalone: true,
  selector: 'app-lesson-page',
  imports: [/* PageShell, TwoColumn, Heading, Lede, BlockRenderer, NgOptimizedImage… */],
  templateUrl: './lesson.page.html',
  styleUrl: './lesson.page.scss',
})
export class LessonPage {
  // Use route input binding (provideRouter + withComponentInputBinding) — set in app.config.ts
  slug = input.required<string>();

  private api = inject(ContentApi);

  // For prerender, the page needs synchronous-enough resolution.
  // Pattern: resolved-data via Angular's `data` route field OR a signal that
  // awaits at component-init. Either works in SSG because the prerender
  // pass awaits the macrotask queue before snapshotting HTML.
  lesson = signal<Lesson | undefined>(undefined);

  constructor() {
    // resolved at SSG prerender time; Angular's static rendering awaits
    // microtasks before serializing.
    this.api.getLesson(this.slug()).then((l) => this.lesson.set(l));
  }
}
```

**Title + meta per route:** Set via the route's `title` field (Angular Router supports it natively, observed in current `src/app/app.routes.ts`). For richer meta (description, OG tags) — **deferred to P6** per UI-SPEC out-of-scope.

### Pattern 4: Block-Rendering Dispatch (PAGE-10)

**What:** A single `app-block-renderer` component switches on `block.type` and projects to the right primitive. Sidenote and parts-list are **not** rendered here — the parent template extracts them.

**When to use:** Inside lesson/article/datasheet/schematic body iterations.

**Example:**

```html
<!-- block-renderer.component.html -->
@switch (block().type) {
  @case ('heading') {
    <ui-heading [level]="$any(block()).level" [id]="$any(block()).id">
      {{ $any(block()).text }}
    </ui-heading>
  }
  @case ('paragraph') {
    <ui-body [innerHTML]="$any(block()).html"></ui-body>
  }
  @case ('lede') {
    <ui-lede [innerHTML]="$any(block()).html"></ui-lede>
  }
  @case ('aside') {
    <ui-aside [variant]="$any(block()).variant" [innerHTML]="$any(block()).html"></ui-aside>
  }
  @case ('figure') {
    <ui-figure [number]="$any(block()).number" [fullBleed]="$any(block()).fullBleed">
      <img [ngSrc]="$any(block()).src"
           [width]="$any(block()).width"
           [height]="$any(block()).height"
           [alt]="$any(block()).alt"
           [priority]="firstFigureOnPage()" />
      @if ($any(block()).captionHtml) {
        <ui-figure-caption [innerHTML]="$any(block()).captionHtml"></ui-figure-caption>
      }
    </ui-figure>
  }
  @case ('code') {
    <ui-code-block
      [language]="$any(block()).language"
      [code]="$any(block()).code"
      [tokens]="$any(block()).tokens"
      [annotations]="$any(block()).annotations"
      [showLineNumbers]="$any(block()).showLineNumbers"
      [highlightLines]="$any(block()).highlightLines"
      [diffMode]="$any(block()).diffMode"
      [filename]="$any(block()).filename" />
  }
  @case ('diff') {
    <ui-diff [before]="$any(block()).before" [after]="$any(block()).after"></ui-diff>
  }
  @case ('pinout') {
    <ui-pinout [src]="$any(block()).src"
               [alt]="$any(block()).alt"
               [pins]="$any(block()).pins" />
  }
  @case ('sidenote') { <!-- intentionally empty: extracted by parent --> }
  @case ('parts-list') { <!-- intentionally empty: extracted by parent --> }
}
```

The `firstFigureOnPage()` signal is a small piece of bookkeeping the parent template provides — UI-SPEC says "first figure on the lesson/article/datasheet/schematic page" gets `priority`. The simplest implementation: parent counts figures encountered and binds `priority="figureIndex === 0"` per `BlockRenderer` instance — or `BlockRenderer` accepts an `[isFirstFigure]` input. Planner's call.

[CITED: existing `src/content/models/block.ts`] The discriminated union shape is locked. The amendment in Plan 03-01 adds only `width: number; height: number` to `figure` and `pinout` — nothing else changes.

[CITED: 03-UI-SPEC §`BlockRenderer`] The dispatch table here matches UI-SPEC verbatim, including the empty `@case` arms for `sidenote` and `parts-list`.

### Pattern 5: CSR Opt-Out for `/preview/*` (PERF-03)

**What:** `RenderMode.Client` makes Angular emit a CSR shell `index.html` for the route prefix instead of prerendering. The shell hydrates client-side; routing reads `:contentType` and `:token` from `ActivatedRoute` params.

**When to use:** `/preview/:contentType/:token` (and inherited from P2: `/dev/primitives`).

**Concrete file:** Single new component `src/app/pages/preview-stub/preview-stub.page.ts` reads `inject(ActivatedRoute)`, displays the locked editorial copy from UI-SPEC §Copywriting, and includes a small `<pre>` showing the received params for the P4 author to verify wiring. **Does NOT call `ContentApi`** in P3 (mock has no preview tokens).

**Why this is not a Node SSR runtime:** `RenderMode.Client` emits a static `index.html` that the browser loads and Angular bootstraps in. There is no Node process at runtime. P2's existing `/dev/primitives` `RenderMode.Client` proves this pattern works on the project's `outputMode: "static"` build.

### Pattern 6: Build-Time Shiki Tokenization (D-SHIKI-01, PRIM-04)

**What:** A Node script reads each fixture's `code` blocks, runs Shiki against the hand-authored theme, and writes the highlighted HTML back as `tokens` field in the same JSON.

**When to use:** `prebuild` script, runs before `ng build`.

**Example:**

```js
// scripts/tokenize-fixtures.mjs
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHighlighter } from 'shiki';

const THEME = JSON.parse(await readFile('src/assets/shiki/arduino-paper.json', 'utf8'));
const LANGS = ['cpp', 'arduino', 'plaintext', 'diff'];

const highlighter = await createHighlighter({
  themes: [THEME],
  langs: LANGS,
  // 'arduino' grammar: register as alias of cpp, OR ship a TM grammar JSON.
  // Planner picks per D-SHIKI-05.
});

async function tokenizeFile(path) {
  const json = JSON.parse(await readFile(path, 'utf8'));
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (node.type === 'code' && typeof node.code === 'string') {
      node.tokens = highlighter.codeToHtml(node.code, {
        lang: node.language === 'arduino' ? 'cpp' : node.language,
        theme: 'arduino-paper',
      });
    }
    Object.values(node).forEach(visit);
  };
  visit(json);
  await writeFile(path, JSON.stringify(json, null, 2) + '\n');
}

const ROOTS = ['lessons','articles','datasheets','schematics']
  .map((d) => `src/assets/mock-data/${d}`);
for (const dir of ROOTS) {
  for (const f of await readdir(dir)) {
    if (f.endsWith('.json')) await tokenizeFile(join(dir, f));
  }
}
```

**Wire into `package.json`:**

```json
{
  "scripts": {
    "prebuild": "node scripts/tokenize-fixtures.mjs",
    "tokenize": "node scripts/tokenize-fixtures.mjs"
  }
}
```

[CITED: https://shiki.style/guide/install] `shiki` exports `createHighlighter` (formerly `getHighlighter`). The `loadTheme()` pattern for custom TM themes is supported via passing the parsed JSON directly into `themes:[…]`.

[ASSUMED] Shiki 3.x's exact API (`createHighlighter` vs `getHighlighter`) — planner verifies at install time. If different, the script's three-line createHighlighter section needs swapping.

### Pattern 7: NgOptimizedImage Discipline (PERF-05, PERF-04 LCP)

**What:** Every `<img>` inside `Figure` and `Pinout` becomes `<img ngSrc="…" [width]="…" [height]="…" [priority]="…">`. Dimensions come from the Block model amendment.

**When to use:** All figure and pinout primitives.

**Example:**

```html
<!-- inside Figure or Pinout primitive template -->
<img [ngSrc]="src()"
     [width]="width()"
     [height]="height()"
     [alt]="alt()"
     [priority]="priority()"
     [loading]="priority() ? 'eager' : 'lazy'" />
```

[CITED: https://angular.dev/api/common/NgOptimizedImage]
- Requires `width` and `height` (or `fill` mode + parent dimensions) — UI-SPEC chooses fixed dimensions, never `fill`.
- `priority="true"` sets `fetchpriority="high"` and `loading="eager"`. Use only on the first above-the-fold image.
- In SSG, the directive emits the right `<img>` markup at prerender; **no IntersectionObserver dependency at build time**.
- `placeholder` is opt-in; UI-SPEC §NgOptimizedImage Rules disables it for v1.
- `sizes` not used in P3 (single rendition; P4 adds with MinIO renditions).

**Image source pipeline for v1:** Local paths only. Fixtures reference `/assets/mock-data/figures/<file>.svg` (or .png/.jpg). No `ImageLoader` needed because Angular's default loader handles relative URLs cleanly. P4 adds a Wagtail-aware `ImageLoader` for `/media/...` URLs.

**Lint enforcement:** `lint-fixtures.mjs` extension verifies `width`/`height` match the file on disk. Manual review at three-breakpoint walk catches accidental hand-rolled `<img>` tags. ESLint's `@angular-eslint` does **not** ship an "img must use ngSrc" rule out of the box; the planner can either add `no-restricted-syntax` matching `<img>` in component templates, or rely on visual review + `lint:js` template-parser scan. Recommend a small custom AST-based `lint-templates.mjs` similar to `lint-fixtures.mjs` if planner wants automated coverage; otherwise manual is acceptable.

### Pattern 8: Lighthouse Gate Mechanics (PERF-04)

**What:** Production build → static file server → `lighthouse` CLI against the locked target lesson, both desktop and mobile profiles.

**Concrete commands:**

```bash
# package.json scripts
"build:prod": "ng build --configuration production",
"serve:dist": "http-server dist/browser -p 4321 --silent",
"lighthouse:lesson": "node scripts/lighthouse-lesson.mjs"
```

```js
// scripts/lighthouse-lesson.mjs (sketch — planner refines)
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const TARGET = 'http://localhost:4321/lessons/pershyi-blymayuchyi-svitlodiod';

async function runLighthouse(profile /* 'desktop' | 'mobile' */) {
  return new Promise((resolve, reject) => {
    const args = [
      TARGET,
      '--output=json',
      `--output-path=lighthouse-${profile}.json`,
      `--preset=${profile === 'desktop' ? 'desktop' : 'perf'}`,
      '--quiet', '--chrome-flags=--headless=new',
      '--only-categories=performance',
    ];
    const p = spawn('lighthouse', args, { stdio: 'inherit' });
    p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`lh ${profile} exit ${c}`))));
  });
}

// (1) start http-server in background, (2) run lighthouse desktop, then mobile,
// (3) parse the two JSON files for LCP/CLS/INP, (4) print PASS/FAIL per gate per profile,
// (5) write a summary line to docs/typography-checklist.md (Performance section).
```

**Thresholds (locked, no tolerance):**
- LCP < 2.5s (lab; CLS-aware; both profiles)
- CLS < 0.1 (both profiles)
- INP < 200ms (lab proxy: `total-blocking-time` / `interactive` — Lighthouse lab does not measure real INP; planner uses TBT < 200ms as the conservative proxy and notes the substitution in `docs/typography-checklist.md`)

[CITED: https://web.dev/articles/inp] INP is a field metric; lab tools surface TBT/INP-proxy. Treat the Lighthouse INP audit (`experimental-interaction-to-next-paint` if present, else TBT) as the gate.

### Pattern 9: Force-en Locale Audit Extension (UKR-06)

**What:** Append a P3 row to `docs/force-en-audit.md` covering every new public route.

**When to use:** Phase-exit audit plan (Plan 03-08 in CONTEXT D-SEQ-01 sequencing).

**Audit additions specific to P3 (new template-touchable Intl callsites):**
- `LessonPage` — published date, read-time number → both go through `formatDateUk`/`formatNumberUk` (already audited in P1+P2 facade).
- `ArticlePage` — published date.
- `LessonLibraryPage` — read-time + difficulty for each row (no Intl on difficulty — it's a value-mapped Ukrainian string, see UI-SPEC §Copywriting).
- `HomePage` — recent-list rows: same date + read-time.
- `DatasheetPage`, `SchematicPage`, `AboutPage`, `NotFoundPage`, `PreviewStubPage` — no template-specific Intl callsites (chrome dates not used).
- 404 reachable via deliberately wrong URL (e.g., `/no-such-thing`).

If the audit walks every route and confirms `<html lang="uk">` survives + dates render Ukrainian + numbers render `1 234,56` + read-time renders `≈ {N} хв` + no English month names → PASS row appended.

### Anti-Patterns to Avoid

- **Calling `inject(ContentApi)` inside `getPrerenderParams()`** — Angular SSG forbids `inject` after `await`. Even if you call before any await, the `ContentApi` token is configured for runtime DI; at build time the right path is `fs`-backed `fixture-loader.ts`. This is why D-PRERENDER-01/02 split them.
- **Dynamic `ComponentFactoryResolver` for block dispatch** — deprecated in modern Angular. Use `@switch` (control flow). The chosen pattern is canonical zoneless idiom.
- **Hand-rolled `<img>` tags after Plan 03-07** — every figure/pinout uses `NgOptimizedImage`. Lint catches missing dimensions; reviewer catches missing directive.
- **`text-align: justify` or `hyphens: auto`** on body prose — locked out by P1 (CLAUDE.md). Don't reintroduce.
- **English month names** — `toLocaleDateString()` without explicit `'uk-UA'` is forbidden by `no-restricted-syntax` ESLint rule (P1 D-28). All formatting goes through `src/lib/intl.ts`.
- **Lorem Ipsum in any new fixture, About page copy, or empty-state string** — P2 D-PRE-05 read-aloud gate applies. Real Ukrainian only.
- **Card grid for `/lessons`** — hard-locked by PROJECT.md Out-of-Scope and 03-UI-SPEC §LessonLibraryPage. Typographic ToC, never cards.
- **Wagtail-grapple, GraphQL, any BE work in P3** — out of scope; the spike at phase exit is empirical contract validation only.
- **Node SSR introduction of any kind** — locked out; if anything looks like it needs SSR, the right answer is more CSR (`/preview/*`-style) or more prerender, never SSR.
- **JS lightbox for schematic click-to-zoom** — UI-SPEC §SchematicPage locks `<a href="…" target="_blank">` — open in new tab is the editorial v1 affordance.
- **`marked` / `markdown-it` / any markdown renderer** — content is already typeset HTML in fixtures (P2 D-PRE-01..05). Use `[innerHTML]` with Angular's default DomSanitizer.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slug enumeration for prerender | Custom directory walker per route | `node:fs/promises` `readdir` in a single `fixture-loader.ts` | One source of truth, < 30 LoC, no library needed |
| Image dimension lookup at lint | Manual measurement, hardcoded constants | `image-size` (or equivalent zero-dep PNG/JPG/SVG header reader) | These are 5-line public APIs; rolling your own SVG header parser is silly |
| Syntax highlighting | Regex-based tokenizer | Shiki 3.x | TextMate grammars are battle-tested across millions of repos via VS Code; regex never matches |
| Image optimization | Custom `srcset` generator | `NgOptimizedImage` | Already locked by PERF-05; directive handles `fetchpriority`, `loading`, `decoding`, dimension assertions, dev warnings |
| Locale formatting | Direct `toLocale*` calls | `src/lib/intl.ts` facade (P1 D-28) | Single audit point; ESLint rule blocks bare `toLocale*` |
| 404 page emission | Custom build hook to copy a static file | Wildcard route `**` with `RenderMode.Prerender` in `serverRoutes` | Angular emits `dist/browser/404.html` automatically |
| Static file serving for Lighthouse run | Custom HTTP server | `http-server` (`pnpm exec http-server`) or `npx serve` | One-liner; widely used; no maintenance |
| Lighthouse runner | Manual `chrome-launcher` + report parsing | `lighthouse` CLI (or `@lhci/cli` if richer assertion needed) | The CLI has battle-tested defaults |
| TM theme | Picking one of Shiki's stock themes and overriding | Hand-authored `arduino-paper.json` (D-SHIKI-02) | Locked by UI-SPEC; stock themes have chromatic alarm |
| Page-title wiring | Custom service | Angular Router `title` field on each route | Already used in P1 routes |

**Key insight:** P3 is gluing existing pieces. Anywhere it feels like you need to invent, you're probably duplicating P1 or P2. Look there first.

## Runtime State Inventory

P3 is **greenfield + amendment** — not a rename or migration. Skipping the formal table; the only state-touching actions are:

- **Stored data:** None — fixtures are read-only inputs; `code.tokens` cache field is regeneratable.
- **Live service config:** None — no external services in P3.
- **OS-registered state:** None.
- **Secrets/env vars:** None — P3 introduces no env-driven config.
- **Build artifacts:** `dist/browser/` is fully regeneratable; the `code.tokens` field embedded in fixtures via `prebuild` is the only "build artifact stored in source" — explicitly designed as cache (D-SHIKI-03).

The Block model amendment (`width`/`height` on figure + pinout) does require a one-time data migration of existing fixtures — handled inside Plan 03-01 by `lint-fixtures.mjs` + manual `width`/`height` insertion into the seven fixtures' figure/pinout blocks, gated by the new lint rule.

## Common Pitfalls

### Pitfall A: `inject()` after `await` in `getPrerenderParams`

**What goes wrong:** Build crashes with `NG0203: inject() must be called from an injection context`.
**Why it happens:** Angular's SSG calls `getPrerenderParams` outside the normal injection context that components get. `inject()` works only synchronously, before any `await`.
**How to avoid:** Don't `inject(ContentApi)` here. Use the pure `fixture-loader.ts` functions — they're plain `fs` calls and need no injector.
**Warning signs:** `NG0203` in the prerender output; or worse, silent prerender failure for one route.
[CITED: https://angular.dev/guide/ssr] Documents the synchronous-`inject` constraint.

### Pitfall B: `MockContentApi.fetch('/assets/...')` fails at build time

**What goes wrong:** If a page template calls `inject(ContentApi).getLesson(slug)` during prerender, and the implementation is `MockContentApi` using `fetch('/assets/mock-data/...')`, the build crashes because `fetch` against a relative URL has no base in Node.
**Why it happens:** `MockContentApi` was built for the browser runtime in P2.
**How to avoid:** Either (a) the page template uses a build-time-aware ContentApi provider that delegates to `FixtureContentSource` at build and to `MockContentApi` at runtime — D-PRERENDER-02 hints at this with "the prerender helper accepts a `ContentSource`", or (b) refactor `MockContentApi` to call `FixtureContentSource` internally so a single implementation works in both environments. Option (b) is the planner's likely choice — simpler DI, single code path.
**Warning signs:** `TypeError: Failed to parse URL` at prerender time.

### Pitfall C: Lighthouse INP measurement vs lab tooling

**What goes wrong:** Lighthouse lab can't measure real INP — it's a field metric. The audit reports a proxy.
**How to avoid:** Use TBT (`total-blocking-time`) or `experimental-interaction-to-next-paint` from Lighthouse, with a 200ms lab threshold as a conservative proxy. Document the substitution in `docs/typography-checklist.md` Performance section so future audits stay consistent.
[CITED: https://web.dev/articles/inp] INP is a field metric; lab proxy is documented as TBT for solo-dev pacing.

### Pitfall D: Shiki bundle accidentally included in client

**What goes wrong:** A casual `import { codeToHtml } from 'shiki'` inside an Angular component balloons the client bundle by 1–2 MB.
**Why it happens:** Shiki is normal ESM; nothing technically prevents an Angular import.
**How to avoid:** Shiki is consumed **only** from `scripts/tokenize-fixtures.mjs` (Node-side). The `CodeBlock` primitive consumes the pre-rendered `tokens` HTML string. ESLint can enforce this via a `no-restricted-imports` rule blocking `shiki` from `src/**`. Recommend the planner add this rule to the Shiki integration plan (Plan 03-06).
**Warning signs:** `dist/browser/main.*.js` jumps unexpectedly after Plan 03-06.

### Pitfall E: NgOptimizedImage warns at runtime → CLS spike

**What goes wrong:** Console warnings ("oversized image", "missing width/height") that look benign but cause real CLS or LCP misses.
**Why it happens:** A figure was hand-rolled, or a fixture's `width`/`height` doesn't match the asset.
**How to avoid:** `lint-fixtures.mjs` image-dimension verification (D-AMEND-02) catches mismatches at commit time. Lighthouse run catches anything missed.
**Warning signs:** Dev console NgOptimizedImage warnings; CLS audit row > 0.1.

### Pitfall F: Wagtail spike runs before 2026-05-04

**What goes wrong:** Trying to install Wagtail 7.4 LTS before the LTS release branch is out gives you a 7.3 fallback or an unstable nightly.
**How to avoid:** Plan 03-09 explicitly checks the date. The CONTEXT D-SEQ-02 says "cannot run before 2026-05-04". Today is 2026-05-01 — plan can be written, executed only on/after 2026-05-04.
**Warning signs:** `pip install wagtail==7.4.*` resolves to a non-final tag.

### Pitfall G: `<title>` and `<html lang>` mismatch in CSR shell for `/preview/*`

**What goes wrong:** The CSR shell's `index.html` is a generic Angular template; without explicit override, `<title>` shows the default and `<html lang>` may follow the configured root setting only if `index.html` has `lang="uk"` (P1 already locked this).
**How to avoid:** Verify `src/index.html` has `<html lang="uk">` (already true since P1). The CSR shell inherits this. The PreviewStubPage component uses Angular's `Title` service to set `<title>Попередній перегляд — Arduino UA</title>` after bootstrap.
**Warning signs:** Force-en audit row for `/preview/...` shows `<title>` in English or `<html lang>` missing.

### Pitfall H: `dist/server/` lingers after `outputMode: "static"` build

**What goes wrong:** Some Angular versions emit `dist/server/` artifacts even in static mode and rely on the build pass to strip them. If `ng build` is interrupted or a custom builder runs, `dist/server/` survives — looking like a Node SSR runtime is required.
**How to avoid:** Build-output verification step (PERF-06): after `pnpm build`, run `test ! -d dist/server || (ls dist/server/ && exit 1)` (or equivalent) to fail loudly if the directory exists. Add to Plan 03-05 verification.
**Warning signs:** `dist/server/main.js` present in a production build.

### Pitfall I: Ukrainian read-time pluralization

**What goes wrong:** Treating `хв` like English `min`/`mins` and pluralizing for 1/2/5/22.
**How to avoid:** `хв` is the **invariant abbreviation** for `хвилина` in Ukrainian — same form regardless of count (cf. `см`, `кг`). UI-SPEC §Copywriting locks the format `≈ {N} хв`. No `Intl.PluralRules` needed. If the project ever decides to spell it out (`12 хвилин` vs `1 хвилина` vs `22 хвилини`), `Intl.PluralRules('uk-UA')` resolves the three Ukrainian plural categories (`one`, `few`, `many`/`other`) — but P3 stays with the abbreviation.
[CITED: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules] Ukrainian uses three plural categories.

## Code Examples

### Read-time formatting (PAGE-05 + LessonPage meta)

```ts
// usage from a page template
import { formatNumberUk } from '../../../lib/intl';

readTimeLabel = computed(() =>
  `≈ ${formatNumberUk(this.lesson()?.estimatedMinutes ?? 0)} хв`
);
```

`formatNumberUk(7)` → `"7"`. `formatNumberUk(1234)` → `"1 234"` with NBSP. UI-SPEC's `≈ {N} хв` is the literal output.

### Difficulty value mapping

```ts
// per UI-SPEC §Copywriting — beginner → "початківець", intermediate → "проміжний"
const DIFFICULTY_UK = { beginner: 'початківець', intermediate: 'проміжний' } as const;

difficultyLabel = computed(() => DIFFICULTY_UK[this.lesson()?.difficulty ?? 'beginner']);
```

### Date formatting

```ts
// per UI-SPEC §Copywriting — published date long form via formatDateUk
import { formatDateUk } from '../../../lib/intl';

publishedAtLabel = computed(() => {
  const iso = this.lesson()?.publishedAt;
  return iso ? formatDateUk(new Date(iso)) : '';
});
// formatDateUk uses { dateStyle: 'long', timeZone: 'Europe/Kyiv' } → "30 квітня 2026 р."
```

[VERIFIED: `src/lib/intl.ts`] `formatDateUk` defaults to `{ dateStyle: 'long', timeZone: 'Europe/Kyiv' }`.

### Prev/next navigation lookup

The Lesson model already carries `prevSlug?` and `nextSlug?`. The lesson template binds those directly — no ContentApi method needed:

```ts
@if (lesson()?.prevSlug) {
  <a [routerLink]="['/lessons', lesson()!.prevSlug]">
    <span class="prev-label">← Попередній урок</span>
    <!-- Title would come from a list lookup; see note below -->
  </a>
}
```

**However** — the prev/next nav (UI-SPEC §LessonPage) requires showing the **title** of the prev/next lesson, not just the slug. The lesson fixture only carries the slug. Two viable options:

1. **Inline both titles in fixtures** — extend the Lesson model with `prevTitle?: string` and `nextTitle?: string`. Cheap, denormalized; mock-friendly; the Wagtail spike confirms or rejects this shape.
2. **Resolve via `ContentApi.listLessons()`** — page template fetches the index, finds prev/next entries by slug, reads their titles. More normalized; works at prerender time because `listLessons()` is fast.

Either works. Recommend **option 2** — keeps the contract minimal and avoids fixture redundancy. Planner picks; both are within the existing ContentApi surface.

### Difficulty + read-time meta line

```html
<!-- lesson.page.html (excerpt) -->
<div class="meta">
  <span>{{ difficultyLabel() }}</span>
  <span class="sep"> · </span>
  <span>≈ {{ formatNumberUk(lesson()!.estimatedMinutes) }} хв</span>
  <span class="sep"> · </span>
  <span>{{ publishedAtLabel() }}</span>
</div>
```

The `· ` separator must be wrapped in `&nbsp;` on either side to honor UI-SPEC's NBSP rule. SCSS or template-level `&nbsp;·&nbsp;` literal is the simplest realization.

### Building output dimensions verification (PERF-06)

```bash
# In the phase-exit verification plan
pnpm build
# 1. Confirm dist/server/ is gone or empty
test ! -d dist/server || (echo "FAIL: dist/server/ exists" && ls dist/server && exit 1)
# 2. Count prerendered HTML files vs route declarations
find dist/browser -name 'index.html' -o -name '404.html' | wc -l
# Expected: 1 (root) + 1 (lessons) + 1 (about) + N(lessons) + M(articles) + K(datasheets) + L(schematics)
#          + 1 (404.html) + 1 (preview shell, name varies) + 1 (dev/glyph-audit) + 1 (dev/primitives shell) — sum into a deterministic count from fixture-loader counts.
# 3. Confirm no .js bundle accidentally pulls Shiki
grep -l 'shikijs\|@shikijs/' dist/browser/*.js && echo "FAIL: Shiki in client bundle" && exit 1 || echo "PASS: no Shiki in client"
```

## Page-by-Page Template Notes

The 03-UI-SPEC fully specifies each template. This research adds only **execution-time gotchas**:

- **`HomePage`** — currently exists (P1) as a placeholder home. Plan reshapes it into the UI-SPEC HomePage (hero + recent lessons + recent articles + entry-points paragraph). Reuse the file path `src/app/pages/home/`.
- **`LessonPage`** — heaviest template. Builds first (D-SEQ-03). Sidenote + parts-list extracted into the margin slot; `BlockRenderer` body iteration filters them out (`.filter(b => b.type !== 'sidenote' && b.type !== 'parts-list')`). The TwoColumn measurement debounce (P2: 50ms) handles the rest.
- **`LessonLibraryPage`** — typographic ToC. **No card grid.** UI-SPEC locks the row visual: `01.` accent number + title + meta line. The empty-state path (when `listLessons()` returns `[]`) renders an editorial `<aside>` with locked Ukrainian copy.
- **`ArticlePage`, `DatasheetPage`, `SchematicPage`** — structural simplifications of LessonPage. Each consumes `BlockRenderer` for body rendering.
- **`AboutPage`** — content is hand-authored as inline TS template constants (NOT a fixture). 4–6 Ukrainian paragraphs drafted in execution, P2 D-MOCK-01 read-aloud gate applies.
- **`NotFoundPage`** — wildcard `**` route. Renders `404` numeral + accent hairline rule + lede + body. Centered vertically via `min-height: calc(100vh - …); display: grid; place-content: center;`.
- **`PreviewStubPage`** — CSR-only. Reads `:contentType` and `:token` from `ActivatedRoute` params, renders editorial panel with locked Ukrainian copy; the params are echoed in a small `<pre>` for P4 author wiring verification. **Must NOT call `ContentApi`** in P3.

## Wagtail 7.4 StreamField Spike Protocol

> Plan 03-09. **Cannot run before 2026-05-04.** Today is 2026-05-01.

**Goal:** Empirically validate that the FE `Block.code` shape `{language, code, annotations: {line, html}[]}` is byte-compatible with what Wagtail 7.4 LTS REST API v2 emits for the equivalent StreamField.

**Throwaway project setup (60 minutes total budget):**

```bash
# Outside the main repo — a separate folder, NEVER committed
mkdir -p /tmp/wagtail-spike && cd /tmp/wagtail-spike
uv init && uv add 'wagtail==7.4.*' 'django==5.2.*' 'psycopg[binary]==3.2.*' pillow

# Bootstrap a Wagtail project (5–10 min)
uv run wagtail start spike .
# Edit spike/settings/base.py — set LANGUAGE_CODE='uk', USE_TZ=True, TIME_ZONE='Europe/Kyiv'
# Switch to SQLite for the spike (no Postgres needed for 30-min spike).

# Define a single page model (10 min) — home/models.py:
```

```python
# /tmp/wagtail-spike/home/models.py
from wagtail import blocks
from wagtail.fields import StreamField
from wagtail.models import Page

class CodeBlock(blocks.StructBlock):
    language = blocks.ChoiceBlock(choices=[
        ('cpp', 'C++'), ('arduino', 'Arduino'),
        ('plaintext', 'Plain'), ('diff', 'Diff'),
    ])
    code = blocks.TextBlock()
    annotations = blocks.ListBlock(
        blocks.StructBlock([
            ('line', blocks.IntegerBlock()),
            ('note', blocks.RichTextBlock()),
        ])
    )

class FigureBlock(blocks.StructBlock):
    image_src = blocks.CharBlock()  # spike: skip ImageChooser, just a URL
    alt = blocks.CharBlock()
    width = blocks.IntegerBlock()
    height = blocks.IntegerBlock()

class HomePage(Page):
    body = StreamField([('code', CodeBlock()), ('figure', FigureBlock())], use_json_field=True)
    content_panels = Page.content_panels + ['body']
    api_fields = ['body']
```

```python
# /tmp/wagtail-spike/spike/api.py
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.api.v2.router import WagtailAPIRouter
api_router = WagtailAPIRouter('wagtailapi')
api_router.register_endpoint('pages', PagesAPIViewSet)

# spike/urls.py — wire api_router under /api/v2/
```

```bash
uv run python manage.py migrate
uv run python manage.py createsuperuser   # answer prompts quickly
uv run python manage.py runserver
```

In Wagtail admin (`http://localhost:8000/admin/`):
- Create one HomePage with one CodeBlock containing 2 lines of code + 1 annotation `{line: 1, note: "Some <em>rich</em> text"}` and one FigureBlock.
- Save + publish.

```bash
# Capture the API response
curl -s 'http://localhost:8000/api/v2/pages/3/?fields=body' | python -m json.tool > spike-response.json
```

**Validation gate (PASS/FAIL):**

Open `spike-response.json` and inspect the `body` array. Expected shape (per Wagtail conventions [CITED: https://docs.wagtail.org/en/stable/advanced_topics/api/v2/configuration.html]):

```json
{
  "body": [
    {
      "type": "code",
      "value": {
        "language": "cpp",
        "code": "void setup() {}\nvoid loop() {}",
        "annotations": [
          { "line": 1, "note": "<p>Some <em>rich</em> text</p>" }
        ]
      },
      "id": "<uuid>"
    },
    {
      "type": "figure",
      "value": {
        "image_src": "/...",
        "alt": "...",
        "width": 800,
        "height": 600
      },
      "id": "<uuid>"
    }
  ]
}
```

**FE model comparison (`src/content/models/block.ts`):**
- FE `Block.code = { type: 'code', language, code, annotations: [{line, html}], … }`
- Wagtail emits `{ type: 'code', value: { language, code, annotations: [{line, note}] }, id }`

**Two structural deltas the spike must surface:**

1. **`value` envelope.** Wagtail wraps each block in `{type, value, id}`. The FE model does not currently have this envelope — `Block` is `{type, …fields}` flat. **Decision required at spike close:**
   - Option A (FE adapts): Refactor `Block` to `{type, id?, ...inline fields}` and a P4 adapter strips Wagtail's `value` envelope. Cheap.
   - Option B (BE adapts): Custom Wagtail serializer flattens `value` into the parent. More BE work; preserves FE simplicity.
   - **Recommended (per CONTEXT D-SEQ-02 design-freeze principle):** Option A — adapt FE because the spike's purpose is to lock the FE contract before P4 BE work begins. A thin P4 adapter is a 5-line transform. Document this in the spike report.

2. **`note` vs `html`.** Wagtail's `RichTextBlock` field is named whatever you call it in the Python `StructBlock` — `note` here. The FE model uses `html`. Two paths:
   - Rename FE field from `html` to `note` (touches Block model + every fixture's annotations field + `CodeBlock` primitive's input + every reference). Manageable; ~7 fixtures.
   - Rename Wagtail field from `note` to `html` (touches one Python class). Manageable.
   - **Recommended:** Rename FE `html` → `note` **inside the spike close commit**, before P3 phase exits. This keeps Wagtail Python model semantically clean (`note` is the right name for "the annotation note"; `html` is the implementation detail of how it's serialized). Captured as the spike's deliverable change.

**Spike artifact:** `.planning/phases/03-page-templates-routing-static-build/wagtail-spike-report.md` — captured `spike-response.json` (or excerpt), structural diff, decisions A/B for each delta, PASS/FAIL verdict per CONTRACT-02. Spike folder under `/tmp/wagtail-spike` is deleted.

**The FE-contract immutability lock:** After this spike report passes, the FE model becomes immutable across P3 → P4. P4 BE conforms to it.

[ASSUMED] The exact Wagtail v2 API output for nested `StructBlock` + `ListBlock` was not retrievable from documentation in this research session. The shape above is consensus expectation from Wagtail community / `LearnWagtail` writeups [CITED: https://learnwagtail.com/tutorials/headless-cms-serializing-richtext-blocks/]. The spike's purpose is to *empirically* verify it. Treat any divergence between this expected shape and the actual spike output as findings, not failures — that's the point.

[ASSUMED] `RichTextBlock` serializes to its expanded HTML representation by default in v2 API. Wagtail's `expand_db_html` may need to be invoked via a custom serializer for nested blocks; the spike must verify.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `*ngFor` / `*ngIf` template directives | `@for` / `@if` / `@switch` control flow | Angular 17 stable, default in 21 | P3 templates use `@switch` — already idiomatic |
| `ComponentFactoryResolver` + `ViewContainerRef` for dynamic dispatch | `@switch` on discriminated-union tag | Angular 17 control flow + signals | `BlockRenderer` uses `@switch`, no factory needed |
| `provideClientHydration()` for SSR | `outputMode: "static"` with no hydration | Angular 19+ static mode | P1 D-26 already locked: no hydration registered |
| `@nguniversal/express-engine` for SSR | `@angular/ssr` with `RenderMode` per route | Angular 17/18 unification | Already on `@angular/ssr` 21.2.9 |
| `getHighlighter` (Shiki ≤2.x) | `createHighlighter` (Shiki 3.x) | Shiki 3 release | Tokenize script uses `createHighlighter` |
| `@shikijs/transformers` `transformerNotationDiff` for diff markers | Project's own `CodeBlock` diff via component inputs | UI-SPEC D-SHIKI: **don't** use the transformers — diff is a layout decision, not a syntax decision | `@shikijs/transformers` may be skipped entirely |

**Deprecated/outdated in this codebase context:**
- Anything referencing `Zone.js` patterns — locked out by zoneless from P1.
- `[innerHTML]` pipelining of full lesson bodies — already typed as `Block[]` in P2, never resurface.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Shiki 3.x exposes `createHighlighter` (vs older `getHighlighter`) | Pattern 6 | Tokenize script needs API name swap — 3-line change, no impact on architecture |
| A2 | Wagtail 7.4 v2 API emits `{type, value, id}` envelope for StreamField blocks | Wagtail Spike Protocol | None — spike's empirical purpose is to verify. Divergence is the deliverable, not a failure |
| A3 | `RichTextBlock` serializes to expanded HTML by default in v2 API | Wagtail Spike Protocol | Spike may need to install custom serializer; budget allows the 60-min timebox to absorb a 10-min serializer add |
| A4 | `image-size` / equivalent zero-dep image-header reader handles SVG via XML parse + viewBox | Pattern 7 / D-AMEND-02 | If chosen lib doesn't support SVG, fallback is a 20-line custom SVG `viewBox` regex; planner picks lib accordingly |
| A5 | Lighthouse INP audit (lab) is unavailable; TBT is the conservative proxy | Pattern 8 | If newer Lighthouse exposes a lab INP audit, swap the metric; doesn't change the gate philosophy |
| A6 | Angular 21's `@angular/ssr` `outputMode: "static"` cleanly strips `dist/server/` after prerender | Pitfall H | If a build version regression leaves `dist/server/`, Plan 03-05 verification step catches it before phase exit |
| A7 | NgOptimizedImage default loader handles relative `/assets/...` paths without an `ImageLoader` | Pattern 7 | If not, the planner adds a tiny no-op `ImageLoader` provider; small change |
| A8 | The Lesson model currently does NOT carry `prevTitle`/`nextTitle` and the planner uses `listLessons()` lookup pattern instead | Code Examples — prev/next | If the planner picks the inlined-titles option instead, the spike still passes; this is a Claude's-discretion item |

**The spike is *expected* to falsify A2 and A3 in some way. That's its job. The plan must allocate 10–15 min of the 60-min spike budget to writing the structural-delta findings into the report.**

## Open Questions (RESOLVED)

1. **Exact Shiki 3.x API for custom TM theme loading**
   - What we know: `createHighlighter({themes:[...]})` accepts theme JSON objects directly.
   - What was unclear: Whether Shiki 3.x renames `loadTheme` or accepts inline JSON for custom themes via a different method.
   - RESOLVED: Use `createHighlighter({themes:[themeJson], langs:['cpp']})` with the theme JSON imported via `node:fs/promises`. Plan 03-08 Task 1 includes a `node --eval` smoke test against `shiki@latest` at install time to confirm the API name; if `getHighlighter` is the current export instead, swap the call site (one-line change). 5-min budget already allocated in 03-08.

2. **`arduino` language registration in Shiki**
   - What we know: VS Code's Arduino extension uses a TextMate grammar that aliases to C++.
   - What was unclear: Whether Shiki 3.x ships an `arduino` grammar by default or whether it must be aliased.
   - RESOLVED: Register `arduino` as a `cpp` alias in the highlighter config (`langAlias: { arduino: 'cpp' }`). Tokenization output is identical for `setup()`/`loop()`/`pinMode()` etc. Arduino-specific keyword highlighting is deferred to Phase 6 polish if the editorial review demands it.

3. **Image dimension lint for SVG fixtures**
   - What we know: PNG/JPG headers carry width/height in the first 24 bytes; `image-size` handles them.
   - What was unclear: SVG dimensions are encoded in `<svg width="…" height="…">` or `viewBox`. Some pure-JS image-size readers handle SVG; others don't.
   - RESOLVED: Use the `image-size` npm package (current major supports SVG via `viewBox` parsing). Plan 03-01 Task 2 pins the version and verifies SVG support against the `pinout-led.svg` fixture as part of the lint extension's smoke test.

4. **Whether to use Angular Title service or route `data.title` for `<title>`**
   - What we know: `app.routes.ts` already uses route `title:` field for static routes (P1 P2 pattern).
   - What was unclear: For dynamic routes, the title needs to interpolate the lesson/article title; the route-level static `title:` doesn't support this.
   - RESOLVED: Use `inject(Title).setTitle(\`${doc.title} — Arduino Hub\`)` inside each dynamic page component (Lesson/Article/Datasheet/Schematic) after the resolved data is bound. Matches Angular 21 idiom. Static routes (home, library, about, 404) keep the route-level `title:` field.

5. **Shiki theme background and CSS variable resolution**
   - What we know: Shiki theme JSON encodes hex colors. SCSS variables are evaluated at FE build, not at fixture-tokenize time.
   - What was unclear: How to keep `arduino-paper.json` colors in sync with `--color-paper`/`--color-ink` tokens.
   - RESOLVED: Hand-author `src/assets/shiki/arduino-paper.json` with **fixed** hex values matching the P1 resolved token values (`#FAF7F2` paper, `#1B1B1B` ink, plus the syntax palette listed in 03-UI-SPEC §Shiki spec). Document the sync rule in `docs/typography-checklist.md` Phase 3 section: any change to `_color.scss` paper/ink values requires a matching edit to `arduino-paper.json` in the same commit. Single-file edit, surfaced by code review.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 20.19+ / 22.x | Angular 21, Shiki, all build scripts | Likely (project already builds) | check via `node --version` | none — required |
| pnpm 10.x | Package management (locked in P1) | Likely (project already uses pnpm) | check via `pnpm --version` | none |
| Chrome/Chromium for Lighthouse | `lighthouse` CLI headless run | macOS dev environment usually has Chrome installed; CI N/A (manual run) | check via `which google-chrome` or `which chromium` | If missing, install Chrome OR use `puppeteer`-bundled Chromium |
| Python 3.13 + uv (for Wagtail spike only) | Plan 03-09 spike, on/after 2026-05-04 | check via `uv --version` | If missing, install uv |
| Internet access at spike time | `pip install wagtail==7.4.*` | check at spike time | none — required |

**Missing dependencies with no fallback:** None expected on the dev machine.

**Verification step before Plan 03-09 execution:** confirm Wagtail 7.4 LTS is published. Check `pip index versions wagtail` (or PyPI) for a non-pre-release `7.4.0`.

## Validation Architecture

> `nyquist_validation` is `false` in `.planning/config.json`. This section is included per the user's explicit request in the research brief, so a Nyquist VALIDATION.md can be derived later if the workflow flag is flipped.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (Angular 21 default) |
| Config file | inherited from Angular CLI (`projects.arduino-hub.architect.test.options.tsConfig = tsconfig.spec.json`) |
| Quick run command | `pnpm test` (runs both arduino-hub + core-ui specs once) |
| Full suite command | `pnpm test && pnpm lint && node scripts/lint-fixtures.mjs` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-01 | LessonPage renders title, deck, parts list, prev/next | unit (DOM) | `pnpm test` (after Plan 03-04 adds `lesson.page.spec.ts`) | ❌ Wave 0 |
| PAGE-02 | ArticlePage renders without parts/prev/next | unit (DOM) | `pnpm test` | ❌ Wave 0 (or visual showcase) |
| PAGE-03 | DatasheetPage renders specs `<dl>` | unit (DOM) | `pnpm test` | ❌ Wave 0 (or visual showcase) |
| PAGE-04 | SchematicPage exposes download link + click-to-zoom | unit (DOM) | `pnpm test` | ❌ Wave 0 (or visual showcase) |
| PAGE-05 | LessonLibrary renders typographic ToC, NOT card grid | unit (DOM negative — no `.card` class) | `pnpm test` | ❌ Wave 0 |
| PAGE-06 | HomePage renders recent-3 + recent-2 from listLessons/listArticles | unit (DOM) | `pnpm test` | ❌ Wave 0 |
| PAGE-07 | AboutPage renders 4–6 paragraphs | manual (read-aloud per D-MOCK-01) | n/a | manual gate |
| PAGE-08 | NotFoundPage at `/no-such-thing` shows 404 numeral | unit (router) | `pnpm test` | ❌ Wave 0 |
| PAGE-09 | All 9 routes resolvable via Router | unit (router config) | `pnpm test` | ❌ Wave 0 |
| PAGE-10 | BlockRenderer dispatches each Block.type to expected primitive | unit (DOM, parameterized over all 9 types) | `pnpm test` | ❌ Wave 0 — highest test value |
| PAGE-11 | All pages use `inject(ContentApi)`, never `HttpClient` directly | static (grep) | `! grep -r "HttpClient" src/app/pages/` | inline check, no file |
| CONTRACT-02 | CodeBlock contract spike PASS | manual (spike report PASS verdict) | n/a | manual gate |
| PERF-01 | `outputMode: "static"` configured, no Node SSR runtime | static (build output verification) | `test ! -d dist/server` after `pnpm build` | inline check |
| PERF-02 | Every dynamic route has `getPrerenderParams`; HTML count matches fixture count | static (build output verification) | `find dist/browser -name 'index.html' \| wc -l` vs expected | inline check |
| PERF-03 | `/preview/*` is `RenderMode.Client`; no prerendered file | static | `test ! -f dist/browser/preview/index.html` (or matches CSR shell shape) | inline check |
| PERF-04 | LCP<2.5s, CLS<0.1, INP-proxy<200ms on target lesson | manual (Lighthouse gate) | `pnpm lighthouse:lesson` | manual gate |
| PERF-05 | NgOptimizedImage on every figure/pinout, dimensions match disk | static (lint) | `node scripts/lint-fixtures.mjs` (extended) | extended in Plan 03-01 |
| PERF-06 | Static build = HTML/JS/CSS/woff2 only | static | `pnpm build && ! grep -l 'shikijs\|@shikijs/' dist/browser/*.js` | inline check |

### Sampling Rate

- **Per task commit:** `pnpm lint && pnpm test --run`
- **Per plan merge:** `pnpm lint && pnpm test && pnpm build && test ! -d dist/server`
- **Phase gate (before `/gsd-verify-work` and Wagtail spike):** Full suite + `pnpm lighthouse:lesson` PASS desktop & mobile + force-en audit row PASS + 3-breakpoint walk PASS

### Wave 0 Gaps

- [ ] `src/app/blocks/block-renderer/block-renderer.component.spec.ts` — covers PAGE-10 (parameterized over Block types)
- [ ] `src/app/pages/lesson/lesson.page.spec.ts` — covers PAGE-01 (title, deck, parts list extraction, prev/next)
- [ ] `src/app/pages/lesson-library/lesson-library.page.spec.ts` — covers PAGE-05 (typographic ToC negative)
- [ ] `src/app/pages/not-found/not-found.page.spec.ts` — covers PAGE-08
- [ ] `src/app/app.routes.spec.ts` — covers PAGE-09 (all 9 routes resolvable)
- [ ] `scripts/lint-fixtures.mjs` extension — covers PERF-05 dimension verification
- [ ] `scripts/lighthouse-lesson.mjs` — covers PERF-04 manual gate
- [ ] `scripts/tokenize-fixtures.mjs` — covers Shiki integration (Plan 03-06)
- [ ] Build-output verification step in Plan 03-05 — covers PERF-01, PERF-02, PERF-03, PERF-06

*(Framework install: none — Vitest already configured.)*

## Sources

### Primary (HIGH confidence)
- [VERIFIED: `package.json`, `angular.json`, `src/app/app.routes.server.ts`, `src/lib/intl.ts`, `src/content/api/*`, `src/content/models/block.ts`] Existing P1+P2 code is the authoritative source for the project's locked patterns.
- [CITED: https://angular.dev/guide/ssr] Angular 21 SSG / `RenderMode` / `getPrerenderParams` API.
- [CITED: https://angular.dev/api/common/NgOptimizedImage] NgOptimizedImage required attributes and behaviors.
- [CITED: https://shiki.style/guide/install] Shiki 3.x `createHighlighter` install.
- [CITED: 03-CONTEXT.md, 03-UI-SPEC.md] Locked decisions for the phase — primary source for design+sequencing+gate constraints.
- [CITED: `.planning/research/STACK.md`, `.planning/research/PITFALLS.md`] Project-wide stack research and Pitfalls 10/12/15/19 directly relevant.

### Secondary (MEDIUM confidence)
- [CITED: https://learnwagtail.com/tutorials/headless-cms-serializing-richtext-blocks/] Wagtail v2 API StreamField serialization conventions; community writeup. To be empirically verified by the Plan 03-09 spike.
- [CITED: https://web.dev/articles/inp] INP is a field metric; lab-tooling proxy substitution is the canonical Web Vitals 2026 stance.
- [CITED: https://docs.wagtail.org/en/stable/advanced_topics/api/v2/configuration.html] Wagtail v2 API basic configuration.

### Tertiary (LOW confidence — flagged for spike or runtime verification)
- Wagtail 7.4 LTS exact final release-date API surface — must be confirmed on/after 2026-05-04.
- Shiki 3.x exact final API name (`createHighlighter` vs older `getHighlighter`) — verified at `pnpm add` time.
- Lighthouse 12.x lab `experimental-interaction-to-next-paint` audit availability — verified at first `pnpm lighthouse:lesson` run.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Angular 21 + zoneless + outputMode:static is verified in repo; Shiki 3.x + NgOptimizedImage + Lighthouse are well-documented.
- Architecture: HIGH — patterns extend P1 D-26 (no hydration) and P2 RenderMode.Client precedent; nothing architecturally new.
- Pitfalls: HIGH — Pitfalls 10/12/15/19 from project research already mapped, plus 9 P3-specific gotchas surfaced by code-tracing the prerender path.
- Wagtail spike outcome: MEDIUM — empirical step by definition; assumptions documented and the 60-min budget includes time to write up the structural deltas.

**Research date:** 2026-05-01
**Valid until:** 2026-06-01 for the SSG mechanics; the Wagtail spike portion is bounded — re-verify on 2026-05-04 (Wagtail 7.4 LTS release) and at spike-execution time.
