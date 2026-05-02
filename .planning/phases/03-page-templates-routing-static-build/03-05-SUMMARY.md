---
phase: 03-page-templates-routing-static-build
plan: 05
subsystem: ui
tags: [angular, typescript, scss, content-api, two-column, pinout, ng-optimized-image]

requires:
  - phase: 03-04
    provides: LessonPage pattern (TwoColumn + BlockRenderer + chrome + CONTENT_API injection)
  - phase: 02
    provides: core-ui primitives (TwoColumn, Sidenote, Heading, Lede, Pinout, PageShell)

provides:
  - ArticlePage standalone component (date-only meta, body+TOC+sidenotes TwoColumn, no parts list, no prev/next)
  - DatasheetPage standalone component (Виробник meta, Pinout, Характеристики dl, Периферія TwoColumn)
  - SchematicPage standalone component (full-bleed schematic, target=_blank zoom, Завантажити схему link, explanation TwoColumn)

affects:
  - 03-07 (routing wiring — these three pages need route declarations)
  - 03-09 (showcase audit — these pages need walk-through verification)

tech-stack:
  added: []
  patterns:
    - "Structural simplification of LessonPage: drop parts list + prev/next, keep TwoColumn + TOC + sidenotes"
    - "DatasheetPage spec table uses <dl>/<dt>/<dd> grid layout (not <table>) per UI-SPEC"
    - "SchematicPage full-bleed: 100vw width + margin-inline calc at ≥1200px, no JS lightbox"
    - "target=_blank + rel=noopener for schematic zoom (threat T-03-05-01 mitigation)"
    - "NgOptimizedImage for schematic <img> binding (consistent with BlockRenderer pattern)"

key-files:
  created:
    - src/app/pages/article/article.page.ts
    - src/app/pages/article/article.page.html
    - src/app/pages/article/article.page.scss
    - src/app/pages/datasheet/datasheet.page.ts
    - src/app/pages/datasheet/datasheet.page.html
    - src/app/pages/datasheet/datasheet.page.scss
    - src/app/pages/schematic/schematic.page.ts
    - src/app/pages/schematic/schematic.page.html
    - src/app/pages/schematic/schematic.page.scss
  modified: []

key-decisions:
  - "SchematicPage uses target=_blank + rel=noopener for zoom — no JS lightbox (UI-SPEC explicit constraint, threat T-03-05-01)"
  - "DatasheetPage spec table is <dl> not <table> — per UI-SPEC §DatasheetPage"
  - "ArticlePage retains inline+margin TOC pattern from LessonPage — UI-SPEC §ArticlePage confirms TOC is present"
  - "NgOptimizedImage imported for schematic <img> — consistent with BlockRenderer; provides width/height LCP hint"

patterns-established:
  - "Page simplification pattern: copy LessonPage, drop unused computeds (partsList, prevSlug, nextSlug, lessonIndex), trim template sections"
  - "All new page components use templateUrl + styleUrl (not inline template) matching LessonPage convention"

requirements-completed: [PAGE-02, PAGE-03, PAGE-04, PAGE-11]

duration: 4min
completed: 2026-05-02
---

# Phase 03 Plan 05: ArticlePage + DatasheetPage + SchematicPage Summary

**Three standalone page components — structural simplifications of LessonPage — each consuming CONTENT_API via inject(), with date-only / manufacturer / full-bleed-schematic meta patterns and Ukrainian-only UI strings.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-02T07:01:57Z
- **Completed:** 2026-05-02T07:05:13Z
- **Tasks:** 3
- **Files modified:** 9 (all created)

## Accomplishments

- ArticlePage: LessonPage stripped of parts list and prev/next; metaLine is date only; inline TOC at <1200px + margin TOC + sidenotes at ≥1200px
- DatasheetPage: Виробник meta line, PinoutComponent wired from `d.pinout`, Характеристики `<dl>` spec grid (1-col mobile / 1fr+2fr tablet+), Периферія TwoColumn
- SchematicPage: full-bleed figure at ≥1200px, `target="_blank" rel="noopener"` zoom link (threat T-03-05-01), Завантажити схему download with down-arrow SVG, explanation TwoColumn

## Task Commits

1. **Task 1: ArticlePage** — `fc8b5f9` (feat)
2. **Task 2: DatasheetPage** — `f2eea42` (feat)
3. **Task 3: SchematicPage** — `d68e2a6` (feat)

## Files Created/Modified

- `src/app/pages/article/article.page.ts` — ArticlePage component with date-only metaLine, bodyBlocks/sidenotes/headingToc/firstFigureIndex computed signals
- `src/app/pages/article/article.page.html` — title block + TwoColumn (inline TOC body / margin TOC + sidenotes)
- `src/app/pages/article/article.page.scss` — outer stair padding, inline/margin TOC visibility toggle
- `src/app/pages/datasheet/datasheet.page.ts` — DatasheetPage with peripheralBlocks/peripheralSidenotes computeds
- `src/app/pages/datasheet/datasheet.page.html` — Виробник meta, ui-pinout, Характеристики dl, Периферія TwoColumn
- `src/app/pages/datasheet/datasheet.page.scss` — spec-row grid layout, section spacing
- `src/app/pages/schematic/schematic.page.ts` — SchematicPage with NgOptimizedImage, explanationBlocks/explanationSidenotes computeds
- `src/app/pages/schematic/schematic.page.html` — full-bleed figure, zoom link, download link with SVG arrow, TwoColumn explanation
- `src/app/pages/schematic/schematic.page.scss` — full-bleed breakpoint rule, zoom-in cursor, download link accent styling

## Decisions Made

- Retained inline+margin TOC pattern in ArticlePage — UI-SPEC §ArticlePage confirms TOC is present (same as LessonPage minus parts list / prev/next)
- Used `<dl>/<dt>/<dd>` grid for DatasheetPage specifications — UI-SPEC is explicit: dl not table
- No JS lightbox for SchematicPage zoom — UI-SPEC explicit constraint; `target="_blank" rel="noopener"` satisfies threat T-03-05-01
- Imported `NgOptimizedImage` for schematic image binding — consistent with BlockRenderer pattern; provides width/height binding for LCP

## Deviations from Plan

None — plan executed exactly as written. SidenoteComponent API uses `<ng-content>` not `[innerHTML]` directly on the component, so the lesson-page pattern of wrapping with `<span [innerHTML]>` inside `<ui-sidenote>` was preserved across all three pages (same as lesson.page.html — this is correct per the component definition).

## Issues Encountered

- Prettier reformatted import order in article.page.ts and schematic.page.ts (Angular core imports alphabetised differently from initial write). Fixed by running `pnpm exec prettier --write` on both files before re-committing.

## User Setup Required

None — no external service configuration required.

## Known Stubs

None — all three pages wire real data from MockContentApi fixtures (chomu-arduino.json, atmega328p.json, blymayuchyi-svitlodiod-shema.json). Routing wiring to activate these pages is deferred to Plan 03-07.

## Threat Flags

No new surface beyond what the plan's threat model covers. T-03-05-01 (reverse tabnabbing via target=_blank) is mitigated with `rel="noopener"`. T-03-05-02 (specification value rendering) uses `{{ }}` interpolation — Angular auto-escapes.

## Next Phase Readiness

- All three page components compile and pass TypeScript + stylelint clean
- `pnpm build` succeeds — 9 new files, no regressions
- Routing wiring (Plan 03-07) can now declare `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug` pointing to these components
- Showcase walk (Plan 03-09) can exercise all three pages

---
*Phase: 03-page-templates-routing-static-build*
*Completed: 2026-05-02*
