# Requirements: Arduino Learning Hub (Ukrainian)

**Defined:** 2026-04-30
**Core Value:** Reading and learning here feels as good as reading a beautifully typeset book — design, typography, and visual structure are the primary product.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Typography & Design System

- [ ] **TYPE-01**: Display, body, and monospace fonts self-hosted as variable woff2 with verified Ukrainian glyph coverage (`і`, `ї`, `є`, `ґ`, `Ї`, `Є`, `Ґ`, apostrophe `ʼ`) in regular, italic, bold, and bold-italic weights
- [ ] **TYPE-02**: Font subsetting includes both `cyrillic` and `cyrillic-ext` Unicode ranges (default Pairing A: Source Serif 4 + Inter + JetBrains Mono)
- [ ] **TYPE-03**: Fontaine-generated fallback metric overrides eliminate CLS on font load (FOUT acceptable, no FOIT)
- [ ] **TYPE-04**: Ukrainian glyph audit harness page exists and visually verifies all critical glyphs across all weights/styles before any page templates are built
- [ ] **TYPE-05**: SCSS token system with semantic naming covers typography scale, spacing scale, color palette (Arduino-teal accent on a distinct identity), borders, and shadows
- [ ] **TYPE-06**: Token system structured so a font-pairing change is a single-file edit (`tokens/_typography.scss`)
- [ ] **TYPE-07**: Type scale calibrated against real Ukrainian Arduino prose (NOT Lorem Ipsum) — comfortable measure ~55–65ch
- [ ] **TYPE-08**: Site committed to a single light theme for v1 — no dark mode in v1; tokens still designed semantically to permit a future parallel theme
- [ ] **TYPE-09**: Body text is ragged-right (no `text-align: justify`, no `hyphens: auto`) — sidesteps unreliable Ukrainian browser hyphenation
- [ ] **TYPE-10**: SCSS architecture: global `styles/tokens/` + `styles/base/` only; component styles co-locate with components

### Ukrainian Text & Locale

- [ ] **UKR-01**: `<html lang="uk">` set globally; `LOCALE_ID = 'uk-UA'` registered in Angular; `registerLocaleData(localeUk)` invoked
- [x] **UKR-02**: Ukrainian text pre-processor utility transforms straight ASCII quotes to `«…»` (primary) and `„…"` (nested), inserts em-dash `—` with surrounding spaces, en-dash `–` for numeric ranges, and inserts non-breaking spaces after one-letter prepositions (`в`, `з`, `у`, `і`, `й`, `та`, `не`, `на`, `до`, `за`, `по`) *(reframed per CONTEXT D-PRE-01..05 as authoring-contract: `docs/copy-style-uk.md` + `scripts/lint-fixtures.mjs`)*
- [x] **UKR-03**: Pre-processor applied consistently to both static prose and rendered StreamField content *(reframed: editorial-smell + content-gate lint clean on all 7 fixtures)*
- [ ] **UKR-04**: All date/number formatting uses `Intl.DateTimeFormat('uk-UA')` and `Intl.NumberFormat('uk-UA')`; sorting uses `Intl.Collator('uk-UA')`; no `toLocaleDateString()` calls without explicit locale
- [ ] **UKR-05**: `TIME_ZONE = 'Europe/Kyiv'` set wherever times are rendered
- [ ] **UKR-06**: Force-en browser-locale audit checklist exists and is run at the end of each phase that touches user-facing strings (catches locale leakage early)

### Layout & Responsive Behavior

- [x] **LAYOUT-01
**: Two-column layout (body column + margin/sidenote column) renders correctly on screens ≥1200px
- [x] **LAYOUT-02
**: Tablet breakpoint (768–1199px) collapses sidenotes/margin content to inline disclosure or above/below body — no overlap, no horizontal scroll
- [x] **LAYOUT-03
**: Mobile breakpoint (<768px) is fully usable — single column, generous line-height, no broken sidenotes
- [x] **LAYOUT-04
**: Layout looks polished on laptop screens and gorgeous on FHD+ (≥1920px) — content does not stretch full-width; max content width respects measure
- [x] **LAYOUT-05
**: Header (with site title and primary navigation) and footer (with about/RSS/license info) render in editorial aesthetic across breakpoints
- [ ] **LAYOUT-06**: Print stylesheet exists for lessons and articles — paper-friendly typography, no nav, expanded sidenotes inline

