---
phase: 02-primitives-two-column-layout-page-model-contract
plan: 05
subsystem: core-ui
tags: [primitive, code-block, copy-clipboard, diff, annotations, dom-test]
requires:
  - "PRIM-01 (core-ui workspace library, public-API barrel)"
  - "PRIM-03 / TwoColumn measure (computeSidenoteStack engine)"
  - "P1 token system (--color-highlight, --color-ink-muted, --color-accent, --space-*, --margin-rail-*)"
  - "_base.scss <pre> rule (lines 105-121) — paper bg, accent border, mono 15px/1.55"
provides:
  - "CodeBlockComponent (PRIM-04 + PRIM-05 + PRIM-06): frame + line numbers + copy + diff + annotations"
  - "Locked DOM contract for the copy-button interaction (D-TEST-01 #2)"
  - "Public-API export #14: CodeBlockComponent"
affects:
  - "package.json — pnpm test now runs through ng test (Angular compiler) so styleUrl resolves in DOM specs"
tech-stack:
  added: []
  patterns:
    - "First Angular DOM/component test in the repo (TestBed.createComponent + jsdom + fake timers)"
    - "TestBed env init via @angular/platform-browser/testing (Angular 21 unified — no @angular/platform-browser-dynamic)"
    - "ResizeObserver feature-guard for jsdom"
key-files:
  created:
    - "projects/core-ui/src/lib/code-block/code-block.component.ts (227 lines)"
    - "projects/core-ui/src/lib/code-block/code-block.component.scss (160 lines)"
    - "projects/core-ui/src/lib/code-block/code-block.spec.ts (102 lines, 4 tests)"
  modified:
    - "projects/core-ui/src/public-api.ts (+1 export — now 14 components)"
    - "package.json (test script: vitest run -> ng test arduino-hub && ng test core-ui)"
decisions:
  - "Component template uses tight whitespace inside <pre> to keep <code-line> children as direct DOM siblings — required for the .code-line:nth-child(N) selector used by placeAnnotations()"
  - "ResizeObserver guarded behind typeof check so jsdom DOM tests don't reference an undefined global"
  - "navigator.clipboard.writeText(this.code()) reads from the input signal — never the DOM — so line-numbers, diff glyphs and gutter padding cannot leak into the clipboard payload"
  - "Diff palette is yellow + ink-muted only; SCSS audit confirms zero red/green/hex literals"
  - "U+2212 (true minus) is the remove gutter glyph, never hyphen — book-typography convention"
metrics:
  duration: "6 minutes"
  completed: "2026-05-01T08:13:00Z"
---

# Phase 2 Plan 05: CodeBlock Primitive Summary

CodeBlock primitive ships its visual frame, gutter line numbers, top-right copy-to-clipboard button (locked Cyrillic strings + 2s/4s timing), restrained yellow+ink-muted diff treatment, and three-breakpoint per-line margin annotations driven by the same `computeSidenoteStack` engine that powers `TwoColumn` — Shiki integration explicitly deferred to P3.

## What Shipped

- **`CodeBlockComponent`** at `projects/core-ui/src/lib/code-block/code-block.component.ts`:
  - Signal inputs: `language`, `code`, `annotations`, `showLineNumbers`, `highlightLines`, `diffMode`, `filename`.
  - Renders `<figure><pre><code>` with optional filename strip; per-line `<span class="code-line">` rows; `code-line__num` gutter (`user-select: none`, right-aligned, 3ch min-width) when `showLineNumbers=true`; `code-line__diff-glyph` `+`/`−` (U+2212) for diff modes; `.code-line--highlighted` for `highlightLines[]`.
  - Top-right copy button reads `code()` directly via `navigator.clipboard.writeText(this.code())`; rest label `Копіювати`, success label `Скопійовано` for 2s, failure label `Не вдалося скопіювати` for 4s; `aria-label="Копіювати код"`; visually-hidden `aria-live="polite"` region announces the transition.
  - Diff lines: `+ ` → `code-line--added` (yellow background + accent `+` glyph); `- ` → `code-line--removed` (line-through + ink-muted + `−` glyph). Leading two characters stripped from rendered content. NO red, NO green.
  - Annotations: desktop (>=1200px) renders absolute-positioned `<small>` boxes whose `top` is computed by `computeSidenoteStack` against each target line's bounding rect; tablet (768-1199px) renders a `<dl><dt>Рядок {N}</dt><dd>{html}</dd></dl>`; mobile (<768px) wraps the same dl in `<details><summary>Примітки до коду ({N})</summary></details>`. `ResizeObserver` (debounced 50ms) re-runs measurement on viewport changes.
