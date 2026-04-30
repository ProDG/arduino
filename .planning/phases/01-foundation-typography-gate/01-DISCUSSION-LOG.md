# Phase 1: Foundation & Typography Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `01-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 01-foundation-typography-gate
**Areas discussed:** Token architecture, Font pipeline, Glyph audit harness, Repo scaffold scope

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Token architecture | SCSS token file split, semantic naming, CSS-custom-property strategy, type/spacing/color scale numerics. Ensures TYPE-06 one-file font swap. | ✓ |
| Font pipeline | Subsetting tool, exact weights shipped, unicode-range strategy, preload list, Fontaine fallback metric integration. | ✓ |
| Glyph audit harness | Page layout for the 24+ cell matrix, real-prose specimen placement, route path, dev-only vs shipped. | ✓ |
| Repo scaffold scope | How much Angular 21 app skeleton lands in P1 vs deferred to P2. | ✓ |

**User's choice:** "I'd like to see your suggestions." — user delegated all four areas to Claude with the request to present concrete recommendations and let the user accept or steer. All four areas were discussed sequentially as a single recommendation per area.

---

## Token architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Accept as starting point | File split (typography/color/spacing/layout/radius/shadow), two-tier SCSS-vars + CSS-custom-props, handpicked type scale, 6-color palette starting with paper #FAF8F3 / ink #1A1A1A / Arduino-teal accent, 4px-base spacing. | ✓ |
| Single-tier, SCSS only | Drop the CSS-custom-property layer. Simpler, but a future dark theme becomes a rebuild. | |
| Pure white paper | #FFFFFF / #000000 instead of warm off-white + soft black. More clinical, less book-feel. | |
| Modular type scale | Strict 1.25 (or 1.333) ratio instead of handpicked sizes. More mathematically pure; less editorial control. | |

**User's choice:** Accept as starting point.
**Notes:** Real numeric values (sizes, exact hex) are the starting point — calibration against real Ukrainian Arduino prose during execution may shift sizes ±2px. Architecture itself is locked.

---

## Font pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| Accept as proposed | pyftsubset script, 6 committed woff2 files (3 families × roman/italic), all variable, no unicode-range, preload only the two roman files, Fontaine output committed inline. | ✓ |
| Split Latin and Cyrillic | unicode-range split → 12 woff2 total. Saves bytes for Latin-only crawlers but adds a second request on every page on a uk-only site. | |
| CI-step subsetting | Run pyftsubset on every CI build. Source TTFs are SoT; less deterministic. | |
| Preload all four roman+italic | Faster italic appearance; quadruples preload bytes on first paint. | |

**User's choice:** Accept as proposed.
**Notes:** Subsetting is a one-shot script (rerun only on font version bump), not on every build. Roman/italic split per family because each family ships a separately-mastered italic — required for italic Cyrillic to render real, not synthesized.

---

## Glyph audit harness

| Option | Description | Selected |
|--------|-------------|----------|
| Accept as proposed | Single `/dev/glyph-audit` page combining 12-cell glyph matrix + isolated-glyph row + real-prose specimen + Intl locale demo. Noindex but shipped. | ✓ |
| Split into two pages | `/dev/glyph-audit` (matrix) + `/dev/specimen` (prose). Cleaner separation; doubles checklist friction. | |
| Three pages | Matrix + specimen + locale-demo all separate. Most rigorous, most friction. | |
| Dev-only, not shipped | Stripped from production bundle. Cannot verify on the live VPS after deploy. | |

**User's choice:** Accept as proposed.
**Notes:** Combining matrix + specimen + locale demo on one page means a font swap or upgrade is verified and recalibrated together at one URL. Shipped to production (noindex) so the audit can be re-run on the live VPS.

---

## Repo scaffold scope

| Option | Description | Selected |
|--------|-------------|----------|
| Accept as proposed | Single Angular app (no core-ui library yet), only `/dev/glyph-audit` + placeholder `/`, raw HTML on the harness, all tooling + pre-commit + docs land in P1. | ✓ |
| Add core-ui library now | Create empty core-ui library project structure in P1. Risks designing the library API before knowing what primitives need. | |
| Drop pre-commit hooks to P3 | Keep gitleaks (security) but defer prettier/eslint/stylelint pre-commit wiring to P3. | |
| Add CI workflow now | (Note: CI workflow is in scope as proposed — this option was offered as a check.) | |

**User's choice:** Accept as proposed.
**Notes:** P1 ships the foundation only. The harness page uses raw HTML elements (no primitives), so it remains a regression check after P2 lands. CI workflow (lint + test + build) is in scope for P1 even though Lighthouse gates are P3.

---

## Claude's Discretion

- Exact Fontaine-generated numeric overrides (tooling-generated).
- Exact wording of the Ukrainian Arduino prose specimen (constraints: technical Arduino content, must use ґ ї є і, must include code block, italic, bold, em-dash, en-dash range, «…» quotes).
- ESLint rule formulation banning bare `toLocaleDateString` / `toLocaleString` calls.
- Whether `gitleaks` runs as pre-commit only or also CI step (defaulting to both).
- Internal TypeScript path aliases.

## Deferred Ideas

- Dark mode → v2 (parallel theme, not a CSS-variable swap).
- Source Serif 4 vs Literata A/B → Phase 6 polish.
- `core-ui` library, primitives, Shiki, page templates → P2/P3.
- Lighthouse gates → P3.
- `hyphens: auto`, justified body, card-grid library index → permanently rejected.
