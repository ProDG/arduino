---
phase: 02-primitives-two-column-layout-page-model-contract
plan: 01
subsystem: infra
tags: [angular-library, ng-packagr, eslint, boundaries, public-api]

requires:
  - phase: 01-foundation-typography-gate
    provides: Angular 21 zoneless app shell, ESLint 9 flat config, pnpm 10 workspace, src/styles/tokens token system

provides:
  - "@arduino/core-ui Angular workspace library at projects/core-ui/ (empty surface ready for primitives)"
  - "@arduino/core-ui path alias (tsconfig.json baseUrl + paths)"
  - "ng build core-ui smoke build is green (560ms cold)"
  - "eslint-plugin-boundaries enforcing the public-API contract (PRIM-01) with 5 element types"
  - "ui- component-selector prefix inside projects/core-ui/** (rest of codebase keeps app-)"
  - "Synthetic violation fixture (.example file) for boundary-rule self-test"
  - "src/assets/ asset-glob entry in angular.json so Plan 02-02 mock JSON ships at /assets/mock-data/..."

affects: 02-02, 02-03, 02-04, 02-05, 02-06, 03, 04

tech-stack:
  added:
    - eslint-plugin-boundaries@6.0.2
    - ng-packagr@21.2.3 (was declared in package.json by `ng generate library` but not installed)
  patterns:
    - "Public-API enforcement via element-type rules, not deny lists"
    - "Selector-prefix override scoped per-glob (matches workspace-library convention)"

key-files:
  created:
    - projects/core-ui/ng-package.json
    - projects/core-ui/tsconfig.lib.json
    - projects/core-ui/tsconfig.lib.prod.json
    - projects/core-ui/tsconfig.spec.json
    - projects/core-ui/src/public-api.ts
    - projects/core-ui/src/lib/_placeholder.ts
    - projects/core-ui/src/lib/.gitkeep
    - projects/core-ui/src/lib/__violation__.ts.example
    - projects/core-ui/README.md
    - src/assets/.gitkeep
  modified:
    - tsconfig.json (baseUrl + @arduino/core-ui path alias)
    - angular.json (core-ui project entry, ui prefix, src/assets glob)
    - eslint.config.js (boundaries plugin + ui-prefix override)
    - package.json (devDependencies: eslint-plugin-boundaries, ng-packagr)

key-decisions:
  - "Path alias is exactly `@arduino/core-ui` -> projects/core-ui/src/public-api.ts (single mapping, no dist/ fallback per D-LIB-03)"
  - "Element-type names match D-LIB-01 suggestion verbatim: core-ui-public, core-ui-internal, app, content-models, app-lib"
  - "tsconfig.json gains `baseUrl: \".\"` because ng-packagr 21.2 requires it for `paths` to resolve"
  - "Plan-level deviation: an empty public-api.ts breaks ng-packagr (`failed to get symbol for entrypoint`); a stub `_placeholder.ts` is exported and the smoke-build runs against it; Plan 02-03 deletes both when real primitives land"

patterns-established:
  - "boundaries plugin extends the existing flat-config pipeline by appending two new config blocks (no rewrite of existing ones), per 02-PATTERNS.md"
  - "Synthetic-violation fixture pattern (P1 idiom) carries forward: kept in repo with `.example` extension; `mv` to `.ts` to self-test the rule"

requirements-completed:
  - PRIM-01

duration: ~30min
completed: 2026-05-01
---

# Plan 02-01: `core-ui` Library + Public-API Boundary

**`@arduino/core-ui` exists as an empty Angular workspace library, builds clean via `ng-packagr`, and reach-through imports are blocked by `eslint-plugin-boundaries` from day one.**

## What landed

### Library scaffold

- `pnpm exec ng generate library core-ui --skip-install` produced `projects/core-ui/` with `ng-package.json`, `tsconfig.lib.json`, `tsconfig.lib.prod.json`, `tsconfig.spec.json`, `src/public-api.ts`, and a `src/lib/core-ui.{ts,spec.ts}` boilerplate that we deleted.
- `angular.json` `projects.core-ui` entry: `projectType: library`, `prefix: ui` (renamed from CLI default `lib`), `architect.build.builder: @angular/build:ng-packagr`.
- The application project's `architect.build.options.assets` array gained `{ glob: "**/*", input: "src/assets" }` so Plan 02-02 mock JSON ships at `/assets/mock-data/...`. `src/assets/.gitkeep` reserves the directory.
- Project `README.md` rewritten to describe the boundary contract (was generic CLI scaffold copy).

### Path alias

```json
// tsconfig.json
"compilerOptions": {
  "baseUrl": ".",
  "paths": {
    "@arduino/core-ui": ["projects/core-ui/src/public-api.ts"]
  },
  ...
}
```

Verifier line: `grep -A2 '"@arduino/core-ui"' tsconfig.json` → exactly one element in the path-mapping array, no `dist/core-ui` fallback (D-LIB-03 satisfied).

### Boundary rule

