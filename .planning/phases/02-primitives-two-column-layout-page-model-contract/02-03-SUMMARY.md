---
phase: 02-primitives-two-column-layout-page-model-contract
plan: 03
subsystem: core-ui
tags: [editorial-primitives, signal-inputs, two-column-geometry, vitest, ng-packagr]

requires:
  - phase: 02-01
    provides: "@arduino/core-ui workspace library scaffold + ui- prefix override + boundary tooling"
  - phase: 02-02
    provides: "page-model contract that primitives' inputs are shaped against"

provides:
  - "10 standalone editorial primitives in @arduino/core-ui: Heading, Body, Lede, Aside, Sidenote, SidenoteRef, Figure, FigureCaption, Diff, Pinout"
  - "Pure-function geometry computeSidenoteStack at projects/core-ui/src/lib/two-column/measure.ts (consumed by Plan 04 TwoColumn from afterNextRender)"
  - "Public API surface exporting all 10 components + measure helpers via projects/core-ui/src/public-api.ts"
  - "6 Vitest unit tests covering empty/single/no-collision/collision/cascading/immutability for the geometry (D-TEST-01 #1)"

affects: 02-04, 02-05, 02-06, 03, 06

tech-stack:
  added: []
  patterns:
    - "Signal-input idiom (input.required<T>() / input<T>(default)) on every primitive — first project usage; locked by UI-SPEC §Editorial Primitives"
    - "Standalone components with `imports: []` — D-LIB-04 self-containment"
    - "`var(--…)` token-only consumption in component SCSS — P1 D-02 carried into core-ui"
    - "Pure-function geometry (Math.max + running lastBottom) at the layout boundary, separated from the Angular component that will measure DOM in Plan 04"

key-files:
  created:
    - projects/core-ui/src/lib/heading/heading.component.{ts,scss}
    - projects/core-ui/src/lib/body/body.component.{ts,scss}
    - projects/core-ui/src/lib/lede/lede.component.{ts,scss}
    - projects/core-ui/src/lib/aside/aside.component.{ts,scss}
    - projects/core-ui/src/lib/sidenote/sidenote.component.{ts,scss}
    - projects/core-ui/src/lib/sidenote-ref/sidenote-ref.component.{ts,scss}
    - projects/core-ui/src/lib/figure/figure.component.{ts,scss}
    - projects/core-ui/src/lib/figure-caption/figure-caption.component.{ts,scss}
    - projects/core-ui/src/lib/diff/diff.component.{ts,scss}
    - projects/core-ui/src/lib/pinout/pinout.component.{ts,scss}
    - projects/core-ui/src/lib/two-column/measure.ts
    - projects/core-ui/src/lib/two-column/measure.spec.ts
  modified:
    - projects/core-ui/src/public-api.ts (placeholder removed; 10 component exports + measure helpers)
  deleted:
    - projects/core-ui/src/lib/_placeholder.ts (no longer needed once real exports exist)

key-decisions:
  - "Heading uses an @switch block over level() to emit the correct semantic h1/h2/h3 element — keeps the bare-element selectors in src/styles/base/_base.scss applicable without duplicating CSS"
  - "FigureCaption mirrors `number` from its parent ui-figure as its own signal input rather than reading parent state via DI — keeps primitives self-contained (D-LIB-04) and avoids hidden coupling"
  - "Aside renders bare <aside> + data-variant attribute; the three variants are visually identical in v1 per UI-SPEC §Aside"
  - "Pinout renders only a static legend below the image (no hover hotspots) — POLISH-05 deferred to P6 per CONTEXT §Deferred"
  - "Diff stays within the existing palette — --color-highlight + --color-ink-muted with hairline rule, no red/green (UI-SPEC §Color)"
  - "Pure-function geometry separates the math from the Angular component that will measure DOM in Plan 04 — keeps the highest-value test (D-TEST-01 #1) trivially unit-testable without TestBed"

---

# Phase 02 Plan 03: Editorial Primitives + Sidenote-Stack Geometry Summary

10 standalone signal-input primitives (`Heading`, `Body`, `Lede`, `Aside`, `Sidenote`, `SidenoteRef`, `Figure`, `FigureCaption`, `Diff`, `Pinout`) shipped in `@arduino/core-ui` against UI-SPEC §"Editorial Primitives — Visual & API Contract" verbatim, plus the pure-function `computeSidenoteStack` geometry that Plan 04's `TwoColumn` will consume.

## What landed

### Task 1 — `measure.ts` + spec (TDD, D-TEST-01 #1)

`projects/core-ui/src/lib/two-column/measure.ts` exports:

```ts
export interface SidenoteInput { anchorTop: number; height: number; }
export interface SidenotePlacement { top: number; }
export function computeSidenoteStack(
  inputs: readonly SidenoteInput[],
  stackGap: number,
): SidenotePlacement[];
```

Implementation: single `for…of` over inputs, running `lastBottom`, `top = Math.max(input.anchorTop, lastBottom + stackGap)`. No mutation. No DI.

**Test results — `pnpm test --run projects/core-ui/src/lib/two-column/`:**

```
Test Files  1 passed (1)
     Tests  6 passed (6)
```

Cases:
1. `returns an empty array for empty input`
2. `returns the anchor top for a single sidenote`
3. `keeps two non-overlapping sidenotes at their preferred tops`
4. `slides the second sidenote down when it would overlap the first` (100+80+24 = 204)
5. `cascades collisions: a third sidenote stacks beneath a slid second` (288)
6. `does not mutate the input array`

RED commit: `c1f14ca` — `test(02-03): add failing spec for computeSidenoteStack`
GREEN commit: `3cfa30e` — `feat(02-03): implement computeSidenoteStack pure-function geometry`

