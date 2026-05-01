---
phase: 02-primitives-two-column-layout-page-model-contract
plan: 04
subsystem: ui
tags: [angular, scss, layout, sidenote, two-column, resize-observer, signal]

requires:
  - phase: 01-foundation-typography-gate
    provides: container tokens (--container-max, --container-pad-*), spacing scale (--space-*), measure-prose token
  - phase: 02-primitives-two-column-layout-page-model-contract/02-01
    provides: core-ui scaffold (ng-packagr entry, public-api barrel)
  - phase: 02-primitives-two-column-layout-page-model-contract/02-03
    provides: computeSidenoteStack pure-function geometry, sidenote/sidenote-ref primitives, 10 editorial primitives
provides:
  - PageShellComponent (header/main/footer wrapper with container paddings)
  - MarginRailComponent (vertical-stack wrapper, --margin-rail-width on desktop)
  - TwoColumnComponent (three-mode layout with JS-measured sidenote anchoring)
  - layout tokens: --margin-rail-width (18rem), --margin-rail-gap, --sidenote-stack-gap
affects: [02-05, 02-06, 03-page-templates, 06-polish]

tech-stack:
  added: []
  patterns:
    - "afterNextRender + ResizeObserver (50ms debounce) is the locked pattern for browser-only DOM measurement in zoneless Angular 21"
    - "viewChild.required signal queries replace ViewChild decorators"
    - "Three-mode viewport switching via internal signal driven by window.innerWidth thresholds (>=1200, 768..1199, <768)"
    - "Reversible DOM relocation: each mode-entry method has a companion mode-exit method that restores the source DOM"

key-files:
  created:
    - projects/core-ui/src/lib/page-shell/page-shell.component.ts
    - projects/core-ui/src/lib/page-shell/page-shell.component.scss
    - projects/core-ui/src/lib/margin-rail/margin-rail.component.ts
    - projects/core-ui/src/lib/margin-rail/margin-rail.component.scss
    - projects/core-ui/src/lib/two-column/two-column.component.ts
    - projects/core-ui/src/lib/two-column/two-column.component.scss
  modified:
    - src/styles/tokens/_layout.scss
    - projects/core-ui/src/public-api.ts

key-decisions:
  - "computeSidenoteStack is the SOLE geometry source for desktop sidenote placement; no other component touches the math."
  - "Tablet mode actively relocates <aside.sidenote> nodes inline (no <details> wrap); margin slot is hidden via CSS data-mode attribute selector."
  - "Mobile mode wraps relocated sidenotes in <details data-mobile-disclosure='true'><summary>Примітка N</summary>… per UI-SPEC copywriting contract."
  - "Mode transitions are reversible — entering desktop calls unwrapMobileDisclosures + unrelocateTabletInline before placeDesktopSidenotes; entering each non-desktop mode clears desktop placements first."
  - "MarginRail does NOT use position: sticky (UI-SPEC §MarginRail explicitly rejects sticky for v1)."
  - "No CSS anchor-name / position-anchor (UI-SPEC rejects for v1 due to mobile WebKit gaps); JS measurement is the locked mechanism."

patterns-established:
  - "Layout primitives compose via named ng-content slots: <ng-content select='[body]'/> + <ng-content select='[margin]'/>. Anchor convention: <p data-sidenote-anchor='N'> in body pairs with Nth <ui-sidenote> in margin DOM order."
  - "DOM-touching code lives ONLY inside afterNextRender callback; no lifecycle hooks (ngAfterViewInit etc.) for measurement."
  - "Token append-only policy: _layout.scss extends the existing :root block; no token deletions or renames."

requirements-completed: [PRIM-03, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05]

duration: ~6min
completed: 2026-05-01
---

# Phase 02 Plan 04: Layout Primitives & Two-Column Sidenote Anchoring Summary

**Three layout primitives shipped — PageShell, MarginRail, and TwoColumn with JS-measured sidenote anchoring driven by computeSidenoteStack across three viewport modes (desktop/tablet/mobile).**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-05-01T08:03:00Z
- **Completed:** 2026-05-01T08:06:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- PageShellComponent: header/main/footer wrapper with breakpoint-stepped container paddings.
- MarginRailComponent: vertical flex stack, `--margin-rail-width` on desktop, no sticky.
- TwoColumnComponent: viewport-mode signal + `afterNextRender` + `ResizeObserver` (50ms debounce); desktop mode delegates geometry to `computeSidenoteStack`, tablet mode relocates sidenotes inline, mobile mode wraps in `<details>Примітка N</summary>` disclosures. All transitions are reversible.
- Three new layout tokens declared in `_layout.scss`: `--margin-rail-width` (18rem), `--margin-rail-gap` (var(--space-6)), `--sidenote-stack-gap` (var(--space-5)).
- Public API surface grows from 11 to 13 component module exports.

