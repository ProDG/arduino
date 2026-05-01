---
phase: 03
plan: 02
subsystem: chrome
tags: [chrome, site-header, site-footer, site-nav, layout-tokens, scss, angular]
dependency_graph:
  requires: [03-01]
  provides: [SiteHeaderComponent, SiteFooterComponent, SiteNavComponent, layout-tokens-p3]
  affects: [03-03, 03-04, 03-05, 03-06, 03-07, 03-08, 03-09, 03-10]
tech_stack:
  added: []
  patterns:
    - ɵresolveComponentResources + fs-resolver for vitest templateUrl compatibility
    - TestBed.resetTestingModule() afterEach for multi-test describe isolation
    - OnPush standalone chrome components with templateUrl/styleUrl
    - CSS Grid 2fr/1fr footer two-column at ≥768px
decisions:
  - "ɵresolveComponentResources (internal Angular API) used with a Node fs resolver to enable vitest run on components with templateUrl — same limitation as pre-existing code-block.spec.ts but now solved"
  - "place-self shorthand instead of separate align-self + justify-self — required by stylelint declaration-block-no-redundant-longhand-properties"
  - "footer colophon margin-top uses space-5 on mobile (flex column gap alternative) then margin-top:0 in grid context at ≥768px"
key_files:
  created:
    - src/app/chrome/site-header.component.ts
    - src/app/chrome/site-header.component.html
    - src/app/chrome/site-header.component.scss
    - src/app/chrome/site-header.component.spec.ts
    - src/app/chrome/site-nav.component.ts
    - src/app/chrome/site-nav.component.html
    - src/app/chrome/site-nav.component.scss
    - src/app/chrome/site-nav.component.spec.ts
    - src/app/chrome/site-footer.component.ts
    - src/app/chrome/site-footer.component.html
    - src/app/chrome/site-footer.component.scss
    - src/app/chrome/site-footer.component.spec.ts
  modified:
    - src/styles/tokens/_layout.scss
metrics:
  duration: 7m
  completed: "2026-05-02"
  tasks: 2
  files: 13
---

# Phase 3 Plan 2: Global Chrome Components Summary

**One-liner:** Three standalone chrome components (SiteHeader, SiteFooter, SiteNav) with Ukrainian copy, router-aware active states, responsive layout, and six new P3 layout tokens declared in _layout.scss.

## Tasks Completed

| # | Name | Commit | Status |
|---|------|--------|--------|
| 1 | Layout tokens + SiteHeader + SiteNav | `944d9cf` | done |
| 2 | SiteFooter | `179678a` | done |

## What Was Built

### Task 1: Layout tokens + SiteHeader + SiteNav

**`src/styles/tokens/_layout.scss`** — six new P3 layout tokens at `:root`:
- `--header-height: auto` (intrinsic, non-sticky)
- `--header-pad-block: var(--space-6)` (32px)
- `--footer-pad-block: var(--space-7)` (48px)
- `--toc-rail-width: var(--margin-rail-width)` (18rem alias)
- `--lesson-row-gap: var(--space-7)` (48px)
- `--page-section-gap: var(--space-9)` (112px)

**`SiteHeaderComponent`** (`app-site-header`):
- Flex row, `justify-content: space-between; align-items: baseline`
- Left: `<a rel="home" routerLink="/">Arduino UA</a>` — italic, weight 600, `--text-h3`, `--color-accent`, underline on hover/focus-visible only
- Right: `<app-site-nav>` — router-aware nav
- Bottom border: 1px `--color-rule`. No sticky, no shadow.
- Breakpoint padding stair: mobile 16px → tablet 32px → desktop 48px

**`SiteNavComponent`** (`app-site-nav`):
- `Уроки` (`/lessons`) and `Про проєкт` (`/about`) links
- `routerLinkActive="site-nav__link--active"` on both links
- Active state: `text-decoration-thickness: 0.12em` (thicker underline per UI-SPEC Color §9)
- `Про проєкт` hidden via `display: none` at `<768px` per UI-SPEC

### Task 2: SiteFooter

**`SiteFooterComponent`** (`app-site-footer`):
- Colophon paragraph: `Arduino UA — це повільний, ретельний переклад...` in `--text-caption` `--color-ink-muted` max-width 40ch
- RSS link `/feed.xml` with inline 16×16 SVG (arc+arc+dot glyph), `aria-disabled="true"`, `title="У наступних фазах"` — placeholder until P6
- License line: `© 2026 · CC BY-SA 4.0` in `--color-ink-muted`
- Mobile-only `Про проєкт` link — hidden at `≥768px`
- Layout: single column `<768px`; CSS Grid `2fr 1fr` at `≥768px`
- Top border: 1px `--color-rule`; padding stair matches header

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vitest templateUrl resolution — solved with ɵresolveComponentResources + fs resolver**
- **Found during:** Task 1 GREEN phase testing
- **Issue:** `pnpm exec vitest run src/app/chrome` cannot resolve `templateUrl`/`styleUrl` in JIT mode without the Angular compiler pipeline. `configureTestingModule` itself throws `Component is not resolved` before `compileComponents` runs. `resolveComponentResources` is not a public Angular 21 API.
- **Fix:** Used `ɵresolveComponentResources` (internal API, aliased on import) with a Node `fs.readFileSync` resolver in `beforeAll`. Added `TestBed.resetTestingModule()` in `afterEach` to prevent state leak between tests in the same describe block.
- **Files modified:** all three `*.spec.ts` files
- **Commits:** `15a002a`, `944d9cf`, `5568261`, `179678a`

**2. [Rule 1 - Bug] Stylelint `declaration-block-no-redundant-longhand-properties` on footer meta**
- **Found during:** Task 2 stylelint check
- **Issue:** `align-self: start; justify-self: end` flagged as redundant longhand — shorthand `place-self` required
- **Fix:** Replaced with `place-self: start end`
- **Files modified:** `site-footer.component.scss`
- **Commit:** `179678a`

## Pre-existing Issues (out of scope)

`projects/core-ui/src/lib/code-block/code-block.spec.ts` — 4 pre-existing failures with the same `templateUrl` resolution limitation. Not caused by this plan. Documented in Plan 03-01 SUMMARY. These tests need the same `ɵresolveComponentResources` fix applied in a future plan or maintenance pass.

## Known Stubs

None. The RSS link `/feed.xml` returns 404 until P6, but it is architecturally complete per UI-SPEC — it carries `aria-disabled` and the tooltip copy `У наступних фазах`. This is not a stub, it is the specified placeholder behavior.

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm exec tsc --noEmit` | clean |
| `pnpm exec stylelint "src/app/chrome/**/*.scss" "src/styles/**/*.scss"` | clean |
| `pnpm exec vitest run src/app/chrome` | 7/7 pass |
| `pnpm build` | clean, 2 routes prerendered |
| `grep -E "sticky\|fixed\|shadow" site-header.component.scss` | 0 matches |
| Six layout tokens in _layout.scss | 6/6 present |
| Ukrainian copy: Arduino UA wordmark | present |
| Ukrainian copy: Уроки + Про проєкт nav | present |
| Ukrainian copy: colophon paragraph | present |
| Ukrainian copy: © 2026 · CC BY-SA 4.0 | present |

## Threat Flags

No new threat surfaces beyond those declared in the plan's threat model. `rel="home"` on the wordmark anchor is informational only. Inline RSS SVG is static markup with no data binding.

## Self-Check: PASSED

All 12 created/modified files verified present on disk. All task commits (`15a002a`, `944d9cf`, `5568261`, `179678a`) confirmed in git log.
