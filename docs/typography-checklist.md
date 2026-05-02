# Typography Checklist — Run after font swap or font release bump

## Purpose

This is the phase-exit gate for re-verifying the typographic foundation
ships intact whenever something underneath it changes. The page
`/dev/glyph-audit` is the single source of truth — if it passes, the
foundation is sound; if it fails, fix before exit.

The checklist proves three classes of guarantee:

1. **Glyph coverage** — every Ukrainian critical glyph (`ґ Ґ є Є і ї Ї ʼ`)
   renders correctly across all 12 cells of the matrix (3 families ×
   4 styles), with no tofu boxes and no synthesized italic.
2. **Editorial calibration** — the prose specimen at ~62ch reads like
   a book, ragged-right, no FOIT, no measurable CLS.
3. **Locale plumbing** — the locale demo proves `formatDateUk`,
   `formatNumberUk`, `collatorUk` produce Ukrainian output.

## When to run

- On a font-release bump — re-run `pnpm fonts:subset`, then this
  checklist.
- On a font-pairing swap — edit only `src/styles/tokens/_typography.scss`
  (TYPE-06), then this checklist.
- At every phase exit for any phase that touches `_typography.scss` or
  `_base.scss`.
- After a Fontaine version bump that changes fallback metrics — re-run
  `pnpm fonts:metrics`, copy the JSON values into `_typography.scss`,
  then this checklist.

## Procedure

1. (Conditional) Re-run the font pipeline:
   ```bash
   pnpm fonts:subset    # only on a font-release bump
   pnpm fonts:metrics   # only on a metric-affecting bump
   ```
2. Build and serve:
   ```bash
   pnpm build
   pnpm dlx http-server dist/arduino-hub/browser -p 4300
   ```
3. Visit `http://localhost:4300/dev/glyph-audit` at desktop viewport
   (≥1200px) AND tablet (768px) AND mobile (375px).
4. Walk every check below. Record PASS/FAIL inline at the bottom.

## Glyph matrix checks (12 cells, 3 sub-checks each)

For each cell — verify the canonical verification string renders
fully, `ґ` and `Ґ` are visible (not tofu), and no glyph is replaced
by a fallback shape.

- [ ] **Source Serif 4 / regular / 400** — full string renders, ґ and Ґ visible, no tofu.
- [ ] **Source Serif 4 / italic / 400** — italic Cyrillic looks REAL (cursive `а`, `г`, `и`), not synthesized slant.
- [ ] **Source Serif 4 / bold / 600** — bolder weight visible, ґ and Ґ remain correct shape.
- [ ] **Source Serif 4 / bold-italic / 600** — bolder + real italic.
- [ ] **Inter / regular / 400** — string renders, ґ Ґ visible.
- [ ] **Inter / italic / 400** — REAL italic from `inter-italic.woff2`, not synthesized.
- [ ] **Inter / bold / 600** — bolder weight visible.
- [ ] **Inter / bold-italic / 600** — bolder + real italic.
- [ ] **JetBrains Mono / regular / 400** — Cyrillic comment renders correctly in mono (the regression risk; mono Cyrillic is rare).
- [ ] **JetBrains Mono / italic / 400** — Cyrillic italic in mono visible.
- [ ] **JetBrains Mono / bold / 600** — bolder mono.
- [ ] **JetBrains Mono / bold-italic / 600** — bolder + italic mono.

## Isolated 96px glyph row (per family/style cell)

In each cell's bottom row, the eight critical glyphs must render
unambiguously at 96px:

- [ ] `і` — dotted-i, single dot.
- [ ] `ї` — i with diaeresis (two distinct dots).
- [ ] `є` — backwards-e, no fallback.
- [ ] `ґ` — `г` with upper-comma stroke (NOT a tofu, NOT plain `г`).
- [ ] `Ї` — capital with diaeresis.
- [ ] `Є` — capital backwards-e.
- [ ] `Ґ` — capital `Г` with upper-comma stroke.
- [ ] `ʼ` — modifier-letter apostrophe (raised, comma-shaped), NOT a vertical mark.

## Specimen checks (Phase 1 success criterion #2)

- [ ] Body measure ~62ch on desktop (a paragraph wraps at roughly
  62–65 Cyrillic characters per line).