## Task Commits

1. **Task 1: page-shell + margin-rail + layout tokens** — `734b728` (feat)
2. **Task 2: two-column with JS-measured sidenote anchoring** — `cb33267` (feat)

## Files Created/Modified
- `src/styles/tokens/_layout.scss` — appended three new tokens to existing `:root` block.
- `projects/core-ui/src/lib/page-shell/page-shell.component.{ts,scss}` — created.
- `projects/core-ui/src/lib/margin-rail/margin-rail.component.{ts,scss}` — created.
- `projects/core-ui/src/lib/two-column/two-column.component.{ts,scss}` — created.
- `projects/core-ui/src/public-api.ts` — three new export lines (page-shell, margin-rail, two-column).

## Decisions Made
- `computeSidenoteStack` from Plan 03 is the only geometry source. The TwoColumn component performs DOM measurement (anchor `top`, sidenote `height`) and delegates collision math to the pure function.
- Tablet mode relocates the bare `<aside.sidenote>` node inline after its anchor and hides the (now-empty) margin slot via `data-mode='tablet'` attribute selector — a reversible single-tree DOM strategy that avoids cloning or projection complexity.
- Mobile mode reuses the same relocation primitive but wraps each sidenote in a `<details data-mobile-disclosure>` with the locked Cyrillic summary text `Примітка ${num}` (per UI-SPEC §Copywriting Contract).
- `viewChild.required` (signal queries) used throughout — matches Angular 21 zoneless idiom established in Plan 03 components.

## Deviations from Plan

None — plan executed exactly as written. Two minor formatting adjustments applied automatically by the project's prettier pre-commit hook (whitespace + line-wrap in SCSS and import-order in TS) before each task commit; no semantic changes.

## Issues Encountered
None.

## Verification Gates Passed
- `pnpm exec ng build core-ui` — exits 0 (Built core-ui in ~840ms).
- `pnpm lint` — eslint + stylelint + lint-fixtures all clean.
- `pnpm test --run projects/core-ui/src/lib/two-column/measure.spec.ts` — 6/6 passing (Plan 03 baseline preserved).
- Acceptance grep checks: 13 component-module exports in public-api; no `@HostListener`; no `anchor-name` / `position-anchor` in SCSS; `Примітка` literal present; both `relocateTabletInline` and `unrelocateTabletInline` defined; tablet relocation does NOT call `createElement('details')`.

## Next Phase Readiness

**Plan 06 hand-off note:** the `/dev/primitives` showcase MUST include a tall section with **three sidenotes anchored to paragraphs near top, middle, and bottom** so the three-breakpoint walk exercises:
1. The collision rule in `computeSidenoteStack` (desktop) — sidenotes near each other should stack-down with `--sidenote-stack-gap`.
2. The tablet relocation reversal when the user resizes from tablet→desktop or tablet→mobile.
3. The mobile `<details>` disclosure summary text rendering correctly with Cyrillic `Примітка N`.

**Wiring the consumer:**
```html
<ui-two-column>
  <article body>
    <p data-sidenote-anchor="1">…<ui-sidenote-ref [number]="1"/>…</p>
    <p>…</p>
    <p data-sidenote-anchor="2">…<ui-sidenote-ref [number]="2"/>…</p>
  </article>
  <ui-margin-rail margin>
    <ui-sidenote [number]="1">…</ui-sidenote>
    <ui-sidenote [number]="2">…</ui-sidenote>
  </ui-margin-rail>
</ui-two-column>
```

The DOM order of `<ui-sidenote>` children inside `<ui-margin-rail margin>` MUST match ascending order of `data-sidenote-anchor` numbers in the body (the locked anchor convention).

## Self-Check: PASSED

- FOUND: projects/core-ui/src/lib/page-shell/page-shell.component.ts
- FOUND: projects/core-ui/src/lib/page-shell/page-shell.component.scss
- FOUND: projects/core-ui/src/lib/margin-rail/margin-rail.component.ts
- FOUND: projects/core-ui/src/lib/margin-rail/margin-rail.component.scss
- FOUND: projects/core-ui/src/lib/two-column/two-column.component.ts
- FOUND: projects/core-ui/src/lib/two-column/two-column.component.scss
- FOUND commit: 734b728
- FOUND commit: cb33267

---
*Phase: 02-primitives-two-column-layout-page-model-contract*
*Completed: 2026-05-01*
