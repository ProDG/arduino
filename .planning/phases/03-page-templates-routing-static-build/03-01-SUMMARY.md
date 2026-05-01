---
phase: 03
plan: 01
subsystem: content-api
tags: [block-model, content-source, fixture-loader, lint-fixtures, image-dimensions]
dependency_graph:
  requires: [02-06]
  provides: [block-model-v2, ContentSource, FixtureContentSource, fixture-loader, image-dimension-lint-gate]
  affects: [03-02, 03-03, 03-04, 03-05, 03-06, 03-07, 03-08]
tech_stack:
  added: [image-size@2.0.2]
  patterns: [discriminated-union-amendment, build-time-node-loader, content-source-port, slug-drift-guard]
key_files:
  created:
    - src/content/api/content-source.ts
    - src/content/api/fixture-loader.ts
    - src/content/api/fixture-content-source.ts
    - src/assets/mock-data/figures/blymayuchyi-svitlodiod-shema.svg
    - src/assets/mock-data/figures/knopka-shema.svg
    - src/assets/mock-data/figures/potentsiometr-shema.svg
    - src/assets/mock-data/figures/atmega328p-pinout.svg
    - src/assets/mock-data/figures/arduino-uno-r3-pinout.svg
  modified:
    - src/content/models/block.ts
    - scripts/lint-fixtures.mjs
    - package.json
    - pnpm-lock.yaml
    - src/content/api/mock-content-api.spec.ts
    - src/assets/mock-data/lessons/pershyi-blymayuchyi-svitlodiod.json
    - src/assets/mock-data/lessons/knopka-ta-pidtyahuvalnyi-rezystor.json
    - src/assets/mock-data/lessons/analogovyi-vhid-ta-potentsiometr.json
    - src/assets/mock-data/datasheets/atmega328p.json
    - src/assets/mock-data/datasheets/arduino-uno-r3.json
    - src/assets/mock-data/schematics/blymayuchyi-svitlodiod-shema.json
decisions:
  - "image-size v2 requires Buffer input (not path string) — wrap readFileSync before calling imageSize()"
  - "5 placeholder SVG files created for fixtures that referenced non-existent figures; dimensions encoded in viewBox"
  - "lint-fixtures checkImageDimensions() added as a separate function before checkContentGates(); same violation shape"
  - "fixture-loader.ts uses node:fs/promises (async); MOCK_ROOT resolved via process.cwd() for Angular CLI build-time compatibility"
  - "MockContentApi hardcoded slug list retained for browser-runtime path; slug-drift test gates future divergence"
metrics:
  duration: 7m
  completed: "2026-05-02"
  tasks: 2
  files: 20
---

# Phase 3 Plan 1: Block Model Amendment & ContentSource Port Summary

**One-liner:** Amended Block discriminated union with required `width`/`height` on figure+pinout and optional `tokens?` on code; introduced `ContentSource` interface + `FixtureContentSource` + `fixture-loader.ts` as build-time-safe content port; extended lint-fixtures with image-dimension gate.

## Tasks Completed

| # | Name | Commit | Status |
|---|------|--------|--------|
| 1 | Amend Block model + migrate fixtures + extend lint | `61ed000` | done |
| 2 | ContentSource interface + FixtureContentSource + MockContentApi slug-drift guard | `3eceefa` | done |

## What Was Built

### Task 1: Block model + fixtures + lint extension

**`src/content/models/block.ts`** (additive amendment):
- `figure` variant: added `width: number; height: number` (required)
- `pinout` variant: added `width: number; height: number` (required)
- `code` variant: added `tokens?: string` (optional Shiki cache field, D-SHIKI-03)

**`scripts/lint-fixtures.mjs`** extension:
- Added `import { imageSize } from 'image-size'` at top
- New `checkImageDimensions(parsed, fileLabel)` function walks all figure/pinout blocks and emits:
  - `missing-dimension` — block has no `width` or `height`
  - `dimension-mismatch` — declared dims differ from on-disk SVG viewBox
  - `image-not-found` — `src` path resolves to a missing file
- Wired into `lintOne()` before `checkContentGates()` — same violation shape

**Fixtures migrated (6 of 7)**:
- `lessons/pershyi-blymayuchyi-svitlodiod.json` — figure: 800×500
- `lessons/knopka-ta-pidtyahuvalnyi-rezystor.json` — figure: 800×500
- `lessons/analogovyi-vhid-ta-potentsiometr.json` — figure: 800×500
- `datasheets/atmega328p.json` — pinout: 600×800
- `datasheets/arduino-uno-r3.json` — pinout: 800×600
- `schematics/blymayuchyi-svitlodiod-shema.json` — figure: 800×500
- `articles/chomu-arduino.json` — no figure/pinout blocks; no migration needed

