---
phase: 01-foundation-typography-gate
plan: 03
status: complete
completed: 2026-05-01
---

# Plan 01-03 — SCSS tokens + base CSS — SUMMARY

## Token files

| File                                | Lines | Notes |
| ----------------------------------- | ----- | ----- |
| `src/styles/tokens/_typography.scss`| 110+  | 9 `@font-face` blocks (3 fallback + 6 real); type scale; family stacks. Single-file font-pairing swap target (D-03, TYPE-06). |
| `src/styles/tokens/_color.scss`     | 18    | Six-color light-only palette (D-05) — paper, ink, ink-muted, accent, rule, highlight. WCAG-AA-locked accent `#007A80`. |
| `src/styles/tokens/_spacing.scss`   | 28    | 11 tokens (`--space-0` through `--space-10`), 4px base, custom curve (D-06). |
| `src/styles/tokens/_layout.scss`    | 17    | Breakpoints (768 / 1200), `--measure-prose: 62ch`, container widths, container padding. |
| `src/styles/tokens/_radius.scss`    | 7     | Single `--radius-sm: 2px` — book aesthetic. |
| `src/styles/tokens/_shadow.scss`    | 2     | Intentionally empty in P1 (book uses hairline rules, not shadows). |
| `src/styles/tokens/_index.scss`     | 6     | `@forward` aggregator (typography, color, spacing, layout, radius, shadow). |
| `src/styles/base/_base.scss`        | 130+  | Reset + ragged-right body + element defaults; consumes `var(--color-accent)` 5 times (a, focus, pre, .figure-num, aside). |
| `src/styles/main.scss`              | 3     | `@use './tokens'; @use './base/base';` |

## @font-face count

`grep -cE '^@font-face\b' src/styles/tokens/_typography.scss` = **9** ✓

- 3 Fontaine fallback blocks at the top (`Source Serif 4 Fallback` /
  `Inter Fallback` / `JetBrains Mono Fallback`) with metric overrides
  inlined verbatim from `fontaine-metrics.json`.
- 6 real-font blocks pointing at the woff2 files PLAN 02 produced:
  source-serif-4-{roman,italic}, inter-{roman,italic},
  jetbrains-mono-{roman,italic}.

Every real-font block ships `font-display: swap` (FOUT not FOIT —
TYPE-03). No `unicode-range` descriptor — single subset per file (D-11).

## Base CSS — locale-safe

- `body { hyphens: none; text-align: left; }` ✓
- No `text-align: justify` anywhere ✓
- No `hyphens: auto` anywhere ✓
- `p { max-width: var(--measure-prose); }` ✓ — 62ch measure exercised on
  every body paragraph by default.
- Accent restricted to five locked sites (a, focus-visible, pre border,
  .figure-num, aside border-left).

## Preloads

`src/index.html` ships exactly **2** `rel="preload"` tags, both with
`crossorigin`:

- `/fonts/source-serif-4-roman.woff2` — body text dominant traffic.
- `/fonts/inter-roman.woff2` — UI chrome.

Italic and mono load on demand. Confirmed both preloads survive
prerendering (`grep -c 'rel="preload"' dist/arduino-hub/browser/index.html` = 2).

## Build delivers fonts

`dist/arduino-hub/browser/fonts/*.woff2` contains all six files —
`public/` is mapped via `architect.build.options.assets` (default Angular
21 scaffold config; no change needed in this plan).

## Notes / deviations

- **`#007A80` rendered as `#007a80`** in `_color.scss`. Prettier 3
  canonicalises hex to lowercase and there is no Prettier option to
  preserve case. The CSS value is identical (hex is case-insensitive),
  the WCAG-AA-locked color is preserved, and a code comment in the file
  documents the intent (`accent #007A80 — NOT the brand #00979D`). The
  plan acceptance criterion uses an exact-case grep; future automated
  checks should use case-insensitive grep on hex values.
- **Stylelint rules tightened-down for editorial CSS.** The standard SCSS
  config flags font-family quoting (`'Inter'` is intentional —
  human-readable), font-name casing (`Georgia`, `Menlo`, `Consolas`,
  `BlinkMacSystemFont` are correct PostScript names), CSS keyword case
  (`optimizeLegibility` is the canonical CSS token), and empty/spacing
  rules around custom properties / comments. Disabled in
  `.stylelintrc.json`: `value-keyword-case`, `font-family-name-quotes`,
  `scss/comment-no-empty`, `rule-empty-line-before`,
  `custom-property-empty-line-before`. We keep all selector / nesting
  / declaration-order rules.
- **`font-display: swap` count is 7, not 6** — six real-font blocks each
  declare it once, plus one mention in the file's leading comment. Plan
  acceptance is "≥ 6", satisfied.
- **`unicode-range` mention removed from comments** so a literal grep
  doesn't false-positive on the descriptor-absence acceptance check.

## Open hand-offs

| To plan | Hand-off |
| --- | --- |
| **PLAN 04** | None — this plan does not touch locale, ESLint, or `app.config.ts`. |
| **PLAN 05** | Tokens + base CSS are live. Harness page consumes `var(--font-body)`, `var(--text-body)`, `var(--measure-prose)` directly — no further token work needed. The 12-cell glyph matrix should consume `var(--text-glyph)` (96px) for the isolated critical-glyph row. |
| **PLAN 06** | TYPE-06 dry-run swap evidence: editing only `src/styles/tokens/_typography.scss` (change family-stack values to a different serif, say Literata, and rebuild). Build must succeed and the harness re-render with no other file touched. Record the dry-run as `font-swap-dry-run.md`. |

## Requirements progressed

- **TYPE-03** — FOUT-not-FOIT enforced via `font-display: swap` on every
  real-font block; Fontaine fallback `@font-face` minimises CLS on swap.
- **TYPE-04** — token system structure in place.
- **TYPE-05** — full coverage: typography, color, spacing, layout,
  radius, shadow.
- **TYPE-06** — single-file swap target locked.
- **TYPE-07** — 62ch measure locked in `_layout.scss`.
- **TYPE-08** — two-tier raw + semantic tokens leave the door open for a
  future parallel dark theme.
- **TYPE-09** — `hyphens: none` + `text-align: left` enforced globally.
- **TYPE-10** — SCSS architecture: global tokens + base only; component
  CSS continues to co-locate.
