# Phase 1: Foundation & Typography Gate - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 ships the **foundation** the rest of the project sits on: a self-hosted Cyrillic-complete font stack with verified Ukrainian glyph quality, an SCSS token system organized for one-file font swaps, day-zero locale and secrets hygiene, and a single `/dev/glyph-audit` proof page that exercises all of it.

What's in scope: tokens (typography, color, spacing, layout, radius, shadow), `@font-face` declarations + Fontaine fallback metrics, the six committed woff2 files, base CSS (reset, ragged-right body, no-justify, no-hyphens), `<html lang="uk">`, `LOCALE_ID = 'uk-UA'` registration, `Europe/Kyiv` time-zone helper, the glyph audit harness page, the force-en audit checklist doc, gitleaks + pre-commit + lint/format wiring, and the Angular 21 app scaffold with `outputMode: "static"`.

What's NOT in scope: `core-ui` library, primitives (`Heading`, `Body`, `CodeBlock`, `TwoColumn`, etc. — all P2), `ContentApi` and content models (P2), Shiki integration (P3), page templates (P3), Wagtail (P4+).

Requirements covered: TYPE-01 through TYPE-10, UKR-01, UKR-04, UKR-05, UKR-06.

</domain>

<decisions>
## Implementation Decisions

### Token architecture

- **D-01:** SCSS tokens live under `src/styles/tokens/` split as: `_typography.scss`, `_color.scss`, `_spacing.scss`, `_layout.scss`, `_radius.scss`, `_shadow.scss`, `_index.scss` (forwards everything). Consumers `@use 'styles/tokens' as t;`.
- **D-02:** Two-tier naming. Raw tokens are SCSS variables (`$serif-stack`, `$gray-900`); semantic tokens are CSS custom properties on `:root` (`--color-text-body`, `--font-body`, `--measure-prose`). Components consume only `var(--...)`. Rationale: SCSS layer for compile-time validation and composition; CSS-var layer enables a future dark theme without an SCSS rebuild.
- **D-03:** `_typography.scss` is the **single-file font-pairing swap target** (TYPE-06). It owns: family stacks, `@font-face` blocks for the six woff2 files, Fontaine fallback metric `@font-face` blocks, the type scale, line-heights. Changing the font pairing is editing this file only — proven by a dry-run swap at phase exit.
- **D-04:** Type scale handpicked, **not** a strict modular ratio. Starting values (calibrated against real Ukrainian Arduino prose at ~62ch measure, may shift ±2px during execution): body 19/1.6, lede 22/1.55, h1 48/1.1, h2 34/1.2, h3 24/1.3, caption 15/1.5, mono 15/1.55.
- **D-05:** Color palette light-only v1, six colors, semantically named. Starting hexes: Paper `#FAF8F3` (warm off-white, book feel — not pure white), Ink `#1A1A1A` (soft black — not pure black), Ink-muted `#5C5C5C` (sidenotes, captions), Arduino-teal `#00979D` (accent only — links, code-block frame, figure numbers), Rule `#E5E0D5` (hairlines, borders), Highlight `#FFF4D6` (code-line highlight). No additional colors in v1.
- **D-06:** Spacing scale 4px-base, custom (not strict modular): `4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 112 / 168`. Bigger jumps at the top end for editorial breathing room.
- **D-07:** Breakpoints: `768px` and `1200px` (matches roadmap mobile / tablet / desktop split). Defined in `_layout.scss` as SCSS vars and as CSS custom properties (for container queries later if needed).

### Font pipeline

- **D-08:** Subsetting tool: **`pyftsubset` (fonttools)** wrapped in a committed Node script `scripts/fonts/subset.mjs` (Node shells out to `pyftsubset`). One-shot, not a CI step. Source TTFs in `fonts-source/` (gitignored if heavy, otherwise committed). Output `*.woff2` checked in to `public/fonts/`. Rerun only when bumping a font release.
- **D-09:** **Six woff2 files total**, all variable, no per-weight static cuts:
  - `source-serif-4-roman.woff2` — `wght 200–900`, `opsz 8–60`
  - `source-serif-4-italic.woff2` — `wght 200–900`, `opsz 8–60`
  - `inter-roman.woff2` — `wght 100–900`
  - `inter-italic.woff2` — `wght 100–900`
  - `jetbrains-mono-roman.woff2` — `wght 100–800`
  - `jetbrains-mono-italic.woff2` — `wght 100–800`

  Roman/italic split (not one combined file per family) because each family ships a separately-mastered italic — required for italic Cyrillic to look real, not synthesized.
