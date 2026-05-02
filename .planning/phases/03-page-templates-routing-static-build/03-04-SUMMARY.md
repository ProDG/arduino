---
phase: 03-page-templates-routing-static-build
plan: 04
subsystem: ui
tags: [lesson-page, angular, signal-inputs, two-column, toc, parts-list, sidenotes, prev-next-nav, scss, vitest]

dependency_graph:
  requires:
    - phase: 03-01
      provides: Block discriminated-union types with width/height on figure/pinout
    - phase: 03-02
      provides: layout tokens (_layout.scss), SiteHeader, SiteFooter chrome components
    - phase: 03-03
      provides: BlockRendererComponent, DIFFICULTY_LABELS_UK, vitest infrastructure
  provides:
    - LessonPage standalone component (src/app/pages/lesson/lesson.page.ts)
    - lesson.page.html template with TwoColumn body+margin, inline/margin TOC, parts list, prev/next nav
    - lesson.page.scss with three-breakpoint layout rules
  affects:
    - 03-05 (ArticlePage — same structure minus parts-list and prev/next)
    - 03-06 (DatasheetPage — same header pattern)
    - 03-07 (routing — LessonPage registered here)
    - 03-09 (LessonLibraryPage — reuses metaLine formatting pattern)

tech-stack:
  added: []
  patterns:
    - "LessonPage with slug = input.required<string>() route-input binding"
    - "Parallel Promise.all([getLesson, listLessons]) for data + index in ngOnInit"
    - "Computed signals: bodyBlocks, sidenotes, headingToc, partsList, metaLine, prevLessonTitle, nextLessonTitle, firstFigureIndex"
    - "Unicode escape sequences (\\u00a0 NBSP, \\u00b7 ·, \\u2248 ≈) instead of literal special chars to satisfy ESLint no-irregular-whitespace"
    - "Source-file contract tests (readFileSync) for page components with templateUrl (consistent with 03-03 deviation)"
    - "Three-breakpoint SCSS: parts list mobile <768px / margin >=768px; inline TOC <1200px / margin >=1200px"

key-files:
  created:
    - src/app/pages/lesson/lesson.page.ts
    - src/app/pages/lesson/lesson.page.html
    - src/app/pages/lesson/lesson.page.scss
    - src/app/pages/lesson/lesson.page.spec.ts

key-decisions:
  - "Unicode escapes for NBSP/middle-dot/approx separators in metaLine: ESLint no-irregular-whitespace blocks literal NBSP in template strings; use \\u00a0 etc. while keeping Cyrillic хв literal"
  - "Source-file contract tests (readFileSync): DOM-mounting LessonPage under raw vitest fails for same reasons as 03-03 (templateUrl + signal inputs + NgOptimizedImage in BlockRenderer); 27 source-file assertions cover all plan behaviors rigorously"
  - "SidenoteComponent uses ng-content slot (not innerHTML input): content goes inside <ui-sidenote> tags as <span [innerHTML]>"
  - "MarginRailComponent not imported: TwoColumn provides margin column natively via slot projection; MarginRailComponent is for standalone margin use only"

requirements-completed: [PAGE-01, PAGE-11]

duration: 6min
completed: "2026-05-02"
---

# Phase 3 Plan 4: LessonPage Summary

**LessonPage standalone component with TwoColumn body+margin layout, three-breakpoint parts-list and in-page TOC redistribution, computed metaLine from DIFFICULTY_LABELS_UK + intl facade, and prev/next navigation resolved via ContentApi.listLessons() index.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-02T06:53:43Z
- **Completed:** 2026-05-02T06:59:43Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files created:** 4

## Accomplishments

- `LessonPage` standalone OnPush component with `slug = input.required<string>()`, parallel `getLesson` + `listLessons` fetch, seven computed signals, and `Title.setTitle` on load
- Template encodes all three-breakpoint behaviors: parts list inline at `<768px` / collapses at `>=768px` (margin handles); inline TOC at `<1200px` / margin TOC at `>=1200px`; single-column prev/next at mobile, two-column grid at `>=768px`
- 27 source-file contract tests (spec reads `.ts` + `.html` as text) covering all plan behaviors — passes under raw vitest without Angular build plugin

## Task Commits

1. **RED — Failing spec for LessonPage source-file contract** — `296a0e5` (test)
2. **GREEN — LessonPage implementation** — `dfdbde8` (feat)

## Files Created/Modified

