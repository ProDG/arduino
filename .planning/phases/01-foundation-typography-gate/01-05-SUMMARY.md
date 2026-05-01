---
phase: 01-foundation-typography-gate
plan: 05
status: implementation-complete-checkpoint-pending
completed: 2026-05-01
---

# Plan 01-05 — Glyph-audit harness page — SUMMARY

## Sections shipped

| # | Section | Phase 1 success criterion |
| - | ------- | ------------------------- |
| 1 | Glyph matrix — 12 cells = 3 families × 4 styles. Each cell renders the canonical D-17 verification string at body and 64px display sizes, plus an isolated 96px row of `і ї є ґ Ї Є Ґ ʼ`. | #1 (Ukrainian glyph coverage across regular/italic/bold/bold-italic for body/display/mono) |
| 2 | Real-prose specimen — Ukrainian Arduino content from `specimen-prose.const.ts`. Includes H1, lede, body para with inline `<strong>`/`<em>`/`<code>`, H2, code block (with Cyrillic comment), figure with caption, H3, aside. Constrained to `var(--measure-prose)` (62ch). | #2 (~62ch measure, ragged-right, no FOIT, no measurable CLS — last two visually verified) |
| 3 | Locale demo — live date, fixed-date verification anchor (`new Date('2026-04-30T12:00:00Z')` → `30 квітня 2026 р.`), number with NBSP separator + comma decimal, Ukrainian-collated sort. Audit instruction footer references `docs/force-en-audit.md` (PLAN 06). | #4 (uk-UA locale outputs verified under force-en) |

## Files

| Path | Lines | Purpose |
| ---- | ----- | ------- |
| `src/app/pages/glyph-audit/verification-string.const.ts` | 16 | Canonical verification string + critical-glyph row. Apostrophe is U+02BC (verified by UTF-8 byte `0xCA 0xBC`). |
| `src/app/pages/glyph-audit/specimen-prose.const.ts` | 38 | All locked Ukrainian Arduino prose strings — H1, lede, body, H2, after-H2, code block (incl. Ukrainian comment), figure caption, H3, after-H3, aside. |
| `src/app/pages/glyph-audit/glyph-audit.component.ts` | 80 | Standalone OnPush component. Imports intl facade + constants. `today` (live) and `fixedDate` (deterministic) both formatted via `formatDateUk`. |
| `src/app/pages/glyph-audit/glyph-audit.component.html` | ~75 | Three sections wired through `@for`. `[innerHTML]` used for the prose paragraphs that ship inline `<strong>`/`<em>`/`<code>` markup (hardcoded constants, zero user input). |
| `src/app/pages/glyph-audit/glyph-audit.component.scss` | ~95 | Co-located component styles. Consumes `var(--…)` only (D-02). Range-syntax media queries (`@media (width >= 768px)`). |
| `public/robots.txt` | 2 | `User-agent: * / Disallow: /dev/` |

## Automated gates — all green

- `pnpm build` succeeds. `dist/arduino-hub/browser/dev/glyph-audit/index.html`
  exists with prerendered content.
- Cell count in built HTML: `12` (`grep -oE 'class="cell"' | wc -l`).
- `<meta name="robots" content="noindex">` in built head.
- Built HTML contains: `Гліф-аудит`, `Ґаздиня`, `Перший крок: світлодіод`,
  `блимаємо світлодіодом`, `Локалізація`, `30 квітня 2026 р.`,
  `Сьогодні (live)`, `Фіксована дата`. All asserted via grep.
- Locale demo rendered output (verified in build):
  - Live: `Сьогодні (live): 1 травня 2026 р.` (today is 2026-05-01)
  - Fixed: `Фіксована дата (для перевірки): 30 квітня 2026 р.`
  - Number: `1 234 567,89` (NBSP separators)
  - Sort: `абрикос → буряк → ґніт → їжак → ялинка`
- `dist/arduino-hub/browser/robots.txt` ships `Disallow: /dev/`.
- `pnpm lint` passes (no bare `toLocale*` violation, no stylelint issue).
- `pnpm format:check` clean.
- `pnpm test` 3/3 pass (intl spec).

## Pending — Task 3 visual checkpoint (BLOCKING gate)

The plan's third task is a `checkpoint:human-verify` gate. Implementation
is complete but the visual checks (italic Cyrillic look real, no tofu on
ґ in any cell, FOUT not FOIT, CLS < 0.05, force-en regression) cannot
be done by an automated executor — they require loading the page in a
browser.

**To run the checkpoint:**

```bash
pnpm build
pnpm dlx http-server dist/arduino-hub/browser -p 4300
# open http://localhost:4300/dev/glyph-audit
```

Then walk through the nine visual checks listed in
`01-05-PLAN.md` §"Task 3 / how-to-verify" — including the force-en
regression test in DevTools Sensors. Once the user types `approved` (or
files specific FAILs), this SUMMARY's status promotes from
`implementation-complete-checkpoint-pending` to `complete`.

## Notes / deviations

- **Stylelint media-feature-range-notation autofix** rewrote
  `(min-width: 768px)` → `(width >= 768px)` and merged
  `row-gap`/`column-gap` into `gap`. Both are modern CSS, fully supported
  in Angular 21 build pipeline. Committed as-is.
- **Apostrophe encoding (U+02BC) verified at write time** via Python read
  of the const file's UTF-8 bytes. Did not regress through Prettier.
- **`<aside>` accessibility lint** — angular-eslint did not flag the
  bare `<aside>` (no `role`/`aria-*`). The aside is decorative editorial
  pattern (sidenote-style); P2 will introduce a primitive that handles
  any required ARIA.

## Open hand-offs

| To plan | Hand-off |
| --- | --- |
| **PLAN 06** | After human checkpoint passes, PLAN 06 runs the font-swap dry-run (TYPE-06): edit `src/styles/tokens/_typography.scss` family stacks to swap Source Serif 4 → Literata, rebuild, observe the harness re-render, record evidence in `font-swap-dry-run.md`. PLAN 06 also writes `docs/typography-checklist.md` (referenced by Task 3 of THIS plan) and `docs/force-en-audit.md` (referenced by the audit footer in Section 3). The CI workflow PLAN 06 lands must run `pnpm lint:verify-rule` so UKR-06 stays enforced. |

## Requirements progressed

- **TYPE-01** — visually verified pending (Task 3); implementation in place.
- **TYPE-02** — Cyrillic-Ext rendering: visual gate pending; build delivers
  the woff2 files, the matrix exposes them.
- **TYPE-03** — `font-display: swap` shipped in PLAN 03; Fontaine fallbacks
  in place. FOUT/CLS verification is the visual checkpoint.
- **TYPE-04** — harness exists; PLAN 02-content phases will consume tokens
  on top.
- **TYPE-07** — 62ch measure exercised on the specimen section.