### Component Primitives (`core-ui`)

- [x] **PRIM-01**: `core-ui` Angular library project exists with public-API boundary (no reaching into primitive internals from features)
- [x] **PRIM-02
**: Primitives implemented: `Heading`, `Body`, `Lede`, `Aside`, `Sidenote`, `Figure`, `FigureCaption`
- [x] **PRIM-03
**: Layout primitives implemented: `PageShell`, `TwoColumn`, `MarginRail`
- [x] **PRIM-04
**: `CodeBlock` primitive with Arduino C++ syntax highlighting (Shiki at build-time), line numbers, copy-to-clipboard button, horizontal scroll on overflow, NO client-side highlighting JS
- [x] **PRIM-05
**: `CodeBlock` supports diff view ("add these lines", "remove these lines") with appropriate visual treatment
- [x] **PRIM-06
**: `CodeBlock` supports per-line margin annotations linked to specific line numbers, vertically aligned to those lines on ≥1200px breakpoint, with disclosure fallback at smaller breakpoints
- [x] **PRIM-07
**: `Pinout` primitive renders chip pinout images with hover hotspots / callouts (static for v1; no live data)
- [x] **PRIM-08
**: `Diff` primitive renders inline content diffs (text-level) for progressive lesson sections

### Page-Model Contract & Mock Data

- [x] **CONTRACT-01**: TypeScript content models locked: `Lesson`, `Article`, `Datasheet`, `Schematic`, with shared `Block` discriminated union covering all StreamField block types (paragraph, heading, sidenote, figure, code, diff, pinout, parts-list)
- [ ] **CONTRACT-02**: `CodeBlock` model includes `language`, `code`, and `annotations: { line: number; html: string }[]` shape verified by a 30–60 minute Wagtail 7.4 spike
- [x] **CONTRACT-03**: `ContentApi` interface defined; `MockContentApi` implementation reads from `/assets/mock-data/*.json`
- [x] **CONTRACT-04**: Mock JSON populated with at least 3 real Ukrainian-language lessons, 1 article, 2 datasheets, 1 schematic — content drives design calibration, not Latin filler

### Page Templates & Routing

- [ ] **PAGE-01**: Lesson page template — title + deck + parts-list-in-margin + in-page TOC + prose + figures + code blocks + prev/next-lesson navigation
- [ ] **PAGE-02**: Standalone article page template — editorial layout with sidenotes, figures, code; no parts list, no prev/next
- [ ] **PAGE-03**: Datasheet page template — component metadata block + pinout figure + specifications + peripheral notes prose
- [ ] **PAGE-04**: Schematic page template — large schematic figure with click-to-zoom, accompanying explanation prose, downloadable image link
- [ ] **PAGE-05**: Lesson library / index page renders as a typographic table-of-contents (NOT a card grid) — visual hierarchy, optional difficulty markers, estimated read time
- [ ] **PAGE-06**: Home page in editorial aesthetic — features the most recent lessons/articles, clear entry points to library and about
- [ ] **PAGE-07**: About page explains the project's purpose and authorship in editorial prose
- [ ] **PAGE-08**: 404 page in editorial aesthetic
- [ ] **PAGE-09**: Routing covers `/`, `/lessons`, `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug`
- [ ] **PAGE-10**: `BlockRenderer` component dispatches the `Block` discriminated union to the right primitive
- [ ] **PAGE-11**: All pages consume content via `ContentApi` (not direct HTTP) so the mock→Wagtail swap is a single DI configuration change

### Build & Performance

