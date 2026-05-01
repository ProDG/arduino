---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready for `/gsd-plan-phase 2`
last_updated: "2026-05-01T07:12:36.215Z"
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 12
  completed_plans: 6
  percent: 50
---

# State: Arduino Learning Hub (Ukrainian)

**Initialized:** 2026-04-30
**Mode:** yolo
**Granularity:** coarse

## Project Reference

- **Core value:** Reading and learning here feels as good as reading a beautifully typeset book — design, typography, and visual structure are the primary product.
- **Stack:** Angular 21 (zoneless, Signal Forms, Vitest) + SCSS + self-hosted variable woff2 (Source Serif 4 + Inter + JetBrains Mono, Pairing A) + Wagtail 7.4 LTS (post 2026-05-04) + Django 5.2 LTS + PostgreSQL 17 + MinIO (S3-compatible) + Traefik (auto-TLS) running in Docker Compose on a single Ubuntu 24.04 VPS.
- **Build order:** FE-first with mocked data → contract lockdown → SSG-only static build → Wagtail BE in Docker conforms to FE contract → Dockerized VPS deploy → content + polish.
- **Rendering strategy:** SSG (`outputMode: "static"`) — no Node SSR ever; CSR-only `/preview/*`.
- **Language:** Ukrainian only, no i18n architecture.

## Current Position

- **Milestone:** v1 (initial release)
- **Phase:** 01 — Foundation & Typography Gate — **COMPLETE** (closed 2026-05-01, user-approved)
- **Next phase:** Phase 2 — Primitives (`Heading`, `Body`, `CodeBlock`, `TwoColumn`, `Sidenote`, etc.)
- **Plan:** None active
- **Status:** Ready for `/gsd-plan-phase 2`
- **Progress:** 1 / 6 phases complete (17%)

```
[█▒▒▒▒▒▒▒▒▒] 1/6 phases
```

## Phase 1 — Foundation & Typography Gate — closed

All five Phase 1 success criteria verified PASS. Foundation locked.

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | Glyph matrix renders Ukrainian critical glyphs (`і ї є ґ Ї Є Ґ ʼ`) across 12 cells (3 families × 4 styles); italic Cyrillic real, no tofu | User-approved visual checkpoint at PLAN 05; `docs/typography-checklist.md` Phase 1 run record |
| 2 | Real-prose specimen ~62ch, ragged-right, no FOIT, CLS<0.05 | `docs/typography-checklist.md` Specimen checks |
| 3 | Single-file font-pairing swap | `.planning/phases/01-foundation-typography-gate/font-swap-dry-run.md` — `TYPE-06 holds` |
| 4 | `<html lang="uk">`, `LOCALE_ID = 'uk-UA'`, force-en regression clean | `docs/force-en-audit.md` Phase 1 run record (10/10 PASS) |
| 5 | `.env` gitignored, gitleaks pre-commit installed and tested, force-en doc filled and run once | gitleaks blocked an AKIA-pattern key; `docs/force-en-audit.md` Phase 1 run record |

**Commits (8):** `3c56b19` scaffold → `6297fdb` font pipeline → `f938219` SCSS tokens + base → `4b18d7f` locale + intl → `1956c16` glyph-audit harness → `5ba8307` CI + security + phase-exit docs → `2076ea4` CI fix (drop pnpm version, opt actions to Node 24). Plus two `chore:` commits dropping stale `.gitkeep` files.

**Requirements shipped:** TYPE-01..10, UKR-01, UKR-04, UKR-05, UKR-06 (14 / 78).

## Performance Metrics

- Phases completed: 1
- Plans completed: 6
- Requirements shipped: 14 / 78

## Accumulated Context

### Key Decisions Logged