- **D-10:** Each family subset to `latin` + `latin-ext` + `cyrillic` + `cyrillic-ext`. **`cyrillic-ext` is non-negotiable** — it carries `ґ` (U+0490/0491). The default `cyrillic` Google subset omits it.
- **D-11:** **No `unicode-range` split.** Single subset file per family/style covers Latin + Cyrillic in one request. Rationale: Ukrainian-only site — every page has Cyrillic; splitting Latin into a separate file just adds a request that always fires.
- **D-12:** `@font-face` declarations in `_typography.scss`: six blocks, each with `font-display: swap`, `font-weight: <range>`, `font-style: normal | italic`, `src: url('/fonts/...woff2') format('woff2-variations')`. No `unicode-range` descriptor.
- **D-13:** **Preload exactly two files** in `index.html` head: `source-serif-4-roman.woff2` (dominant body traffic) and `inter-roman.woff2` (UI chrome). Italic and mono load on demand. Mono only matters on lesson pages with code; italic only on emphasized prose.
- **D-14:** Fontaine fallback metric overrides generated once via `npx fontaine` against the local woff2; output committed inline as a static block at the top of `_typography.scss`. Three `@font-face` blocks: `"Source Serif 4 Fallback"`, `"Inter Fallback"`, `"JetBrains Mono Fallback"` with `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`. Family stacks reference the fallback name, e.g., `font-family: "Source Serif 4", "Source Serif 4 Fallback", Georgia, serif;`. Result: CLS-free swap, FOUT not FOIT.

### Glyph audit harness

- **D-15:** **Single page does triple duty**: glyph matrix + real-prose specimen + `Intl` locale demo. Route: `/dev/glyph-audit`. The `/dev/*` prefix is a clear "internal" namespace; the page is excluded from sitemap and emits `<meta name="robots" content="noindex">`. Shipped to production (not dev-only) so the audit can be re-run on the live VPS after deploy.
- **D-16:** **Section 1 — Glyph matrix:** 12 cells in a 3×4 grid. Rows: Source Serif 4, Inter, JetBrains Mono. Columns: Regular, Italic, Bold, Bold-Italic. Each cell renders the canonical Ukrainian verification string at body size **and** at 64px display size, side-by-side. Each cell labels its `font-family` + `font-style` + `font-weight` so a tofu box is traceable to the exact face. Below each cell: the critical glyphs `і ї є ґ Ї Є Ґ ʼ` rendered isolated at 96px so the diaeresis, the upper-comma on `ґ`, and the apostrophe shape are inspectable without prose context.
- **D-17:** **Canonical verification string** (single source of truth, committed as a constant):

  > Ґаздиня їсть її їжу — є ґедзь, ґніт, ґанок. Цей рядок має бути ідеально набраним. ATmega328P, INPUT_PULLUP. «Лапки» „вкладені" — апостроф ʼ.

- **D-18:** **Section 2 — Real-prose specimen:** centered `<article>` with the body serif at the calibrated measure (~62ch). Real Ukrainian Arduino prose (NOT Lorem Ipsum). Includes h1, h2, lede, body paragraphs, inline italic, inline bold, inline code (`pin 13`), a code block (mono), captions, and an aside styled visually as a sidenote (visual only — the `Sidenote` primitive is P2). This is the calibration page for TYPE-07.
- **D-19:** **Section 3 — Locale demo (TYPE-04, UKR-04):** inline at the bottom of the same page. Renders `Intl.DateTimeFormat('uk-UA', { dateStyle: 'long' }).format(new Date())`, `Intl.NumberFormat('uk-UA').format(1234567.89)`, and a sorted list using `Intl.Collator('uk-UA')`. A footer note instructs: "Audit checklist — load this page with browser locale set to `en-US`. The Ukrainian-formatted date above MUST stay in Ukrainian."
- **D-20:** **Harness uses raw HTML elements**, not primitives. The `Heading`, `Body`, etc. primitives don't exist until P2. The harness page must remain a regression check that the underlying tokens still work after P2 lands — keeping it primitive-free preserves that.
- **D-21:** No automated tests for glyph rendering. Phase-exit gate is the human walking through `docs/typography-checklist.md` once. Glyph rendering is visual; an automated test would be theatre.

### Repo scaffold scope

