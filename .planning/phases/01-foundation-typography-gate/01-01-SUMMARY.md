---
phase: 01-foundation-typography-gate
plan: 01
status: complete
completed: 2026-05-01
---

# Plan 01-01 — Angular scaffold + tooling — SUMMARY

## What landed

- Angular **21.2.x** application scaffolded via `pnpm dlx @angular/cli@21 new`, then
  reconfigured for SSG-only.
- **Zoneless** change detection (`provideZonelessChangeDetection()`) from day one.
- `outputMode: "static"` in `angular.json` — SSG only. Pure prerendered HTML;
  the server bundle is dropped from `dist/` by the builder. Build-time `main.server.ts`
  exists solely so Angular can evaluate routes — `dist/arduino-hub/server/` does **not**
  exist after `pnpm build`.
- `<html lang="uk">` set in both `src/index.html` and the prerendered HTML for `/`
  and `/dev/glyph-audit` (verified via grep on built artifact).
- `provideClientHydration` intentionally **not** registered (D-26).
- `<meta name="robots" content="noindex">` is set on `/dev/glyph-audit` via the
  Angular `Meta` service in `GlyphAuditComponent.ngOnInit`.
- Two routes registered (D-25): `/` (HomeComponent, locked Ukrainian copy from
  UI-SPEC) and `/dev/glyph-audit` (placeholder; PLAN 05 fills sections 1/2/3).

## Tooling versions (locked)

| Tool      | Version       | Notes                                                         |
| --------- | ------------- | ------------------------------------------------------------- |
| pnpm      | `10.33.2`     | `packageManager` field pinned; `pnpm-lock.yaml` committed     |
| Node      | engines TBD   | corepack-managed pnpm; tested on Node 24                       |
| Angular   | `^21.2.0`     | core, common, compiler, forms, platform-browser, router, ssr  |
| ESLint    | `^9.16.0`     | flat config; `angular-eslint@^21`, `typescript-eslint@^8`     |
| Stylelint | `^16.10.0`    | `stylelint-config-standard-scss@^14`                          |
| Prettier  | `^3.8.1`      | + `prettier-plugin-organize-imports@^4`                       |
| Vitest    | `^4.0.8`      | `vitest run --passWithNoTests` until first spec lands         |
| TypeScript| `~5.9.2`      | scaffold default                                              |

## Folder layout established

```
src/
  app/
    pages/home/                 (HomeComponent — Ukrainian root copy)
    pages/glyph-audit/          (placeholder; PLAN 05 fills)
    app.component.ts/html/scss  (router-outlet shell)
    app.config.ts               (provideRouter + zoneless; LOCALE_ID TODO PLAN 04)
    app.config.server.ts        (build-time only — see header)
    app.routes.ts               (two routes)
    app.routes.server.ts        (RenderMode.Prerender for **)
  index.html                    (lang="uk", font preload slot for PLAN 03)
  lib/                          (.gitkeep — PLAN 04 adds intl.ts)
  main.ts                       (bootstrap)
  main.server.ts                (build-time only)
  styles/
    main.scss                   (aggregator with PLAN 03 placeholders)
    tokens/                     (.gitkeep — PLAN 03 fills)
    base/                       (.gitkeep — PLAN 03 fills)
public/fonts/                   (.gitkeep — PLAN 02 fills with woff2)
scripts/fonts/                  (.gitkeep — PLAN 02 fills with subset.mjs)
docs/                           (.gitkeep — PLAN 06 fills with audit + checklist)
fonts-source/                   (gitignored; PLAN 02 may use)
```

## Build / test gates verified

- `pnpm install --frozen-lockfile` — succeeds.
- `pnpm build` — produces `dist/arduino-hub/browser/` with prerendered
  `index.html` and `dev/glyph-audit/index.html`. Both have `lang="uk"`.
  `Prerendered 2 static routes.`
- `pnpm lint` — eslint + stylelint pass on the scaffold (no rules tightened yet).
- `pnpm test` — vitest runs (no specs yet; passes with `--passWithNoTests`).
- `pnpm format:check` — Prettier clean across the tree.
- No `server.mjs`, no `server/` folder in `dist/` — SSG-only confirmed.