### Task 2 — 10 primitives + public-api

Every primitive: `selector: 'ui-<name>'`, `standalone: true`, `imports: []`, `changeDetection: ChangeDetectionStrategy.OnPush`, signal inputs only, co-located SCSS reading only `var(--…)` tokens.

`projects/core-ui/src/public-api.ts`:

```ts
/*
 * Public API surface of @arduino/core-ui.
 */
export * from './lib/aside/aside.component';
export * from './lib/body/body.component';
export * from './lib/diff/diff.component';
export * from './lib/figure-caption/figure-caption.component';
export * from './lib/figure/figure.component';
export * from './lib/heading/heading.component';
export * from './lib/lede/lede.component';
export * from './lib/pinout/pinout.component';
export * from './lib/sidenote-ref/sidenote-ref.component';
export * from './lib/sidenote/sidenote.component';
export { computeSidenoteStack } from './lib/two-column/measure';
export type { SidenoteInput, SidenotePlacement } from './lib/two-column/measure';
```

(Prettier alphabetized the 10 component exports; semantic content unchanged from PLAN.)

Build/lint gates:

- `pnpm exec ng build core-ui` — built clean (`Time: ~826ms`)
- `pnpm test --run projects/core-ui/src/lib/two-column/` — 6/6 pass
- `pnpm lint` — clean (only pre-existing `boundaries/element-types` deprecation warnings; lint-fixtures: 7 fixtures clean)

Commit: `e188e4e` — `feat(02-03): ship 10 editorial primitives in @arduino/core-ui [PRIM-02,PRIM-07,PRIM-08]`

## Acceptance criteria — verified

- 10 primitive directories present under `projects/core-ui/src/lib/` ✓
- `grep -l "standalone: true" projects/core-ui/src/lib/**/*.component.ts | wc -l` → `10` ✓
- `grep -r "@use 'tokens" projects/core-ui/src/lib/` → empty ✓
- `grep -rE '\$[a-z-]+' projects/core-ui/src/lib/*/*.scss` → empty ✓
- `grep -c "export \* from './lib/" projects/core-ui/src/public-api.ts` → `10` ✓
- `grep -iE 'red|green|#[0-9a-f]' projects/core-ui/src/lib/diff/diff.component.scss` → empty ✓
- `grep -F 'sidenote__number' projects/core-ui/src/lib/sidenote/sidenote.component.ts` → match ✓
- `grep -F "'#sn-' + number()" projects/core-ui/src/lib/sidenote-ref/sidenote-ref.component.ts` → match ✓
- `grep -iE 'mousemove|mouseenter|hotspot|<map' projects/core-ui/src/lib/pinout/pinout.component.ts` → empty ✓

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Lint fix] `ReadonlyArray<T>` → `readonly T[]` in `measure.ts`**

- **Found during:** Task 1 GREEN commit (precommit eslint hook)
- **Issue:** project-wide `@typescript-eslint/array-type` enforces `readonly T[]` form
- **Fix:** Inlined the rule's preferred shape in the `computeSidenoteStack` signature
- **Files modified:** `projects/core-ui/src/lib/two-column/measure.ts`
- **Commit:** `3cfa30e` (the fix folded into the GREEN commit)

**2. [Rule 1 — Format fix] Prettier reformat of two files**

- **Found during:** Task 2 commit (precommit prettier hook)
- **Issue:** `sidenote-ref.component.ts` template line wrap and `public-api.ts` import order needed prettier normalization
- **Fix:** Ran `pnpm exec prettier --write` on the affected files; behavior unchanged
- **Files modified:** `projects/core-ui/src/lib/sidenote-ref/sidenote-ref.component.ts`, `projects/core-ui/src/public-api.ts`
- **Commit:** `e188e4e`

No other deviations. The 10 primitive APIs match UI-SPEC §"Editorial Primitives — Visual & API Contract" verbatim. No NgModules, no architectural surprises, no new tokens, no new colors.

## Plan 04 hand-off note

Plan 04's `TwoColumn` consumes `computeSidenoteStack` from `'@arduino/core-ui'`:

```ts
import { afterNextRender, ElementRef, viewChild, viewChildren } from '@angular/core';
import { computeSidenoteStack, type SidenoteInput } from '@arduino/core-ui';

// Inside TwoColumnComponent:
afterNextRender(() => {
  const grid = this.gridRef().nativeElement.getBoundingClientRect();
  const inputs: SidenoteInput[] = this.anchors().map((anchorEl, i) => ({
    anchorTop: anchorEl.getBoundingClientRect().top - grid.top,
    height: this.sidenotes()[i].nativeElement.getBoundingClientRect().height,
  }));
  const placements = computeSidenoteStack(inputs, this.stackGapPx);
  placements.forEach((p, i) => {
    (this.sidenotes()[i].nativeElement as HTMLElement).style.top = `${p.top}px`;
  });
});
```

The geometry function is locked. Plan 04 only needs to wire the DOM measurement and a `ResizeObserver` debounced at 50 ms.

## Self-Check: PASSED

Files verified present:

- `projects/core-ui/src/lib/two-column/measure.ts` — FOUND
- `projects/core-ui/src/lib/two-column/measure.spec.ts` — FOUND
- 10 × `projects/core-ui/src/lib/<primitive>/<primitive>.component.{ts,scss}` — all FOUND
- `projects/core-ui/src/public-api.ts` — FOUND (modified, exports 10 + measure helpers)
- `projects/core-ui/src/lib/_placeholder.ts` — DELETED (intentional)

Commits verified in `git log`:

- `c1f14ca` — RED test commit — FOUND
- `3cfa30e` — GREEN measure.ts commit — FOUND
- `e188e4e` — 10 primitives commit — FOUND
