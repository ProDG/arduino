# Arduino UA — Editorial-quality Ukrainian Arduino learning hub

An editorial-quality Ukrainian-language Arduino learning website. Lessons, articles,
schematics, and datasheets — typeset like a book. Frontend-first build with mocked
data (Angular 21 + SCSS, SSG only); a Wagtail 7.4 LTS backend running in Docker
conforms to the locked frontend contract in later phases.

Design and typography are the product, not decoration.

## Local dev

Requirements: Node 22+, pnpm 10 (via `corepack enable && corepack prepare pnpm@10 --activate`).

```bash
pnpm install            # installs deps from frozen lockfile in CI; locally generates one
pnpm dev                # ng serve on http://localhost:4200/
pnpm build              # static SSG build → dist/arduino-hub/browser/
pnpm test               # vitest run
pnpm lint               # eslint + stylelint
pnpm format             # prettier --write .
pnpm format:check       # prettier --check .
```

## Routes (Phase 1)

- `/` — placeholder root page.
- `/dev/glyph-audit` — typography + glyph + locale verification harness (PLAN 05).

## Planning + workflow

This repo uses the GSD workflow. See `.planning/ROADMAP.md` for phases and
`.planning/PROJECT.md` for goals and constraints. `CLAUDE.md` documents hard
project constraints (Ukrainian only, no Tailwind, no Node SSR runtime ever).