## Notes / deviations

- **Vitest is run via `vitest run --passWithNoTests`.** No `@analogjs/vitest-angular`
  preset — Angular 21 ships its own first-party Vitest builder via
  `@angular/build:unit-test` (used in the `architect.test` target). The plan
  mentioned `@analogjs/vitest-angular` from STACK.md §2; the first-party builder
  supersedes that guidance for v21 and is what `ng new --ssr` produces. First
  spec(s) will land in PLAN 04 (`src/lib/intl.spec.ts`).
- **`@eslint/js` was added as a devDep** — required by the flat-config
  `eslint.configs.recommended` import. Not in the plan's listed devDeps but
  necessary for the rule body the plan asks for.
- **Removed `express` and `@types/express`** from generated package.json — they
  are runtime SSR deps, irrelevant under `outputMode: "static"`. Also removed
  the generated `serve:ssr:arduino-hub` npm script.
- **Re-added `src/main.server.ts`, `src/app/app.config.server.ts`,
  `src/app/app.routes.server.ts`** after the initial pass deleted them. Angular 21's
  `outputMode: "static"` requires a server entry to evaluate the route config at
  build time, but the builder strips the resulting server bundle from `dist/`
  (`ignoreServer: true` for `OutputMode.Static`). The header in `main.server.ts`
  documents this. **No Node SSR runtime ever ships** — the project's hard
  constraint is preserved.
- **`prerender-routes.txt` was tried then removed** — once `outputMode: "static"`
  + `server` are set, Angular auto-discovers routes via the server entry and
  `ServerRoute[]` config; explicit routesFile is ignored.
- **`packageManager: "pnpm@10.33.2"`** rather than the doc-suggested `pnpm@10.0.0`
  — corepack already pinned 10.33.2, and matching the live version avoids
  CI vs local drift.

## Open hand-offs

| To plan | Hand-off |
| --- | --- |
| **PLAN 02** | `public/fonts/` and `scripts/fonts/` directories created and empty; `fonts-source/` gitignored. `.planning/phases/01-foundation-typography-gate/fontaine-metrics.json` is the agreed sidecar location. |
| **PLAN 03** | `src/styles/main.scss` aggregator has `// @use './tokens';` and `// @use './base/base';` commented placeholders ready to uncomment. `src/index.html` has `<!-- font preloads injected in PLAN 03 -->` comment marking the preload slot. Two-tier token approach (D-02) ready to fill. |
| **PLAN 04** | `src/app/app.config.ts` has TODO comment `// LOCALE_ID + registerLocaleData added in PLAN 04 (UKR-01)` at the providers array. `eslint.config.js` has TODO referencing PLAN 04 / UKR-06 / D-28 for the bare-locale-formatter ban. `src/lib/` directory ready for `intl.ts`. |
| **PLAN 05** | `/dev/glyph-audit` route registered, component placeholder ships `noindex`. `verification-string.const.ts` and `specimen-prose.const.ts` not yet created — PLAN 05 owns them. |
| **PLAN 06** | `docs/` directory ready; `pre-commit`, gitleaks, GitHub Actions all not yet wired — PLAN 06 owns them. |

## Files committed in this plan

See `git log -1 --stat` after the commit. Sentinel files added:

- All under `src/`, `public/`, `scripts/`, `docs/` per the directory layout above.
- Root: `package.json`, `pnpm-lock.yaml`, `angular.json`, `tsconfig*.json`,
  `eslint.config.js`, `.stylelintrc.json`, `.prettierrc.json`, `.prettierignore`,
  `.npmrc`, `.gitignore`, `.editorconfig`, `README.md`.
- `.vscode/` and `public/favicon.ico` from the Angular CLI scaffold (kept).

## Requirements progressed

- **TYPE-10** — *Toolchain locked* — pnpm 10, ESLint 9, Stylelint 16, Prettier 3,
  Vitest 4 wired and runnable; lockfile committed.