- **D-22:** Single Angular app via `ng new arduino-hub --style=scss --ssr=true --routing=true`, then reconfigured for `outputMode: "static"`. Angular 21.2.x, zoneless (default), Vitest as test runner. **No `core-ui` library project in P1** — that lands in P2.
- **D-23:** Folder layout set up to receive primitives later: `src/app/`, `src/styles/`, `src/styles/tokens/`, `src/styles/base/`. Component styles co-locate as `.component.scss` from day one.
- **D-24:** `src/styles/main.scss` aggregates `tokens` + `base`. `_base.scss` ships: reset, prose defaults, `body { text-align: left; hyphens: none; }` (TYPE-09), default `font-family` from CSS custom properties.
- **D-25:** **Two routes in P1.** `/` is a placeholder ("Phase 1 foundation complete — see /dev/glyph-audit"). `/dev/glyph-audit` is the harness. No 404 page, no header/footer, no library/lessons routes — those are P3.
- **D-26:** App config (`app.config.ts`): `provideRouter`, `provideClientHydration` *not* registered (SSG only, no hydration v1 — Angular `outputMode: "static"` produces pure prerendered HTML), `LOCALE_ID = 'uk-UA'` registered, `registerLocaleData(localeUk)` called once at startup.
- **D-27:** `<html lang="uk">` set in `index.html`.
- **D-28:** `Europe/Kyiv` time-zone is applied wherever `Intl.DateTimeFormat` is used. A thin utility `src/lib/intl.ts` exports `formatDateUk(date)`, `formatNumberUk(n)`, `collatorUk()` with the locale and time zone baked in. **No code in this project may call `Date.prototype.toLocaleDateString()` or `toLocaleString()` without an explicit `'uk-UA'` and `Europe/Kyiv` argument** — enforced by an ESLint rule (custom or `no-restricted-syntax`) added in this phase.
- **D-29:** Build command `pnpm build` produces `dist/browser/` static folder. Dev: `pnpm dev` on `:4200`. CI: per the Phase 1 acceptance, GitHub Actions wires `pnpm lint && pnpm test --run && pnpm build` on push. (Lighthouse gates are P3, but the CI workflow itself lands in P1.)
- **D-30:** Tooling locked: pnpm 10 (lockfile committed), ESLint 9 (flat config) + `angular-eslint` 21.x, Stylelint 16 + `stylelint-config-standard-scss`, Prettier 3 + `prettier-plugin-organize-imports`.
- **D-31:** Pre-commit (host machine, via `pre-commit` Python tool — `.pre-commit-config.yaml` committed): gitleaks, prettier-check on staged, eslint on changed `.ts`, stylelint on changed `.scss`. `.env`, `node_modules/`, `dist/`, and `fonts-source/` (if heavy) gitignored.
- **D-32:** Two doc files exist by phase exit, both filled in (not stubs): `docs/force-en-audit.md` (UKR-06, the project-wide locale audit checklist), `docs/typography-checklist.md` (the phase-exit gate for re-running glyph + specimen verification on a font swap or upgrade).

### Claude's Discretion

