# Roadmap: Arduino Learning Hub (Ukrainian)

**Created:** 2026-04-30
**Last updated:** 2026-05-01 — switched BE/deployment topology to Docker (Traefik + Wagtail + Postgres + MinIO); added WAGTAIL-09/10; rewrote DEPLOY-01..08; locked SSG-only / no-SSR-ever.
**Granularity:** coarse (6 phases — solo developer pacing)
**Coverage:** 78 / 78 v1 requirements mapped
**Build order:** FE-first with mocked data → contract lockdown → static page templates → Wagtail BE in Docker (post 2026-05-04) → Dockerized single-VPS deployment → content + polish.

## Phases

- [ ] **Phase 1: Foundation & Typography Gate** — Day-zero locale + secrets discipline; self-hosted Cyrillic-complete font stack; SCSS token system; Ukrainian glyph audit harness page; light-only-v1 commitment.
- [ ] **Phase 2: Primitives, Two-Column Layout & Page-Model Contract** — `core-ui` primitives (Heading, Body, Aside, Sidenote, Figure, CodeBlock with diff/annotations, Pinout, PageShell, TwoColumn, MarginRail); three-breakpoint sidenote behavior; TypeScript content models locked; `ContentApi` interface + `MockContentApi` with real Ukrainian fixtures.
- [ ] **Phase 3: Page Templates, Routing & Static Build** — All page templates (lesson/article/datasheet/schematic/library/home/about/404); routing; SSG prerender via `outputMode: "static"`; CSR-only `/preview/*` stub; Lighthouse gates met; **30–60 min Wagtail StreamField spike at phase exit** validates contract before BE work begins.
- [ ] **Phase 4: Wagtail Backend Skeleton & Contract Match** — Wagtail 7.4 LTS conforms 1:1 to FE contract; DRF v2 with server-side `expand_db_html`; `wagtail-headless-preview` wired; `WagtailContentApi` flips mock→real. **Cannot start before 2026-05-04** (Wagtail 7.4 LTS release).
- [ ] **Phase 5: Single-VPS Deployment** — Caddy + gunicorn + systemd + PostgreSQL 17 on Ubuntu 24.04; auto-TLS; off-site backups with tested restore drill before any content publishes; `ufw` lockdown; reproducible `deploy.sh`.
- [ ] **Phase 6: Content Migration, Differentiators & Editorial Polish** — All initial content in Wagtail; drop caps; glossary tooltips; pin/peripheral references; numbered figure cross-refs; pinout hover hotspots; SEO/JSON-LD; RSS feed; print stylesheet; full WCAG AA pass; final force-en locale audit.

## Phase Details

### Phase 1: Foundation & Typography Gate
**Goal**: The typographic and locale foundation is locked — every Ukrainian glyph the site will ever need renders correctly in every weight/style; the SCSS token system is in place; locale leakage and secret leakage are structurally prevented from day zero.
**Depends on**: Nothing (first phase)
**Requirements**: TYPE-01, TYPE-02, TYPE-03, TYPE-04, TYPE-05, TYPE-06, TYPE-07, TYPE-08, TYPE-09, TYPE-10, UKR-01, UKR-04, UKR-05, UKR-06
**Success Criteria** (what must be TRUE):
  1. The Ukrainian glyph audit harness page renders `і ї є ґ Ї Є Ґ ʼ` correctly in regular, italic, bold, and bold-italic for body, display, and mono — verified visually side-by-side, no synthesized italics, no fallback `ґ`.
  2. A typography specimen page set in real Ukrainian Arduino prose (NOT Lorem Ipsum) shows comfortable measure (~55–65ch) with ragged-right body, no FOIT on font load, no measurable CLS from font swap.
  3. Changing the font pairing requires editing exactly one file (`styles/tokens/_typography.scss`) — proven by a dry-run swap.
  4. `<html lang="uk">` is set globally, `LOCALE_ID = 'uk-UA'` is registered, `Intl.DateTimeFormat('uk-UA')` and `Intl.NumberFormat('uk-UA')` produce Ukrainian-formatted output on a demo route — verified under a force-en browser locale.
  5. Day-zero hygiene is in place: `.env` is gitignored, `gitleaks` runs as a pre-commit hook, the force-en locale audit checklist exists at `docs/force-en-audit.md` and has been run once.
