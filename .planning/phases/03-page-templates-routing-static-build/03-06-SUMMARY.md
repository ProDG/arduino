---
phase: 03-page-templates-routing-static-build
plan: 06
subsystem: ui
tags: [angular, typescript, scss, content-api, lesson-library, home, about, not-found, tdd]

dependency_graph:
  requires:
    - phase: 03-04
      provides: LessonPage pattern (signal, CONTENT_API injection, listLessons)
    - phase: 03-05
      provides: ArticlePage pattern (listArticles, date meta)
    - phase: 03-03
      provides: DIFFICULTY_LABELS_UK, formatNumberUk, source-file contract test strategy
    - phase: 02
      provides: core-ui primitives (AsideComponent, HeadingComponent, LedeComponent, PageShellComponent)
  provides:
    - LessonLibraryPage standalone component (typographic ToC, empty-state aside)
    - HomeComponent reshaped to editorial hero + recent lessons/articles + entry-points
    - AboutPage standalone component (5 hand-authored Ukrainian paragraphs, no data dep)
    - NotFoundPage standalone component (404 numeral + accent hairline, no data dep)
  affects:
    - 03-07 (routing — these four pages need route declarations)
    - 03-09 (showcase audit — these pages need walk-through verification)

tech-stack:
  added: []
  patterns:
    - "LessonLibraryPage: sortedLessons computed signal, grid-template-areas num+title+meta row"
    - "HomeComponent: Promise.all([listLessons, listArticles]), sort desc, slice(0,3)/slice(0,2)"
    - "AboutPage: static prose page with readonly { html: string }[] const, [innerHTML] binding (trusted repo constant)"
    - "NotFoundPage: grid place-content: center vertical centering, 2px --color-accent hairline hr"
    - "readonly T[] syntax over ReadonlyArray<T> per @typescript-eslint/array-type rule"

key-files:
  created:
    - src/app/pages/lesson-library/lesson-library.page.ts
    - src/app/pages/lesson-library/lesson-library.page.html
    - src/app/pages/lesson-library/lesson-library.page.scss
    - src/app/pages/lesson-library/lesson-library.page.spec.ts
    - src/app/pages/about/about.page.ts
    - src/app/pages/about/about.page.html
    - src/app/pages/about/about.page.scss
    - src/app/pages/about/about-prose.const.ts
    - src/app/pages/about/about.page.spec.ts
    - src/app/pages/not-found/not-found.page.ts
    - src/app/pages/not-found/not-found.page.html
    - src/app/pages/not-found/not-found.page.scss
    - src/app/pages/not-found/not-found.page.spec.ts
    - src/app/pages/home/home.component.spec.ts
  modified:
    - src/app/pages/home/home.component.ts
    - src/app/pages/home/home.component.html
    - src/app/pages/home/home.component.scss

key-decisions:
  - "LessonLibraryPage uses grid-template-areas not flexbox for row layout — num+title on line 1, meta indented on line 2 under title"
  - "AboutPage uses [innerHTML] on plain <p> (not ui-body) — ui-body wraps ng-content in its own <p>; double-wrapping would break prose layout"
  - "readonly { html: string }[] instead of ReadonlyArray<T> — enforced by @typescript-eslint/array-type (existing project ESLint rule)"
  - "HomeComponent: no 'Усі статті →' link for articles section — UI-SPEC §HomePage explicit: article library deferred, trailing link omitted in P3"

requirements-completed: [PAGE-05, PAGE-06, PAGE-07, PAGE-08, PAGE-11]

duration: 5min
completed: "2026-05-02"
---

# Phase 03 Plan 06: LessonLibraryPage + HomePage + AboutPage + NotFoundPage Summary

**Four non-editorial-template pages shipped as TDD RED/GREEN pairs: LessonLibraryPage (typographic ToC), HomeComponent reshaped to editorial home, AboutPage (5 hand-authored Ukrainian paragraphs, no data dep), NotFoundPage (404 + accent hairline, vertically centered).**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-02T07:07:51Z
- **Completed:** 2026-05-02T07:13:03Z
- **Tasks:** 2 (each TDD: RED + GREEN)
- **Files created:** 14, **modified:** 3

## Accomplishments

- **LessonLibraryPage:** `listLessons()` on init, `sortedLessons` computed signal (publishedAt desc), two-line grid rows (accent zero-padded number + h3 title link + difficulty·хв meta), 1px `--color-rule` hairline between rows (first row no border), empty-state `ui-aside` "Уроки готуються", no border-radius/box-shadow anywhere (PAGE-05)
- **HomeComponent reshaped:** hero (`Arduino UA` h1 + locked lede), `Останні уроки` mini-TOC (3 most recent, same row idiom as library), `Статті` mini-TOC (2 most recent, date meta), trailing `Усі уроки →` accent link, entry-points paragraph with `/lessons` and `/about` links (PAGE-06)
- **AboutPage:** 5 hand-authored Ukrainian paragraphs in `about-prose.const.ts` (includes `<em>Arduino Starter Kit</em>` and `<code>Wagtail</code>` inline markup), rendered via `[innerHTML]` on `<p>`, no CONTENT_API dependency, title "Про проєкт — Arduino UA" (PAGE-07)
- **NotFoundPage:** `404` h1 numeral, `<hr>` with `border-block-start: 2px solid var(--color-accent)` (unique graphic moment per UI-SPEC §Color addition 15), "Цієї сторінки немає" lede, body paragraph with `/lessons` and `/` links, vertically centered via `display: grid; place-content: center` (PAGE-08)
- **34 source-file contract tests** across all four pages — all pass

