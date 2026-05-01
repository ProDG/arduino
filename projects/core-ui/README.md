# `@arduino/core-ui`

Editorial primitives library for the Arduino Learning Hub (Ukrainian).

## Boundary

- Consumed only via the path alias `@arduino/core-ui`. Reach-through imports
  (e.g. `@arduino/core-ui/lib/...`) are blocked by `eslint-plugin-boundaries`.
- Every primitive is a **standalone Angular component** with **signal inputs**.
  No `NgModule`s, anywhere.
- Component selectors use the `ui-` prefix (lint-enforced inside this project only).
- Co-located styles: `<name>.component.scss` next to `<name>.component.ts`.
- Reads tokens **only as `var(--…)`** — never raw SCSS variables, never new sizes
  or colors. The token system lives in `src/styles/tokens/` (Phase 1 lock).

## What lives here

Phase 2 adds the editorial primitives (`Heading`, `Body`, `Lede`, `Aside`,
`Sidenote`, `SidenoteRef`, `Figure`, `FigureCaption`, `Diff`, `Pinout`),
the layout primitives (`PageShell`, `MarginRail`, `TwoColumn`), and a single
`CodeBlock` with build-time Shiki tokenization.

## Boundary verification

A synthetic violation fixture lives at `src/lib/__violation__.ts.example`.
Rename to `.ts` to watch `pnpm lint` fail with a `boundaries/element-types`
error. Rename back to `.example` to restore a clean baseline.