- **SCSS** at `projects/core-ui/src/lib/code-block/code-block.component.scss`: composes the existing `_base.scss` `<pre>` rule, adds gutter grid, diff treatment (token-only — no hex), annotation rail at desktop via grid placement, dl-list at tablet, summary chip at mobile.
- **Vitest DOM spec** at `projects/core-ui/src/lib/code-block/code-block.spec.ts`: 4 cases driving the locked copy contract — initial label, success path (2s) with `clipboard.writeText` called once with verbatim `code`, failure path (4s) with no `console.error` and no thrown exception, presence of an `aria-live="polite"` region. First Angular DOM/component test in the repo.
- **Public API export** in `projects/core-ui/src/public-api.ts`: `CodeBlockComponent` joins the barrel — now 14 component modules.

## Verification

```
$ pnpm test
arduino-hub:  Test Files  3 passed (3)   Tests  19 passed (19)
core-ui:      Test Files  2 passed (2)   Tests  10 passed (10)
TOTAL: 5 files, 29 tests, all green
```

```
$ pnpm exec ng build core-ui
✔ Built core-ui
Time: 940ms
```

```
$ pnpm lint
lint-fixtures: 7 fixtures clean.
(eslint and stylelint exit 0; only the boundaries-plugin v5→v6 deprecation warning, pre-existing)
```

### Acceptance criteria spot checks

| Check | Result |
|---|---|
| `grep -F "Копіювати"` in component | rest label + aria-label present |
| `grep -F "Скопійовано"` in component | present (2s state) |
| `grep -F "Не вдалося скопіювати"` in component | present (4s state) |
| `grep -F "Копіювати код"` in component | aria-label present |
| `grep -F '−'` (U+2212) in component | present in remove diff glyph |
| `grep -F 'navigator.clipboard.writeText(this.code())'` | present — reads from input, not DOM |
| `grep -F "computeSidenoteStack"` in component | imported from `../two-column/measure`; used in `placeAnnotations()` |
| `grep -F "afterNextRender"` + `grep -F "new ResizeObserver"` | both present |
| `grep -c "^export \* from './lib/" public-api.ts` | `14` — matches 14-export expectation |
| `grep -iE 'red\|green\|#[0-9a-f]{3,}' code-block.component.scss` | no diff-related hits — palette stays in tokens |

## Public-API state

```ts
// projects/core-ui/src/public-api.ts (14 component-module exports)
export * from './lib/aside/aside.component';
export * from './lib/body/body.component';
export * from './lib/code-block/code-block.component';      // ← P02-05 adds this
export * from './lib/diff/diff.component';
export * from './lib/figure-caption/figure-caption.component';
export * from './lib/figure/figure.component';
export * from './lib/heading/heading.component';
export * from './lib/lede/lede.component';
export * from './lib/margin-rail/margin-rail.component';
export * from './lib/page-shell/page-shell.component';
export * from './lib/pinout/pinout.component';
export * from './lib/sidenote-ref/sidenote-ref.component';
export * from './lib/sidenote/sidenote.component';
export { computeSidenoteStack } from './lib/two-column/measure';
export type { SidenoteInput, SidenotePlacement } from './lib/two-column/measure';
export * from './lib/two-column/two-column.component';
```

## Shiki status

**No Shiki dependency was added.** `package.json` `dependencies` and `devDependencies` are unchanged versus master at the start of this plan. CodeBlock renders code as plain monospace text; the per-line DOM shape (`<span class="code-line"><span class="code-line__content">…</span></span>`) is exactly the shape Shiki will inhabit in P3 by replacing `{{ line.content }}` text nodes with pre-tokenized highlighted spans.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Test infrastructure] First Angular DOM spec in the repo required Angular's runtime compiler**
- **Found during:** Task 2, first run of `pnpm test`.
- **Issue:** `pnpm test` was wired to `vitest run --passWithNoTests`, which runs vitest directly. With no Angular compiler in the loop, `styleUrl: './code-block.component.scss'` raises `Component 'CodeBlockComponent' is not resolved … Did you run and wait for resolveComponentResources()?` Prior plans only had pure-function / type-only specs, so this gap had not surfaced.
- **Fix:** Updated `package.json` test scripts so DOM specs are compiled through Angular's `@angular/build:unit-test` builder:
  - `test`: `ng test arduino-hub --watch=false && ng test core-ui --watch=false` (29 tests, two Vitest runs).
  - `test:watch`: `ng test core-ui` (the workspace where DOM specs live).
