# Phase 3: Page Templates, Routing & Static Build — Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up all eight public page templates (`LessonPage`, `ArticlePage`, `DatasheetPage`, `SchematicPage`, `LessonLibraryPage`, `HomePage`, `AboutPage`, `NotFoundPage`) plus the `/preview/*` CSR stub, the global `SiteHeader`/`SiteFooter`/`SiteNav` chrome, the `BlockRenderer` dispatcher, the routing surface and `getPrerenderParams()` plumbing for SSG output, the Shiki build-time syntax-highlighting integration, the `NgOptimizedImage` swap (with the `width`/`height` Block-model amendment), the Lighthouse performance gate on a representative lesson, and the 30–60 minute Wagtail 7.4 StreamField spike at phase exit.

Phase 3 does **not** ship any backend (`MockContentApi` continues to serve), real preview-token wiring, drop caps / hanging punctuation / glossary tooltips / pin cross-refs / figure cross-refs / RSS / JSON-LD / OG tags / print stylesheet / dark mode / `/articles` library page / WCAG AA full audit. Those belong to P4–P6.

</domain>

<decisions>
## Implementation Decisions

The 03-UI-SPEC.md (APPROVED 2026-05-01) locks ~95% of design decisions: chrome composition, all eight templates, routing table, copywriting strings, color additions (entries 8–15 of accent reserve), layout tokens (`--header-height`, `--header-pad-block`, `--footer-pad-block`, `--toc-rail-width`, `--lesson-row-gap`, `--page-section-gap`), `BlockRenderer` dispatch table, Shiki theme principle (no chromatic alarm), NgOptimizedImage rules, Lighthouse thresholds, and the 12 open decisions carried forward (§"Open Decisions Carried Forward"). This CONTEXT.md captures only the implementation gray areas the UI-SPEC explicitly defers.

### Plan Sequencing & Spike Timing

- **D-SEQ-01:** Plan ordering is **foundation-first** and linear:
  1. Block model amendment + fixture migration + lint extension
  2. Chrome — `SiteHeader`, `SiteFooter`, `SiteNav` slotted into `PageShell`
  3. `BlockRenderer` dispatcher
  4. Page templates — `LessonPage` first (heaviest: TwoColumn body+margin, parts list, in-page TOC, prev/next nav), then `ArticlePage`, `DatasheetPage`, `SchematicPage`, `LessonLibraryPage`, `HomePage`, `AboutPage`, `NotFoundPage`, `PreviewStubPage`
  5. SSG prerender wiring — `getPrerenderParams()` on every dynamic route, `app.routes.server.ts` updates, `outputMode: "static"` verification
  6. Shiki build-time integration
  7. `NgOptimizedImage` swap across `Figure` + `Pinout`
  8. Phase-exit audits (own plan) — three-breakpoint walk + `docs/typography-checklist.md` P3 rows + `docs/force-en-audit.md` P3 row + Lighthouse gate
  9. Wagtail 7.4 StreamField spike (CONTRACT-02), blocking phase exit
- **D-SEQ-02:** The Wagtail spike is the **last plan** and **blocks phase exit**. Matches UI-SPEC §Wagtail Spike: design-freeze checkpoint; FE contract becomes immutable across P3→P4 once it passes. Cannot run before 2026-05-04 (Wagtail 7.4 LTS release).
- **D-SEQ-03:** `LessonPage` is built before its siblings because every other template is a structural simplification of it (no parts list, no prev/next, no in-page TOC margin variant). Settling LessonPage first de-risks the whole template group.
- **D-SEQ-04:** Phase-exit audits are their own plan (matches the P1 "Day-zero security + audit docs" and P2 "showcase + audit" pattern), not folded into the Lighthouse plan.

### Shiki Build-Time Integration

