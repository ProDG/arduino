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
- [ ] **UKR-02**: Ukrainian text pre-processor utility transforms straight ASCII quotes to `«…»` (primary) and `„…"` (nested), inserts em-dash `—` with surrounding spaces, en-dash `–` for numeric ranges, and inserts non-breaking spaces after one-letter prepositions (`в`, `з`, `у`, `і`, `й`, `та`, `не`, `на`, `до`, `за`, `по`)
- [ ] **UKR-03**: Pre-processor applied consistently to both static prose and rendered StreamField content
- [ ] **UKR-04**: All date/number formatting uses `Intl.DateTimeFormat('uk-UA')` and `Intl.NumberFormat('uk-UA')`; sorting uses `Intl.Collator('uk-UA')`; no `toLocaleDateString()` calls without explicit locale
- [ ] **UKR-05**: `TIME_ZONE = 'Europe/Kyiv'` set wherever times are rendered
- [ ] **UKR-06**: Force-en browser-locale audit checklist exists and is run at the end of each phase that touches user-facing strings (catches locale leakage early)

### Layout & Responsive Behavior

- [ ] **LAYOUT-01**: Two-column layout (body column + margin/sidenote column) renders correctly on screens ≥1200px
- [ ] **LAYOUT-02**: Tablet breakpoint (768–1199px) collapses sidenotes/margin content to inline disclosure or above/below body — no overlap, no horizontal scroll
- [ ] **LAYOUT-03**: Mobile breakpoint (<768px) is fully usable — single column, generous line-height, no broken sidenotes
- [ ] **LAYOUT-04**: Layout looks polished on laptop screens and gorgeous on FHD+ (≥1920px) — content does not stretch full-width; max content width respects measure
- [ ] **LAYOUT-05**: Header (with site title and primary navigation) and footer (with about/RSS/license info) render in editorial aesthetic across breakpoints
- [ ] **LAYOUT-06**: Print stylesheet exists for lessons and articles — paper-friendly typography, no nav, expanded sidenotes inline

### Component Primitives (`core-ui`)

- [ ] **PRIM-01**: `core-ui` Angular library project exists with public-API boundary (no reaching into primitive internals from features)
- [ ] **PRIM-02**: Primitives implemented: `Heading`, `Body`, `Lede`, `Aside`, `Sidenote`, `Figure`, `FigureCaption`
- [ ] **PRIM-03**: Layout primitives implemented: `PageShell`, `TwoColumn`, `MarginRail`
- [ ] **PRIM-04**: `CodeBlock` primitive with Arduino C++ syntax highlighting (Shiki at build-time), line numbers, copy-to-clipboard button, horizontal scroll on overflow, NO client-side highlighting JS
- [ ] **PRIM-05**: `CodeBlock` supports diff view ("add these lines", "remove these lines") with appropriate visual treatment
- [ ] **PRIM-06**: `CodeBlock` supports per-line margin annotations linked to specific line numbers, vertically aligned to those lines on ≥1200px breakpoint, with disclosure fallback at smaller breakpoints
- [ ] **PRIM-07**: `Pinout` primitive renders chip pinout images with hover hotspots / callouts (static for v1; no live data)
- [ ] **PRIM-08**: `Diff` primitive renders inline content diffs (text-level) for progressive lesson sections

### Page-Model Contract & Mock Data

- [ ] **CONTRACT-01**: TypeScript content models locked: `Lesson`, `Article`, `Datasheet`, `Schematic`, with shared `Block` discriminated union covering all StreamField block types (paragraph, heading, sidenote, figure, code, diff, pinout, parts-list)
- [ ] **CONTRACT-02**: `CodeBlock` model includes `language`, `code`, and `annotations: { line: number; html: string }[]` shape verified by a 30–60 minute Wagtail 7.4 spike
- [ ] **CONTRACT-03**: `ContentApi` interface defined; `MockContentApi` implementation reads from `/assets/mock-data/*.json`
- [ ] **CONTRACT-04**: Mock JSON populated with at least 3 real Ukrainian-language lessons, 1 article, 2 datasheets, 1 schematic — content drives design calibration, not Latin filler

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

### Single-VPS Deployment