- Exact Fontaine-generated numeric overrides (`size-adjust`, `ascent-override`, etc.) — generated by tooling, committed verbatim.
- The exact wording of the Ukrainian Arduino prose specimen (real prose calibration, but the specific paragraphs are Claude's choice — must be technical Arduino content, must use `ґ`, `ї`, `є`, `і`, must include code block, italic, bold, em-dash, en-dash range, and `«…»` quotes).
- ESLint rule formulation that bans bare `toLocaleDateString` / `toLocaleString` calls (custom rule vs `no-restricted-syntax` selector — implementation detail).
- Whether `gitleaks` runs as a pre-commit hook only or also as a CI step (default to both — cheap insurance).
- Internal TypeScript path aliases (`@/*` mapping or similar).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project locks (must read first)

- `CLAUDE.md` — hard constraints: Ukrainian only, Cyrillic-Ext required, ragged-right body, no Tailwind, no Node SSR runtime in v1, frontend owns the contract, real Ukrainian prose for design calibration.
- `.planning/PROJECT.md` — vision, requirements, key decisions table.
- `.planning/REQUIREMENTS.md` — full v1 requirement list. Phase 1 covers TYPE-01..10, UKR-01, UKR-04, UKR-05, UKR-06.
- `.planning/ROADMAP.md` §"Phase 1: Foundation & Typography Gate" — phase goal, depends-on (none), success criteria 1–5.

### Stack research (locked decisions)

- `.planning/research/STACK.md` §1 (Cyrillic-Capable Typography Pipeline) — Pairing A locked (Source Serif 4 + Inter + JetBrains Mono), self-host woff2, subsetting strategy, Fontaine fallback metric pattern, FOUT decision, verification protocol with the canonical Ukrainian verification string.
- `.planning/research/STACK.md` §2 (Angular 21 Specifics) — `outputMode: "static"` SSG strategy, no Node SSR runtime in v1, `LOCALE_ID = 'uk-UA'` setup.
- `.planning/research/STACK.md` §5 (Tooling) — pnpm 10, ESLint 9, Stylelint 16, Prettier 3, `pre-commit` versions; the master frontend installation cheatsheet.
- `.planning/research/PITFALLS.md` — light-only-v1, ragged-right rationale, locale leakage traps. *(Read for the "Looks Done But Isn't" pitfall list.)*
- `.planning/research/SUMMARY.md` — synthesized stack overview.
- `.planning/research/ARCHITECTURE.md` — folder layout intent.
- `.planning/research/FEATURES.md` — feature inventory cross-check.

### Phase 1 success criteria (gate)

- `.planning/ROADMAP.md` §"Phase 1: ... Success Criteria" 1–5 — these are the executable acceptance gates. Specifically:
  1. Glyph audit page renders `і ї є ґ Ї Є Ґ ʼ` correctly across regular/italic/bold/bold-italic for body/display/mono — verified visually side-by-side, no synthesized italics, no fallback `ґ`.
  2. Specimen page in real Ukrainian Arduino prose shows ~55–65ch measure, ragged-right, no FOIT, no measurable CLS.
  3. Font pairing swap is a single-file edit (`tokens/_typography.scss`) — proven by dry-run.
  4. `<html lang="uk">`, `LOCALE_ID = 'uk-UA'`, `Intl.DateTimeFormat('uk-UA')` and `Intl.NumberFormat('uk-UA')` produce Ukrainian output on a demo route — verified under force-en browser locale.
  5. `.env` gitignored, `gitleaks` pre-commit hook, `docs/force-en-audit.md` exists and has been run once.

### External docs to consult during execution

- Fontaine — fallback metric override generation: https://github.com/unjs/fontaine
- fonttools / pyftsubset — variable woff2 subsetting: https://fonttools.readthedocs.io/
- Source Serif 4 source TTFs (Adobe / SIL OFL): https://github.com/adobe-fonts/source-serif
- Inter source TTFs (SIL OFL): https://github.com/rsms/inter
- JetBrains Mono source TTFs (SIL OFL): https://github.com/JetBrains/JetBrainsMono
- Angular 21 SSG / `outputMode: "static"`: https://angular.dev/guide/prerendering
- Angular `LOCALE_ID` + `registerLocaleData`: https://angular.dev/api/core/LOCALE_ID
- gitleaks pre-commit: https://github.com/gitleaks/gitleaks
- pre-commit framework: https://pre-commit.com/

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

None. The repository contains only `CLAUDE.md` and `.planning/` at the start of Phase 1. This phase scaffolds the Angular app from scratch.

### Established Patterns

None in code yet. Patterns to **establish** in P1 that downstream phases will follow:
- SCSS architecture: global `styles/tokens/` + `styles/base/` only; component styles co-locate.
- Token consumption: components use `var(--...)`, never raw SCSS variables directly.
- `Intl` calls go through `src/lib/intl.ts` — never bare `toLocaleString` / `toLocaleDateString`.
- Pre-commit gates: gitleaks + lint + format on every commit.

### Integration Points

None to integrate with. P1 is greenfield. P2 (primitives) will integrate with the tokens established here. P3 (page templates) will integrate with both. P4 (Wagtail) integrates with the FE contract locked in P2.

</code_context>

<specifics>
## Specific Ideas

- **Editorial north star:** the official Arduino Starter Kit book — confident typography hierarchy, generous whitespace, warm off-white paper, restrained palette. The Phase 1 specimen page should already start to *feel* like that book, even without primitives — the body type, measure, and color choices set the tone.
- **Paper color is warm, not pure white.** `#FAF8F3` on Ink `#1A1A1A` is the starting calibration. Pure white feels clinical; the warm paper is where the "feels like a book" core value starts being delivered.
- **Arduino-teal `#00979D` as accent only.** Not a brand color, not used for headings or body — only for links, code-block frame, figure numbers. Restrained. The site has its own identity inspired by Arduino, not Arduino-branded (PROJECT.md decision).

</specifics>

<deferred>
## Deferred Ideas

- **Dark mode** — light-only in v1 by explicit decision (TYPE-08, PROJECT.md). The two-tier token architecture (SCSS raw + CSS-custom-prop semantic) keeps the door open for a future *parallel* dark theme (not a CSS-variable swap — see PITFALLS.md), but no work in v1.
- **Source Serif 4 vs Literata A/B test** — open question deferred to Phase 6 polish (per STATE.md). Phase 1 commits to Source Serif 4. Revisit only if calibration on real prose feels off.
- **`core-ui` library project** — P2.
- **Primitives** (`Heading`, `Body`, `CodeBlock`, etc.) — P2.
- **Shiki integration** — P3 (binds to the `CodeBlock` primitive, which is P2; build-time pipeline lands in P3 with the page templates).
- **Lighthouse gates** — P3 success criteria, not P1.
- **`hyphens: auto` for body** — explicitly rejected (CLAUDE.md, PITFALLS.md). Ragged-right only.
- **Card-grid library / lesson index** — explicitly rejected (CLAUDE.md, REQUIREMENTS.md out-of-scope). P3 builds the typographic table-of-contents instead.

</deferred>

---

*Phase: 01-foundation-typography-gate*
*Context gathered: 2026-04-30*
