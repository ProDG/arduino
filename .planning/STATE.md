---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: phase_closed_with_debt
last_updated: "2026-05-02T09:30:00.000Z"
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 22
  completed_plans: 22
  percent: 100
known_debt:
  count: 5
  blocks_milestone_exit: true
  ids: [KD-01, KD-02, KD-03, KD-04, KD-05]
---

# State: Arduino Learning Hub (Ukrainian)

**Initialized:** 2026-04-30
**Mode:** yolo
**Granularity:** coarse

## Project Reference

- **Core value:** Reading and learning here feels as good as reading a beautifully typeset book — design, typography, and visual structure are the primary product.
- **Stack:** Angular 21 (zoneless, Signal Forms, Vitest) + SCSS + self-hosted variable woff2 (Source Serif 4 + Inter + JetBrains Mono, Pairing A) + Wagtail 7.3 (post 2026-05-04) + Django 5.2 LTS + PostgreSQL 17 + MinIO (S3-compatible) + Traefik (auto-TLS) running in Docker Compose on a single Ubuntu 24.04 VPS.
- **Build order:** FE-first with mocked data → contract lockdown → SSG-only static build → Wagtail BE in Docker conforms to FE contract → Dockerized VPS deploy → content + polish.
- **Rendering strategy:** SSG (`outputMode: "static"`) — no Node SSR ever; CSR-only `/preview/*`.
- **Language:** Ukrainian only, no i18n architecture.

## Current Position

Phase: 03 (page-templates-routing-static-build) — **CLOSED WITH KNOWN DEBT** (option C)
Plan: None active

- **Milestone:** v1 (initial release)
- **Phase:** 03 — Page Templates, Routing & Static Build — **CLOSED 2026-05-02 with known-debt disclaimer**
- **Next phase:** Phase 4 — Wagtail backend (Docker)
- **Plan:** None active
- **Status:** Phase 3 closed; ready to plan Phase 4
- **Progress:** [█████░░░░░] 3/6 phases

