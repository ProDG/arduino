---
phase: 04-wagtail-backend-skeleton-contract-match-dockerized
plan: 05
subsystem: frontend/content-api
tags: [frontend, angular, content-api, di, adapter, wagtail-rest-v2]
requires:
  - 04 (BE skeleton + REST v2 endpoint shape)
provides:
  - WagtailContentApi (Angular adapter for Wagtail REST v2 -> FE TS contract)
  - WagtailContentSource (prerender-path sibling implementing ContentSource)
  - env-driven provideContentApi() factory (Mock <-> Wagtail one-flag swap)
affects:
  - src/content/api/content-api.token.ts (factory now branches on environment flag)
  - angular.json (added fileReplacements for development environment file swap)
tech-stack:
  added: []
  patterns:
    - thin adapter (envelope strip + page-meta hoist + single-block un-wrap + sidenote anchor compute)
    - environment-driven Angular provider factory
key-files:
  created:
    - src/content/api/wagtail-content-api.ts
    - src/content/api/wagtail-content-source.ts
    - src/content/api/wagtail-content-api.spec.ts
    - src/environments/environment.ts
    - src/environments/environment.development.ts
  modified:
    - src/content/api/content-api.token.ts
    - angular.json
decisions:
  - Default useWagtailContentApi=false in both environment.ts and environment.development.ts; Mock remains the default until Plan 06 contract-diff parity gate clears.
  - Adapter is THIN — only strips {type, value, id} envelopes, hoists slug/publishedAt/updatedAt, un-wraps single-block StreamFields (partsList, pinout, schematicImage), and computes sidenote.anchorParagraphIndex. No HTML rewriting, no image fetching, no business logic — server serializers (Plan 03) do the heavy shaping.
  - Preview methods (getLessonPreview etc.) live as additional public surface on WagtailContentApi (4 extra methods) without modifying the locked ContentApi abstract class. Plan 07 wires them.
  - normalize* methods kept private; spec uses a `WagtailContentApiTestable` subclass casting through `unknown` to invoke them — preserves encapsulation while enabling unit-test isolation (no network fetch in tests).
metrics:
  duration: ~25 minutes
  completed: 2026-05-03
  tasks: 1
  files-created: 5
  files-modified: 2
---

# Phase 04 Plan 05: WagtailContentApi Adapter + Env-Driven Factory Summary

Frontend adapter that turns Wagtail REST API v2 responses into the locked TypeScript content models, wired behind an `environment.useWagtailContentApi` flag so MockContentApi remains the default until contract-diff parity clears.

## What Shipped

| Component                | Surface                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `WagtailContentApi`      | extends `ContentApi`; 8 abstract methods + 4 preview methods + private normalize helpers    |
| `WagtailContentSource`   | implements `ContentSource`; thin wrapper that delegates list/load to `WagtailContentApi`    |
| `provideContentApi()`    | now `useFactory` — picks `WagtailContentApi` vs `MockContentApi` from env flag at DI time   |
| `src/environments/*`     | new `environment.ts` (prod) + `environment.development.ts`; both default flag to `false`    |
| `angular.json`           | development config gains `fileReplacements` swapping prod env file for dev env file         |
| `wagtail-content-api.spec.ts` | 8 tests covering envelope strip, sidenote anchor compute, single-block un-wrap, factory branching |

## Adapter Behavior (D-DTO-05 + D-MODEL-04)

- `normalizeBlock({type, value, id})` -> flat `Block` (envelope stripped, no `id`, no `value` wrapper).
- `normalizePage(raw, kind)`:
  - hoists `slug` / `publishedAt` / `updatedAt` to top level (falls back to `meta.first_published_at`)
  - un-wraps single-block StreamFields: `parts_list[0]` (Lesson), `pinout[0]` (Datasheet), `schematicImage[0]` (Schematic)
  - walks body and computes `anchorParagraphIndex` for every sidenote (= index of the nearest preceding paragraph)
- All ContentApi methods route to `fetchFirst` / `fetchList` against `${env.wagtailBaseUrl}/api/v2/pages/?type=...&fields=*`.
- Preview methods route to `/api/v2/page_preview/?content_type=...&token=...` with `credentials: 'include'` (Plan 07 consumes).

## TDD Gate Sequence

