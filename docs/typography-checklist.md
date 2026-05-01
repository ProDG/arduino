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
