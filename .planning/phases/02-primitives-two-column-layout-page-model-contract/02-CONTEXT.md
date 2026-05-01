# Phase 2: Primitives, Two-Column Layout & Page-Model Contract — Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 ships:

- The `core-ui` Angular workspace library at `projects/core-ui/` with a public-API boundary (PRIM-01).
- Editorial primitives `Heading`, `Body`, `Lede`, `Aside`, `Sidenote`, `SidenoteRef`, `Figure`, `FigureCaption`, `CodeBlock` (visual frame + line numbers + copy + diff visuals + annotation alignment, **no Shiki** — that's P3), `Diff`, `Pinout` (static legend, no hotspots) (PRIM-02, PRIM-04..08).
- Layout primitives `PageShell`, `TwoColumn`, `MarginRail` with the JS-measurement sidenote-anchoring mechanism (PRIM-03, LAYOUT-01..05).
- The locked TypeScript page-model contract at `src/content/models/*.ts` — `Block` discriminated union (10 variants), `Lesson`, `Article`, `Datasheet`, `Schematic`, `AnyPage` (CONTRACT-01).
- The `ContentApi` abstract class + `MockContentApi` reading `/src/assets/mock-data/*.json` (CONTRACT-03, CONTRACT-04).
- 7 mock fixtures of real Ukrainian Arduino prose: 3 lessons, 1 article, 2 datasheets, 1 schematic — slugs locked in 02-UI-SPEC.md.
- The `/dev/primitives` showcase page exercising every primitive at all three breakpoints.

What's **not** in scope for P2: Shiki integration (P3), `BlockRenderer` dispatcher (P3), public page templates / routing (P3), header/footer chrome (P3), NgOptimizedImage swap (P3), drop caps + glossary tooltips + pinout hotspots + cross-refs (P6), the Ukrainian text pre-processor (**descoped** — see D-PRE-01..05 below).

Requirements covered: PRIM-01..08, LAYOUT-01..05, CONTRACT-01, CONTRACT-03, CONTRACT-04. **UKR-02 and UKR-03 are reframed as authoring-contract requirements (style guide + lint), not transformation-function requirements** — see D-PRE-01..05 below.

</domain>

<decisions>
## Implementation Decisions

### `core-ui` library boundary tooling

- **D-LIB-01:** Public-API enforcement via **`eslint-plugin-boundaries`**. Declarative element-type rules (e.g., `app` → can import `core-ui-public`, forbidden to import `core-ui-internal`). Chosen over `no-restricted-imports` patterns and `eslint-plugin-import/no-internal-modules` because (a) it scales to additional libs in P3+ (a `content` lib, a `templates` lib) without rule rewrites, (b) configuration reads as architectural intent rather than a deny list of paths.
- **D-LIB-02:** Public-API surface is **components + their input/output types only**. Each primitive class plus the input signal types it exposes. The shared `Block` discriminated union and page models stay in `src/content/models/*` and are imported separately by consumers. Rationale: `core-ui` is a UI lib; coupling it to the content-model union would re-export domain types from a presentation library and tangle the boundary at the place we just spent effort defining.
- **D-LIB-03:** Lib path resolution via **`tsconfig.base.json` paths only**: `"@arduino/core-ui": ["projects/core-ui/src/public-api.ts"]`. No `ng-packagr` consumption step in dev. Single-app workspace; the lib is consumed by source. ng-packagr build is exercised at phase exit by a one-time `ng build core-ui` smoke test (not wired to CI in P2 — defer to P3/P4 if/when a second consumer or external publish is on the table).
- **D-LIB-04:** No NgModules anywhere. Every primitive is a standalone component. `imports: []` self-contained. Co-located styles per `<name>.component.scss`. Tokens read only as `var(--…)` (TYPE-10 + P1 D-02 inheritance).

### Pre-processor — descoped from Phase 2

- **D-PRE-01:** **No `processUkrainianText` function. No `src/lib/uk-text.ts`.** Authors deliver source text already typeset (`«…»`, `—`, `–`, NBSP ` `, `ʼ`) — both for P2 mock JSON and P4 Wagtail content. Rationale: solo author + skilled editors deliver high-quality typeset prose; the transformation function would solve a problem we don't have, while creating a synchronization burden between FE and Wagtail in P4.
- **D-PRE-02:** Primitives consume `html` / `text` strings **verbatim**. No transformation at API boundary. No transformation at render time. The `MockContentApi.getLesson()` returns the JSON unchanged.
- **D-PRE-03:** **UKR-02 and UKR-03 are reframed**: instead of a transformation function, P2 ships:
  - `docs/copy-style-uk.md` — short author/editor style guide (~1 page) listing required typography forms: `«…»` outer quotes, `„…"` nested, `—` em-dash with NBSP before, `–` en-dash for numeric ranges, NBSP after one-letter prepositions (`в у і й з а о та не на до за по`), `ʼ` (U+02BC) for Ukrainian apostrophe, never ASCII `'` between Cyrillic letters.
  - `scripts/lint-fixtures.mjs` — Node CLI that scans `src/assets/mock-data/**/*.json` and reports editorial smells (straight `"`, `--` between words, ASCII `'` between Cyrillic letters, regular space after listed prepositions in body prose). **Warns** the author with file:line context — does not transform. Wired into `pnpm lint`.
- **D-PRE-04:** P4 contract test (`MockContentApi` ↔ `WagtailContentApi` byte-equality) still works because both sides ship verbatim — there is no transformation pair to keep in sync. Wagtail editors will type into the same authoring contract.
- **D-PRE-05:** **02-UI-SPEC.md §"Ukrainian Text Pre-processor" is superseded by this CONTEXT.** The pre-processor section, plus its mention in the showcase force-en audit, plus its UKR-02/UKR-03 wiring claim, must be amended (status bumped back to `draft` per UI-SPEC §"Open Decisions Carried Forward" rule, or a strikethrough block added) **before planning starts**. Recorded as a phase-prep task for the planner.

### Mock data authoring workflow

- **D-MOCK-01:** **AI-drafted, author-reviewed.** Claude drafts each fixture's prose to UI-SPEC content gates (real Ukrainian Arduino content, hits all required glyphs and punctuation forms, exercises the right Block variants). The author then **reads each fixture aloud** and rewrites anything that smells machine-translated, flat, or non-native. The read-aloud rewrite is a hard gate per fixture before commit. **Author bears the design-calibration risk** that AI prose may calibrate the type scale wrongly — this is a known cost of the AI-drafted choice and is mitigated by the per-fixture rewrite pass, the editorial-smell lint, and the option to redraft any fixture that fails the read-aloud check.
- **D-MOCK-02:** **Hand-written JSON, no compile step.** Each fixture is a `.json` file in `src/assets/mock-data/{lessons|articles|datasheets|schematics}/{slug}.json`, byte-shaped to the matching TypeScript page model. Authoring is awkward (escaping quotes, structural noise) but the JSON IS the contract — no abstraction layer to drift from the FE contract that Wagtail must conform to in P4. TS-source-with-`.ts` and markdown-with-build-step were both rejected for this reason.
- **D-MOCK-03:** **Slugs are locked** (from 02-UI-SPEC §Mock data fixtures): lessons → `pershyi-blymayuchyi-svitlodiod`, `knopka-ta-pidtyahuvalnyi-rezystor`, `analogovyi-vhid-ta-potentsiometr`; article → `chomu-arduino`; datasheets → `atmega328p`, `arduino-uno-r3`; schematic → `blymayuchyi-svitlodiod-shema`.
- **D-MOCK-04:** **Content gates verified by `scripts/lint-fixtures.mjs`** (the same script from D-PRE-03 — single Node lint covers both editorial-smell detection and per-fixture content-gate enforcement). Gates per UI-SPEC §"Mock-data prose calibration rule":
  1. At least one `ґ` in body prose (not just headings).
  2. At least one `«…»` quote pair.
  3. At least one em-dash `—` and one en-dash range `\d+–\d+`.
  4. At least one inline `<code>` reference (e.g., `pin 13`).
  5. Lesson fixtures: at least one `sidenote` block, one `figure` block, one `code` block.
  6. Read-aloud native-Ukrainian check — **author-attested, not lint-checkable**, recorded as a per-fixture commit-message line `read-aloud: PASS`.
- **D-MOCK-05:** No fixture authoring tool, no JSON-schema validator beyond what the TypeScript model already enforces at the `MockContentApi` boundary (typed `as Lesson` casts at fetch time will surface shape mismatches). Adding `zod` or similar is out-of-scope for v1.

### Primitive test depth

- **D-TEST-01:** **Vitest unit tests for four scopes** (in priority order):
  1. **`TwoColumn` measurement logic** — unit-test the geometry function that, given a list of body-anchor `top`s and sidenote heights, computes per-sidenote `top` with the collision/stack-down rule from UI-SPEC §"Sidenote anchoring mechanism". Stubbed `getBoundingClientRect` inputs; pure-function output. Highest-value test in the phase.
  2. **`CodeBlock` copy-button interaction** — mock `navigator.clipboard.writeText`, click the button, assert label transitions through `Скопійовано` (2s) and `Не вдалося скопіювати` (4s on rejection), assert `aria-live` region updates. Catches regressions in the locked copy-feedback timing and copy strings.
  3. **`Block` discriminated-union type-narrowing** — type-only test file using Vitest's `expectTypeOf` verifying that narrowing on `Block.type` yields the right field set per variant. Catches accidental TS contract loosening before the P4 contract test depends on it.
  4. **Fixture-loading by `MockContentApi`** — happy-path round-trip per page type (`getLesson('pershyi-blymayuchyi-svitlodiod')` returns a typed `Lesson` matching the on-disk JSON). One test per page type (4 tests).
- **D-TEST-02:** **No primitive snapshot tests, no Playwright screenshots, no Storybook in P2.** Visuals are verified manually on `/dev/primitives` (D-VISUAL-01). Adding screenshot tooling at this stage tends to fight the author during typographic calibration; revisit at P3 phase exit when page templates stabilize.
- **D-VISUAL-01:** **Phase-exit visual verification = manual breakpoint walk on `/dev/primitives`** at <768, 768–1199, ≥1200 against `docs/typography-checklist.md` (extending the same accumulating doc started in P1). New P2 section in the checklist enumerates each primitive + each breakpoint behavior and asks for a tick. Same gate format the project already trusts.

### Showcase page wiring

- **D-WIRE-01:** **`MockContentApi` provided via Angular `InjectionToken` + factory.** `export const CONTENT_API = new InjectionToken<ContentApi>('ContentApi')`. Factory `provideContentApi()` returns `MockContentApi` in P2 and is called from `app.config.ts`. The P4 mock→Wagtail flip is a one-line factory edit. Standard Angular 21 zoneless idiom; matches REQ CONTRACT-03 and PAGE-11.
- **D-WIRE-02:** **`/dev/primitives` route registration**: registered in the standalone routes array at all times so `pnpm dev` serves it. **Excluded from `getPrerenderParams()`** so `ng build` does not emit a static HTML file in `dist/browser/`. Page emits `<meta name="robots" content="noindex">`. Mirrors the P1 pattern for `/dev/glyph-audit` and 02-UI-SPEC §"The Showcase Page".
- **D-WIRE-03:** **`PageShell` wraps `/dev/primitives`** so the structural skeleton (empty `<header>`, `<main>`, empty `<footer>`) is exercised in P2 even though the chrome is P3.
- **D-WIRE-04:** Showcase page uses raw template composition (no `BlockRenderer` — that's P3). Section-by-section markup per UI-SPEC §"Page structure (top to bottom)" 1–11. The lede paragraph, prose, code blocks, and sidenotes are pulled from the lesson fixture `pershyi-blymayuchyi-svitlodiod` where appropriate, hand-written for the showcase otherwise — the page is a developer audit surface, not a public lesson.

### Claude's Discretion

- Internal file/folder structure inside `projects/core-ui/src/lib/<primitive>/` — naming of internal helpers, whether `TwoColumn`'s measurement function is co-located or in `projects/core-ui/src/lib/two-column/measure.ts`.
- Exact `eslint-plugin-boundaries` element-type names (`core-ui-public` / `core-ui-internal` / `app` / `content-models` is a starting suggestion).
- The exact wording of `docs/copy-style-uk.md` (~1 page; must list the typography forms in D-PRE-03 and link to the lint script).
- Internal structure of `scripts/lint-fixtures.mjs` (single file, regex-based, exits non-zero on violation; flag format and CLI ergonomics).
- AI-drafted prose authorship — whether to draft all 7 fixtures in one batch or interleave authoring-and-review per fixture. Author preference; either works.
- Vitest test file organization (`projects/core-ui/src/lib/two-column/two-column.spec.ts` vs central `__tests__/`). Default to co-location, matching the SCSS co-location rule.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project locks (must read first)

- `CLAUDE.md` — hard constraints, especially: Ukrainian only, Cyrillic-Ext, ragged-right body, no Tailwind, no Node SSR ever, frontend owns the contract, real Ukrainian prose for design calibration, no NgModules.
- `.planning/PROJECT.md` — vision, key decisions table, FE-first build-order discipline.
- `.planning/REQUIREMENTS.md` §"Layout & Responsive Behavior" (LAYOUT-01..05), §"Component Primitives (`core-ui`)" (PRIM-01..08), §"Page-Model Contract & Mock Data" (CONTRACT-01, CONTRACT-03, CONTRACT-04). UKR-02/UKR-03 reframed per D-PRE-01..05.
- `.planning/ROADMAP.md` §"Phase 2: Primitives, Two-Column Layout & Page-Model Contract" — phase goal, Success Criteria 1–5.

### Phase 2 design contract (LOCKED, with one section superseded)

- `.planning/phases/02-primitives-two-column-layout-page-model-contract/02-UI-SPEC.md` — **the design contract; status `approved`, 6/6 dimensions PASS as of 2026-05-01.** Locks every primitive's API + visuals, layout breakpoints, sidenote anchoring mechanism, copy-button strings + timing, diff color palette, mock fixture slugs, showcase section structure.
  - **§"Ukrainian Text Pre-processor (UKR-02, UKR-03)" is SUPERSEDED by 02-CONTEXT D-PRE-01..05.** Planner must amend the UI-SPEC (status → `draft`, strikethrough or removal of that section, plus removal of the pre-processor mention from the §"The Showcase Page" force-en footer) **before producing PLAN.md**.

### Phase 1 inheritance (must understand)

- `.planning/phases/01-foundation-typography-gate/01-CONTEXT.md` — every Phase 1 decision (D-01..D-32). Specifically D-01..D-07 (token architecture) and D-23..D-30 (folder layout, Angular config, Vitest, ESLint, Stylelint, Prettier) define the substrate Phase 2 builds on.
- `.planning/phases/01-foundation-typography-gate/01-UI-SPEC.md` — every token, base CSS rule, copywriting punctuation rule that Phase 2 inherits unchanged.
- `docs/typography-checklist.md` — extended in P2 with a new section for the three-breakpoint manual walk on `/dev/primitives`.
- `docs/force-en-audit.md` — extended in P2 with a row for the showcase-page audit.

### Phase 2 success criteria (gate)

- `.planning/ROADMAP.md` §"Phase 2: ... Success Criteria" 1–5 — these are the executable acceptance gates for phase exit. Note: SC #5 mentions the pre-processor; per D-PRE-05 this success criterion is reinterpreted as "the editorial-smell + content-gate lint passes on every fixture" rather than a function idempotency check. Planner must reflect this in PLAN.md and in the eventual VERIFICATION.md.

### External docs to consult during execution

- Angular standalone components + signal inputs: https://angular.dev/guide/components
- Angular `afterNextRender` (used for `TwoColumn` measurement): https://angular.dev/api/core/afterNextRender
- `ResizeObserver` (used for breakpoint-crossing re-measure): https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
- Angular workspace libraries (`projects/core-ui/`): https://angular.dev/tools/cli/creating-libraries
- `eslint-plugin-boundaries`: https://github.com/javierbrea/eslint-plugin-boundaries
- Vitest `expectTypeOf`: https://vitest.dev/api/expect-typeof.html
- Clipboard API: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (Phase 1 deliverables)

- **SCSS token system** at `src/styles/tokens/` (P1 D-01..D-07). Phase 2 primitives consume only `var(--…)` semantic tokens — never raw SCSS variables, never new sizes/colors/weights. Two-tier architecture (SCSS raw + CSS-custom-prop semantic) inherited unchanged.
- **`_typography.scss` single-file font-pairing swap** (P1 D-03, TYPE-06). Phase 2 introduces no new font sizes or weights; the type scale is locked.
- **`src/lib/intl.ts`** (P1 D-28) — `formatDateUk`, `formatNumberUk`, `collatorUk`. Lesson `estimatedMinutes` rendering (`≈ 12 хв`) on the showcase page goes through this — never bare `toLocaleString`.
- **ESLint rule banning bare `toLocaleString` / `toLocaleDateString`** (P1 D-28) — already enforced. Phase 2 inherits.
- **`/dev/glyph-audit` route pattern** (P1 D-15) — `/dev/*` namespace, `noindex`, ships in production. Phase 2's `/dev/primitives` mirrors this pattern exactly (D-WIRE-02).
- **Angular 21 zoneless app shell** (P1 D-22, D-26). Phase 2 adds the `core-ui` library project to the workspace; the app config gains a `provideContentApi()` factory but otherwise unchanged.
- **Pre-commit + gitleaks + lint pipeline** (P1 D-31). Phase 2's new `scripts/lint-fixtures.mjs` plugs into the existing `pnpm lint` step.

### Established Patterns to Follow

- Component styles co-locate (`<name>.component.scss` next to `<name>.component.ts`). TYPE-10.
- Tokens consumed via `var(--…)`, never raw SCSS `$…` (P1 D-02).
- `Intl` calls go through `src/lib/intl.ts` (P1 D-28).
- `/dev/*` routes: `noindex`, ship-in-production-acceptable, route registered + prerender-excluded.
- Real Ukrainian prose for every design surface — never Lorem Ipsum (CLAUDE.md).
- Author-walked phase-exit checklist over automated visual regression (P1 D-21).

### Integration Points

- `tsconfig.base.json` — adds path mapping for `@arduino/core-ui` (D-LIB-03).
- `eslint.config.mjs` — adds `eslint-plugin-boundaries` configuration with element-type rules (D-LIB-01).
- `app.config.ts` — adds `provideContentApi()` returning `MockContentApi` via `InjectionToken` (D-WIRE-01).
- App routes — adds `/dev/primitives` (D-WIRE-02). `getPrerenderParams()` exclusion list extended.
- `src/styles/main.scss` — no change. P2 adds no global styles; only co-located component styles.
- `package.json` scripts — `lint` script extended to invoke `node scripts/lint-fixtures.mjs`.
- `docs/typography-checklist.md` — appended P2 section.
- `docs/force-en-audit.md` — appended P2 row.

</code_context>

<specifics>
## Specific Ideas

- **Editorial north star unchanged from P1**: confident typography hierarchy, generous whitespace, warm off-white paper, restrained palette. Phase 2 primitives compose without introducing decoration that would fight the book aesthetic.
- **The "feels like a book" gate begins to be testable on `/dev/primitives`**: a long body-prose section with three sidenotes anchored at top / middle / bottom, plus an annotated code block, is the first concrete moment in the project where the editorial thesis can be judged on real content. That's the audit moment.
- **Sidenote anchoring is the hardest single piece of the phase.** The JS-measurement approach is locked; the planner should treat `TwoColumn` as a meaningful chunk of work in its own right (likely its own plan) and the executor should expect to spend disproportionate time on the collision rule and the ResizeObserver debounce.
- **Pre-processor descope is intentional and a deliberate trade.** We give up automated typography normalization; we keep the contract simpler, eliminate a P4 sync burden, and trust skilled editors. The lint script is the safety net.

</specifics>

<deferred>
## Deferred Ideas

- **`processUkrainianText` function** — descoped from P2 (D-PRE-01..05). May be reintroduced in a future phase if/when CMS editors prove unable to deliver typeset prose; that decision will be evidence-driven, not prophylactic.
- **Shiki integration** — P3 (CodeBlock ships its frame and structure in P2; tokens land with page templates).
- **`BlockRenderer` dispatcher** — P3 (showcase composes primitives directly in markup).
- **NgOptimizedImage swap** for `<img>` in `Figure`/`Pinout` — P3.
- **Pinout hover hotspots** — P6 (POLISH-05). v1 ships static legend.
- **Drop caps** — P6 (POLISH-01).
- **Hanging punctuation, OpenType refinements** — P6 (POLISH-02).
- **Glossary tooltips, pin-reference cross-links, figure cross-references** — P6 (POLISH-03..05).
- **Margin-extending figures** (third grid column variant) — deferred per UI-SPEC; v1 = body-measure or full-bleed only.
- **Word-level inline diff for `Diff` primitive** — v2 nice-to-have; P2 swaps the entire passage.
- **Sticky positioning on `MarginRail`** — explicitly rejected for v1 (book aesthetic prefers content sitting where placed).
- **Playwright screenshot baselines + Storybook** — out of scope for P2; revisit at P3 exit.
- **`ng build core-ui` as a CI step** — out of scope for P2 (single-app workspace); revisit if a second consumer or external publish becomes relevant.
- **Aside variant differentiation** (visible icon/rule for `warning` vs `fact`) — P3+ when page templates need it; the `variant` input is shipped now to avoid a future API break.
- **Dark mode** — out of scope for v1 entirely (TYPE-08, P1 deferred).

</deferred>

---

*Phase: 02-primitives-two-column-layout-page-model-contract*
*Context gathered: 2026-05-01*