## Task Commits

1. **Task 1 RED — LessonLibraryPage spec** — `faf61ca` (test)
2. **Task 1 GREEN — LessonLibraryPage implementation** — `e1d6470` (feat)
3. **Task 2 RED — HomePage + AboutPage + NotFoundPage specs** — `1b4cc38` (test)
4. **Task 2 GREEN — HomePage + AboutPage + NotFoundPage implementation** — `ed87715` (feat)

## Files Created

- `src/app/pages/lesson-library/lesson-library.page.ts` — LessonLibraryPage: listLessons, sortedLessons computed, labelDifficulty, labelMinutes
- `src/app/pages/lesson-library/lesson-library.page.html` — @if empty-state + @for toc rows with padStart number prefix
- `src/app/pages/lesson-library/lesson-library.page.scss` — grid-template-areas row layout, hairline border-block-start, no card surfaces
- `src/app/pages/lesson-library/lesson-library.page.spec.ts` — 10 source-file contract assertions
- `src/app/pages/about/about-prose.const.ts` — 5 Ukrainian paragraphs as `readonly { html: string }[]`
- `src/app/pages/about/about.page.ts` — static OnPush component, Title injection only
- `src/app/pages/about/about.page.html` — title block + @for prose loop with [innerHTML]
- `src/app/pages/about/about.page.scss` — container stair + flex column gap
- `src/app/pages/about/about.page.spec.ts` — 7 source-file assertions (no CONTENT_API, 4-6 entries, em reference)
- `src/app/pages/not-found/not-found.page.ts` — static OnPush component, Title injection only
- `src/app/pages/not-found/not-found.page.html` — 404 numeral + hr rule + lede + body links
- `src/app/pages/not-found/not-found.page.scss` — grid place-content center, 2px accent hairline hr
- `src/app/pages/not-found/not-found.page.spec.ts` — 8 source-file assertions (no CONTENT_API, hairline, centering)
- `src/app/pages/home/home.component.spec.ts` — 9 source-file assertions

## Files Modified

- `src/app/pages/home/home.component.ts` — full reshape: CONTENT_API + Promise.all + sort + slice signals
- `src/app/pages/home/home.component.html` — hero + two mini-TOC sections + entry-points paragraph
- `src/app/pages/home/home.component.scss` — row grid idiom matching library page, hero/section rules

## Decisions Made

- **AboutPage uses `[innerHTML]` on plain `<p>` not `ui-body`:** `BodyComponent` wraps `<ng-content>` in `<p>` — projecting a `[innerHTML]` binding into it would double-wrap. Plain `<p class="about-page__para" [innerHTML]>` is semantically correct.
- **`readonly T[]` not `ReadonlyArray<T>`:** Project ESLint rule `@typescript-eslint/array-type` enforces the array literal form. Pre-commit hook caught this on first attempt.
- **No `Усі статті →` link:** UI-SPEC §HomePage is explicit — article library page is deferred to a later plan; trailing link for articles section is omitted in P3.
- **HomeComponent stays `.component.ts` not `.page.ts`:** Pre-existing file name convention per PATTERNS.md note; the `.page.ts` suffix applies to new files only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `ReadonlyArray<T>` rejected by ESLint `@typescript-eslint/array-type`**
- **Found during:** Task 2 GREEN pre-commit hook
- **Issue:** Plan spec used `ReadonlyArray<{ html: string }>` but the project enforces `readonly T[]` syntax
- **Fix:** Changed to `readonly { html: string }[]` in `about-prose.const.ts`
- **Files modified:** `src/app/pages/about/about-prose.const.ts`
- **Commit:** `ed87715`

**2. [Rule 1 - Bug] Prettier reformatted HTML templates on first commit attempt**
- **Found during:** Task 1 + Task 2 pre-commit hooks
- **Issue:** Angular HTML template formatting diverged from Prettier's opinion on multi-line attribute wrapping
- **Fix:** `pnpm exec prettier --write` on affected files before re-staging
- **Files modified:** `lesson-library.page.html`, `home.component.html`, `about.page.html`, `about.page.ts`, `not-found.page.ts`
- **Commit:** same GREEN commits after re-formatting

## Known Stubs

None — all four pages wire real data from MockContentApi fixtures or static prose constants. Routing wiring (Plan 03-07) will activate these pages at their final URLs.

## Threat Flags

- **T-03-06-01 mitigated:** `ABOUT_PROSE[*].html` strings are repository constants authored at build time. Angular's `DomSanitizer` sanitizes `[innerHTML]` bindings by default — no user-supplied content reaches the DOM through this path.
- **T-03-06-02 accepted:** 404 page is an intentional public surface.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `lesson-library.page.ts` exists | FOUND |
| `lesson-library.page.html` exists | FOUND |
| `lesson-library.page.scss` exists | FOUND |
| `about.page.ts` exists | FOUND |
| `about-prose.const.ts` exists | FOUND |
| `not-found.page.ts` exists | FOUND |
| `home.component.ts` reshaped | FOUND |
| commit `faf61ca` (RED-1) exists | FOUND |
| commit `e1d6470` (GREEN-1) exists | FOUND |
| commit `1b4cc38` (RED-2) exists | FOUND |
| commit `ed87715` (GREEN-2) exists | FOUND |
| 34/34 vitest spec tests pass | PASS |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm exec stylelint` all new scss | PASS |
| `pnpm build` | PASS |
| `node scripts/lint-fixtures.mjs` | 7 fixtures clean |
