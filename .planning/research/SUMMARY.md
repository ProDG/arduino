# Project Research Summary

**Project:** Arduino Learning Hub (Ukrainian)
**Domain:** Editorial-quality, Ukrainian-language headless content/learning site (Wagtail 7.3 + Angular 21, Dockerized single VPS)
**Researched:** 2026-04-30 — updated 2026-05-01 for Docker/Traefik/MinIO architecture and SSG-only lock.
**Confidence:** HIGH overall (one MEDIUM area: annotated code-block StreamField modeling)

## Executive Summary

This is a niche editorial publication that happens to be a learning site — the design thesis (book-grade typography, two-column body+margin layout, annotated code blocks, Ukrainian-first) is the product, not the wrapper. Experts build sites of this class by treating typography and layout as load-bearing engineering: hand-authored SCSS with a token system, self-hosted variable woff2 fonts subset to Cyrillic + Cyrillic-Ext, a typed page-model contract owned by the frontend, and CMS choices (Wagtail DRF v2, StreamField as a typed discriminated union of blocks) that *match* that contract rather than dictate it. The Tufte/Gwern/Ciechanowski lineage is the canonical reference set; the Adafruit/Sparkfun/arduino.cc sites are functionally complete but typographically utilitarian — the empty intersection is exactly where this project lives.

The recommended approach is **frontend-first, mock-data-driven, SSG-only**: build the design system, primitives, and page templates against typed JSON fixtures; lock the contract; only then bring up Wagtail 7.3 (Dockerized) to *conform* to that contract. Stack: Angular 21 zoneless + signals + SSG prerender (no Node SSR — ever), Source Serif 4 + Inter + JetBrains Mono (Pairing A) self-hosted, Shiki at build-time for syntax highlighting + diff + line annotations, Wagtail 7.3 + Django 5.2 LTS + PostgreSQL 17 + MinIO (S3-compatible) + Traefik (auto-TLS) all running in Docker Compose on a single Ubuntu 24.04 VPS, uv + Ruff for Python tooling inside the wagtail image, pnpm + Vitest for FE (host-native dev — no FE container).

The dominant risks are typographic-Ukrainian (a font with a missing or fallback `ґ`, late-discovered quotation/dash/NBSP conventions, Latin Lorem Ipsum hiding measure problems), contract drift between mock JSON and real Wagtail StreamField shape, and editorial polish leaking English (locale defaults, month names, decimal separators). All are addressable by sequencing: typography gate before any templates; contract lockdown between design and FE; explicit `uk-UA` everywhere on day zero; static-first rendering until preview/autosave actually need a Node process.

## Key Findings

### Recommended Stack

The supporting stack around the locked choices (Angular 21 zoneless, SCSS-only, Wagtail 7.3, single VPS, Ukrainian-only) is the 2026 lean default for self-hosted editorial sites. Self-host everything; avoid Docker, Node SSR runtime, GraphQL, Tailwind, and Google Fonts CDN.

**Core technologies:**
- **Source Serif 4 + Inter + JetBrains Mono (variable woff2, self-hosted)** — body serif / sans / mono — verified Ukrainian glyph quality including `ґ`, `ї`, `є`, `і`; subset to Cyrillic + Cyrillic-Ext; Fontaine-generated fallback metrics to eliminate CLS.
- **Angular 21.2.x zoneless + signals + Vitest 3 + `@angular/ssr`** — locked; `outputMode: "static"` (pure SSG, no Node SSR runtime — ever).
- **Shiki 3 + `@shikijs/transformers` (build-time)** — syntax highlighting, diff, line highlights, margin annotations via meta parsing; zero client JS for highlighting.
- **Wagtail 7.3 + Django 5.2 LTS + Python 3.13 + PostgreSQL 17 + psycopg 3.2** — all LTS-aligned; built-in REST API v2 (NOT wagtail-grapple); `wagtail-headless-preview` for editor preview; `django-storages[s3]` + `boto3` against MinIO for media.
- **Docker Compose + Traefik 3 + MinIO + Ubuntu 24.04** — Traefik for auto-TLS via Let's Encrypt and label-driven routing; MinIO for media + image renditions; single host systemd unit `docker-compose@arduino.service`. No bare-metal Wagtail/gunicorn/Caddy/Postgres.
- **uv (Python, inside the wagtail image) + pnpm 10 (Node, on host for FE dev) + Ruff + ESLint 9 + Stylelint 16** — 2026 default tooling.