- **Verification:** All 5 spec files / 29 tests pass; `pnpm lint` and `pnpm exec ng build core-ui` exit 0.
- **Files modified:** `package.json`.
- **Commit:** `92fbb68`.

**2. [Rule 3 — Test environment] `ResizeObserver` is not defined in jsdom**
- **Found during:** Task 2, second run after fix #1.
- **Issue:** The component's `afterNextRender` callback constructs `new ResizeObserver(...)` to react to viewport changes. jsdom (the test environment) does not implement `ResizeObserver`, so the constructor threw and Angular logged the rejection via `console.error`, which broke the failure-path test's `expect(consoleErr).not.toHaveBeenCalled()` assertion.
- **Fix:** Added a `typeof ResizeObserver === 'undefined'` early-return guard. The breakpoint-change re-measure is a real-browser optimization; in jsdom it is functionally inert anyway since there is no rendering layout to observe.
- **Files modified:** `projects/core-ui/src/lib/code-block/code-block.component.ts`.
- **Commit:** `92fbb68`.

**3. [Rule 3 — TestBed environment init] Spec needed an explicit `TestBed.initTestEnvironment` block**
- **Found during:** Task 2, before fix #1.
- **Issue:** First Angular DOM spec in the repo — there's no shared `test-setup.ts`. `TestBed.configureTestingModule` errored with `Need to call TestBed.initTestEnvironment() first`. In Angular 21, the entry point is `@angular/platform-browser/testing` (`BrowserTestingModule` + `platformBrowserTesting`) — `@angular/platform-browser-dynamic` was removed in v20+ when the dynamic compiler was unified.
- **Fix:** Added `// @vitest-environment jsdom` directive + a `beforeAll` block that idempotently initializes the test environment via `BrowserTestingModule` and `platformBrowserTesting`. The next plan that adds a DOM spec can lift this into a shared setup file when the repeated boilerplate becomes meaningful.
- **Files modified:** `projects/core-ui/src/lib/code-block/code-block.spec.ts`.
- **Commit:** `92fbb68` (the spec file in this commit; the original RED-step spec was committed in `558f7be` and modified in this commit).

## Hand-off to Plan 06 (Showcase Page)

Plan 06's `/dev/primitives` showcase page must include three `CodeBlock` instances per UI-SPEC §"The Showcase Page" sections 6, 7, 8:

1. **§6 — Basic CodeBlock:** 12-line Arduino C++ snippet (with the locked comment `// блимаємо світлодіодом`); `language="arduino"`, `showLineNumbers=true`, `highlightLines=[7]`, no annotations, no diff. Verifies hierarchy: gutter + highlight band + copy button.
2. **§7 — Diff CodeBlock:** ≥16-line snippet, `diffMode=true`, ≥2 added (`+ `) and ≥2 removed (`- `) lines. Verifies the editorial yellow-highlight + line-through + accent `+` / ink-muted `−` glyph treatment under real Cyrillic-comment prose.
3. **§8 — Annotated CodeBlock:** 20-line snippet with 4 annotations at lines 3, 8, 13, 18. Each `html` should be a 1-2-sentence Ukrainian explanation. Verifies `placeAnnotations()` desktop alignment within 4 px of the target line (visual gate on the typography checklist), `<dl>` collapse at 768-1199 px, `<details>Примітки до коду (4)</details>` at <768 px.

Plan 06 also has the `/dev/primitives` route + force-en audit row + typography checklist additions.

## Self-Check: PASSED

- [x] FOUND: projects/core-ui/src/lib/code-block/code-block.component.ts
- [x] FOUND: projects/core-ui/src/lib/code-block/code-block.component.scss
- [x] FOUND: projects/core-ui/src/lib/code-block/code-block.spec.ts
- [x] FOUND commit `558f7be` (test RED step)
- [x] FOUND commit `92fbb68` (feat GREEN step)
- [x] public-api.ts shows 14 `export * from './lib/...` lines
- [x] No Shiki dependency in `package.json`