- **D-SHIKI-01:** Tokenization is encapsulated as a small reusable function `tokenize(code, language) → tokensHtml` (TypeScript module). In P3 it is invoked from a Node script `scripts/tokenize-fixtures.mjs` registered as a `prebuild` step in `package.json`. The script reads each `src/assets/mock-data/**/*.json` fixture, runs Shiki on every `code` block, and writes the highlighted HTML back into the fixture as a new optional `tokens` field.
- **D-SHIKI-02:** The `arduino-paper` Shiki theme is **hand-authored** as `src/assets/shiki/arduino-paper.json` (TextMate theme JSON). Background = `--color-paper`, foreground = `--color-ink`, comments = italic `--color-ink-muted`, keywords = weight 600 (no chromatic alarm), strings = `--color-ink`, numbers + types = italic. **No bright reds, greens, blues, yellows.** Differentiation by weight + style only. Loaded by the tokenize script via Shiki's `loadTheme()`.
- **D-SHIKI-03:** `code.tokens` is an **optional cache field**. `lint-fixtures.mjs` ignores it. The `CodeBlock` primitive falls back to plain `<pre>{{ code }}</pre>` rendering when absent. Tokenization is regeneratable and never load-bearing for content correctness — this matters for the P4 editor flow, where Wagtail editor saves must trigger seamless re-tokenization without breaking the contract.
- **D-SHIKI-04:** **Forward-compatibility with P4 editor flow** — the `tokenize()` logic is small and pure so it can be ported into the Wagtail container in P4 (Python or shelled-out Node) and run on `pre_save` so editors get highlighted code seamlessly after save. The same `arduino-paper.json` theme file is consumed in both environments. **No client-side Shiki bundle ever** (PRIM-04 constraint preserved).
- **D-SHIKI-05:** Languages registered: `cpp`, `arduino` (aliased to `cpp` or registered as TextMate variant), `plaintext`, `diff` — exactly the four `Block.code.language` enum values.

### Block Model Amendment + Prerender Plumbing

- **D-AMEND-01:** The `width: number` + `height: number` (required) addition to `figure` and `pinout` Block variants lands as **Plan 03-01, isolated**. Single CONTRACT-bumping commit touching `content/models/block.ts`, every figure/pinout fixture under `src/assets/mock-data/**/*.json`, and `scripts/lint-fixtures.mjs`. Everything downstream builds on a settled type.
- **D-AMEND-02:** `lint-fixtures.mjs` extension reads each referenced image's header (using `image-size` or an equivalent lightweight pure-JS PNG/JPG/SVG parser — no full decode) and **verifies the fixture's `width`/`height` matches the actual image dimensions on disk**. Mismatches fail lint. This catches CLS-causing dimension drift at commit time, not at the phase-exit Lighthouse run.
- **D-PRERENDER-01:** A shared module `src/content/api/fixture-loader.ts` exports pure functions (`loadAllLessons()`, `loadAllArticles()`, `loadAllDatasheets()`, `loadAllSchematics()`, plus `getLesson(slug)` etc.) that read JSON via Node `fs` at build time. Both `MockContentApi` (runtime) and every page template's `getPrerenderParams()` (build) consume this single source of truth. No duplicate parsing, no drift between prerendered and runtime output.
- **D-PRERENDER-02:** Define a `ContentSource` interface (e.g., `listLessonSlugs()`, `getLesson(slug)`, `listArticleSlugs()`, `getArticle(slug)`, etc. — exact shape locked by the planner). P3 ships `FixtureContentSource` (reads JSON via `fs`) as the only implementation. P4 will add `WagtailContentSource` (hits REST API v2) and the swap is a single DI registration change. The prerender helper accepts a `ContentSource` so P4 can prerender against Wagtail at build time without rewriting `getPrerenderParams()`.

### Lighthouse Gate Enforcement

- **D-LH-01:** Lighthouse runs **locally as a manual phase-exit step** via `pnpm lighthouse:lesson`. The script serves `dist/browser/` with a static file server (e.g. `pnpm exec http-server` or `npx serve`) and runs `lighthouse-cli` against `/lessons/pershyi-blymayuchyi-svitlodiod`. **Not in CI** for v1 — solo-dev pacing + LH numbers vary on CI runners. Matches the manual-phase-exit pattern of `docs/typography-checklist.md` and `docs/force-en-audit.md`.
- **D-LH-02:** Lighthouse runs at **both desktop and mobile profiles**. The gate fails if either profile misses thresholds. Mobile is the strictest constraint (4G throttling, slower CPU); desktop is the editorial happy path.
- **D-LH-03:** Thresholds from UI-SPEC §Lighthouse Gates are enforced as **hard pass/fail with no tolerance band**: LCP < 2.5s, CLS < 0.1, INP < 200ms. These are industry "good" Core Web Vitals; a tolerance band quietly becomes the real threshold.
- **D-LH-04:** On Lighthouse miss, the executor **halts phase exit** and produces a remediation note. Pre-locked likely causes from UI-SPEC become the triage order: LCP miss → verify `priority` on first figure + font preloads in `index.html` + woff2 budget; CLS miss → audit unmeasured `<img>` + Fontaine fallback metrics; INP miss → audit `TwoColumn` 50ms debounce + Shiki-produced DOM node count. Author approves the remediation plan before the phase re-runs.
- **D-LH-05:** Numbers (raw LH JSON output + PASS/FAIL verdict per gate per profile) are recorded in a new "Performance" section of `docs/typography-checklist.md`, accumulating with prior P1/P2 entries.