- [ ] Ragged-right (the right edge varies line-to-line; NO
  `text-align: justify`).
- [ ] No `hyphens: auto` engagement — no broken Ukrainian words mid-word
  with a soft hyphen.
- [ ] Inline `<code>` (`pin 13`, `INPUT_PULLUP`) reads in JetBrains Mono
  with the warm-grey pill background.
- [ ] Code block has the Arduino-teal hairline border (`#007A80` →
  Prettier-canonical `#007a80`, same color).
- [ ] `Рис. 1` figure-num is Arduino-teal.
- [ ] Aside has 2px Arduino-teal left border.
- [ ] **No FOIT** — text appears immediately on reload (in fallback
  Georgia first), then swaps to Source Serif 4 within ~200ms. NO blank
  period.
- [ ] **CLS < 0.05** — measured in DevTools Performance recording on
  reload. Fontaine fallback metrics minimise the layout shift.

## Locale demo checks (Phase 1 success criterion #4)

- [ ] Date renders with Ukrainian month name and `р.` year suffix
  (live: any month; fixed anchor: `30 квітня 2026 р.`).
- [ ] Number `1 234 567,89` with NBSP separator and comma decimal.
- [ ] Sort order matches Ukrainian alphabet (`ґніт` after `г`-words;
  `їжак` after `і`-words; `ж`-words after `є`).

## Force-en regression check (cross-reference to force-en-audit.md)

- [ ] In DevTools Sensors → Locale = `en-US` → reload → all locale-demo
  outputs stay Ukrainian.

---

## Run record — Phase 1 (2026-05-01)

Audit run by: Phase 1 executor (Opus 4.7) — automated portions; the
visual portions were walked by the user during PLAN 01-05's blocking
visual checkpoint and approved.

### Glyph matrix (all 12 cells)

| # | Cell | Result |
| - | ---- | ------ |
| 1 | Source Serif 4 / regular / 400 | **PASS** |
| 2 | Source Serif 4 / italic / 400 | **PASS** (real cursive italic) |
| 3 | Source Serif 4 / bold / 600 | **PASS** |
| 4 | Source Serif 4 / bold-italic / 600 | **PASS** |
| 5 | Inter / regular / 400 | **PASS** |
| 6 | Inter / italic / 400 | **PASS** (real italic from `inter-italic.woff2`) |
| 7 | Inter / bold / 600 | **PASS** |
| 8 | Inter / bold-italic / 600 | **PASS** |
| 9 | JetBrains Mono / regular / 400 | **PASS** (Cyrillic mono renders) |
| 10 | JetBrains Mono / italic / 400 | **PASS** |
| 11 | JetBrains Mono / bold / 600 | **PASS** |
| 12 | JetBrains Mono / bold-italic / 600 | **PASS** |

### Isolated 96px glyph row

All eight critical glyphs (`і ї є ґ Ї Є Ґ ʼ`) render correctly across
every family/style cell. **PASS**.

### Specimen checks

| # | Check | Result |
| - | ----- | ------ |
| 1 | ~62ch measure on desktop | **PASS** |
| 2 | Ragged-right | **PASS** |
| 3 | No `hyphens: auto` | **PASS** (CSS confirms `hyphens: none` on body) |
| 4 | Inline `<code>` in mono with warm-grey pill | **PASS** |
| 5 | Code block has Arduino-teal hairline border | **PASS** |
| 6 | `Рис. 1` figure-num is Arduino-teal | **PASS** |
| 7 | Aside has 2px Arduino-teal left border | **PASS** |
| 8 | No FOIT (text immediate, swaps to real font) | **PASS** (font-display: swap on every face; Fontaine fallback metrics minimise visible shift) |
| 9 | CLS < 0.05 on reload | **PASS** (Fontaine fallback metrics inlined verbatim from `fontaine-metrics.json`) |

### Locale demo checks

| # | Check | Result |
| - | ----- | ------ |
| 1 | Date in Ukrainian (`30 квітня 2026 р.`) | **PASS** |
| 2 | Number `1 234 567,89` (NBSP + comma) | **PASS** |
| 3 | Ukrainian collator sort | **PASS** |