| Phase  | Commit    | Subject                                                         |
| ------ | --------- | --------------------------------------------------------------- |
| RED    | `e41b555` | `test(04-05): add failing spec for WagtailContentApi adapter`   |
| GREEN  | `dec0424` | `feat(04-05): implement WagtailContentApi adapter and env-driven provider factory` |

REFACTOR was not needed — implementation matched the test contract on first pass.

## Verification

| Check                                                                                                    | Result |
| -------------------------------------------------------------------------------------------------------- | ------ |
| `test -f src/content/api/wagtail-content-api.ts && test -f src/content/api/wagtail-content-source.ts`    | PASS   |
| `grep -F "export class WagtailContentApi extends ContentApi" src/content/api/wagtail-content-api.ts`     | PASS   |
| `grep -cE "override (async )?(getLesson\|listLessons\|getArticle\|listArticles\|getDatasheet\|listDatasheets\|getSchematic\|listSchematics)\b"` -> exactly `8` | PASS (8) |
| `grep -F "anchorParagraphIndex"` (D-MODEL-04 sidenote compute)                                           | PASS   |
| `grep -E "raw\.value\|env\.value"` (envelope strip)                                                      | PASS   |
| `grep -F "implements ContentSource"`                                                                     | PASS   |
| `grep -F "useFactory"` in `content-api.token.ts`                                                         | PASS   |
| `grep -F "environment.useWagtailContentApi"` in `content-api.token.ts`                                   | PASS   |
| `git diff --exit-code src/content/models/ src/content/api/{content-api,content-source,mock-content-api,fixture-content-source,fixture-content-api,fixture-loader}.ts` | PASS (CONTRACT-IMMUTABLE-OK) |
| `npx vitest run src/content/api/wagtail-content-api.spec.ts` -> 8/8 pass                                 | PASS   |
| `pnpm build` with `useWagtailContentApi: false` (default)                                                | PASS (4.081s, 11 routes prerendered) |
| `pnpm build` with `useWagtailContentApi: true` (flipped via sed, then restored)                          | PASS (2.422s, 11 routes prerendered) |
| `npx tsc --noEmit -p tsconfig.app.json`                                                                  | PASS (no errors) |

## Test Output

```
$ npx vitest run src/content/api/wagtail-content-api.spec.ts
 RUN  v4.1.5 /Users/ipomar/PycharmProjects/arduino/.claude/worktrees/...

 Test Files  1 passed (1)
      Tests  8 passed (8)
   Duration  239ms
```

Tests covered:

1. `normalizeBlock` strips paragraph envelope
2. `normalizeBlock` strips code envelope, preserves annotations
3. `normalizePage` computes sidenote anchorParagraphIndex (multi-sidenote case: 0 then 1)
4. `normalizePage` un-wraps single-block `parts_list` on Lesson
5. `normalizePage` un-wraps single-block `schematicImage` on Schematic + uses top-level `downloadUrl`
6. `provideContentApi()` returns a CONTENT_API provider with a `useFactory`
7. factory returns `MockContentApi` when flag is `false`
8. factory returns `WagtailContentApi` when flag is `true` (verified via `vi.doMock` of environment module)

## FE Contract Immutability

`git diff --exit-code` confirms ZERO changes in:

- `src/content/models/{block,lesson,article,datasheet,schematic,index}.ts`
- `src/content/api/content-api.ts` (abstract surface)
- `src/content/api/content-source.ts` (interface)
- `src/content/api/mock-content-api.ts`
- `src/content/api/fixture-content-source.ts`
- `src/content/api/fixture-loader.ts`

Verifier may rerun the same `git diff --exit-code` against this commit range to confirm.

## Build Output (Both Flag States)

Default (`useWagtailContentApi: false`, MockContentApi wired):
```
Initial total            259.58 kB                72.28 kB
Prerendered 11 static routes.
Application bundle generation complete. [4.081 seconds]
```

Flipped (`useWagtailContentApi: true`, WagtailContentApi wired):
```
Initial total            259.58 kB                72.28 kB  (identical — both classes are tree-shaken-resistant by design; T-04-29 accepted)
Prerendered 11 static routes.  (prerender uses MockContentSource by default — see note below)
Application bundle generation complete. [2.422 seconds]
```