**Placeholder SVG files created (5)**:
- `blymayuchyi-svitlodiod-shema.svg` (800×500)
- `knopka-shema.svg` (800×500)
- `potentsiometr-shema.svg` (800×500)
- `atmega328p-pinout.svg` (600×800, portrait — realistic pinout proportions)
- `arduino-uno-r3-pinout.svg` (800×600)

### Task 2: ContentSource port

**`src/content/api/content-source.ts`**: TypeScript interface with 8 methods (listXxxSlugs + loadXxx for lesson/article/datasheet/schematic). Type-only imports — no DI, no Angular.

**`src/content/api/fixture-loader.ts`**: Pure `node:fs/promises` readers. No `@angular/*` imports. `MOCK_ROOT` uses `process.cwd()` so Angular CLI build-time (`app.routes.server.ts`) and Vitest tests both resolve correctly. Named exports: `listLessonSlugs`, `loadLesson`, `listArticleSlugs`, `loadArticle`, `listDatasheetSlugs`, `loadDatasheet`, `listSchematicSlugs`, `loadSchematic`.

**`src/content/api/fixture-content-source.ts`**: Plain class (not `@Injectable`) implementing `ContentSource` by delegating to `fixture-loader`. Ready for use in both DI (Plan 03-07) and `getPrerenderParams` (Plan 03-07).

**`src/content/api/mock-content-api.spec.ts`**: Added `slug-drift guard` describe block. Asserts `MockContentApi.listLessons()` slugs match `FixtureContentSource.listLessonSlugs()`. Test uses Vitest's Node environment (fs works); mock-based fetch spy maps slugs back to minimal Lesson shapes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing figure SVG files — created 5 placeholder SVGs**
- **Found during:** Task 1 — fixtures referenced 5 SVG paths that had no on-disk files
- **Issue:** `lint-fixtures.mjs` image-dimension gate would emit `image-not-found` for every such block, blocking `node scripts/lint-fixtures.mjs` from exiting 0
- **Fix:** Created 5 placeholder SVGs matching the same editorial-placeholder style as existing ones (`viewBox` dimensions chosen to be realistic: lessons/schematics at 800×500 landscape; atmega328p-pinout at 600×800 portrait; arduino-uno-r3-pinout at 800×600)
- **Files modified:** 5 new SVG files in `src/assets/mock-data/figures/`
- **Commit:** `61ed000`

**2. [Rule 1 - Bug] Prettier formatting — migrated fixtures used `JSON.stringify` indentation that differed from project style**
- **Found during:** Task 1 pre-commit hook
- **Issue:** The Node script used `JSON.stringify(parsed, null, 2)` which Prettier reformatted differently (trailing comma style / array formatting)
- **Fix:** Ran `pnpm exec prettier --write` on the 3 affected lesson fixtures; re-verified `node scripts/lint-fixtures.mjs` still clean
- **Files modified:** the same 3 lesson JSON files
- **Commit:** `61ed000` (included in same commit after reformat)

**3. [Rule 1 - Bug] image-size v2 API change — requires Buffer, not path string**
- **Found during:** Task 1, Step 3 testing
- **Issue:** `imageSize(filePath)` throws `TypeError: The "list" argument must be an instance of SharedArrayBuffer, ArrayBuffer or ArrayBufferView` in v2.0.2 — the API no longer accepts a path string
- **Fix:** Wrapped with `readFileSync(imgPath)` before calling `imageSize(buf)` in `checkImageDimensions()`
- **Files modified:** `scripts/lint-fixtures.mjs`
- **Commit:** `61ed000`

## Known Stubs

The 5 new SVG placeholder files are editorial-placeholder images (diagonal cross pattern, cream background). They are intentional stubs — real schematics/pinouts will be produced in a later content phase. They are structurally correct (valid SVG, correct dimensions, correct viewBox) and pass the lint gate.

## Verification Results

| Check | Result |
|-------|--------|
| `node scripts/lint-fixtures.mjs` | 7 fixtures clean |
| `pnpm lint` (ESLint + Stylelint + lint-fixtures) | clean (pre-existing ESLint boundary deprecation warnings only) |
| `pnpm exec tsc --noEmit` | clean |
| `pnpm exec vitest run src/content/api` | 6/6 pass |
| `pnpm build` | 2 routes prerendered, no regression |
| Synthetic violation: width+1 | exits 1, `dimension-mismatch` in stderr |
| Synthetic violation: remove width/height | exits 1, `missing-dimension` in stderr |
| Synthetic test: tokens on code block | exits 0 (ignored correctly) |

**Pre-existing test failure (out of scope):** `projects/core-ui/src/lib/code-block/code-block.spec.ts` — 4 failures with `Component 'CodeBlockComponent' is not resolved` (styleUrl resolution issue with TestBed). Confirmed pre-existing on commit `1b6e1db` before this plan. Not caused by or related to Plan 03-01 changes.

## Self-Check: PASSED

All created files verified present on disk. Both task commits (`61ed000`, `3eceefa`) confirmed in git log.