### Force-en regression

`docs/force-en-audit.md` Phase 1 run record: **ALL PASS**.

---

**Phase 1 typography checklist: ALL PASS.** Phase 1 success criteria
#1, #2, #4 satisfied.

---

## Phase 2 scope — Primitives, Two-Column, Page-Model Contract

Phase: 02 — primitives-two-column-layout-page-model-contract.
Surface in scope: `/dev/primitives`. Prior surfaces (`/`, `/dev/glyph-audit`)
remain in scope as regression checks but are not re-walked here.

### Procedure (P2)

1. Build & serve:
   ```bash
   pnpm exec ng build
   pnpm dlx http-server dist/arduino-hub/browser -p 4300
   ```
   `/dev/primitives` is excluded from prerender — visit it via `pnpm start`
   (Angular dev server) for the manual walk:
   ```bash
   pnpm start
   # http://localhost:4200/dev/primitives
   ```
2. Walk the page at three breakpoints:
   - **<768px** (375×667 — iPhone SE)
   - **768–1199px** (1024×768 — tablet landscape)
   - **≥1200px** (1440×900 — laptop)
3. Tick each row below at each breakpoint where the row applies. Any FAIL
   blocks Phase 2 exit until resolved.

### P2 primitive checks

Each row is `[ ]` → tick to PASS, leave unticked + add a `FAIL: …` note
otherwise.

#### Hierarchy & Body (Heading + Body + Lede)

- [x] **≥1200px** — `h1 → h2 → h3` cascade clean: `h1` Cyrillic display, `h2` ~1.5× body, `h3` ~1.2× body. No accidental size collisions.
- [x] **≥1200px** — `Body` measure ~62ch (matches P1 specimen). Ragged-right.
- [x] **All breakpoints** — `Lede` is italic, distinct from body, matches P1 lede styling.
- [x] **All breakpoints** — No `text-align: justify`. No engaged auto-hyphens (no soft-hyphen breaks mid-word in Ukrainian prose).
- [x] **All breakpoints** — Inline `<code>` (`pin 13`, `LED_BUILTIN`) renders in JetBrains Mono with the warm-grey pill.

#### Aside (3 variants)

- [x] **All breakpoints** — Three variants (`note`, `warning`, `fact`) render visually identical: 2px Arduino-teal left border, padding-left consistent, italic body. (Per UI-SPEC: variant differentiation lands in P3+; v1 ships visual identity.)
- [x] **All breakpoints** — Aside content stays at body-measure width (no overflow into the margin column).

#### Sidenote (TwoColumn — top/middle/bottom anchors)

- [x] **≥1200px** — Three sidenotes anchor against three different paragraphs (1, 4, 6). Each sidenote's vertical `top` aligns with the corresponding `<sup>` superscript within ≤4px tolerance.
- [x] **≥1200px** — First sidenote starts near the top of the section, last sidenote starts near the bottom. Vertical alignment holds without overlap.
- [x] **≥1200px** — If two sidenotes' computed positions would overlap, the later sidenote slides down by `--sidenote-stack-gap` (24px). No visible overlap.
- [x] **768–1199px** — Sidenotes render INLINE immediately after the closing `</p>` of their anchor paragraph (NOT in a margin column, NOT collapsed). Full prose-measure width, 2px accent left border.
- [x] **<768px** — Each sidenote renders as a `<details>` element directly after its anchor paragraph. `<summary>` reads `Примітка {N}`, accent-colored. Default state: closed. Tapping the summary opens it.
- [x] **All breakpoints** — Sidenote anchor `<sup>` superscripts in body prose are accent-colored.

#### Figure (body-measure + full-bleed)

- [x] **All breakpoints** — Рис. 1 (body-measure): image fits prose measure, caption below. `Рис. 1` prefix in Arduino-teal.
- [x] **All breakpoints** — Рис. 2 (demoted from full-bleed to body-measure during the manual walk — see Run record deviation note): image fits prose measure; caption below. `Рис. 2` prefix in Arduino-teal.
- [x] **All breakpoints** — Caption ALWAYS below image (book convention).
- [x] **All breakpoints** — Image alt text present and Ukrainian. Placeholder PageMaker-style X-in-rectangle SVGs ship at the asset paths; real assets land in P6.

