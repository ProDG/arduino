# Phase 04 — Deferred Items

Tracked here so they don't fall on the floor; addressed in P5/P6 polish or earlier as warranted.

## From plan 04-07

- **Task 3 (manual editor walkthrough)**: Docker daemon was unavailable in the parallel-executor sandbox. Live click-through (admin login → edit draft → click Preview → see content) deferred to a Docker-enabled verifier, ideally bundled with the next phase-exit verification of P4 (or scheduled as a standalone step before P5 begins). Verification recipe is in `04-07-PLAN.md` Task 3 `<how-to-verify>`.

- **`pnpm test` (Angular `unit-test` builder)** fails at compile time across many specs (e.g. `app.routes.spec.ts`, `block-renderer.component.spec.ts`, `site-footer.component.spec.ts`, `preview-stub.page.spec.ts`) with `TS2304 Cannot find name '__dirname'` and `TS2307 Cannot find module 'node:fs'`. This is a pre-existing baseline failure (verified via `git stash` baseline run on commit 2ce4762a) — `tsconfig.spec.json` declares `types: ["vitest/globals"]` which replaces (not extends) Node's default types when the Angular @angular/build:unit-test compiler kicks in. **Direct vitest invocation works**: `npx vitest run src/app/pages/preview-stub/preview-stub.page.spec.ts` → 7/7 PASS for the new spec contract. The Angular-runner-level fix (likely add `"node"` to `tsconfig.spec.json` types or split the source-file specs into their own non-Angular target) is a tooling concern, not a content concern, and is out of scope for plan 04-07.

- **`pnpm contract:diff` re-run after the mixin** (acceptance criterion in 04-07): requires the Docker stack up + seeded fixtures. Deferred to the same Docker-enabled verifier session as the manual editor walkthrough. Static analysis: `HeadlessPreviewMixin` adds no fields and the new `get_preview_url` override does not affect the API serializer; no contract regression is structurally possible from these edits.
