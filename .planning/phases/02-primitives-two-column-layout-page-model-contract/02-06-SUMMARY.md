---
phase: 02-primitives-two-column-layout-page-model-contract
plan: 06
subsystem: showcase-and-phase-exit
tags: [showcase, dev-route, prerender-exclusion, di, three-breakpoint, force-en, phase-exit]
requires: [02-01, 02-02, 02-03, 02-04, 02-05]
provides:
  - "/dev/primitives showcase route consuming MockContentApi via DI"
  - "Phase 2 exit attestation — typography-checklist.md + force-en-audit.md P2 ALL PASS"
affects:
  - src/app/app.config.ts
  - src/app/app.routes.ts
  - src/app/app.routes.server.ts
  - src/app/pages/dev-primitives/dev-primitives.component.{ts,html,scss}
  - src/assets/mock-data/figures/blymayuchyi-shema.svg
  - src/assets/mock-data/figures/uno-r3-pinout-hero.svg
  - src/assets/mock-data/figures/uno-r3-pinout.svg
  - angular.json
  - docs/typography-checklist.md
  - docs/force-en-audit.md
tech-stack:
  added: []
  patterns:
    - "RenderMode.Client for dev-only routes — emits CSR shell, NOT a Node-SSR runtime"
    - "PageMaker-style X-in-rectangle SVG placeholders for unshipped image assets"
key-files:
  modified:
    - src/app/app.config.ts
    - src/app/app.routes.ts
    - src/app/app.routes.server.ts
    - angular.json
    - docs/typography-checklist.md
    - docs/force-en-audit.md
  created:
    - src/app/pages/dev-primitives/dev-primitives.component.ts
    - src/app/pages/dev-primitives/dev-primitives.component.html
    - src/app/pages/dev-primitives/dev-primitives.component.scss
    - src/assets/mock-data/figures/blymayuchyi-shema.svg
    - src/assets/mock-data/figures/uno-r3-pinout-hero.svg
    - src/assets/mock-data/figures/uno-r3-pinout.svg
decisions:
  - "Showcase Figure #2 demoted from [fullBleed] to body-measure for the user-facing walk; the [fullBleed] capability remains in core-ui's public surface for future content."
  - "Image assets ship as PageMaker-style X-in-rectangle placeholders; real assets land in P6 (content migration)."
  - "/dev/primitives is RenderMode.Client — explicitly NOT prerendered, consistent with the SSG-only / no-SSR-ever constraint (Client mode emits a thin CSR shell, no Node runtime)."
metrics:
  duration: ~30m (post-checkpoint close-out)
  completed: 2026-05-01
requirements: [PRIM-01, PRIM-02, PRIM-03, PRIM-04, PRIM-05, PRIM-06, PRIM-07, PRIM-08, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05, UKR-02, UKR-03]
---

# Phase 2 Plan 06: `/dev/primitives` showcase + 3-breakpoint walk + force-en audit Summary

**One-liner:** Wired `/dev/primitives` as a CSR-only showcase consuming `MockContentApi` via DI, exercised every P2 primitive on real Ukrainian Arduino prose, and closed Phase 2 with user-approved three-breakpoint walk + force-en locale audit.

## Objective recap

Plan 02-06 was the phase-exit gate for Phase 2. Wire DI (`provideContentApi()`), register `/dev/primitives` as a lazy CSR-only route (excluded from SSG prerender), author a showcase template that exercises all 14 P2 primitives end-to-end, append P2 sections to `docs/typography-checklist.md` and `docs/force-en-audit.md`, then walk the page at <768 / 768–1199 / ≥1200 and force-en `en-US`. Outcome: ROADMAP SC#1..SC#5 satisfied; Phase 2 closes.

## Files modified

**Created:**
- `src/app/pages/dev-primitives/dev-primitives.component.{ts,html,scss}` — showcase composing 14 primitives via the `@arduino/core-ui` public surface only.
- `src/assets/mock-data/figures/{blymayuchyi-shema.svg,uno-r3-pinout-hero.svg,uno-r3-pinout.svg}` — three PageMaker-style X-in-rectangle placeholders (~436 B each).

**Modified:**
- `src/app/app.config.ts` — `provideContentApi()` appended to providers; DI now resolves `MockContentApi` end-to-end.
- `src/app/app.routes.ts` — `dev/primitives` lazy route added.
- `src/app/app.routes.server.ts` — explicit `dev/primitives` → `RenderMode.Client` ahead of the `**` catch-all `RenderMode.Prerender` rule.
- `angular.json` — fixed `assets` output mapping so `/assets/mock-data/*.json` resolves both in `pnpm start` and the prerendered build.
- `docs/typography-checklist.md` — Phase 2 section ALL ticked PASS; run record dated 2026-05-01 with deviation chain noted.
- `docs/force-en-audit.md` — Phase 2 row marked **ALL PASS** dated 2026-05-01.