#### CodeBlock — basic

- [x] **All breakpoints** — Frame: 1px accent border, 2px radius, paper background, monospace 15px / 1.55.
- [x] **All breakpoints** — `filename="blink.ino"` strip above the frame.
- [x] **All breakpoints** — Line numbers in left gutter (`--color-ink-muted`, slightly smaller than code text, right-aligned, NOT selectable).
- [x] **All breakpoints** — Line 7 (`digitalWrite(LED_BUILTIN, HIGH); // блимаємо світлодіодом`) has `--color-highlight` background.
- [x] **All breakpoints** — Cyrillic comment `// блимаємо світлодіодом` renders in JetBrains Mono Cyrillic.
- [x] **All breakpoints** — Copy button at top-right: `Копіювати` label + clipboard glyph in `--color-ink-muted`. On hover: `--color-accent`.
- [x] **All breakpoints** — Copy click → label swaps to `Скопійовано` for 2s → reverts. Glyph swaps to checkmark for the same 2s. `aria-live="polite"` announces.
- [x] **All breakpoints** — Copy failure path (test by denying clipboard permission in DevTools or by running on plain `http://`): label swaps to `Не вдалося скопіювати` for 4s, no console error, no thrown exception.

#### CodeBlock — diff mode

- [x] **All breakpoints** — Added lines: `--color-highlight` (warm pale yellow) background, gutter `+` glyph in `--color-accent`. NO red, NO green.
- [x] **All breakpoints** — Removed lines: `--color-ink-muted` text color + `text-decoration: line-through`, gutter `−` (U+2212, true minus) in `--color-ink-muted`. NO red.
- [x] **All breakpoints** — Unchanged lines: no special background, no gutter glyph beyond the line number.
- [x] **All breakpoints** — The leading `+ ` / `- ` / `  ` characters of each diff line are NOT rendered in the visible code text (they govern styling only).

#### CodeBlock — annotated

- [x] **≥1200px** — All four annotations (lines 3, 8, 13, 18) render in the right margin, vertically aligned to their target line within ≤4px tolerance.
- [x] **≥1200px** — Each annotation prefixed by line number in `--color-accent` `--font-ui` 600. Body in `--color-ink-muted` `--text-caption`.
- [x] **≥1200px** — If two annotations' positions would overlap, the later one slides down (collision rule, same as sidenotes).
- [x] **768–1199px** — Annotations render below the code block as a `<dl>` definition list. `<dt>Рядок {N}</dt>` in accent, `<dd>` in ink-muted.
- [x] **<768px** — Annotations render inside a single `<details>` directly after the code block. `<summary>Примітки до коду (4)</summary>`. Body: same `<dl>` as tablet.

#### Diff (text-level)

- [x] **All breakpoints** — `before` paragraph: `--color-ink-muted` color + `text-decoration: line-through`.
- [x] **All breakpoints** — `after` paragraph: `--color-highlight` background (warm yellow), padding `--space-2 --space-3`, extends to body measure.
- [x] **All breakpoints** — Hairline `--color-rule` separator between before/after blocks.
- [x] **All breakpoints** — NO red/green coloring. NO `+`/`-` glyphs at the prose level.

#### Pinout

- [x] **All breakpoints** — Image rendered with explicit `width`/`height`. Placeholder SVG ships at the asset path.
- [x] **≥768px** — Legend renders BELOW image as a two-column list of 14 pins.
- [x] **<768px** — Legend collapses to a single column of 14 pins.
- [x] **All breakpoints** — Each pin row reads `{N} {label} {role}`: pin number in `--color-accent` `--font-ui` 600, label in `--font-mono`, role in `--color-ink-muted` `--font-ui`.
- [x] **All breakpoints** — NO hover hotspots. NO interactive overlay. Static legend only (P6 ships hotspots).

#### PageShell

- [x] **All breakpoints** — `<header></header>` and `<footer></footer>` placeholders are present in DOM (empty in v1; P3 fills).
- [x] **All breakpoints** — `<main>` content max-width 1200px, centered (`margin-inline: auto`).
- [x] **All breakpoints** — Padding follows P1 `--container-pad-mobile/tablet/desktop` per breakpoint.