### Claude's Discretion

- Exact filenames and component class names within the locked module organization (`src/app/chrome/site-header.component.ts` etc. per UI-SPEC) — planner finalizes per existing P2 conventions.
- Test coverage scope per template — planner picks which templates warrant DOM tests vs. visual showcase verification only (P2 chose showcase + targeted DOM tests for `CodeBlock` and `measure.ts`; P3 likely follows the same proportion).
- The exact `image-size`-equivalent library choice (any small pure-JS or zero-dep image-header reader; planner picks based on supply-chain footprint).
- Whether `cpp`/`arduino` language registration uses Shiki's built-in TextMate grammar or a tiny aliasing config — planner decides during Shiki integration plan.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 3 design contract
- `.planning/phases/03-page-templates-routing-static-build/03-UI-SPEC.md` — APPROVED 2026-05-01 by gsd-ui-checker (6/6 dimensions PASS). Locks chrome, all 8 templates, routing table, BlockRenderer dispatch table, Shiki theme principle, color/typography/spacing inheritance, NgOptimizedImage rules, Lighthouse thresholds, the 12 open decisions carried forward, and the Wagtail spike protocol. **This is the primary source of truth for P3 design decisions.**

### Project + requirements
- `.planning/PROJECT.md` — vision, hard constraints (Ukrainian only, no SSR ever, MinIO, Cyrillic-Ext, ragged-right, real Ukrainian prose).
- `.planning/REQUIREMENTS.md` — P3 requirements: PAGE-01..11, CONTRACT-02, PERF-01..06.
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, scope boundaries.
- `CLAUDE.md` — coding conventions, Ukrainian-only locale, no Tailwind, real Ukrainian prose calibration.

### Phase 1 + Phase 2 lock-ins (inherited)
- `.planning/phases/01-foundation-typography-gate/01-UI-SPEC.md` — typography, color, spacing tokens.
- `.planning/phases/02-primitives-two-column-layout-page-model-contract/02-UI-SPEC.md` — primitives, two-column behavior, copywriting punctuation rules.
- `.planning/phases/01-foundation-typography-gate/01-CONTEXT.md` — `_typography.scss` as single-file font-pairing swap target (D-03), `src/lib/intl.ts` as the only `Intl.*` call site (D-28).
- `.planning/phases/02-primitives-two-column-layout-page-model-contract/02-CONTEXT.md` — `MockContentApi` DI shape, fixture lint pattern (`scripts/lint-fixtures.mjs`), measure-geometry pure fn pattern, D-MOCK-01 read-aloud gate for editorial prose.

### Existing code references
- `src/app/app.routes.ts` — current routes (will be extended).
- `src/app/app.routes.server.ts` — `RenderMode` strategy (will be extended).
- `src/app/app.config.ts` — DI providers including `provideContentApi()` (P2).
- `src/content/api/` — `ContentApi` token + `MockContentApi` impl (P2). Will gain `fixture-loader.ts` + `ContentSource` interface in Plan 03-01 (or Plan 03-05 if scoped that way by planner).
- `src/content/models/block.ts` — `Block` discriminated union (P2). Amended in Plan 03-01.
- `src/assets/mock-data/{lessons,articles,datasheets,schematics}/*.json` — fixtures, all migrated in Plan 03-01.
- `scripts/lint-fixtures.mjs` — extended with image-dimension verification in Plan 03-01.
- `docs/typography-checklist.md`, `docs/force-en-audit.md` — accumulating phase-exit audit docs.