Full detail: `.planning/research/STACK.md`.

### Expected Features

**Must have (table stakes):**
- Cyrillic-complete font stack (display, body, mono) with verified `ґ`, `ї`, `є`, `і` in italic, bold-italic, small-caps
- Ukrainian text pre-processor: smart quotes `«…»` / `„…"`, em-dash with spaces, en-dash for ranges, non-breaking spaces after one-letter prepositions
- Comfortable measure (~55–65ch for Ukrainian — shorter than English 65–75ch), ragged-right body, vertical rhythm, generous whitespace
- Two-column body + margin layout with three-breakpoint behavior (≥1200 / 768–1199 / <768)
- Lesson page template (title + deck + parts-list-in-margin + in-page TOC + prose + figures + code blocks + prev/next)
- Code blocks: Arduino C++ syntax + line numbers + copy + horizontal scroll
- Schematic figure with click-to-zoom; datasheet pinout + metadata
- Lesson library / index in typographic-TOC style (NOT card grid)
- Header / footer / home / about / 404 in editorial aesthetic; WCAG AA contrast; keyboard nav; print stylesheet

**Should have (competitive differentiators that DEFINE the product):**
- **Sidenotes / margin notes (Tufte-style)** with mobile-disclosure fallback — the signature gesture
- **Code-block margin annotations linked to specific line numbers** — mirrors Arduino Starter Kit; the most expensive differentiator
- **Diff highlighting (`add these lines`)** — for progressive lessons
- Drop caps on lesson openers (with care for wider Cyrillic letters Ж, Щ, Ю, М)
- Glossary / definition tooltips on technical terms
- Numbered figures + cross-references (`див. рис. 3`)
- Hover hotspots on chip pinouts
- RSS feed (Ukrainian tech audience uses RSS more than Western average)

**Defer (v2+):**
- Reader accounts / progress; site search; dark mode (must be designed as parallel theme — commit to light-only v1); comments; library filter/sort.

**Anti-features (explicitly excluded):**
Tailwind, Google Fonts CDN, Material Design, dark-mode-as-token-swap, card-grid library, search bar, justified body without working hyphenation, English month names anywhere.

Full detail: `.planning/research/FEATURES.md`.

### Architecture Approach

Monorepo with `frontend/` (Angular workspace; `web/` app + `core-ui/` library) and `backend/` (Wagtail Django project, arrives Phase 4+). The frontend owns the page-model contract via TypeScript discriminated-union `Block` types; Wagtail's StreamField shape must match — not the inverse. A single `ContentApi` interface with two implementations (`MockContentApi` reading `/assets/mock-data/*.json`, `WagtailContentApi` hitting `/api/v2/pages/`) is the swap seam. SCSS lives only in `styles/tokens/` + `styles/base/` globally; component styles co-locate. `core-ui` enforces a public-API boundary.

**Major components:**
1. **`core-ui` library (Angular)** — design-system primitives (`Heading`, `Body`, `Aside`, `Sidenote`, `Figure`, `CodeBlock`, `Diff`, `Pinout`, `PageShell`, `TwoColumn`, `MarginRail`). Knows nothing about "Lesson".
2. **`web` app `content/` layer** — `models/` (typed Lesson/Article/Datasheet/Schematic + `Block` discriminated union), `api/` (ContentApi + Mock/Wagtail impls), `stores/`.
3. **`web` app `features/` + `layout/`** — one folder per route family; `BlockRenderer` switch dispatching the discriminated union.
4. **Wagtail backend (Phase 4+)** — apps per page type; `content_blocks` shared StreamField blocks; DRF v2 with custom serializers matching FE shape 1:1; `wagtail-headless-preview`.
5. **Single-VPS topology** — Caddy :443 (auto-TLS) reverse-proxying `/api/*`, `/admin/*`, `/preview/*`, `/media/*` to gunicorn :8000; everything else served as static files. PostgreSQL 17 on UNIX socket. systemd-managed; no Docker.