**Plans**: 6 plans
  - [ ] 01-01-PLAN.md — Repo scaffold + Angular 21 SSG app + tooling (pnpm/ESLint/Stylelint/Prettier/Vitest)
  - [ ] 01-02-PLAN.md — Font pipeline: subsetting + six variable woff2 + Fontaine fallback metrics
  - [ ] 01-03-PLAN.md — SCSS token system + base CSS + index.html font preloads
  - [ ] 01-04-PLAN.md — Locale & i18n hygiene: LOCALE_ID + intl facade + ESLint guardrail
  - [ ] 01-05-PLAN.md — Glyph audit harness page (`/dev/glyph-audit`) — matrix + specimen + locale demo
  - [ ] 01-06-PLAN.md — Day-zero security + CI + audit docs + TYPE-06 dry-run swap evidence
**UI hint**: yes

### Phase 2: Primitives, Two-Column Layout & Page-Model Contract
**Goal**: The design system primitives are built, the two-column body+margin layout works at all three breakpoints, and the TypeScript page-model contract that Wagtail must later conform to is locked and exercised by real Ukrainian mock data.
**Depends on**: Phase 1
**Requirements**: PRIM-01, PRIM-02, PRIM-03, PRIM-04, PRIM-05, PRIM-06, PRIM-07, PRIM-08, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05, CONTRACT-01, CONTRACT-03, CONTRACT-04, UKR-02, UKR-03
**Success Criteria** (what must be TRUE):
  1. A standalone primitive showcase page renders every `core-ui` primitive (Heading, Body, Lede, Aside, Sidenote, Figure, FigureCaption, CodeBlock, Diff, Pinout, PageShell, TwoColumn, MarginRail) using real Ukrainian content; primitives are consumed only via the `core-ui` public API.
  2. The two-column body+sidenote layout is visually correct at ≥1200px (true margin column), inlines under the anchor paragraph at 768–1199px, and collapses to a `<details>` disclosure under 768px — verified by manual breakpoint resize on the showcase page.
  3. A `CodeBlock` instance demonstrates Arduino C++ syntax highlighting (Shiki at build-time), line numbers, copy-to-clipboard, diff markers, and per-line margin annotations vertically aligned to their target lines on a wide viewport.
  4. `content/models/*.ts` (`Lesson`, `Article`, `Datasheet`, `Schematic`, and the shared `Block` discriminated union) is locked and committed; `MockContentApi` reads `/assets/mock-data/*.json` containing at least 3 real Ukrainian lessons, 1 article, 2 datasheets, 1 schematic.
  5. The Ukrainian text pre-processor transforms `"…"`→`«…»`, `--`→`—`, ranges to en-dash, and inserts NBSPs after one-letter prepositions; running the same fixture through it twice is a no-op (idempotent), and the force-en locale audit passes for all primitives.
**Plans**: 6 plans
  - [ ] 02-01-PLAN.md — `core-ui` workspace library scaffold + ESLint boundary rule + path alias
  - [ ] 02-02-PLAN.md — TS content models + ContentApi/MockContentApi + 7 Ukrainian fixtures + fixture lint + copy style guide (UKR-02/UKR-03 reframed per D-PRE-01..05)
  - [ ] 02-03-PLAN.md — 10 editorial primitives + `measure.ts` pure-fn geometry with Vitest (highest-value test)
  - [ ] 02-04-PLAN.md — Layout primitives: PageShell + MarginRail + TwoColumn (JS-measured sidenote anchoring)
  - [ ] 02-05-PLAN.md — CodeBlock primitive (frame + line numbers + copy interaction + diff visuals + annotation alignment) with DOM test
  - [ ] 02-06-PLAN.md — `/dev/primitives` showcase page + DI wiring + prerender exclusion + 3-breakpoint walk + force-en audit
**UI hint**: yes

### Phase 3: Page Templates, Routing & Static Build
**Goal**: Every public route is a real, prerendered page consuming the `ContentApi`; the build ships as a static folder of HTML/JS/CSS/woff2 with no runtime Node dependency; the Wagtail spike at phase exit confirms the locked contract is buildable in Wagtail 7.4 before any BE work starts.
**Depends on**: Phase 2
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07, PAGE-08, PAGE-09, PAGE-10, PAGE-11, CONTRACT-02, PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06
**Success Criteria** (what must be TRUE):
  1. A reader can visit `/`, `/lessons`, `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug`, `/about`, and a missing route in the prerendered build, see editorial-quality typography on each, and prev/next-lesson navigation works on the lesson template.
  2. The lesson library renders as a typographic table-of-contents (NOT a card grid), with optional difficulty markers and Ukrainian-formatted estimated read time; all pages consume content via `ContentApi` (no direct HTTP).
  3. `ng build` produces a folder of static HTML/JS/CSS/woff2 — no `arduino-ssr.service`, no Node runtime needed; `/preview/<contentType>/<token>` is present as a CSR-only stub inside the same static bundle.
  4. Lighthouse on a representative lesson page meets LCP < 2.5s, CLS < 0.1, INP < 200ms; every figure on every template uses NgOptimizedImage with explicit dimensions; force-en locale audit passes for all templates.
  5. A 30–60 minute Wagtail 7.4 StreamField spike (executed at phase exit, on or after 2026-05-04) confirms `CodeBlock = StructBlock(language, code, annotations=ListBlock({line, note}))` produces a serialized shape that matches `Block.code` in `content/models/*.ts` — design freeze checkpoint signed off.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Wagtail Backend Skeleton & Contract Match (Dockerized)