- [ ] **DEPLOY-01**: Single Ubuntu 24.04 VPS provisioned; Caddy 2.8+, gunicorn 23, PostgreSQL 17, all managed by systemd; no Docker
- [ ] **DEPLOY-02**: Caddyfile configured: auto-TLS, `/api/*`, `/admin/*`, `/preview/*`, `/media/*` routed to gunicorn :8000; everything else served as static files from the prerendered Angular build
- [ ] **DEPLOY-03**: PostgreSQL connects via UNIX socket (no TCP listener); `arduino-wagtail.service` systemd unit defined and enabled
- [ ] **DEPLOY-04**: Daily off-site backups: `pg_dump` + `restic` to a remote target (e.g., Backblaze B2); restore drill executed and documented before any real content is published
- [ ] **DEPLOY-05**: Cert renewal (Caddy) and backup completion both monitored via Healthchecks.io pings; failure alerts go to author email
- [ ] **DEPLOY-06**: Quarterly cron runs `wagtail_update_image_renditions --purge-only` to prevent rendition disk bloat
- [ ] **DEPLOY-07**: `ufw` firewall allows only 22, 80, 443; SSH via key only
- [ ] **DEPLOY-08**: Reproducible `deploy.sh` script in repo (idempotent — can be re-run safely); deployment does not depend on the dev machine

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
| Real-time / autosave-driven SSR for `/preview/*` (v1) | CSR-only `/preview/*` is acceptable in v1; revisit only if Wagtail 7.4 autosave UX demands SSR. |
| Newsletter popup, autoplay video, cookie banners beyond legal minimum | Anti-features — actively excluded to protect reading experience. |
| Comments / Disqus / external embeds | Same — reading experience first. |
| CDN front (Cloudflare/Bunny) | Not needed at expected audience scale; revisit only post-launch. |
| GraphQL (`wagtail-grapple`) | REST v2 is sufficient; one less moving part for solo author. |
| Docker | Single-VPS topology is simpler with systemd + uv + pnpm directly. |
| Node SSR runtime in v1 | SSG resolution: pure prerender ships the same SEO/perf with one less service. |
| English month names anywhere in the UI | Locale leakage — actively guarded against. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TYPE-01 | TBD | Pending |
| TYPE-02 | TBD | Pending |
| TYPE-03 | TBD | Pending |
| TYPE-04 | TBD | Pending |
| TYPE-05 | TBD | Pending |
| TYPE-06 | TBD | Pending |
| TYPE-07 | TBD | Pending |
| TYPE-08 | TBD | Pending |
| TYPE-09 | TBD | Pending |
| TYPE-10 | TBD | Pending |
| UKR-01 | TBD | Pending |
| UKR-02 | TBD | Pending |
| UKR-03 | TBD | Pending |
| UKR-04 | TBD | Pending |
| UKR-05 | TBD | Pending |
| UKR-06 | TBD | Pending |
| LAYOUT-01 | TBD | Pending |
| LAYOUT-02 | TBD | Pending |
| LAYOUT-03 | TBD | Pending |
| LAYOUT-04 | TBD | Pending |
| LAYOUT-05 | TBD | Pending |
| LAYOUT-06 | TBD | Pending |
| PRIM-01 | TBD | Pending |
| PRIM-02 | TBD | Pending |
| PRIM-03 | TBD | Pending |
| PRIM-04 | TBD | Pending |
| PRIM-05 | TBD | Pending |
| PRIM-06 | TBD | Pending |
| PRIM-07 | TBD | Pending |
| PRIM-08 | TBD | Pending |
| CONTRACT-01 | TBD | Pending |
| CONTRACT-02 | TBD | Pending |
| CONTRACT-03 | TBD | Pending |
| CONTRACT-04 | TBD | Pending |
| PAGE-01 | TBD | Pending |
| PAGE-02 | TBD | Pending |
| PAGE-03 | TBD | Pending |
| PAGE-04 | TBD | Pending |
| PAGE-05 | TBD | Pending |
| PAGE-06 | TBD | Pending |
| PAGE-07 | TBD | Pending |
| PAGE-08 | TBD | Pending |
| PAGE-09 | TBD | Pending |
| PAGE-10 | TBD | Pending |
| PAGE-11 | TBD | Pending |
| PERF-01 | TBD | Pending |
| PERF-02 | TBD | Pending |
| PERF-03 | TBD | Pending |
| PERF-04 | TBD | Pending |
| PERF-05 | TBD | Pending |
| PERF-06 | TBD | Pending |
| WAGTAIL-01 | TBD | Pending |
| WAGTAIL-02 | TBD | Pending |
| WAGTAIL-03 | TBD | Pending |
| WAGTAIL-04 | TBD | Pending |
| WAGTAIL-05 | TBD | Pending |
| WAGTAIL-06 | TBD | Pending |
| WAGTAIL-07 | TBD | Pending |
| WAGTAIL-08 | TBD | Pending |
| DEPLOY-01 | TBD | Pending |
| DEPLOY-02 | TBD | Pending |
| DEPLOY-03 | TBD | Pending |
| DEPLOY-04 | TBD | Pending |
| DEPLOY-05 | TBD | Pending |
| DEPLOY-06 | TBD | Pending |
| DEPLOY-07 | TBD | Pending |
| DEPLOY-08 | TBD | Pending |
| POLISH-01 | TBD | Pending |
| POLISH-02 | TBD | Pending |
| POLISH-03 | TBD | Pending |
| POLISH-04 | TBD | Pending |
| POLISH-05 | TBD | Pending |
| POLISH-06 | TBD | Pending |
| POLISH-07 | TBD | Pending |
| POLISH-08 | TBD | Pending |
| POLISH-09 | TBD | Pending |

**Coverage:**
- v1 requirements: 76 total
- Mapped to phases: 0 (roadmap pending)
- Unmapped: 76 ⚠️ (will be populated by roadmap)

---
*Requirements defined: 2026-04-30*
*Last updated: 2026-04-30 after initial definition*