Full detail: `.planning/research/ARCHITECTURE.md`.

### Critical Pitfalls

1. **Fonts without verified Ukrainian Cyrillic across ALL weights AND italics** — tofu `ґ`, browser-synthesized italic. Mitigate with a glyph audit harness (`і ї є ґ Ї Є Ґ ʼ` × regular/italic/bold/bold-italic × body/display); require both `cyrillic` AND `cyrillic-ext` subsets.
2. **Designing in Lorem Ipsum (Latin) instead of real Ukrainian prose** — measure, drop caps, headings calibrate wrong. Mitigate by pasting real Ukrainian Arduino prose into every comp from day zero.
3. **Mock data shape diverges from real Wagtail StreamField shape** — six weeks of FE rework when Wagtail returns `[{type, value, id}]` arrays + internal markup. Mitigate with a contract phase between design and FE; model TypeScript types on actual Wagtail API output (not intuition); decide server-side `expand_db_html` upfront; stand up a Wagtail skeleton spike early.
4. **Two-column body+sidenote layout collapses badly at tablet** — sidenotes squeeze, then duplicate inline. Mitigate by defining three-breakpoint behavior up-front and testing all three from day one.
5. **i18n leakage to English even though "Ukrainian only"** — `toLocaleDateString()` → `4/30/2026`, date-fns defaults to en. Mitigate with explicit `LOCALE_ID = 'uk-UA'`, `<html lang="uk">`, `Accept-Language: uk-UA`, `Intl.NumberFormat('uk-UA')`, `Intl.Collator('uk-UA')`, Django `LANGUAGE_CODE = 'uk'` from day zero; force-en browser-locale audit at every phase exit.
6. **Headless preview never gets wired up; editor flies blind**. Mitigate by treating preview as P0 BE deliverable: install `wagtail-headless-preview`, add `HeadlessPreviewMixin` to every page model, build `/preview/<contentType>/<token>` Angular route as a stub during FE phase.
7. **Solo-VPS ops decay** — no backups, expired certs, secrets in git, rendition disk bloat. Mitigate with day-zero discipline: `.env` gitignored + `gitleaks` pre-commit; `pg_dump` + `restic` to off-site before first content; certbot/Caddy renewal monitored via Healthchecks.io; quarterly `wagtail_update_image_renditions --purge-only`; reproducible deploy script in repo.

Full detail: `.planning/research/PITFALLS.md`.

### Rendering Strategy: SSG-only (LOCKED 2026-05-01)

**Decision: SSG-only — no Node SSR, ever.** Locked by explicit user direction on 2026-05-01.

- v1 ships **`outputMode: "static"`** with **CSR-only `/preview/*`**.
- All public routes prerendered at build time via `getPrerenderParams()` pulling slugs from Wagtail.
- `/preview/<contentType>/<token>` lives in the same static bundle and runs CSR — Angular client fetches preview JSON from an authenticated Wagtail endpoint and renders client-side. Autosave ergonomics are addressed via CSR polling, not SSR.
- Angular SSG output is served by a tiny `caddy:alpine` container behind Traefik; the prior Node SSR box is permanently removed from the topology.

**Why SSG is sufficient:**
- Prerendered HTML serves *faster* than Node SSR (no per-request render cost, full edge cacheability); `<title>`/meta tags baked at build time.
- No hydration mismatches — Pitfall 11 is N/A.
- One fewer service to operate (no Node runtime, no SSR memory leaks, no Node version to manage).
- Preview ergonomics handled with CSR + autosave polling.

This decision is final for v1; revisiting would require an explicit ADR.

### Ukrainian / Cyrillic-Specific Findings (Cross-Cutting)

These touch nearly every phase:

1. **Glyph coverage gate (`ґ`, `ї`, `є`, `і`)** — `ґ` lives at U+0490/U+0491 in Cyrillic-Ext, NOT in basic Cyrillic (U+0400–U+045F). Google Fonts default `cyrillic` subset omits it. Verify in italic, bold-italic, small-caps. Source Serif 4, Inter, JetBrains Mono, Literata, IBM Plex confirmed.
2. **Quotation marks** — primary `«…»` (chevrons, no inner spaces), nested `„…"` (low-9 + high-6). Save-side normalizer in Wagtail RichText; CSS `lang="uk"` `quotes` declaration; CI lint for ASCII straight quotes.
3. **Dashes** — em-dash `—` with spaces; en-dash `–` no spaces for numeric ranges (`1–2 дні`); hyphen only for compounds (`бізнес-план`).
4. **Non-breaking spaces** after one-letter prepositions/conjunctions: `в`, `з`, `у`, `і`, `й`, `та`, `не`, `на`, `до`, `за`, `по`. Standard Ukrainian rule.
5. **Hyphenation** — `hyphens: auto` + `lang="uk"` works in Chrome ≥112, Firefox ≥9, Safari ≥9.1 (~93% global, not 100%). **Recommendation: ragged-right body, no auto-hyphenation.** The Arduino Starter Kit book itself uses ragged-right in many spreads.
6. **Measure** — Ukrainian words average longer than English; comfortable measure shifts to ~55–65ch. Calibrate against real Ukrainian prose.
7. **Drop caps** — `Ї` has dot above, `Ґ` has upturn, `Ж`/`Щ`/`Ю`/`М` are wider than Latin. Test with realistic Ukrainian opener letters.
8. **Cyrillic in monospace** — stroke-weight harmony varies. JetBrains Mono passes.
9. **Locale leakage** — explicit `LOCALE_ID = 'uk-UA'` + `registerLocaleData(localeUk)` + `<html lang="uk">` + Django `LANGUAGE_CODE = 'uk'` + `TIME_ZONE = 'Europe/Kyiv'` + date-fns `import { uk }` + `Intl.NumberFormat('uk-UA')` + `Intl.Collator('uk-UA')` + HTTP interceptor adding `Accept-Language: uk-UA`. Day zero. Force-en browser audit at every phase exit.
10. **Domain vocabulary** — Arduino terminology in Ukrainian is unsettled. A site glossary defends voice consistency and feeds tooltip infrastructure.

## Implications for Roadmap

### Phase 1: Typography & Design System Foundation
**Rationale:** Typography is the gate. All four research files independently flag this. Latin Lorem Ipsum hides the problem.
**Delivers:** Self-hosted Pairing A (Source Serif 4 + Inter + JetBrains Mono); subset Cyrillic + Cyrillic-Ext woff2; Fontaine fallback metrics; Ukrainian glyph audit harness; Ukrainian text pre-processor (quotes, dashes, NBSP); `styles/tokens/*.scss` (semantic naming for future dark-mode safety); `styles/base/*.scss`; typography specimen page using REAL Ukrainian Arduino prose; `core-ui` library scaffolded; day-zero `LOCALE_ID = 'uk-UA'` + `<html lang="uk">`; light-only-v1 commitment in writing.
**Avoids:** Pitfalls 1, 2, 3, 4, 7, 15, 17.

### Phase 2: Component Primitives + Page-Model Contract Lockdown
**Rationale:** The contract phase between design and FE — flagged in PITFALLS.md as the missing phase that causes mock-shape divergence.
**Delivers:** `core-ui` primitives (Heading, Body, Aside, Sidenote, Figure, CodeBlock, Diff, Pinout, PageShell, TwoColumn, MarginRail); two-column layout with all three breakpoints verified; sidenote three-breakpoint disclosure; `content/models/*.ts` LOCKED (Lesson, Article, Datasheet, Schematic + `Block` discriminated union with `CodeBlock.annotations: {line, html}[]`); `ContentApi` interface; `MockContentApi`; mock JSON in REAL Ukrainian; **30–60 min Wagtail skeleton spike** to verify StreamField shape before FE commits to it.
**Avoids:** Pitfalls 5, 6.