**Goal**: Wagtail 7.4 LTS is the source of truth for content, runs in Docker against Postgres + MinIO, conforms 1:1 to the FE-locked contract, and the editor can preview unpublished drafts via the Angular `/preview/*` route (CSR). The mock→real swap is one DI configuration change.
**Depends on**: Phase 3 (FE contract locked + spike validated). **External dependency: Wagtail 7.4 LTS release on 2026-05-04 — phase cannot start before this date.**
**Requirements**: WAGTAIL-01, WAGTAIL-02, WAGTAIL-03, WAGTAIL-04, WAGTAIL-05, WAGTAIL-06, WAGTAIL-07, WAGTAIL-08, WAGTAIL-09, WAGTAIL-10
**Success Criteria** (what must be TRUE):
  1. Wagtail 7.4 LTS + Django 5.2 LTS + Python 3.13 + PostgreSQL 17 + psycopg 3.2 is up inside Docker Compose (services: `wagtail`, `postgres`, `minio`); `uv` + `Ruff` manage Python tooling inside the wagtail image; page models for `Lesson`, `Article`, `Datasheet`, `Schematic` exist with field names matching `content/models/*.ts` exactly.
  2. The Wagtail REST API v2 returns a serialized lesson whose JSON shape is byte-compatible with `MockContentApi`'s fixture for the same slug — verified by a contract test that runs both APIs and diffs the response; rich-text HTML is `expand_db_html`-resolved server-side. Image renditions resolve through MinIO URLs (presigned where appropriate; public-read for the renditions prefix).
  3. `django-storages[s3]` + `boto3` are configured against the MinIO container; uploading an image via Wagtail admin places original + generated renditions in the MinIO bucket, NOT on the local filesystem (verified by `mc ls` against the bucket).
  4. An editor can edit a draft lesson in the Wagtail admin, click Preview, and see the unpublished content render through the Angular `/preview/<contentType>/<token>` route (CSR-only) via `wagtail-headless-preview` redirect mode.
  5. Setting an environment flag flips `MockContentApi` → `WagtailContentApi` and the FE built in Phase 3 renders the same lesson identically (or with documented intentional differences) from Wagtail.
  6. Day-zero security is enforced: `.env` is gitignored, `gitleaks` pre-commit blocks secret commits, `DEBUG = False` in production settings, `ALLOWED_HOSTS` is explicit, `LANGUAGE_CODE = 'uk'`, `TIME_ZONE = 'Europe/Kyiv'`, `USE_TZ = True`; force-en audit passes for any new admin-rendered strings. MinIO credentials and Postgres password come from environment, not committed files.
  7. `docker compose -f compose.yml -f compose.dev.yml up -d` brings up the full BE stack on a fresh laptop; FE dev runs on the host (`pnpm start`) and reaches Wagtail at `http://localhost:8000` via the published Traefik route or a direct dev-only port.
**Plans**: TBD

### Phase 5: Single-VPS Deployment (Docker Compose)
**Goal**: The full stack runs on a single Ubuntu 24.04 VPS under Docker Compose with Traefik auto-TLS, daily off-site backups for both Postgres and MinIO proven by a restore drill, and a reproducible deploy script — before a single piece of real content gets published. **No Node SSR. No bare-metal Wagtail/gunicorn. No local-filesystem media.**
**Depends on**: Phase 4
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-07, DEPLOY-08
**Success Criteria** (what must be TRUE):
  1. `https://<domain>` serves the prerendered Angular bundle from the `caddy:alpine` static-FE container (Traefik handles TLS upstream); `/api/*`, `/admin/*`, `/preview/*`, `/django-static/*` route to the Wagtail container :8000; `/media/*` routes to MinIO :9000. Certificates auto-issue and auto-renew via Traefik's Let's Encrypt resolver. **NO `arduino-ssr.service`, NO host-level Caddy, NO host-level gunicorn.**
  2. PostgreSQL 17 and MinIO are reachable only on the internal Docker network (no host port published); `ufw` on the host allows only 22, 80, 443; SSH is key-only (password auth disabled). Postgres data and MinIO data live on separate named volumes (host-bound to `/srv/arduino/postgres-data` and `/srv/arduino/minio-data`) so a media-disk-fill cannot starve Postgres.
  3. A daily `pg_dump` (run via `docker compose exec` or sidecar) + `restic` job ships Postgres backups off-site to Backblaze B2; a daily `mc mirror` ships the MinIO bucket to a separate B2 bucket. A restore drill has been executed end-to-end on a fresh DB AND a fresh MinIO bucket and documented in `deploy/RESTORE.md` — completed before any author content is published.
  4. Healthchecks.io receives pings on Traefik successful cert renewal, daily Postgres backup success, and daily MinIO mirror success; an intentional failed run for each path produces an email alert to the author.
  5. Running `deploy/deploy.sh` from a fresh laptop (or twice in a row from the same machine) produces an identical, working deployment via `docker compose -f compose.yml -f compose.prod.yml up -d --build` plus migrations, `collectstatic` to MinIO, and FE-bundle rsync to the host volume mounted into the FE-static container. Quarterly `docker compose exec wagtail python manage.py wagtail_update_image_renditions --purge-only` is registered as a host cron or systemd timer. The host runs a single systemd unit `docker-compose@arduino.service` to start the stack on boot.
