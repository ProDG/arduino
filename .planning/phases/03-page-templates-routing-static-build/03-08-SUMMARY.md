---
phase: 03-page-templates-routing-static-build
plan: "08"
subsystem: build-tooling, primitives
tags: [shiki, tokenization, ng-optimized-image, perf, prim]
dependency_graph:
  requires: [03-01, 03-03, 03-07]
  provides: [PERF-05, PRIM-04]
  affects:
    - src/assets/mock-data/**/*.json
    - projects/core-ui/src/lib/code-block
    - projects/core-ui/src/lib/pinout
    - src/app/blocks/block-renderer
tech_stack:
  added:
    - shiki@4.0.2 (devDependency only — build-time tokenization, never in client bundle)
  patterns:
    - prebuild script writes Shiki tokens into fixture JSON via Prettier-formatted output for idempotence
    - ESLint no-restricted-imports blocks accidental shiki import from src/**
    - NgOptimizedImage in PinoutComponent with bound width/height from block model
key_files:
  created:
    - src/assets/shiki/arduino-paper.json
    - scripts/tokenize-fixtures.mjs
  modified:
    - package.json
    - eslint.config.js
    - projects/core-ui/src/lib/code-block/code-block.component.ts
    - projects/core-ui/src/lib/code-block/code-block.component.scss
    - projects/core-ui/src/lib/pinout/pinout.component.ts
    - src/app/blocks/block-renderer/block-renderer.component.ts
    - src/assets/mock-data/lessons/pershyi-blymayuchyi-svitlodiod.json
    - src/assets/mock-data/lessons/analogovyi-vhid-ta-potentsiometr.json
    - src/assets/mock-data/lessons/knopka-ta-pidtyahuvalnyi-rezystor.json
    - src/assets/mock-data/articles/chomu-arduino.json
    - src/assets/mock-data/datasheets/arduino-uno-r3.json
    - src/assets/mock-data/datasheets/atmega328p.json
decisions:
  - "Tokenize script uses Prettier API (resolveConfig + format) internally to produce Prettier-compatible JSON output, avoiding a tokenize→prettier→tokenize instability cycle"
  - "CodeBlock tokens path uses [innerHTML] on .code-block__shiki div; ::ng-deep reaches injected .shiki pre styles"
  - "Keyword weight override: TM bold (700) → 600 via SCSS span[style*='font-weight: bold'] selector in ::ng-deep scope"
  - "PinoutComponent owns its own <img [ngSrc]>; FigureComponent continues using <ng-content> with BlockRenderer projecting the <img [ngSrc]> (already wired in 03-03)"
  - "Color palette hex values locked: paper=#faf8f3, ink=#1a1a1a, ink-muted=#5c5c5c (from src/styles/tokens/_color.scss)"
metrics:
  duration: "~18m"
  completed: "2026-05-02"
  tasks_completed: 2
  files_changed: 14
---

# Phase 3 Plan 08: Shiki Build-Time Tokenization + NgOptimizedImage Summary

Build-time Shiki tokenization with hand-authored arduino-paper theme + NgOptimizedImage swap in Pinout, closing PERF-05 and finalizing PRIM-04.

## What Was Built

### Task 1: arduino-paper.json + tokenize-fixtures.mjs + ESLint guard

**`src/assets/shiki/arduino-paper.json`** — Hand-authored TextMate theme. Palette:
- `editor.background`: `#faf8f3` (--color-paper)
- `editor.foreground`: `#1a1a1a` (--color-ink)
- Comments: `#5c5c5c` italic (--color-ink-muted)
- Keywords/storage: `#1a1a1a` bold (no chromatic alarm — weight-only differentiation)
- Strings, variables, punctuation: `#1a1a1a`
- Numerics, types: `#1a1a1a` italic

No reds, greens, blues, or yellows anywhere in the theme.

**`scripts/tokenize-fixtures.mjs`** — Node prebuild script:
- Walks `src/assets/mock-data/{lessons,articles,datasheets,schematics}/*.json`
- Finds code blocks (`node.type === 'code'`), tokenizes via `createHighlighter` from shiki@4
- `arduino` language aliased to `cpp`
- Uses Prettier API (`resolveConfig` + `format`) to write output matching the project's Prettier config — critical for idempotence (plain `JSON.stringify` produces different short-array formatting than Prettier)
- 6 fixtures updated on first run; 0 on second run (idempotent)

**`package.json`** — Added `"tokenize"` and `"prebuild"` scripts; `shiki@^4.0.2` in devDependencies.

**`eslint.config.js`** — `no-restricted-imports` rule in `src/**/*.ts` block prevents `shiki` and `@shikijs/transformers` imports with descriptive error messages referencing PRIM-04.

### Task 2: CodeBlock tokens rendering + Pinout NgOptimizedImage

**`code-block.component.ts`** — Template updated to branch on `tokens()`:
- `@if (tokens())` → renders `<div class="code-block__shiki" [innerHTML]="tokens()"></div>`
- `@else` → existing `<pre><code>` loop path unchanged
- Copy button and annotations rail remain outside the branch (always rendered)

**`code-block.component.scss`** — Added `.code-block__shiki ::ng-deep .shiki` rules:
- font-family, background-color (belt-and-braces override against Shiki's inline style), padding, border-radius, overflow-x, tab-size
- Keyword weight override: `span[style*='font-weight: bold']` → `font-weight: 600`

**`pinout.component.ts`** — Added `width = input<number>(0)`, `height = input<number>(0)`; imported `NgOptimizedImage`; template swapped `<img [src]>` for `<img [ngSrc]="src()" [width]="width()" [height]="height()" [alt]="alt()" [loading]="'lazy'">`.

**`block-renderer.component.ts`** — Pinout case now passes `[width]="$any(block()).width"` and `[height]="$any(block()).height"`.

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm tokenize` first run | 6 file(s) updated |
| `pnpm tokenize` second run | 0 file(s) updated (idempotent) |
| `node scripts/lint-fixtures.mjs` | 7 fixtures clean |
| ESLint rule fires on synthetic `import 'shiki'` in src/ | PASS (exit 1 with message) |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm exec stylelint` on modified SCSS | PASS |
| `pnpm build` | PASS — 11 routes prerendered |
| Shiki bytes in `dist/arduino-hub/browser/*.js` | 0 files (grep returns empty) |
| `grep -E "Red\|Green\|Blue\|Yellow" src/assets/shiki/arduino-paper.json` | No matches |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Tokenize script uses Prettier for JSON serialization**
- **Found during:** Task 1, first commit attempt
- **Issue:** `JSON.stringify(json, null, 2) + '\n'` diverges from Prettier's output for short arrays like `[7]`. Prettier inlines short arrays; `JSON.stringify` always multi-lines them. This caused an unstable tokenize→prettier→tokenize cycle that would fail the pre-commit hook repeatedly.
- **Fix:** Added `import { format, resolveConfig } from 'prettier'` and replaced the `JSON.stringify` write path with `await format(JSON.stringify(json), { ...prettierConfig, parser: 'json' })`.
- **Files modified:** `scripts/tokenize-fixtures.mjs`
- **Commit:** 3086a5a

**2. [Rule 1 - Bug] `:global()` SCSS selector replaced with `::ng-deep`**
- **Found during:** Task 2 stylelint run
- **Issue:** `:global(.shiki)` is a CSS Modules pattern that Stylelint flags as unknown pseudo-class.
- **Fix:** Used `::ng-deep .shiki` which is the correct Angular pattern for piercing view encapsulation to reach `[innerHTML]`-injected content.
- **Files modified:** `projects/core-ui/src/lib/code-block/code-block.component.scss`
- **Commit:** bbdbaf0

### Pre-existing Issues (out of scope)

- `code-block.spec.ts` — 4 tests failing with "Component not resolved: styleUrl" (missing `resolveComponentResources()` call in test setup). Pre-dates this plan; confirmed by git stash check. Deferred.

## Known Stubs

None — CodeBlock `tokens` path is wired end-to-end from fixture JSON through BlockRenderer to `[innerHTML]`; NgOptimizedImage receives real `width`/`height` from block model fields verified by `lint-fixtures.mjs`.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: innerHTML-injection | code-block.component.ts | Shiki tokens HTML injected via [innerHTML] — mitigated: content is build-time output of trusted fixture source code; Angular DomSanitizer applies (T-03-08-01) |

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/assets/shiki/arduino-paper.json | FOUND |
| scripts/tokenize-fixtures.mjs | FOUND |
| commit 3086a5a (Task 1) | FOUND |
| commit bbdbaf0 (Task 2) | FOUND |