### Phase 3: Page Templates + Routing + Static Build
**Rationale:** With contract locked and primitives in hand, build the four page templates plus library/home/about. `outputMode: "static"` per the SSG resolution. SSR explicitly NOT used.
**Delivers:** All routes (`/`, `/lessons`, `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug`, `/preview/<type>/<token>` CSR stub); page components consuming `ContentApi`; `BlockRenderer`; **code block with line numbers + Shiki + diff + margin annotations + copy** working on a real demo lesson; schematic with click-to-zoom; datasheet pinout; library typographic-TOC; header/footer/home/about/404; three-breakpoint responsive; Lighthouse gate (LCP < 2.5s, CLS < 0.1) with `<app-figure>` enforcing NgOptimizedImage contract.
**Avoids:** Pitfalls 11, 12, 19; SSR hydration risk eliminated.

**DESIGN FREEZE CHECKPOINT** at end of Phase 3.

### Phase 4: Wagtail Backend Skeleton + Contract Match (Dockerized)
**Rationale:** Wagtail conforms to the locked FE contract. Phase 4 builds against Wagtail 7.3 (GA today) with a planned one-line bump to 7.4 LTS on its 2026-05-04 release. Preview is P0. BE runs in Docker from day one.
**Delivers:** `compose.yml` + `compose.dev.yml` defining `wagtail`, `postgres`, `minio` services with healthchecks and named volumes; Wagtail 7.3 + Django 5.2 + Python 3.13 + PG17 + psycopg 3.2 + uv + Ruff inside the wagtail image; apps (`lessons`, `articles`, `datasheets`, `schematics`, `content_blocks`); page models matching `content/models/*.ts` 1:1; `CodeBlock = StructBlock(language, code, annotations=ListBlock({line, note}))` validated by spike; DRF v2 with `expand_db_html` server-side; `wagtail-headless-preview` + `HeadlessPreviewMixin` on every page model; `django-storages[s3]` + `boto3` against MinIO (uploads, renditions, collectstatic); `WagtailContentApi`; one lesson migrated mock→Wagtail with image renditions verified to land in MinIO; Django `LANGUAGE_CODE = 'uk'`, `TIME_ZONE = 'Europe/Kyiv'`; day-zero security (`.env` gitignored, `gitleaks`, `DEBUG=False`, explicit `ALLOWED_HOSTS`).
**Avoids:** Pitfalls 5, 8, 14, 18, 20.