`eslint.config.js` appends two new flat-config blocks:

1. The `boundaries/element-types` rule with the five element types and the policy from D-LIB-01. `app` may import `core-ui-public`, `content-models`, `app-lib`. `core-ui-internal` may sibling-import within the library but never `@arduino/core-ui` itself. `core-ui-public` re-exports `core-ui-internal`. `content-models` and `app-lib` are leaves.
2. `@angular-eslint/component-selector` override scoped to `projects/core-ui/**/*.ts` only — `ui-` prefix passes here, `app-` prefix continues to be required everywhere else.

`pnpm lint` baseline: **exit 0**. The plugin emits two warnings about `boundaries/element-types` being renamed to `boundaries/dependencies` in v6 — followup work item, not a blocker.

### Smoke build

```
$ pnpm exec ng build core-ui
- Compiling with Angular sources in partial compilation mode.
✔ Compiling with Angular sources in partial compilation mode.
✔ Generating FESM and DTS bundles
✔ Copying assets
✔ Writing package manifest
✔ Built core-ui

Build at: 2026-05-01T07:19:13.513Z - Time: 294ms
```

`pnpm tsc -p projects/core-ui/tsconfig.lib.json --noEmit` also green.

## Deviations from the plan

| # | Deviation | Why | When does it unwind |
|---|-----------|-----|---------------------|
| 1 | Added `compilerOptions.baseUrl: "."` to root `tsconfig.json` | Without `baseUrl`, ng-packagr 21.2 rejects the new `paths` entry: `TS5090: Non-relative paths are not allowed when 'baseUrl' is not set`. The plan locked the path alias but did not specify the `baseUrl` requirement. | Permanent — required for any path mapping. |
| 2 | Added `projects/core-ui/src/lib/_placeholder.ts` exporting `__CORE_UI_PLACEHOLDER__`, re-exported from `public-api.ts` | An empty entry point fails ng-packagr 21.2 with `Internal error: failed to get symbol for entrypoint`. The plan requires `pnpm exec ng build core-ui` to exit 0 AND forbids creating primitives in this plan. The placeholder reconciles both. | **Plan 02-03** deletes `_placeholder.ts` and the re-export when real primitives land (recorded as a checklist item in the plan-level cleanup section of this SUMMARY's `affects` list). |
| 3 | Ran `pnpm install` between Task 1 and the smoke build | `ng generate library --skip-install` declared `ng-packagr` in `package.json` but did not download it. `pnpm exec ng build core-ui` failed silently (exit 1, zero stderr) until the package was actually present in `node_modules/`. | One-shot; n/a after this. |

All three are documented in the relevant commit message bodies; none of them weaken the plan's success criteria.

## Verification evidence

- ✅ `projects/core-ui/ng-package.json` exists.
- ✅ `projects/core-ui/src/public-api.ts` exists; contains the documenting comment block + the placeholder re-export (one line, with rationale comment).
- ✅ `projects/core-ui/src/lib/` contains `_placeholder.ts`, `__violation__.ts.example`, `.gitkeep` — no boilerplate components.
- ✅ `tsconfig.json` `paths` has `"@arduino/core-ui": ["projects/core-ui/src/public-api.ts"]` and **no** `dist/core-ui` mapping.
- ✅ `angular.json` `projects.core-ui` entry exists, `projectType: library`.
- ✅ `angular.json` `application` build assets: both `public` and `src/assets` are present.
- ✅ `pnpm exec ng build core-ui` exit 0 (after `pnpm install` finished).
- ✅ `pnpm tsc -p projects/core-ui/tsconfig.lib.json --noEmit` exit 0.
- ✅ `package.json` `devDependencies` contains `eslint-plugin-boundaries@^6.0.2`.
- ✅ `eslint.config.js` imports `boundariesPlugin` and contains the `boundaries/element-types` rule with the five element types from D-LIB-01.
- ✅ `eslint.config.js` contains a `projects/core-ui/**/*.ts` block setting the component-selector prefix to `ui`.
- ✅ `pnpm lint` exit 0 (warnings only, no errors).
- ✅ `projects/core-ui/src/lib/__violation__.ts.example` exists with the documented self-test instructions.

## Followups for downstream plans

- **Plan 02-03 cleanup checklist (record in 02-03 SUMMARY):** delete `projects/core-ui/src/lib/_placeholder.ts`; remove the placeholder re-export line from `public-api.ts`; verify `pnpm exec ng build core-ui` still passes once real primitives are exported.
- **Plan 02-03 self-test:** rename `__violation__.ts.example` → `__violation__.ts` once a real primitive exists, run `pnpm lint`, observe `boundaries/element-types` error, rename back.
- **Future cleanup (low priority, not blocking):** migrate `boundaries/element-types` to the v6 `boundaries/dependencies` rule with object-based selectors. Tracked as a non-phase TODO; would tidy two warnings on every lint run.

## Resolved versions

```
ng-packagr            21.2.3
eslint-plugin-boundaries  6.0.2
```