```
[███▒▒▒] 3/6 phases
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

## Phase 2 — Primitives, Two-Column Layout & Page-Model Contract — closed

All five Phase 2 success criteria verified PASS. `core-ui` library, layout primitives, content-model contract, and `/dev/primitives` showcase locked.

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | Every primitive renders on `/dev/primitives` consumed only via `@arduino/core-ui` | User-approved visual checkpoint at PLAN 02-06; `02-06-SUMMARY.md` |
| 2 | Three-breakpoint TwoColumn + sidenote behavior PASSes | `docs/typography-checklist.md` Phase 2 run record (ALL PASS at <768 / 768–1199 / ≥1200) |
| 3 | CodeBlock basic / diff / annotated PASS | typography-checklist.md P2 CodeBlock rows ALL PASS; Plan 02-05 DOM-test for copy interaction green |
| 4 | `MockContentApi` wired end-to-end via DI; page resolves a `Lesson` at runtime | `provideContentApi()` in `app.config.ts`; `02-06-SUMMARY.md` build-verification block |
| 5 | UKR-02/03 reframed per D-PRE-05: editorial-smell + content-gate lint clean on every fixture; force-en audit PASS | `node scripts/lint-fixtures.mjs` → `7 fixtures clean`; `docs/force-en-audit.md` Phase 2 row **ALL PASS** |

**Commits (Plan 02-06 chain, latest 7):** `a850d4a` showcase wiring → `420403a` P2 doc-section append → `27f5341` MockContentApi asset-path fix → `d4be5d5` editorial SVG placeholders → `f849770` PageMaker-style placeholder refinement → `bb7d38a` Figure #2 demote-from-bleed → `f5684e1` tick P2 audit rows. Plus the per-plan summaries `02-{01..06}-SUMMARY.md`.

**Requirements shipped:** PRIM-01..08, LAYOUT-01..05, CONTRACT-01, CONTRACT-03, CONTRACT-04, UKR-02, UKR-03 (18 / 78).

## Phase 3 — Page Templates, Routing & Static Build — closed with known debt

10 plans across 8 waves shipped. All 4 page templates (Lesson, Article, Datasheet, Schematic) plus library/home/about/404/preview-stub built; routes wired with getPrerenderParams; Shiki integrated at build time with line numbers + github-light theme; NgOptimizedImage in Figure/Pinout; CONTRACT-02 Wagtail spike PASS (FE Block model immutable across P3→P4).

**Verifier verdict:** `gaps_found`, 12/17 must-haves verified. Phase closed under **option C** (known-debt disclaimer; gaps roll into milestone-end review). See `03-VERIFICATION.md` for the full report.

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | All 9 page templates render correctly at runtime (manual three-breakpoint walk) | User PASS verdict 2026-05-02; `03-09-SUMMARY.md` |
| 2 | Build emits pure static `dist/browser/`; no `dist/server/` runtime; no Shiki bytes in client bundle | `03-07-SUMMARY.md`; verifier confirmed |
| 3 | All 11 routes wired via Angular Router; `/preview/*` is RenderMode.Client | `app.routes.ts`, `app.routes.server.ts` |
| 4 | CONTRACT-02 — Wagtail 7.3 StreamField spike PASS; FE Block model unchanged | `wagtail-spike-report.md`; CONTRACT-02 closed |
| 5 | BlockRenderer dispatcher routes all 10 Block variants to core-ui primitives | `block-renderer.component.ts` (PAGE-10) |
| ~ | **PERF-01..06 SSG meaningful prerender** | ❌ KNOWN DEBT: dynamic-slug pages prerender as empty shells (async ngOnInit not awaited) |
| ~ | **`<ui-heading>` projection** | ❌ KNOWN DEBT: text-node children not materializing into h1/h2/h3 |
| ~ | **PERF-04 Lighthouse gate runner** | ❌ KNOWN DEBT: not built (deferred until SSG fix) |
| ~ | **Audit doc P3 rows** | ❌ KNOWN DEBT: `docs/typography-checklist.md` and `docs/force-en-audit.md` P3 sections empty |

**Commits:** 31 plan commits + 8 inline-fix commits during manual verification + 1 SUMMARY for 03-09 + 1 phase-closure record. Ranges: `61ed000`..`88fc989` for plans 01-08; `c2146b6`..`716b973` for inline fixes; `3ee24cd`..`ffdc96e` for plan 10; `2fdff70` for 03-09 SUMMARY; this commit for closure.

**Requirements shipped:** PAGE-01..11, PAGE-10, CONTRACT-02 (12 / 78). PERF-01..06 deferred to known-debt remediation.

## Known Debt — to remediate before milestone v1.0 ships

These items were explicitly accepted at Phase 3 close (option C). They MUST be remediated before v1.0 ships — they are entries on the milestone-exit checklist, not optional polish.

### KD-01 — Dynamic-slug pages prerender as empty shells (PERF-01..06 functionally unmet)

**What:** Lesson, Article, Datasheet, Schematic, Home, and Lesson-Library pages all use `async ngOnInit` to fetch data via `CONTENT_API`. Angular's prerender does not await `ngOnInit` before snapshotting the DOM, so the static HTML output for `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug`, `/`, and `/lessons` contains a `*-loading` empty shell. Pages only render via client-side bootstrap.

**Why this is debt, not a paper cut:** SSG meaningful-prerender is the editorial value of the project per CLAUDE.md ("typography is the product, not decoration"). First-paint UX and SEO indexing both see the empty shell. Visiting `/lessons/x` in a fresh tab flashes blank for ~150-300ms before client-side render fills the article.

**Fix shape:** Migrate each page's data fetch from `async ngOnInit` to an Angular `ResolveFn` (router resolver). Resolvers ARE awaited by Angular's prerender. Touches `app.routes.ts`, `app.routes.server.ts`, plus the 6 page components. ~1-2 plans of focused work.

**Verifier evidence:** `dist/arduino-hub/browser/lessons/pershyi-blymayuchyi-svitlodiod/index.html` contains `<article class="lesson-page lesson-page--loading"><!--container--></article>` with no body content.

### KD-02 — `<ui-heading>` text-node projection silently drops content

**What:** `<ui-heading [level]="N">{{ text }}</ui-heading>` renders as an empty `<h1|h2|h3>` element in prerendered HTML. Lesson page works around with a literal `<h1>`; Article, Datasheet, Schematic, Lesson-Library, About, BlockRenderer-driven `heading` blocks all still use `<ui-heading>` and likely lose their headings during prerender.

**Why this is debt:** Headings are accessibility-critical landmarks. They also drive in-page TOC generation. Empty headings break SEO and screen readers.

**Fix shape:** Investigate `@switch` + `<ng-content>` + Angular SSR projection limitation in `projects/core-ui/src/lib/heading/heading.component.ts`. Likely fix: change input shape to `text = input.required<string>()` and render `{{ text() }}` in the template instead of projecting via `<ng-content>`. Migration is mechanical: rewrite each `<ui-heading>{{ x }}</ui-heading>` callsite to `<ui-heading [text]="x" />`. ~half a plan of work.

### KD-03 — `scripts/lighthouse-lesson.mjs` Lighthouse gate runner not built (PERF-04 unmeasured)

**What:** Plan 03-09 declared this script as a must-have; it was deferred because measuring Lighthouse against an SSG-empty-shell would be misleading.

**Fix shape:** After KD-01 lands, build the runner per the original 03-09 Task 1 spec. Serves `dist/browser` via http-server and runs Lighthouse against `/lessons/pershyi-blymayuchyi-svitlodiod` at desktop + mobile profiles, fails the script on LCP ≥2.5s OR CLS ≥0.1 OR TBT ≥200ms.

### KD-04 — `docs/typography-checklist.md` P3 rows missing

**What:** No P3 three-breakpoint walk rows + no P3 Performance section. The doc currently has P1 and P2 rows only.

**Fix shape:** Append once KD-01 + KD-03 land and provide accurate prerender + LH numbers to record.

### KD-05 — `docs/force-en-audit.md` P3 row missing

**What:** P3 section is a placeholder. No checklist items, no run record row.

**Fix shape:** Run the force-en audit across every P3 route (home, lessons, lessons/:slug, articles/:slug, datasheets/:slug, schematics/:slug, about, /preview/:contentType/:token, 404), populate the row.

## Performance Metrics

- Phases completed: 3 (with KD-01..05 carried as v1.0-blocking debt)
- Plans completed: 22 (12 P1+P2 + 10 P3)
- Requirements shipped: 44 / 78

## Accumulated Context

### Key Decisions Logged

| Decision | Where | Rationale |
|----------|-------|-----------|
| FE-first with mocked data, BE second | PROJECT.md | Lock design quality without CMS data model leaking into UI decisions |
| Angular 21 zoneless + SCSS, no Tailwind | PROJECT.md | Editorial design wants bespoke CSS |
| Wagtail 7.3 for BE, planned bump to 7.4 LTS on 2026-05-04 | PROJECT.md, CLAUDE.md | Switched 2026-05-01 — unblocks Phase 4 immediately; 7.3→7.4 is a minor-release upgrade with no breaking changes; lands on LTS within a week |
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
| Phase 02 P03 | 8m | 2 tasks | 23 files |
| Phase 02 P04 | 6min | 2 tasks | 8 files |
| Phase 02 P05 | 6min | 2 tasks | 5 files |
| Phase 02 P06 | 30min (incl. user walk + 3 deviation commits) | 2 tasks | 11 files |
| Phase 03 P01 | 7m | 2 tasks | 20 files |
| Phase 03 P02 | 7m | 2 tasks | 13 files |
| Phase 03 P03 | 18m | 1 tasks | 11 files |
| Phase 03 P04 | 6min | 2 tasks | 4 files |
| Phase 03 P05 | 4min | 3 tasks | 9 files |
| Phase 03 P06 | 312s | 2 tasks | 17 files |
| Phase 03 P07 | 272 | 2 tasks | 8 files |
| Phase 03 P08 | 18m | 2 tasks | 14 files |
| Phase 03 P10 | 314s | 2 tasks | 2 files |

### Active Todos

(None — Phases 1+2 closed; ready for Phase 3 planning.)

### Blockers

- (None) Phase 4 was previously blocked on Wagtail 7.4 LTS release; switched target to Wagtail 7.3 (2026-05-01) — Phase 4 is now unblocked. Plan a one-line version pin bump to 7.4 LTS on its 2026-05-04 release inside Phase 4.

### Open hand-offs

- **CI verified green on first push.** First-push failures (pnpm version conflict + Node 20 deprecation warning) were filed as commit `2076ea4` and re-pushed; user confirmed `phase 1 approved`. Hand-off closed.
- **Phase 2 — Primitives — will be tested against the harness page.** Any primitive whose typography drifts from `/dev/glyph-audit` is wrong. The two phase-exit checklists (`docs/force-en-audit.md` and `docs/typography-checklist.md`) accumulate scope per phase — Phase 2 must add primitive-specific items.

### Open Questions (deferred to phase planning)

- Final Source Serif 4 vs Literata A/B test in real two-column layout — revisit at Phase 6.
- Margin-annotation CSS alignment across breakpoints — may warrant `/gsd-research-phase` on CSS `anchor-name` / `position-anchor` at start of Phase 3.
- "Universal Listings API" in Wagtail 7.3/7.4 — verify against 7.4 LTS release notes on 2026-05-04; default to `/api/v2/pages/` until then.
- `pillow-avif-plugin` longevity — re-check at Phase 4; switch to native Pillow AVIF if available.
- Preview UX with Wagtail 7.3 autosave — measure in Phase 4; SSG is locked, so any preview ergonomics issues will be solved with CSR autosave-polling against the preview-token endpoint, not by introducing SSR.

## Session Continuity

- **Last session:** 2026-05-02T09:18:39.724Z
- **Files just written:** `03-03-SUMMARY.md`, `vitest.config.ts`, `vitest.setup.ts`, `src/lib/difficulty.ts`, `src/app/blocks/block-renderer/block-renderer.component.ts`
- **Next action:** Execute Plan 03-04 — LessonPage template.

---
*State initialized: 2026-04-30 — Phase 1 closed: 2026-05-01 — Phase 2 closed: 2026-05-01.*

**Planned Phase:** 3 (page-templates-routing-static-build) — 10 plans — 2026-05-01T17:17:07.837Z