## Task commits (full Plan 02-06 chain)

| # | Hash | Subject |
|---|------|---------|
| 1 | `a850d4a` | `feat(02-06): wire /dev/primitives showcase + DI + prerender exclusion [PRIM-01..08,LAYOUT-01..05]` |
| 2 | `420403a` | `docs(02-06): append P2 sections to typography-checklist + force-en-audit [PRIM-01..08,LAYOUT-01..05,UKR-02,UKR-03]` |
| 3 | `27f5341` | `fix(02-06): MockContentApi resolves /assets/mock-data/* in dev [CONTRACT-01,CONTRACT-03]` *(Rule 1 deviation found during manual walk)* |
| 4 | `d4be5d5` | `feat(02-06): editorial SVG placeholders for three figure assets [PRIM-07]` *(Rule 3 deviation: missing referenced assets)* |
| 5 | `f849770` | `refactor(02-06): swap editorial SVGs for PageMaker-style image-frame placeholders` *(visual-fit refinement on top of #4)* |
| 6 | `bb7d38a` | `fix(02-06): demote showcase figure 2 from bleed to wide variant` *(Rule 1 deviation: full-bleed against placeholder didn't read; Figure primitive's [fullBleed] retained in `core-ui`)* |
| 7 | `f5684e1` | `docs(02-06): tick phase 2 audit rows after user approval` |

## Gates passed

- **Task 1 — automated:** `provideContentApi()` wired; `dev/primitives` route + `RenderMode.Client` registered; component imports primitives only from `'@arduino/core-ui'`; `pnpm exec ng build` exit 0; `pnpm lint` clean; `find dist -path '*dev/primitives*' -name '*.html'` returns no public prerender HTML.
- **Task 2 — checkpoint:human-verify:** User walked `/dev/primitives` at 375×667, 1024×768, 1440×900 and force-en `en-US` at ≥1200; reply `approved`. Three deviation commits surfaced and were fixed inline before approval (commits 3, 4–5, 6 above).

## Requirements shipped

This plan is the carrier of the Phase 2 exit attestation; the requirements it stamps complete are **all P2 reqs** (verified by union of `requirements:` fields across plans 02-01..02-06):

- **PRIM-01..08** — `core-ui` library + boundary lint + 14 primitives exercised on real Ukrainian content.
- **LAYOUT-01..05** — three-breakpoint TwoColumn behavior + PageShell + MarginRail verified PASS at all three breakpoints.
- **CONTRACT-01, CONTRACT-03, CONTRACT-04** — TS content models locked, `ContentApi`/`MockContentApi` exercised end-to-end via DI, 7 real-Ukrainian-prose fixtures committed.
- **UKR-02, UKR-03** — honored as authoring-contract per CONTEXT D-PRE-01..05; `docs/copy-style-uk.md` + `scripts/lint-fixtures.mjs` clean on all 7 fixtures; force-en walk confirms quotes/apostrophes/dashes render correctly at runtime.

**Phase 2 total: 18 requirements complete.**

## Build / dist verification

```
$ pnpm exec ng build
Initial total            234.34 kB | 66.50 kB transfer
Lazy: dev-primitives-component  46.25 kB | 9.32 kB transfer
Prerendered 2 static routes.   # / and /dev/glyph-audit only

$ find dist -path '*dev/primitives*' -name '*.html'
(no results)

$ du -sh dist/arduino-hub/browser
1.8M

$ pnpm lint            -> clean (lint-fixtures: 7 fixtures clean)
$ pnpm test            -> 2 files / 10 tests passed
```

## Phase 2 success-criteria attestation

| SC | Criterion | Evidence |
|----|-----------|----------|
| 1 | Every primitive renders on `/dev/primitives` consumed only via `@arduino/core-ui` | `dev-primitives.component.ts` imports only from `'@arduino/core-ui'`; user-walk PASS |
| 2 | Three-breakpoint TwoColumn + sidenote behavior PASSes | typography-checklist.md P2 Sidenote rows ALL PASS at <768 / 768–1199 / ≥1200 |
| 3 | CodeBlock basic / diff / annotated PASS (highlight + copy + diff palette + annotation alignment) | typography-checklist.md P2 CodeBlock rows ALL PASS; Plan 05 DOM-test for copy interaction green |
| 4 | `MockContentApi` wired end-to-end; page resolves a `Lesson` at runtime | `provideContentApi()` in `app.config.ts`; `getLesson('pershyi-blymayuchyi-svitlodiod')` invoked in `ngOnInit`; lesson title renders in showcase header |
| 5 | UKR-02/UKR-03 reframed per D-PRE-05: editorial-smell + content-gate lint clean on every fixture; force-en audit PASS | `node scripts/lint-fixtures.mjs` → `7 fixtures clean`; `force-en-audit.md` Phase 2 row **ALL PASS** |

**All five Phase 2 success criteria verified PASS.** Phase 2 closes.

## Deviations from Plan

### Auto-fixed during the manual walk (Rule 1 / Rule 3)

**1. [Rule 1 — Bug] `MockContentApi` 404s in dev** (`27f5341`)
- **Found during:** Task 2 manual walk at ≥1200 — Network tab showed `/assets/mock-data/lessons/pershyi-blymayuchyi-svitlodiod.json` 404.
- **Fix:** Updated `angular.json` `assets` glob output mapping so `src/assets/mock-data/**` is copied to `/assets/mock-data/**` in the dev server and prerendered build.

**2. [Rule 3 — Blocking] Missing referenced figure assets** (`d4be5d5` → `f849770`)
- **Found during:** Task 2 manual walk — three referenced SVGs (`blymayuchyi-shema.svg`, `uno-r3-pinout-hero.svg`, `uno-r3-pinout.svg`) returned 404.
- **Fix:** Shipped three PageMaker-style X-in-rectangle SVG placeholders (~436 B each) at the canonical asset paths so the showcase composition reads correctly.

**3. [Rule 1 — Bug] Showcase Figure #2 in `[fullBleed]` looked off** (`bb7d38a`)
- **Found during:** Task 2 manual walk at ≥1200 — full-bleed against the placeholder asset disrupted the page rhythm.
- **Fix:** Demoted the showcase usage from `[fullBleed]="true"` to body-measure. The Figure primitive's `[fullBleed]` API remains in `core-ui`'s public surface — content can opt back in.

### Auth gates / human-action

None.

## Hand-off notes for Phase 3

- **Locked content models** (`content/models/*.ts`) and the `Block` discriminated union are the contract Wagtail must conform to in P4. Phase 3 builds `BlockRenderer` + page templates on top of these — no model changes needed.
- **`ContentApi` DI token** is wired in `app.config.ts`. Phase 3 page components inject `CONTENT_API` directly; the mock→Wagtail swap in P4 is a single `provideContentApi(WagtailContentApi)` change.
- **Primitive public-API surface** is locked at `@arduino/core-ui`'s `public-api.ts`. Phase 3 templates compose primitives only via this barrel; the boundary lint rule blocks reach-through imports into `projects/core-ui/src/lib/...`.
- **Shiki integration replaces plain monospace in `CodeBlock`.** P2 ships the frame, line numbers, copy interaction, diff visuals, and annotation alignment — all as plain monospace text. P3 adds Shiki at build-time (per STACK.md) so the `language` field on `Block.code` actually drives syntax tokens. The `CodeBlock` component's public API does not change.
- **Real SVG / PNG figure assets replace placeholders.** The three placeholders at `src/assets/mock-data/figures/` are intentional stand-ins; they live at the same paths and have the same alt text, so the swap to real assets is a file-replace operation with no template changes.
- **`Figure` primitive may grow a `wide` variant separately** if Phase 3 / Phase 6 content needs an intermediate width between body-measure and `[fullBleed]`. Out of scope for now — `[fullBleed]` and body-measure cover all P2 showcase needs.
- **Wagtail spike at P3 exit (post 2026-05-04):** validates `CodeBlock = StructBlock(language, code, annotations=ListBlock({line, note}))` produces a serialized shape byte-compatible with `Block.code`. Run before any P4 work begins.

## Self-Check: PASSED

**Files verified present:**
- FOUND: src/app/pages/dev-primitives/dev-primitives.component.ts
- FOUND: src/app/pages/dev-primitives/dev-primitives.component.html
- FOUND: src/app/pages/dev-primitives/dev-primitives.component.scss
- FOUND: src/assets/mock-data/figures/blymayuchyi-shema.svg
- FOUND: src/assets/mock-data/figures/uno-r3-pinout-hero.svg
- FOUND: src/assets/mock-data/figures/uno-r3-pinout.svg
- FOUND: docs/typography-checklist.md (P2 ALL PASS run record)
- FOUND: docs/force-en-audit.md (P2 ALL PASS row)

**Commits verified in `git log`:** a850d4a, 420403a, 27f5341, d4be5d5, f849770, bb7d38a, f5684e1.