**Plans**: TBD

### Phase 6: Content Migration, Differentiators & Editorial Polish
**Goal**: The initial content set lives in Wagtail (mocks become E2E fixtures), every editorial differentiator that turns the site from "competent" into "feels like a book" is shipped, and a final end-to-end "Looks Done But Isn't" walk confirms no English leaks through anywhere.
**Depends on**: Phase 5
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06, POLISH-07, POLISH-08, POLISH-09, LAYOUT-06
**Success Criteria** (what must be TRUE):
  1. The same 3+ lessons, 1+ article, 2+ datasheets, and 1+ schematic from CONTRACT-04 are published in Wagtail and render correctly through `WagtailContentApi`; the original mock JSON is retained as E2E test fixtures.
  2. Lesson openers display drop caps calibrated for Cyrillic letters including Ж, Щ, Ю, М, Ї, Й; hanging punctuation and OpenType refinements (small caps where used, old-style figures where appropriate) are applied; numbered figures with `див. рис. N` cross-references resolve to the correct anchor.
  3. Hovering or focusing a glossary term in prose reveals a definition tooltip; pin/peripheral references (e.g., `pin 13`) in both prose and code link or tooltip to the relevant datasheet entry; pinout images expose hover hotspots that map to pin roles.
  4. Every prerendered page emits SEO meta tags, Open Graph tags, and JSON-LD article structured data; `/feed.xml` returns a valid RSS feed covering lessons + articles; the print stylesheet renders lessons and articles as paper-friendly typography with sidenotes inlined and navigation hidden.
  5. WCAG AA contrast is verified across every text/background combination, full keyboard navigation works on every page, and a final force-en browser-locale audit walks the entire site end-to-end with zero English leakage detected — the "Looks Done But Isn't" checklist is fully green.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Typography Gate | 0/6 | Not started | - |
| 2. Primitives, Two-Column Layout & Page-Model Contract | 0/6 | Planned | - |
| 3. Page Templates, Routing & Static Build | 0/0 | Not started | - |
| 4. Wagtail Backend Skeleton & Contract Match | 0/0 | Blocked: awaiting Wagtail 7.4 LTS (2026-05-04) | - |
| 5. Single-VPS Deployment | 0/0 | Not started | - |
| 6. Content Migration, Differentiators & Editorial Polish | 0/0 | Not started | - |

## Coverage

- v1 requirements: 78 total
- Mapped to phases: 78 ✓
- Unmapped: 0
- Per-phase counts: P1=14, P2=18, P3=18, P4=10 (added WAGTAIL-09, WAGTAIL-10), P5=8, P6=10

## Cross-Cutting Conventions

These run across every phase and are enforced at phase exits, not localized to a single phase:

- **Force-en locale audit (UKR-06):** runs at the exit of every phase that touches user-facing strings (P1, P2, P3, P4, P6).
- **Real Ukrainian content, never Lorem Ipsum:** all design comps and templates calibrate against actual Ukrainian Arduino prose from day zero.
- **Three-breakpoint review:** any phase that touches layout (P2, P3, P6) verifies behavior at <768, 768–1199, ≥1200 before exit.
- **"Looks Done But Isn't" checklist:** the project-wide checklist (typography italic Cyrillic, ґ visible, quotes, hyphenation, locale, preview, NgOptimizedImage, hydration-free, code block four features, backups, certs, secrets, deploy, rendition cleanup, monitoring, disk separation) is walked end-to-end at the close of P6 and partial-walked at every prior phase exit.

---
*Roadmap created: 2026-04-30; updated 2026-05-01 for Docker/Traefik/MinIO/no-SSR architecture.*