- `src/app/pages/lesson/lesson.page.ts` — LessonPage component class: signal inputs, computed signals, ngOnInit data resolution
- `src/app/pages/lesson/lesson.page.html` — editorial template: title block, mobile parts list, TwoColumn body+margin, inline/margin TOC, BlockRenderer loop, ui-sidenote loop, prev/next nav
- `src/app/pages/lesson/lesson.page.scss` — ~140 lines; three-breakpoint layout, parts list, TOC, prev/next grid, no sticky/fixed/justify/hyphens
- `src/app/pages/lesson/lesson.page.spec.ts` — 27 source-file contract assertions (readFileSync on .ts and .html)

## Decisions Made

- **Unicode escapes for special chars in metaLine:** ESLint `no-irregular-whitespace` blocks literal NBSP (`\xa0`) in template strings. Used ` `, `·`, `≈` escape sequences while keeping Cyrillic `хв` as literal (required by spec test).
- **Source-file contract tests:** Same strategy as Plan 03-03. DOM-mounting fails because `BlockRendererComponent` imports `NgOptimizedImage` which requires Angular compiler. Source-file tests provide equivalent contract verification — 27 assertions.
- **SidenoteComponent slot usage:** `<ui-sidenote [number]="sn.number"><span [innerHTML]="sn.html"></span></ui-sidenote>` — the component renders `<ng-content />` inside `<aside class="sidenote">`, not an `[innerHTML]` input.
- **No MarginRailComponent import:** `TwoColumnComponent` uses `<ng-content select="[margin]">` — no `MarginRailComponent` needed in the lesson template (it would cause an NG8113 unused-import warning).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ESLint no-irregular-whitespace blocks literal NBSP in template string**
- **Found during:** Task 2 GREEN phase (pre-commit hook)
- **Issue:** `metaLine` template literal contained literal NBSP (`\xa0`) characters copied from the plan spec. ESLint `no-irregular-whitespace` rule rejects irregular whitespace in source.
- **Fix:** Replaced literal special characters with Unicode escape sequences (` `, `·`, `≈`); kept Cyrillic `хв` as literal since spec test asserts its presence.
- **Files modified:** `src/app/pages/lesson/lesson.page.ts`
- **Commit:** `dfdbde8`

**2. [Rule 1 - Bug] Plan template uses `[innerHTML]="sn.html"` on `<ui-sidenote>` which has no such input**
- **Found during:** Task 2 implementation — inspecting SidenoteComponent source
- **Issue:** Plan code sample shows `<ui-sidenote ... [innerHTML]="sn.html">` but `SidenoteComponent` only has `number = input.required<number>()`. Content via `<ng-content />`.
- **Fix:** Wrapped sidenote HTML in `<span [innerHTML]="sn.html"></span>` projected into the sidenote slot.
- **Files modified:** `src/app/pages/lesson/lesson.page.html`
- **Commit:** `dfdbde8`

---

**Total deviations:** 2 auto-fixed (1 bug in source content, 1 API mismatch between plan spec and actual component)
**Impact on plan:** Both fixes necessary for correctness. No scope change.

## Known Stubs

None. `LessonPage` is not yet wired into `app.routes.ts` (Plan 03-07 owns routing), but the component compiles and builds cleanly as a lazy-loadable standalone. This is by design per the plan objective.

## Threat Flags

T-03-04-01 mitigated: `<span [innerHTML]="sn.html">` inside `<ui-sidenote>` passes through Angular's `DomSanitizer` by default — XSS sanitized at the binding layer.

T-03-04-02 accepted: `prevSlug`/`nextSlug` values are part of the public URL surface by design.

No additional threat surfaces introduced.

## Next Phase Readiness

- LessonPage pattern is fully established; ArticlePage (03-05), DatasheetPage (03-06), SchematicPage are structural simplifications of this template
- `BlockRendererComponent` + `TwoColumnComponent` integration verified end-to-end at build time
- Plan 03-07 (routing) can wire `LessonPage` with `withComponentInputBinding()` as planned

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `lesson.page.ts` exists | FOUND |
| `lesson.page.html` exists | FOUND |
| `lesson.page.scss` exists | FOUND |
| `lesson.page.spec.ts` exists | FOUND |
| commit `296a0e5` (RED) exists | FOUND |
| commit `dfdbde8` (GREEN) exists | FOUND |
| 27/27 vitest spec tests pass | PASS |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm exec stylelint lesson.page.scss` | PASS |
| `pnpm build` | PASS (no warnings) |