| Decision | Where | Rationale |
|----------|-------|-----------|
| FE-first with mocked data, BE second | PROJECT.md | Lock design quality without CMS data model leaking into UI decisions |
| Angular 21 zoneless + SCSS, no Tailwind | PROJECT.md | Editorial design wants bespoke CSS |
| Wagtail 7.4 LTS for BE | PROJECT.md | LTS support window + autosave; phase scheduled post 2026-05-04 |
| Ukrainian only, no i18n architecture | PROJECT.md | Explicit scope decision |
| Single VPS hosting | PROJECT.md | Cost + control; small audience scale |
| SSG-only for v1 (no Node SSR) | research/SUMMARY.md | Eliminates a failure surface; CSR-only preview is acceptable v1 |
| Pairing A: Source Serif 4 + Inter + JetBrains Mono | research/STACK.md | Verified Ukrainian glyph quality incl. ґ across all weights |
| Light-only theme in v1 | research/PITFALLS.md | Dark mode = parallel design language, not token swap; defer to v2 |
| Ragged-right body, no auto-hyphenation | research/PITFALLS.md | Sidesteps unreliable Ukrainian browser hyphenation |
| REST API v2, not wagtail-grapple | research/STACK.md | Fewer moving parts; built-in; matches contract |
| Docker Compose for BE in dev AND prod (Wagtail + Postgres + MinIO + Traefik + FE-static); FE dev on host | PROJECT.md, CLAUDE.md | Same-backend dev/prod parity catches storage/networking bugs early; FE dev runs `pnpm start` on host for fast iteration. Locked 2026-05-01. |
| Traefik (containerized) for reverse proxy + Let's Encrypt auto-TLS | PROJECT.md, research/STACK.md §4 | Docker-native, label-driven routing; replaces host-level Caddy; integrates with Compose. Locked 2026-05-01. |
| MinIO (S3-compatible, containerized) for media + Wagtail renditions + collectstatic | PROJECT.md, REQUIREMENTS.md WAGTAIL-09 | `django-storages[s3]` + `boto3`; same backend dev/prod (different bucket); off-site backup via `mc mirror` to B2; prevents disk-fill from media taking down Postgres. Locked 2026-05-01. |
| SSG-only — no Node SSR EVER (upgraded from "v1 only") | PROJECT.md, CLAUDE.md, research/SUMMARY.md | Wagtail REST API v2 → Angular consumes (build-time prerender + CSR for `/preview/*`). Preview ergonomics solved via CSR autosave-polling, NOT SSR. Locked 2026-05-01. |
| Backups: `pg_dump → restic` + `mc mirror`, both off-site to B2 | REQUIREMENTS.md DEPLOY-04, research/STACK.md §4 | Different shapes (relational vs blob) warrant different tools. Restore drill before content publish. Locked 2026-05-01. |
| Phase 1: `_typography.scss` is the single-file font-pairing swap target | 01-CONTEXT.md D-03, font-swap-dry-run.md | Proven by dry-run (TYPE-06). Future font A/B (e.g., Source Serif 4 vs Literata in Phase 6 polish) edits this file only. |
| Phase 1: `src/lib/intl.ts` is the only Intl.* call site | 01-CONTEXT.md D-28, force-en-audit.md "Intl wrapper policy" | Bare `toLocale*` blocked by no-restricted-syntax ESLint rule + synthetic violation fixture. Audited zero violations on phase exit. |
| Phase 1: Source Serif 4 ships with `opsz` axis (380KB ceiling, not 250KB) | 01-02-SUMMARY.md | The `opsz` axis is the editorial driver of this project (body vs display optical sizing); dropping it to fit a heuristic ceiling would amputate the design intent. Inter / JBM keep tighter ceilings. |

### Active Todos

(None — Phase 1 closed; ready for Phase 2 planning.)

### Blockers

- **Phase 4 cannot start before 2026-05-04** (Wagtail 7.4 LTS release date). Phases 2–3 are unblocked and can proceed immediately.

### Open hand-offs

- **CI verified green on first push.** First-push failures (pnpm version conflict + Node 20 deprecation warning) were filed as commit `2076ea4` and re-pushed; user confirmed `phase 1 approved`. Hand-off closed.
- **Phase 2 — Primitives — will be tested against the harness page.** Any primitive whose typography drifts from `/dev/glyph-audit` is wrong. The two phase-exit checklists (`docs/force-en-audit.md` and `docs/typography-checklist.md`) accumulate scope per phase — Phase 2 must add primitive-specific items.

### Open Questions (deferred to phase planning)

- Final Source Serif 4 vs Literata A/B test in real two-column layout — revisit at Phase 6.
- Margin-annotation CSS alignment across breakpoints — may warrant `/gsd-research-phase` on CSS `anchor-name` / `position-anchor` at start of Phase 3.
- "Universal Listings API" in Wagtail 7.4 — verify against final 2026-05-04 release notes; default to `/api/v2/pages/`.
- `pillow-avif-plugin` longevity — re-check at Phase 4; switch to native Pillow AVIF if available.
- Preview UX with Wagtail 7.4 autosave — measure in Phase 4; SSG is locked, so any preview ergonomics issues will be solved with CSR autosave-polling against the preview-token endpoint, not by introducing SSR.

## Session Continuity

- **Last session:** --stopped-at
- **Files just written:** `.planning/phases/01-foundation-typography-gate/01-{01..06}-SUMMARY.md`, `font-swap-dry-run.md`, `docs/force-en-audit.md`, `docs/typography-checklist.md`, full Angular SSG app + woff2 pipeline + tokens + harness.
- **Next action:** `/gsd-plan-phase 2` — plan Phase 2 (Primitives).

---
*State initialized: 2026-04-30 — Phase 1 closed: 2026-05-01.*

**Planned Phase:** 2 (primitives-two-column-layout-page-model-contract) — 6 plans — 2026-05-01T07:12:36.211Z
