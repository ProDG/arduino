---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready for `/gsd-plan-phase 1`
last_updated: "2026-04-30T15:34:43.366Z"
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Arduino Learning Hub (Ukrainian)

**Initialized:** 2026-04-30
**Mode:** yolo
**Granularity:** coarse

## Project Reference

- **Core value:** Reading and learning here feels as good as reading a beautifully typeset book — design, typography, and visual structure are the primary product.
- **Stack:** Angular 21 (zoneless, Signal Forms, Vitest) + SCSS + self-hosted variable woff2 (Source Serif 4 + Inter + JetBrains Mono, Pairing A) + Wagtail 7.4 LTS (post 2026-05-04) + Django 5.2 LTS + PostgreSQL 17 + Caddy + gunicorn + systemd on a single Ubuntu 24.04 VPS.
- **Build order:** FE-first with mocked data → contract lockdown → SSG-only static build → Wagtail BE conforms to FE contract → VPS deploy → content + polish.
- **Rendering strategy:** SSG (`outputMode: "static"`) for v1 — no Node SSR runtime; CSR-only `/preview/*`.
- **Language:** Ukrainian only, no i18n architecture.

## Current Position

- **Milestone:** v1 (initial release)
- **Phase:** Not started — roadmap just created
- **Next phase:** Phase 1 — Foundation & Typography Gate
- **Plan:** None active
- **Status:** Ready for `/gsd-plan-phase 1`
- **Progress:** 0 / 6 phases complete (0%)

```
[          ] 0/6 phases
```

## Performance Metrics

- Phases completed: 0
- Plans completed: 0
- Requirements shipped: 0 / 76

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

### Active Todos

(None — phase planning has not started)

### Blockers

- **Phase 4 cannot start before 2026-05-04** (Wagtail 7.4 LTS release date). Phases 1–3 are unblocked and can proceed immediately.

### Open Questions (deferred to phase planning)

- Final Source Serif 4 vs Literata A/B test in real two-column layout — revisit at Phase 6.
- Margin-annotation CSS alignment across breakpoints — may warrant `/gsd-research-phase` on CSS `anchor-name` / `position-anchor` at start of Phase 3.
- "Universal Listings API" in Wagtail 7.4 — verify against final 2026-05-04 release notes; default to `/api/v2/pages/`.
- `pillow-avif-plugin` longevity — re-check at Phase 4; switch to native Pillow AVIF if available.
- Preview UX with Wagtail 7.4 autosave — measure in Phase 4; if broken without SSR, revisit SSG-only resolution and selectively graduate `/preview/*` to per-route SSR.

## Session Continuity

- **Last session:** --stopped-at
- **Files just written:** `.planning/ROADMAP.md`, `.planning/STATE.md`, traceability table updated in `.planning/REQUIREMENTS.md`.
- **Next action:** `/gsd-plan-phase 1` — plan Phase 1 (Foundation & Typography Gate).

---
*State initialized: 2026-04-30*