- [ ] **PERF-01**: Angular 21.2.x with zoneless change detection (default), Signal Forms, Vitest as test runner, `@angular/ssr` configured for `outputMode: "static"`
- [ ] **PERF-02**: All public routes prerendered at build time (`getPrerenderParams()` for `/lessons/:slug` etc.); no Node SSR runtime in v1
- [ ] **PERF-03**: `/preview/<contentType>/<token>` route runs CSR-only (Angular client-side render of preview JSON from authenticated Wagtail endpoint)
- [ ] **PERF-04**: Lighthouse gates met on a representative lesson page: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] **PERF-05**: All in-page imagery uses NgOptimizedImage; figures enforce explicit dimensions
- [ ] **PERF-06**: Static build deploys as a folder of HTML/JS/CSS/woff2 — no runtime Node dependency

### Wagtail Backend (post 2026-05-04)

- [ ] **WAGTAIL-01**: Wagtail 7.4 LTS installed with Django 5.2 LTS, Python 3.13, PostgreSQL 17, psycopg 3.2; Python tooling via `uv` + `Ruff`
- [ ] **WAGTAIL-02**: Page models for `Lesson`, `Article`, `Datasheet`, `Schematic` match the FE TypeScript content models 1:1 (field names and shapes)
- [ ] **WAGTAIL-03**: StreamField block types implemented for all `Block` discriminated-union variants, including `CodeBlock` as `StructBlock(language, code, annotations=ListBlock({line, note}))`
- [ ] **WAGTAIL-04**: Wagtail REST API v2 (`/api/v2/pages/`) exposes content; custom serializers expand rich-text HTML server-side (`expand_db_html`); response shape matches the `ContentApi` contract exactly
- [ ] **WAGTAIL-05**: `wagtail-headless-preview` installed, `HeadlessPreviewMixin` applied to every page model, preview redirects to the Angular `/preview/*` route with token auth
- [ ] **WAGTAIL-06**: Django configured for Ukrainian: `LANGUAGE_CODE = 'uk'`, `TIME_ZONE = 'Europe/Kyiv'`, `USE_TZ = True`
- [ ] **WAGTAIL-07**: `WagtailContentApi` Angular implementation hits `/api/v2/pages/`; environment flag flips `MockContentApi` → `WagtailContentApi`
- [ ] **WAGTAIL-08**: Day-zero security: `.env` in `.gitignore`, `gitleaks` pre-commit hook, `DEBUG = False` in prod, explicit `ALLOWED_HOSTS`, secret key not in repo
- [ ] **WAGTAIL-09**: Wagtail uses `django-storages[s3]` + `boto3` configured against MinIO (S3-compatible) for `DEFAULT_FILE_STORAGE` — original uploads, image renditions, and document storage live in a single MinIO bucket. Endpoint, bucket name, and credentials are sourced from environment variables (no hardcoded URLs). Local-filesystem `MEDIA_ROOT` storage is forbidden (same backend in dev and prod).
- [ ] **WAGTAIL-10**: BE (Wagtail + Postgres + MinIO) runs in Docker Compose in both dev and prod. The same `docker-compose.yml` (with `compose.dev.yml` / `compose.prod.yml` overlays) defines services, networks, named volumes, and healthchecks; production differs only via overlay (TLS via Traefik labels, no port exposure to host except Traefik's 80/443).

### Single-VPS Deployment

- [ ] **DEPLOY-01**: Single Ubuntu 24.04 VPS provisioned with Docker Engine 27+ and Docker Compose v2. The full prod stack runs from `compose.yml` + `compose.prod.yml`: Traefik (reverse proxy + auto-TLS), Wagtail (gunicorn 23 in container), PostgreSQL 17, MinIO, and a static-FE container (`caddy:alpine`) serving the prerendered Angular bundle on port 80 (Traefik handles TLS upstream). A single host-level `docker-compose@arduino.service` systemd unit ensures the stack starts on boot.
- [ ] **DEPLOY-02**: Traefik configured via container labels: auto-TLS via Let's Encrypt; `Host(<domain>)` routes — `/api/*`, `/admin/*`, `/preview/*`, `/django-static/*` to the Wagtail container :8000; `/media/*` to MinIO :9000 with bucket-level public-read policy on the renditions prefix; everything else routed to the static-FE container :80 (which serves the prerendered Angular bundle and falls back to `/index.html` for SPA routes). HTTP→HTTPS redirect handled by Traefik entrypoint config.
- [ ] **DEPLOY-03**: PostgreSQL 17 runs in container, exposed only on the internal Docker network (no host port published). Wagtail connects via Docker DNS (e.g., `postgres:5432`). Postgres data on a named volume backed by a host-bind mount at `/srv/arduino/postgres-data` for backup access. MinIO data on a separate named volume bound to `/srv/arduino/minio-data` so a media-disk-fill cannot starve Postgres.
- [ ] **DEPLOY-04**: Daily off-site backups via two paths: (a) `pg_dump` from a transient sidecar container (or `docker compose exec postgres pg_dump`) piped into `restic` to Backblaze B2; (b) MinIO bucket replicated to B2 via `mc mirror` (run from a sidecar/cron). Restore drill executed and documented in `deploy/RESTORE.md` end-to-end on a fresh DB AND a fresh MinIO bucket before any real content is published.
- [ ] **DEPLOY-05**: Traefik cert renewal, daily `pg_dump` job, and daily `mc mirror` job each ping Healthchecks.io on success; failure (or missed ping) emails the author. Traefik logs cert events; the backup cron exits non-zero on any error to trip the Healthchecks grace window.
- [ ] **DEPLOY-06**: Quarterly cron runs `docker compose exec wagtail python manage.py wagtail_update_image_renditions --purge-only` to prevent rendition bloat in MinIO. Optional: a MinIO bucket lifecycle policy ages out renditions older than N days as a second safety net.
- [ ] **DEPLOY-07**: `ufw` firewall allows only 22, 80, 443 on the host; Docker daemon is configured with `iptables=true` but the `docker-compose.yml` exposes only Traefik's 80/443 to the host (Postgres, MinIO, Wagtail, FE-static are all on the internal network). SSH via key only (`PasswordAuthentication no`).
- [ ] **DEPLOY-08**: Reproducible `deploy/deploy.sh` script in repo (idempotent — can be re-run safely): pulls the repo, runs `docker compose -f compose.yml -f compose.prod.yml pull && up -d --build`, runs Django migrations + `collectstatic` to MinIO via `docker compose exec wagtail …`, rsyncs the FE bundle to the host volume mounted into the FE-static container, and restarts only the affected services. Deployment does not depend on the dev machine — works from any laptop with SSH access.

### Editorial Differentiators & Polish

- [ ] **POLISH-01**: Drop caps on lesson openers, calibrated for wider Cyrillic letters (Ж, Щ, Ю, М) and the dot-above `Ї`/`Й`
- [ ] **POLISH-02**: Hanging punctuation and OpenType refinements (small caps where used, old-style figures where appropriate) applied
- [ ] **POLISH-03**: Numbered figures with cross-references in prose (`див. рис. 3`)
- [ ] **POLISH-04**: Glossary terms displayed as definition tooltips on hover/focus on technical terms in prose
- [ ] **POLISH-05**: Pin / peripheral references in prose and code (e.g., `pin 13`) link or tooltip to the relevant datasheet entry
- [ ] **POLISH-06**: SEO meta tags + Open Graph + JSON-LD article structured data baked into prerender output
- [ ] **POLISH-07**: RSS feed at `/feed.xml` covering lessons + articles
- [ ] **POLISH-08**: WCAG AA contrast ratios verified across all text/background combinations; full keyboard navigation works on every page
- [ ] **POLISH-09**: Initial content set published in Wagtail (mocks retained as E2E test fixtures): the same 3+ lessons, 1+ article, 2+ datasheets, 1+ schematic from CONTRACT-04, plus any new content the author has ready

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Reader Features

- **READER-01**: Reader accounts with email + password
- **READER-02**: Per-lesson progress tracking (read / unread / in-progress)
- **READER-03**: Bookmark a lesson or article for later
- **READER-04**: Per-user preferences (e.g., font size, theme — see THEME-01)

### Themes & Display

- **THEME-01**: Dark mode designed as a parallel theme (NOT a CSS-variable swap) with its own paper/ink calibration

### Discovery

- **SEARCH-01**: Site-wide full-text search over lessons, articles, datasheets
- **SEARCH-02**: Library filter and sort (by difficulty, topic, peripheral, date)

### Engagement

- **ENGAGE-01**: Comments under lessons and articles
- **ENGAGE-02**: Reaction or "found this helpful" signal on lessons

### Content Tooling

- **TOOL-01**: Ukrainian Arduino vocabulary glossary as a managed Wagtail snippet collection (not just inline)
- **TOOL-02**: Course-progression graphic showing prerequisite chains visually

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Circuit simulator (Wokwi-style) | Scope explosion; design quality is the priority. Schematics are static images. |
| In-browser code execution / Arduino emulation | Same as above; not worth the complexity for v1. |
| Internationalization (multi-language) | Project is Ukrainian-only by explicit decision. No `wagtail-localize`, no Angular i18n routing. |
| Tailwind / utility-first CSS | Editorial design wants hand-authored, semantic SCSS. |
| Google Fonts CDN | Self-hosting required for subset control, woff2 quality, and Cyrillic-Ext coverage. |
| Material Design / off-the-shelf component library | Editorial primitives are bespoke; design system is the product. |
| Card-grid library / index | Replaced by typographic table-of-contents — explicitly rejects the "YouTube grid" pattern. |
| Justified body text | Reliable Ukrainian browser hyphenation is not yet universal; ragged-right is the editorial choice. |
| Node SSR runtime (any phase) | SSG-only is the locked architecture. Wagtail REST API v2 → Angular consumes content; `/preview/*` is CSR-only with autosave polling. SSR is not on the roadmap. |
| Server-rendered preview (`/preview/*`) | CSR-only `/preview/*` is the v1 strategy; preview UX issues will be addressed via autosave polling on the CSR side, not by introducing SSR. |
| Newsletter popup, autoplay video, cookie banners beyond legal minimum | Anti-features — actively excluded to protect reading experience. |
| Comments / Disqus / external embeds | Same — reading experience first. |
| CDN front (Cloudflare/Bunny) | Not needed at expected audience scale; revisit only post-launch. |
| GraphQL (`wagtail-grapple`) | REST v2 is sufficient; one less moving part for solo author. |
| Bare-metal systemd-managed Wagtail/gunicorn | Replaced by Docker Compose. Single `docker-compose@arduino.service` host unit is the only host-level service. |
| Local-filesystem media storage (`MEDIA_ROOT` on disk) | Replaced by MinIO (S3-compatible). Same backend in dev and prod. Prevents disk-fill from media uploads taking down Postgres. |
| nginx as reverse proxy | Replaced by Traefik (Docker-native, label-driven routing, integrated Let's Encrypt). |
| Caddy on the host | Caddy still appears as the FE-static container (`caddy:alpine`) on `:80`, but TLS is handled by Traefik upstream. No host-level Caddy. |
| English month names anywhere in the UI | Locale leakage — actively guarded against. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TYPE-01 | Phase 1 | Pending |
| TYPE-02 | Phase 1 | Pending |
| TYPE-03 | Phase 1 | Pending |
| TYPE-04 | Phase 1 | Pending |
| TYPE-05 | Phase 1 | Pending |
| TYPE-06 | Phase 1 | Pending |
| TYPE-07 | Phase 1 | Pending |
| TYPE-08 | Phase 1 | Pending |
| TYPE-09 | Phase 1 | Pending |
| TYPE-10 | Phase 1 | Pending |
| UKR-01 | Phase 1 | Pending |
| UKR-02 | Phase 2 | **Complete** (2026-05-01) |
| UKR-03 | Phase 2 | **Complete** (2026-05-01) |
| UKR-04 | Phase 1 | Pending |
| UKR-05 | Phase 1 | Pending |
| UKR-06 | Phase 1 | Pending |
| LAYOUT-01 | Phase 2 | **Complete** (2026-05-01) |
| LAYOUT-02 | Phase 2 | **Complete** (2026-05-01) |
| LAYOUT-03 | Phase 2 | **Complete** (2026-05-01) |
| LAYOUT-04 | Phase 2 | **Complete** (2026-05-01) |
| LAYOUT-05 | Phase 2 | **Complete** (2026-05-01) |
| LAYOUT-06 | Phase 6 | Pending |
| PRIM-01 | Phase 2 | **Complete** (2026-05-01) |
| PRIM-02 | Phase 2 | **Complete** (2026-05-01) |
| PRIM-03 | Phase 2 | **Complete** (2026-05-01) |
| PRIM-04 | Phase 2 | **Complete** (2026-05-01) |
| PRIM-05 | Phase 2 | **Complete** (2026-05-01) |
| PRIM-06 | Phase 2 | **Complete** (2026-05-01) |
| PRIM-07 | Phase 2 | **Complete** (2026-05-01) |
| PRIM-08 | Phase 2 | **Complete** (2026-05-01) |
| CONTRACT-01 | Phase 2 | **Complete** (2026-05-01) |
| CONTRACT-02 | Phase 3 | Pending |
| CONTRACT-03 | Phase 2 | **Complete** (2026-05-01) |
| CONTRACT-04 | Phase 2 | **Complete** (2026-05-01) |
| PAGE-01 | Phase 3 | Pending |
| PAGE-02 | Phase 3 | Pending |
| PAGE-03 | Phase 3 | Pending |
| PAGE-04 | Phase 3 | Pending |
| PAGE-05 | Phase 3 | Pending |
| PAGE-06 | Phase 3 | Pending |
| PAGE-07 | Phase 3 | Pending |
| PAGE-08 | Phase 3 | Pending |
| PAGE-09 | Phase 3 | Pending |
| PAGE-10 | Phase 3 | Pending |
| PAGE-11 | Phase 3 | Pending |
| PERF-01 | Phase 3 | Pending |
| PERF-02 | Phase 3 | Pending |
| PERF-03 | Phase 3 | Pending |
| PERF-04 | Phase 3 | Pending |
| PERF-05 | Phase 3 | Pending |
| PERF-06 | Phase 3 | Pending |
| WAGTAIL-01 | Phase 4 | Pending |
| WAGTAIL-02 | Phase 4 | Pending |
| WAGTAIL-03 | Phase 4 | Pending |
| WAGTAIL-04 | Phase 4 | Pending |
| WAGTAIL-05 | Phase 4 | Pending |
| WAGTAIL-06 | Phase 4 | Pending |
| WAGTAIL-07 | Phase 4 | Pending |
| WAGTAIL-08 | Phase 4 | Pending |
| WAGTAIL-09 | Phase 4 | Pending |
| WAGTAIL-10 | Phase 4 | Pending |
| DEPLOY-01 | Phase 5 | Pending |
| DEPLOY-02 | Phase 5 | Pending |
| DEPLOY-03 | Phase 5 | Pending |
| DEPLOY-04 | Phase 5 | Pending |
| DEPLOY-05 | Phase 5 | Pending |
| DEPLOY-06 | Phase 5 | Pending |
| DEPLOY-07 | Phase 5 | Pending |
| DEPLOY-08 | Phase 5 | Pending |
| POLISH-01 | Phase 6 | Pending |
| POLISH-02 | Phase 6 | Pending |
| POLISH-03 | Phase 6 | Pending |
| POLISH-04 | Phase 6 | Pending |
| POLISH-05 | Phase 6 | Pending |
| POLISH-06 | Phase 6 | Pending |
| POLISH-07 | Phase 6 | Pending |
| POLISH-08 | Phase 6 | Pending |
| POLISH-09 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 78 total (added WAGTAIL-09, WAGTAIL-10 on 2026-05-01)
- Mapped to phases: 78
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-30*
*Last updated: 2026-05-01 — added WAGTAIL-09 (MinIO storage) and WAGTAIL-10 (Docker Compose); rewrote DEPLOY-01..08 for Docker/Traefik/MinIO topology; updated Out of Scope table to reflect locked architecture changes.*