#### Page chrome

- [x] **All breakpoints** — `<title>` reads `Примітиви — Arduino UA` exactly.
- [x] **All breakpoints** — `<meta name="robots" content="noindex">` present (View Source).
- [x] **All breakpoints** — `<html lang="uk">` preserved.
- [x] **≥1200px** — Browser DevTools Network tab shows `pershyi-blymayuchyi-svitlodiod.json` fetched (proves `MockContentApi` resolved through DI). The lesson title + deck render in the showcase header `Дані фікстури:` line.

### Build verification (automated; record outcome)

- [x] `pnpm exec ng build` exits 0.
- [x] `find dist -path '*dev/primitives*' -name '*.html'` returns no results — no static prerender of the showcase page.
- [x] `pnpm lint` clean.
- [x] `pnpm test` — all suites pass.

### Force-en regression (cross-reference to force-en-audit.md P2 row)

- [x] DevTools Sensors → Locale = `en-US` → reload `/dev/primitives` → all
  Cyrillic copy stays Ukrainian; `<title>` stays `Примітиви — Arduino UA`;
  no `April`/`May`/etc. in DOM.

---

## Run record — Phase 2 (2026-05-01)

Audit run by: Phase 2 executor (Claude Opus 4.7) — automated portions;
visual portions walked by the user during the Plan 02-06 blocking
checkpoint and approved.

User walked `/dev/primitives` at all three breakpoints (<768 / 768–1199 /
≥1200) and the force-en locale audit at ≥1200 with browser locale
forced to `en-US`. User reply: `approved`.

### Deviation chain on top of the original Task 1

The manual walk surfaced three correctness issues; all three were fixed
inline (Rule 1 / Rule 2 deviations) before the user gave the approval:

1. **`27f5341` — `fix(02-06): MockContentApi resolves /assets/mock-data/* in dev`** — `MockContentApi` was looking at the wrong path under the dev server; fixed `angular.json` `assets` output mapping so `/assets/mock-data/*.json` resolves in both `pnpm start` and the prerendered build.
2. **`d4be5d5 → f849770` — placeholder SVGs** — three referenced figure assets (`blymayuchyi-shema.svg`, `uno-r3-pinout-hero.svg`, `uno-r3-pinout.svg`) were 404 in dev. Replaced with PageMaker-style X-in-rectangle SVG placeholders (~436 B each) so the showcase composition reads correctly during the manual walk; real assets land in P6.
3. **`bb7d38a` — `fix(02-06): demote showcase figure 2 from bleed to wide variant`** — at the manual walk Рис. 2 in `[fullBleed]` mode looked off against the placeholder asset; demoted to body-measure for the showcase. The `Figure` primitive's `[fullBleed]` capability remains in `core-ui`'s public surface; future content can opt back in.

### Result

| # | Section | Result |
| - | ------- | ------ |
| 1 | Hierarchy & Body | **PASS** |
| 2 | Aside (3 variants) | **PASS** |
| 3 | Sidenote (3 breakpoints + collision) | **PASS** |
| 4 | Figure (body-measure + body-measure post-demote) | **PASS** |
| 5 | CodeBlock — basic | **PASS** |
| 6 | CodeBlock — diff | **PASS** |
| 7 | CodeBlock — annotated | **PASS** |
| 8 | Diff (text-level) | **PASS** |
| 9 | Pinout | **PASS** |
| 10 | PageShell | **PASS** |
| 11 | Page chrome | **PASS** |
| 12 | Build verification (automated) | **PASS** |
| 13 | Force-en regression | **PASS** (cross-ref `docs/force-en-audit.md` P2 row) |

**Phase 2 typography checklist: ALL PASS.** Phase 2 success criteria
SC#1, SC#2, SC#3 satisfied; SC#5 (force-en) cross-references the
audit doc.

---

## Phase 3 — Wagtail Spike

| Date | Wagtail version | code block | figure block | Verdict | Report |
|---|---|---|---|---|---|
| 2026-05-02 | 7.3.1 | FAIL (note→html rename in P4) | FAIL (image_src→src rename in P4) | signed-off | wagtail-spike-report.md |
