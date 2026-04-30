# CLAUDE.md — Arduino Learning Hub (Ukrainian)

This file is read by Claude Code at the start of every session in this repo. Keep it concise and current.

## Project

Editorial-quality Ukrainian-language Arduino learning website. Lessons, articles, schematics, datasheets. **Design and typography are the product**, not decoration — inspired by the official Arduino Starter Kit book. Built FE-first with mocked data (Angular 21 + SCSS), then a Wagtail 7.4 LTS backend conforms to the locked frontend contract. Single self-hosted VPS. Ukrainian only — no i18n.

**Core value:** Reading and learning here feels as good as reading a beautifully typeset book.

## GSD Workflow

This project uses Get Shit Done (GSD) for planning and execution. Key files in `.planning/`:

- `PROJECT.md` — project context, requirements, key decisions
- `REQUIREMENTS.md` — 76 v1 requirements across 11 categories, with phase traceability
- `ROADMAP.md` — 6 coarse phases, FE-first build order
- `research/` — STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md
- `STATE.md` — current phase / plan focus
- `config.json` — workflow settings (mode: yolo, granularity: coarse, model: quality)

**Workflow commands:**

- `/gsd-progress` — see where we are and what's next
- `/gsd-plan-phase N` — plan a phase (creates PLAN.md)
- `/gsd-execute-phase N` — execute the planned phase
- `/gsd-discuss-phase N` — gather context before planning
- `/gsd-ui-phase N` — generate UI design contract for phases marked `UI hint: yes` (P1, P2, P3, P6)

## Stack (locked)

- **Frontend:** Angular 21.2.x (zoneless, Signal Forms, Vitest), SCSS (no Tailwind), `@angular/ssr` with `outputMode: "static"` (pure SSG, no Node SSR runtime in v1)
- **Typography:** Source Serif 4 (body) + Inter (UI) + JetBrains Mono (code), self-hosted variable woff2, subset Cyrillic + Cyrillic-Ext, Fontaine fallback metrics
- **Code rendering:** Shiki at build-time with `@shikijs/transformers` for diff and line-anchored margin annotations
- **Backend:** Wagtail 7.4 LTS (releases 2026-05-04) + Django 5.2 LTS + Python 3.13 + PostgreSQL 17 + psycopg 3.2; REST API v2 (NOT wagtail-grapple); `wagtail-headless-preview`
- **Tooling:** pnpm 10 + ESLint 9 + Stylelint 16 (FE); uv + Ruff + mypy + pytest (BE); pre-commit + gitleaks
- **Deployment:** Single Ubuntu 24.04 VPS — Caddy 2.8+ (auto-TLS) + gunicorn 23 + systemd + PostgreSQL on UNIX socket. No Docker, no Node SSR service.

## Hard constraints

- **Ukrainian only.** No i18n infrastructure ever. `<html lang="uk">`, `LOCALE_ID = 'uk-UA'`, `TIME_ZONE = 'Europe/Kyiv'`, `LANGUAGE_CODE = 'uk'`. No `toLocaleDateString()` without explicit `'uk-UA'`. Force-en browser audit at every phase exit.
- **Cyrillic-Ext required.** All fonts must ship `ґ` (U+0490/U+0491) and have it verified visually in regular, italic, bold, bold-italic. Google Fonts default `cyrillic` subset omits `ґ` — always include `cyrillic-ext`.
- **Real Ukrainian prose for design calibration.** Never Lorem Ipsum. Measure, drop caps, headings calibrate wrong on Latin filler.
- **Ragged-right body**, no `text-align: justify`, no `hyphens: auto` — Ukrainian browser hyphenation isn't reliable.
- **No Tailwind.** Hand-authored SCSS with token system; component styles co-locate, only `styles/tokens/` and `styles/base/` are global.
- **Frontend owns the contract.** TypeScript content models in `content/models/*.ts` are locked first; Wagtail StreamField shapes match them, not the inverse.
- **No Node SSR runtime in v1.** SSG only. `/preview/*` runs CSR-only. Revisit only if Wagtail 7.4 autosave preview UX demands SSR.
- **Backups before content.** Restore drill executed end-to-end before a single piece of real content is published.

## Out of scope (don't propose these without explicit user request)

Tailwind, Google Fonts CDN, Material Design, Docker, GraphQL/wagtail-grapple, dark mode in v1, justified body, search, reader accounts, comments, circuit simulator, code execution, i18n, card-grid library index, CDN front, English month names anywhere.

## Coding conventions

- Default to writing **no comments**. Only add a comment when the WHY is non-obvious.
- Prefer editing existing files to creating new ones.
- Match existing patterns in this repo before inventing new ones.
- For UI changes, verify on real Ukrainian prose at all three breakpoints (<768 / 768–1199 / ≥1200).
- Commit messages: lowercase imperative summary; reference REQ-IDs where relevant.

---
*Last updated: 2026-04-30 after project initialization*