Both states produce a green build with 11 prerendered routes. Bundle size is identical to the byte; a follow-up improvement could measure with `--stats-json` to see which class actually contributes more to the chunk graph.

NOTE on prerender: `WagtailContentSource` is shipped but not yet wired into the SSG `getPrerenderParams` paths (still using `FixtureContentSource`). Plan 06 (contract-diff) and Plan 07 (preview wiring) consume `WagtailContentSource`; Plan 05 only ships it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript strict-mode index access in WagtailContentApi**

- **Found during:** Task 1 implementation
- **Issue:** Project tsconfig has `"noPropertyAccessFromIndexSignature": true`. The plan's pseudocode (`raw.body`, `raw.deck`, `raw.lede`, `raw.parts_list`, etc.) would fail to compile because `WagtailPageResponse` has an index signature.
- **Fix:** Used bracket-notation index access (`raw['body']`, `raw['deck']`, `raw['parts_list']`) with explicit type narrowing via `as` casts at each access site. Also dropped the `lede` property assignment to a Lesson — `Lesson` does not declare `lede` (only Block model does), so leaving it out keeps the `as unknown as Lesson` cast type-safe and matches the FE model.
- **Files modified:** src/content/api/wagtail-content-api.ts
- **Commit:** dec0424

**2. [Rule 3 - Blocking] Test cast incompatible with Provider type**

- **Found during:** Task 1, RED phase
- **Issue:** `provideContentApi() as { useFactory: () => unknown }` failed TS2352 because `Provider` is a union type that does not sufficiently overlap.
- **Fix:** Cast through `unknown` first: `as unknown as { useFactory: () => unknown }`.
- **Files modified:** src/content/api/wagtail-content-api.spec.ts
- **Commit:** e41b555 (RED)

### Other notes

- Spec file uses a `WagtailContentApiTestable` subclass that exposes `normalizeBlock` / `normalizePage` via `unknown` casts. This keeps the helpers `private` on the production class (information-hiding) while still enabling unit-test isolation without network calls.

## Deferred Issues (Out of Scope — Pre-existing)

`pnpm test` (full suite) currently fails due to missing `node` types in `tsconfig.spec.json`. Affected pre-existing specs that import `node:fs`, `node:path`, `node:url`, or use `__dirname` / `process`:

- src/app/app.routes.spec.ts
- src/app/blocks/block-renderer/block-renderer.component.spec.ts
- src/app/chrome/{site-footer,site-header,site-nav}.component.spec.ts
- src/app/pages/{about,home,lesson-library,lesson,not-found,preview-stub}/*.spec.ts
- src/content/api/fixture-loader.ts (transitively imported by mock-content-api.spec.ts)

Confirmed pre-existing via `git stash` round-trip — these errors exist on the base commit (562331f) before Plan 05 changes. Logged here per `<scope_boundary>` rules; tsconfig.spec.json fix is outside the scope of WAGTAIL-07.

The new Plan 05 spec was verified by running `npx vitest run src/content/api/wagtail-content-api.spec.ts` directly (bypasses the broken pages/chrome specs), all 8 tests pass.

## Authentication Gates

None. Smoke against live BE was a build-only check (no live HTTP request). Plan 07 will wire preview cookie-auth.

## Threat Surface Scan

No new threat surface beyond what is already declared in the Plan 05 `<threat_model>` (T-04-28..T-04-32). The adapter does not introduce new network endpoints (it consumes the REST v2 endpoints declared in Plan 03), no new auth paths, no new file/IO paths, no schema changes.

## Self-Check: PASSED

- `test -f src/content/api/wagtail-content-api.ts` -> FOUND
- `test -f src/content/api/wagtail-content-source.ts` -> FOUND
- `test -f src/content/api/wagtail-content-api.spec.ts` -> FOUND
- `test -f src/environments/environment.ts` -> FOUND
- `test -f src/environments/environment.development.ts` -> FOUND
- `git log --oneline | grep e41b555` -> FOUND (RED commit)
- `git log --oneline | grep dec0424` -> FOUND (GREEN commit)
- `grep -F "useFactory" src/content/api/content-api.token.ts` -> FOUND
- `git diff --exit-code` against locked FE contract files -> CLEAN
