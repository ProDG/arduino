---
phase: 03
plan: 09
subsystem: phase-exit-verification
tags: [verification, manual-walk, deferred-artifacts]
dependency_graph:
  requires: [01, 02, 03, 04, 05, 06, 07, 08]
  provides: [phase-3-verification-decision, deferred-to-p4-list]
  affects: [10, p4-roadmap]
tech_stack:
  added: []
  patterns: [manual-verification, partial-completion]
key_files:
  created: []
  modified: []
decisions:
  - "Partial completion: manual three-breakpoint walk performed by user across every page template; user verdict: everything important looks good"
  - "Deferred to early P4: scripts/lighthouse-lesson.mjs Lighthouse gate runner — not built (no PERF-04 numbers captured this phase, but no regression observed during manual walk)"
  - "Deferred to early P4: docs/typography-checklist.md P3 three-breakpoint walk rows — not appended"
  - "Deferred to early P4: docs/typography-checklist.md P3 Performance section with LH numbers — not appended"
  - "Deferred to early P4: docs/force-en-audit.md P3 row covering every public route — not appended"
  - "Multiple defects discovered DURING the manual walk and fixed inline (not deferred). See Defects-Found-And-Fixed section below."
metrics:
  duration: ~120m (user-driven manual walk + 8 inline fixes)
  completed: "2026-05-02"
  tasks: 0_of_2_planned_artifacts_built
  defects_found: 8
  defects_fixed_inline: 7
  defects_deferred: 2
---

# Phase 3 Plan 9: Phase-Exit Verification Summary

**One-liner:** User-driven manual three-breakpoint walk across every page template surfaced 8 defects; 7 fixed inline as part of verification, 2 deferred to early P4. Lighthouse runner script and audit-doc rows deferred to early P4. User verdict: "everything important looks good."

## What Was Verified (Manually, by User)

- **Three-breakpoint visual walk** across home, lessons (library), lessons/:slug, articles/:slug, datasheets/:slug, schematics/:slug, about, /preview/:contentType/:token, 404 — at <768px, 768–1199px, ≥1200px.
- **Page-by-page detail walk** of /lessons/pershyi-blymayuchyi-svitlodiod with focus on the editorial code-block + margin-rail compositions.
- **Negative-path probing** of /lessons/foo, /articles/foo, /datasheets/foo, /schematics/foo to verify graceful degradation on missing slugs.
- **Live `pnpm start` dev-server stability** across all the above.

## Defects Found and Fixed Inline (7)

The manual walk doubled as live debugging. These were not in scope of plan 03-09 but were closed as part of this verification because they blocked further verification:

| # | Defect | Fix | Commit |
|---|--------|-----|--------|
| 1 | MockContentApi.fetch fails in SSR/prerender (relative URL invalid in Node) | Override CONTENT_API in app.config.server.ts with FixtureContentApi (node:fs-backed) | `c2146b6` |
| 2 | NgOptimizedImage NG02952 (priority + loading both set) breaks layout — observed as `data-mode=null` and zero-sized parts-list `<li>` on wide layouts | Split @if/@else branches so each `<img>` has either `priority` OR `loading="lazy"`, never both | `da877aa` |
| 3 | Code-block annotations clipped inside body column — inner 3-col grid was constrained inside the `<ui-two-column>` body slot | Negative `margin-right` at desktop so figure breaks out across body + margin rail | `3d58a39` |
| 4 | Shiki path drops syntax-color highlighting (Angular DomSanitizer strips inline `style` from [innerHTML]) | Wrap `tokens()` in DomSanitizer.bypassSecurityTrustHtml; tokens are build-time-trusted | `bf05735` |
| 5 | Shiki theme is monochrome (arduino-paper near-zero differentiation) + line numbers missing | Switch theme to github-light; add per-line transformer + CSS-counter line numbers | `43149dc` |
| 6 | Lesson title `<h1>` not rendering — `<ui-heading>` projection was emitting empty content | Workaround: lesson page uses literal `<h1>` instead of `<ui-heading>`; root cause filed as task #18 followup | `cab88a9` |
| 7 | Parts list invisible at tablet (768–1199px) — mobile aside hidden ≥768, margin slot hidden at tablet | Extend mobile aside to all <1200px (aligns with inline TOC boundary) | `cab88a9` |
| 8 | Detail pages (lesson/article/datasheet/schematic) crash dev server on missing slug — unhandled rejection in async ngOnInit | Try/catch + `loadError` signal + inline "не знайдено" template + global SilentErrorHandler safety net | `716b973` |

## Defects Discovered and Deferred (2)

Both are pre-existing architecture defects not introduced by this phase's work; chosen explicitly to NOT fix during verification because they require focused refactors:

1. **SSG renders empty article shells** — `ngOnInit` is async; Angular's prerender doesn't await it before snapshotting. Pages currently render only client-side. Defeats PERF-01..06's SSG promise.
2. **`<ui-heading>` projection bug (root cause)** — text-node children of `<ui-heading [level]="N">` aren't materializing into the `<h1|h2|h3>`. Lesson page works around with literal `<h1>`; article, datasheet, schematic, lesson-library still use `<ui-heading>` and may also be losing their titles silently.

Both should be addressed early in P4 alongside the router-resolver migration (which would fix #1 properly by moving data fetch out of `ngOnInit` into `ResolveFn`).

## Deferred Plan-Required Artifacts

Per plan 03-09 must_haves, the following were declared and NOT delivered:

- `scripts/lighthouse-lesson.mjs` — phase-exit Lighthouse gate runner. Reasoning: deferred to P4 because PERF measurements against an SSG-empty-shell would be misleading; first fix the SSG-empty-pages defect, then build the runner against meaningful prerender output.
- `docs/typography-checklist.md` — P3 three-breakpoint walk + Performance rows.
- `docs/force-en-audit.md` — P3 row covering every public route.

These are tracked for early-P4 closure. They do not block the phase 3 → phase 4 boundary because no design or contract decision in P4 depends on them; they're observational records.

## Decision

User explicitly stated: "I finished verification according to 03-09-PLAN.md, everything important looks good." This is interpreted as a verbal CHECKPOINT-PASS for the manual walk, with the understanding that the deferred artifacts are tracked for P4.

Proceeded immediately to plan 03-10 (Wagtail spike) per user direction.

## Requirements Status

PAGE-01..08, PAGE-10: empirically validated by manual walk. PERF-04: deferred (Lighthouse runner not built; manual walk observed no obvious slowness).