### Phase 5: Single-VPS Deployment (Docker Compose)
**Rationale:** Bring static FE + Wagtail BE together on Ubuntu 24.04 via Docker Compose. Backups before content. **No Node SSR. No bare-metal Wagtail/gunicorn. No local-filesystem media.**
**Delivers:** `compose.prod.yml` overlay adding Traefik (Let's Encrypt resolver) + `fe-static` (`caddy:alpine`) container serving the prerendered Angular bundle; single host systemd unit `docker-compose@arduino.service`; Postgres + MinIO data on host-bound named volumes (separate volumes — media disk-fill cannot starve Postgres); two backup paths (`pg_dump → restic` to B2 for Postgres, `mc mirror` to B2 for MinIO) with restore drill executed end-to-end before content publish; Healthchecks.io pings on Traefik cert renewal + each backup path; quarterly `docker compose exec wagtail … wagtail_update_image_renditions --purge-only`; `ufw` 22/80/443; reproducible `deploy/deploy.sh`.
**Avoids:** Pitfalls 9 (Docker-specific), 13, 20.

### Phase 6: Content Migration, Polish, & Differentiator Build-Out
**Delivers:** All initial content in Wagtail; mock JSON retained as E2E fixtures; glossary + definition tooltips; pin/peripheral references in prose and code; numbered figures + cross-references; hover hotspots on pinouts; drop caps; hanging punctuation / OT refinements; print stylesheet; RSS feed; SEO meta + Open Graph baked into prerender; full WCAG AA pass; locale-leakage audit (force-en browser tour); "Looks Done But Isn't" checklist walked end-to-end.

### Phase Ordering Rationale

- **Typography before everything** — load-bearing decision; mid-template glyph discovery is a redo.
- **Contract phase between design and FE** — most expensive avoidable bug class is mock-shape divergence; 30-min Wagtail spike is cheap insurance.
- **FE before BE with static build** — PROJECT.md mandates FE-first; SSG resolution means Phase 3 has zero backend dependency.
- **BE in Phase 4 (Wagtail 7.3 today; bump to 7.4 LTS on 2026-05-04)** — switched from "wait for LTS" to "build on 7.3, bump at LTS release" because 7.3→7.4 is a minor-release upgrade with no breaking changes; unblocks Phase 4 immediately and lands on LTS within a week.
- **Deployment in Phase 5** — backups-before-content discipline; Docker Compose + Traefik + MinIO topology locked.
- **Content + polish + differentiators in Phase 6** — additive without rework.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** annotated-CodeBlock StreamField design is MEDIUM in ARCHITECTURE.md — no canonical pattern. Run 30–60 min spike at Phase 2/4 boundary against Wagtail 7.3's actual block API.
- **Phase 3:** margin-annotation alignment CSS (vertical alignment of margin notes to specific code lines, three-breakpoint) has no canonical implementation. Worth a focused `/gsd-research-phase` on CSS `anchor-name` / `position-anchor` (Chrome 125+).
- **Phase 4:** "Universal Listings API" in Wagtail 7.3 unverified — recheck final 7.4 release notes 2026-05-04. Default to `/api/v2/pages/`.
- **Phase 4:** `pillow-avif-plugin` longevity — Pillow may have native AVIF by mid-2026; switch if so.
- **Phase 6:** Source Serif 4 vs Literata A/B test in real two-column layout — Pairing A vs C is taste-dependent.

Phases with standard patterns (lighter-touch research):
- **Phase 1:** typography pipeline is HIGH confidence; execute the recipe.
- **Phase 5:** Caddy + gunicorn + systemd + Postgres on Ubuntu is canonical 2026; execute, do not re-research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Variable woff2, Angular 21 zoneless, Wagtail 7.3, Caddy/gunicorn/systemd, uv/pnpm/Ruff are 2026-validated official defaults. MEDIUM sub-area: Pairing A vs C resolves in Phase 6 A/B. |
| Features | HIGH for editorial typography (Tufte/Gwern/Distill canonical); MEDIUM for Arduino-domain UX (observable but not formalized); MEDIUM for Ukrainian-specific typography (linguistic + style-guide sources). |
| Architecture | HIGH on FE structure, ContentApi seam, monorepo, single-VPS, REST-vs-GraphQL. MEDIUM on annotated-CodeBlock StreamField (opinionated synthesis). MEDIUM on rendering strategy — RESOLVED above. |
| Pitfalls | HIGH for Cyrillic/typography (Wikipedia, TypeDrawers, caniuse); HIGH for Angular 21 zoneless and Wagtail headless (official + community); MEDIUM for VPS-ops (third-party guides cross-referenced). |

**Overall confidence:** HIGH

### Gaps to Address

- Annotated CodeBlock StreamField schema — validate via 30-min Wagtail 7.3 spike at Phase 2/4 boundary.
- Margin-annotation CSS alignment across breakpoints — no canonical implementation; Phase 3 may need focused research-phase on CSS `anchor-name` / `position-anchor`.
- "Universal Listings API" in Wagtail 7.3 — verify against 2026-05-04 release notes.
- Source Serif 4 vs Literata final pick — Phase 1 builds against Pairing A; revisit at Phase 6.
- Preview UX with Wagtail 7.3 autosave — measure in Phase 4; SSG-only is locked, so any preview-ergonomics issues will be solved with CSR autosave-polling (poll the preview-token endpoint at 1–2s during editor focus), NOT by introducing SSR.
- Browser hyphenation reliability for `lang="uk"` — recommendation is ragged-right body to sidestep.
- Ukrainian Arduino vocabulary glossary — seed in Phase 1 samples; formalize in Phase 6.

---
*Research completed: 2026-04-30*
*Updated: 2026-05-01 — switched to Docker (Traefik + Wagtail + Postgres + MinIO); MinIO for media; locked SSG-only / no SSR.*
*Ready for roadmap: yes*