### External docs the planner/researcher may need
- Angular 21 SSG + `outputMode: "static"` — official `@angular/ssr` docs.
- `NgOptimizedImage` — Angular docs for `priority`, `ngSrc`, dimensions.
- Shiki + `@shikijs/transformers` — official docs (theme JSON, custom theme loading, no client-side bundle).
- TextMate theme JSON spec — for hand-authoring `arduino-paper.json`.
- Wagtail 7.4 LTS StreamField + REST API v2 docs — needed only for the spike plan, on or after 2026-05-04.
- Lighthouse CLI — desktop and mobile profile flags.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`PageShell` (P2)** — header/main/footer slot composition; every page template wraps in it.
- **`TwoColumn` + `MarginRail` + `Sidenote` (P2)** — JS-measured anchoring already works; LessonPage / ArticlePage / DatasheetPage / SchematicPage all reuse it. P3 only needs to compose, not reinvent.
- **All editorial primitives (P2)** — `Heading`, `Body`, `Lede`, `Aside`, `Figure`, `FigureCaption`, `CodeBlock`, `Diff`, `Pinout` — consumed by templates only via `@arduino/core-ui` public API. P3 introduces NO new exports from `core-ui`.
- **`MockContentApi` + DI (`provideContentApi()` in `app.config.ts`)** — already wired. Gets refactored under `ContentSource` interface in Plan 03-01.
- **`scripts/lint-fixtures.mjs` pattern (P2)** — small Node script wired via `pnpm`. Reused as the model for `scripts/tokenize-fixtures.mjs` (Plan 03-06).
- **`src/lib/intl.ts` (P1)** — only `Intl.*` call site; `formatDateUk`, `formatNumberUk` consumed for read-time + dates in lesson/article meta.
- **`docs/typography-checklist.md`, `docs/force-en-audit.md`** — accumulating phase-exit audit docs; P3 appends rows.

### Established Patterns
- **`core-ui` boundary rule (P2)** — domain assemblies (templates, BlockRenderer) live in `src/app/`, NOT in the library. ESLint boundary rule enforces this.
- **Standalone components, lazy-loaded per route** — every page template is `src/app/pages/<name>/<name>.page.ts` (note `.page.ts` suffix to differentiate from primitives).
- **Real Ukrainian content for design calibration** — never Lorem Ipsum (P2 D-PRE-05).
- **Force-en audit at every phase exit** — UKR-06; P3 row appended to `docs/force-en-audit.md`.
- **Three-breakpoint manual walk** — every layout-touching phase verifies <768 / 768–1199 / ≥1200 before exit.
- **Editorial smell + content-gate lint clean on every fixture** — P2 D-PRE-05 reframing of UKR-02/03; P3 fixtures must continue to lint clean after the `width`/`height` amendment.

### Integration Points
- `src/app/app.routes.ts` — extended with all P3 routes per UI-SPEC route table.
- `src/app/app.routes.server.ts` — `/preview/*` added as `RenderMode.Client`; the rest stay `RenderMode.Prerender`; `/dev/primitives` continues as `RenderMode.Client` from P2.
- `src/app/app.config.ts` — DI registration evolves to use `ContentSource`-shaped provider; `provideContentApi()` gets a build-time variant for prerender.
- `src/content/api/` — adds `fixture-loader.ts`, `content-source.ts` (interface), `fixture-content-source.ts` (P3 impl).
- `src/content/models/block.ts` — amended for `width`/`height` on figure + pinout.
- `src/app/chrome/` — new directory for `site-header.component.ts`, `site-footer.component.ts`, `site-nav.component.ts`.
- `src/app/blocks/block-renderer/` — new directory for the dispatcher.
- `src/app/pages/{home,lessons,articles,datasheets,schematics,about,not-found,preview-stub,lesson-library}/` — eight new page directories.
- `src/assets/shiki/arduino-paper.json` — new hand-authored theme.
- `scripts/tokenize-fixtures.mjs` — new `prebuild` script.
- `package.json` — `prebuild` + `tokenize` + `lighthouse:lesson` scripts added.

</code_context>

<specifics>
## Specific Ideas

- **P4-forward Shiki port:** the `tokenize()` function in P3 is intentionally small and pure so the same logic can be re-implemented in the Wagtail container's `pre_save` path in P4 — editor saves trigger seamless re-tokenization without coupling to Angular's build. Same `arduino-paper.json` theme file consumed in both environments.
- **`ContentSource` interface as the P4 swap point:** P3 ships only `FixtureContentSource` but defines the interface so P4 lands `WagtailContentSource` as a single new file + a single DI registration change.
- **Image-dimension lint as a CLS pre-flight:** verifying fixture `width × height` against image-on-disk dimensions catches CLS regressions at commit time, before the Lighthouse run finds them at phase exit.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed strictly within phase scope. The 12 "Open Decisions Carried Forward" already enumerated in UI-SPEC §Open Decisions cover all ideas the executor might revisit during P3 execution; no additional deferrals were generated during this discussion.

</deferred>

---

*Phase: 03-page-templates-routing-static-build*
*Context gathered: 2026-05-01*
