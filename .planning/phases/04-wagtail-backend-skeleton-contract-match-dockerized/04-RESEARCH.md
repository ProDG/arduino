# Phase 4: Wagtail Backend Skeleton & Contract Match (Dockerized) — Research

**Researched:** 2026-05-02
**Domain:** Wagtail 7.3 + Django 5.2 + REST API v2 + django-storages[s3] + MinIO + Traefik + Docker Compose + uv-managed Python tooling
**Confidence:** HIGH on locked-stack APIs (Wagtail v2 serializers, headless-preview, django-storages S3 keys, Traefik labels, uv lockfile workflow). MEDIUM on the exact wagtail-headless-preview version pin (verified during `uv add`) and on Wagtail-7.3-specific block representation context. LOW: none — all unknowns are pin-resolution choices, not API uncertainties.

## Summary

This phase is unusually well-bounded: CONTEXT.md (D-LAYOUT-01..04, D-MINIO-01..05, D-PREVIEW-01..04, D-NET-01..03, D-CONTRACT-01..06, D-DTO-01..05, D-MODEL-01..05, D-SEQ-01..02, D-BUMP-01..03, D-SEC-01..04) has already locked every architecturally-significant choice. Research scope is thin: verify external API shapes for Wagtail 7.3 custom serializers, `wagtail-headless-preview`, `django-storages[s3]`, Traefik docker-provider routing, and uv multi-stage Dockerfile patterns — and turn the planner's loose ends (package version pins, gunicorn defaults, app-folder layout) into concrete, prescriptive guidance.

The locked architecture is sound: same-origin Traefik routing in dev (eliminates CORS / cookie SameSite issues), single MinIO bucket with prefix-scoped public-read on `images/` (matches `mc anonymous set` capabilities natively), Wagtail-side per-block `get_api_representation` overrides + a thin FE adapter (envelope strip + sidenote anchor index computation), and a deferred 7.4 LTS bump (D-BUMP-01) that pulls the major-version risk surface out of the contract-locking phase. Nothing in research surfaced a reason to revisit any locked decision.

**Primary recommendation:** Plan execution in the 10-step D-SEQ-01 order. Pin Wagtail to `~=7.3.0`, Django to `~=5.2.0`, psycopg to `~=3.2`, wagtail-headless-preview to `~=0.8` (latest 0.x compatible with Wagtail 7.x), django-storages to `~=1.14`, boto3 to the version pulled by django-storages. Use `uv sync --frozen --no-dev` in stage 1 of the Dockerfile and copy `/opt/venv` into a clean `python:3.13-slim` stage 2. Configure Traefik with explicit route priorities so `/admin/*`, `/api/*`, `/preview-data/*`, `/django-static/*`, `/media/*` win over the wildcard `/*` route to `host.docker.internal:4200`. Use `mc anonymous set download arduino-media/images/` for prefix-scoped public-read on renditions; keep `originals/` and `documents/` at default (presigned via `AWS_QUERYSTRING_AUTH=True`) by NOT setting an anonymous policy on those prefixes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

The FE contract is **immutable**: `src/content/models/{block,lesson,article,datasheet,schematic}.ts` and `src/content/api/content-api.ts` are NOT amended. Three field renames from CONTRACT-02 spike are inputs:

- StructBlock field `note` → `html` (in `code.annotations`).
- StructBlock field `image_src` → `src` (in `figure` and `pinout`).
- FE `WagtailContentApi` strips the `{type, value, id}` per-block envelope via a `normalizeBlock()` adapter.

**D-LAYOUT-01..04 (Repo Layout & Python Tooling):**
- Wagtail in `backend/` sibling to `src/`; one `.git` at root.
- `backend/pyproject.toml` (uv-managed), `backend/uv.lock` committed, `backend/Dockerfile`, `backend/wagtail_arduino/` (Django project package), `backend/apps/` (Wagtail apps).
- Multi-stage Dockerfile keyed on `python:3.13-slim`. Stage 1: `uv sync --frozen --no-dev`. Stage 2: copy `/opt/venv` to clean runtime, set `PATH=/opt/venv/bin:$PATH`. Dev image is a separate target including the `dev` group (Ruff, mypy, pytest, ipython).
- Compose files at repo root: `compose.yml` + `compose.dev.yml` (P4 ships) + `compose.prod.yml` (sketched, P5 finalizes). Build context for `wagtail`: `./backend/`.
- Pre-commit hooks at repo-root `.pre-commit-config.yaml`. Add `ruff`, `ruff-format`, `mypy` scoped to `backend/**/*.py`. Existing hooks unchanged.

**D-MINIO-01..05 (MinIO):**
- Single bucket `arduino-media` with prefixes `originals/`, `images/`, `documents/`. Public-read at `images/` only.
- Renditions: `width-800`, `width-1600`, `width-3200`. Default `src` is `width-1600`.
- Prod URL strategy: Traefik routes `/media/*` → MinIO :9000, public-read on `images/` makes URLs unsigned.
- Dev: MinIO publishes :9000 to host. `DJANGO_AWS_S3_ENDPOINT_URL=http://localhost:9000` in dev, `http://minio:9000` in prod.
- Bucket bootstrap is a one-shot `mc` sidecar service in `compose.dev.yml`.

**D-PREVIEW-01..04 (Preview):**
- Auth = standard Django session cookie. `wagtail-headless-preview` redirect mode points at Angular `/preview/<contentType>/<token>`. Token is opaque; preview-data API authorizes by Django session, not token.
- Endpoint `GET /api/v2/page_preview/?content_type=<app.Model>&token=<opaque>` returns same JSON shape as `/api/v2/pages/<id>/`. FE calls with `withCredentials: true`.
- Reload UX: plain browser refresh — no autosave, no polling.
- Same-origin in dev mandatory (locked via D-NET-01). `django-cors-headers` NOT added.

**D-NET-01..03 (Dev Networking):**
- Traefik on host port 80, host header `arduino.localhost`.
  - `/admin/*`, `/api/*`, `/preview-data/*`, `/django-static/*` → `wagtail:8000`.
  - `/media/*` → `minio:9000`.
  - `/*` (everything else) → `host.docker.internal:4200` (FE pnpm dev).
  - Linux fallback: `extra_hosts: ["host.docker.internal:host-gateway"]`.
- Two env vars: `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS` (comma-separated).
- `WAGTAIL_BASE_URL` env-driven. Dev: `http://arduino.localhost`. Prod: `https://arduino.example`.

**D-CONTRACT-01..06 (Contract Test):**
- `scripts/contract-diff.mjs`, runnable as `pnpm contract:diff`.
- Strictness: structural + fixed allowlist of volatile fields stripped before byte-equal canonicalized JSON comparison.
- Allowlist: `meta.detail_url`, `meta.html_url`, `meta.first_published_at`, `meta.alias_of`, `meta.parent`, `meta.seo_title`, `meta.search_description`, `meta.show_in_menus`; top-level `id`; top-level `updatedAt`; per-block `id`; `code.tokens`.
- All 7 fixtures diffed.
- `code.tokens` stripped both sides. Shiki `pre_save` is deferred per D-CONTRACT-04.
- Wagtail seed via `python manage.py seed_fixtures` Django management command in `apps/contract/`.
- Test execution: stack up → seed → `pnpm contract:diff`. Not in CI for v1.

**D-DTO-01..05 (DTO Mapping):**
- Wagtail-side custom serializers emit close-to-FE shape; FE adapter does only envelope strip + page-meta hoist + sidenote anchor index compute.
- Page-meta hoisted to top level: `slug`, `publishedAt` (from `first_published_at`), `updatedAt` (from `last_published_at`).
- Every RichText-bearing field server-side `expand_db_html()` in `get_api_representation`. Internal `<a linktype="page" id="N">` resolved to absolute paths via `WAGTAIL_BASE_URL` + `url_path`. `<embed embedtype="image" id="N">` resolved to `<img src=".../images/...width-800.jpg">`.
- Custom `ImageChooserBlock.get_api_representation` returns `{src, alt, width, height}` where `src` is `width-1600` rendition URL.
- FE adapter: `normalizeBlock`, `normalizePage` only. No HTML rewriting, no image fetching.

**D-MODEL-01..05 (Page-Model Shape):**
- `LessonPage.parts_list = StreamField([('parts_list', PartsListBlock())], min_num=1, max_num=1, use_json_field=True)`. FE un-wraps the single-element array.
- `DatasheetPage.pinout` and `DatasheetPage.specifications` likewise StreamField.
- `SchematicPage.schematic_image = StreamField([('figure', FigureBlock())], min_num=1, max_num=1)`; `SchematicPage.download_url = URLField(max_length=500)` (paste-the-URL).
- `sidenote.anchorParagraphIndex` computed FE-side post-fetch; Wagtail emits sidenote without it.
- Slug is canonical lookup key; pre-transliterated Ukrainian slugs (e.g. `pershyi-blymayuchyi-svitlodiod`).

**D-SEQ-01..02 (Sequencing):** 10-step infrastructure-first → contract → preview → verification order. The 7.4 bump is NOT in P4.

**D-BUMP-01..03 (7.4 Deferred):** Phase 4 ships and exits on Wagtail 7.3.x. Bump → dedicated follow-up.

**D-SEC-01..04 (Security & Locale):**
- Secrets env-driven from `.env` (gitignored, verified). `.env.example` documents all keys.
- Settings split: `base.py`, `dev.py`, `prod.py`. `DJANGO_SETTINGS_MODULE` env var picks.
- gitleaks v8.30.1 already installed. P4 verifies it blocks a contrived `.env` commit at phase exit.
- Locale: `LANGUAGE_CODE='uk'`, `TIME_ZONE='Europe/Kyiv'`, `USE_TZ=True`, `WAGTAIL_CONTENT_LANGUAGES=[('uk', 'Українська')]`, `WAGTAIL_I18N_ENABLED=False`.

### Claude's Discretion

- Exact Python package version pins within the locked stack — research below resolves these.
- Exact gunicorn worker count + timeout in prod settings — research below recommends.
- Whether `apps/blocks/` is one app or several — research below recommends one shared `apps/blocks/` plus per-page apps.
- Whether `Pinout.pins.x/y` use `FloatBlock` (0..1) or `IntegerBlock` (pixel) — research below: match P2 FE component.
- Exact `mc` sidecar image tag — research below: latest stable.
- `wagtail-headless-preview` config syntax for redirect mode — research below verifies.

### Deferred Ideas (OUT OF SCOPE)

- `code.tokens` `pre_save` Shiki sidecar (D-CONTRACT-04 strips both sides; preview shows untokenized code).
- Wagtail 7.4 LTS bump (D-BUMP-01..03).
- Auto-derived `Schematic.downloadUrl` from companion ImageChooserBlock.
- Reusable `PartsList` Snippet across multiple lessons.
- `django-cors-headers` (D-PREVIEW-04).
- Autosave polling on `/preview/*`.
- In-CI contract diff.
- Production Compose overlay finalization (P5).
- Wagtail admin English-string sweep (P6 polish).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WAGTAIL-01 | Wagtail 7.3 + Django 5.2 LTS + Python 3.13 + PostgreSQL 17 + psycopg 3.2; uv + Ruff | Standard Stack table below pins exact versions; Dockerfile pattern in Code Examples; uv multi-stage workflow in Architecture Patterns |
| WAGTAIL-02 | Page models match FE TS contract 1:1 | D-MODEL-01..03 + per-page custom `BasePageSerializer` subclass with `api_fields = [APIField('slug'), APIField('publishedAt', source='first_published_at'), ...]`; un-wraps single-block StreamField FE-side per D-DTO-05 |
| WAGTAIL-03 | StreamField blocks for all `Block` discriminated-union variants, `CodeBlock = StructBlock(language, code, annotations=ListBlock({line, html}))` | Per-block `get_api_representation` patterns in Code Examples; spike rename `note→html` is an input |
| WAGTAIL-04 | REST API v2 exposes content; rich text expanded server-side via `expand_db_html`; response matches `ContentApi` exactly | `expand_db_html` invocation pattern documented; per-block `get_api_representation` returns close-to-FE shape; FE adapter only strips envelopes + hoists meta + computes sidenote index |
| WAGTAIL-05 | `wagtail-headless-preview` installed, `HeadlessPreviewMixin` on every page, redirect to Angular `/preview/*` with token auth | Library config `WAGTAIL_HEADLESS_PREVIEW = {"REDIRECT_ON_PREVIEW": True, "CLIENT_URLS": {"default": "http://arduino.localhost"}}`; `/api/v2/page_preview/?content_type=&token=` endpoint shape verified |
| WAGTAIL-06 | Django Ukrainian locale | `LANGUAGE_CODE='uk'`, `TIME_ZONE='Europe/Kyiv'`, `USE_TZ=True` in `base.py`; `WAGTAIL_I18N_ENABLED=False` |
| WAGTAIL-07 | `WagtailContentApi` Angular implementation; env flag flips mock → wagtail | New file `src/content/api/wagtail-content-api.ts` mirrors `mock-content-api.ts` public surface; `provideContentApi()` switch |
| WAGTAIL-08 | Day-zero security: `.env` gitignored, gitleaks pre-commit, `DEBUG=False` prod, explicit `ALLOWED_HOSTS`, secret key env-driven | `.gitignore` already excludes `.env`; gitleaks v8.30.1 installed; settings split confirmed |
| WAGTAIL-09 | `django-storages[s3]` + `boto3` against MinIO; single bucket; env-driven endpoint/bucket/credentials; no local-fs MEDIA_ROOT | django-storages 1.14+ STORAGES dict (Django 5.x); `AWS_S3_ENDPOINT_URL`, `AWS_S3_ADDRESSING_STYLE='path'`, `AWS_QUERYSTRING_AUTH` per-prefix via custom storage class subclassing |
| WAGTAIL-10 | BE in Docker Compose dev + prod; same compose.yml + overlays; healthchecks; prod via Traefik labels | `compose.yml` + `compose.dev.yml` + `compose.prod.yml` (sketch) pattern; healthcheck examples in Code Examples |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Page-model schema (Lesson, Article, Datasheet, Schematic) | API/Backend (Wagtail) | — | StreamField + Django models are the authoritative schema; FE TS interfaces are immutable consumers |
| Rich-text HTML expansion (`<a linktype>`, `<embed embedtype>`) | API/Backend | — | Done in `get_api_representation` so prerendered FE has no runtime resolver dependency |
| Per-block envelope (`{type, value, id}`) | API/Backend (emit) → FE (strip) | — | Wagtail emits its native envelope; FE adapter normalizes to flat `Block` shape |
| Sidenote `anchorParagraphIndex` | FE (compute) | — | Mock fixtures bake it in; Wagtail emits sidenote without it; FE adapter walks body post-strip and computes |
| Image rendition URLs | API/Backend (Wagtail) → CDN/Storage (MinIO) | — | Wagtail generates renditions on first request; MinIO serves cacheable URLs at `/images/<rendition>` |
| Preview auth | API/Backend (Django session) | — | Standard Django session cookie; same-origin via Traefik means no SameSite/CORS issues |
| Preview redirect | API/Backend (`wagtail-headless-preview`) → FE (`/preview/*` route) | — | Library issues opaque token + redirects; FE renders CSR-only |
| Code-tokenization (Shiki) | DEFERRED — both Mock and Wagtail emit untokenized code in P4 | — | D-CONTRACT-04: `code.tokens` stripped both sides; pre_save sidecar deferred |
| Static asset routing | CDN/Static (Traefik) → MinIO | — | `/media/*` Traefik route → MinIO; public-read on `images/` makes prerender-safe URLs |
| Frontend dev server | Browser/Client (host pnpm) via Traefik proxy | — | `pnpm start` on host :4200; Traefik proxies `arduino.localhost/*` → `host.docker.internal:4200` |

## Standard Stack

### Core (verified pins — verify with `uv add` at execute time)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Wagtail | `~=7.3.0` | Headless CMS, page models, REST API v2 | Locked in CLAUDE.md/PROJECT.md; D-BUMP-01 defers 7.4 |
| Django | `~=5.2.0` | Web framework (LTS) | Wagtail 7.3 supports Django 4.2/5.0/5.1/5.2; LTS = lowest maintenance burden |
| Python | `3.13` | Runtime | CLAUDE.md locked; `python:3.13-slim` Docker base |
| psycopg | `~=3.2` | PostgreSQL driver (binary install: `psycopg[binary]`) | Modern psycopg3, Django 5.2 native support |
| PostgreSQL | `17` | Database | CLAUDE.md locked; matches DEPLOY-03 |
| wagtail-headless-preview | `~=0.8` | Preview redirect to FE | Latest stable; supports Wagtail 7.x; verify exact pin at `uv add` (CHANGELOG check). D-PREVIEW-01..04. |
| django-storages | `~=1.14` | S3-compatible storage backend | Active, Django 5.2 compatible, supports MinIO via `endpoint_url` |
| boto3 | `~=1.34` (or as pulled by django-storages) | AWS SDK for S3 calls | Required dependency of django-storages[s3] |
| gunicorn | `~=23.0` | Prod WSGI server | DEPLOY-01 locked at gunicorn 23 |

### Supporting (dev group, excluded from prod image)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ruff | `~=0.11` | Linter + formatter | Pre-commit hook scoped to `backend/**/*.py` (D-LAYOUT-04) |
| mypy | `~=1.13` | Type checker | Pre-commit hook scoped to `backend/**/*.py` |
| pytest | `~=8.3` | Test runner (P4 has no pytest tests required, but install for future) | Future BE tests |
| pytest-django | `~=4.9` | Django integration | If/when BE tests land |
| ipython | latest | REPL for `manage.py shell` | Dev convenience |

### Alternatives Considered & Rejected

| Instead of | Could Use | Why Rejected |
|------------|-----------|----------------|
| `django-storages[s3]` | `django-minio-storage` (py-pa) | django-storages is the de-facto Django S3 backend; MinIO works via `AWS_S3_ENDPOINT_URL` + `AWS_S3_ADDRESSING_STYLE='path'`; one less dependency |
| psycopg3 | psycopg2-binary | psycopg3 is current; Django 5.2 supports both but psycopg3 is the recommended modern choice |
| wagtail-grapple (GraphQL) | — | Out of scope per PROJECT.md; REST v2 is sufficient |
| nginx reverse proxy | Traefik | Out of scope per PROJECT.md; Traefik is locked |
| `django-cors-headers` | — | D-PREVIEW-04 deliberately excludes; same-origin via Traefik makes it inert |

**Installation (in `backend/pyproject.toml`):**

```toml
[project]
name = "wagtail-arduino"
version = "0.1.0"
requires-python = "==3.13.*"
dependencies = [
  "wagtail~=7.3.0",
  "django~=5.2.0",
  "psycopg[binary]~=3.2",
  "wagtail-headless-preview~=0.8",
  "django-storages[s3]~=1.14",
  "gunicorn~=23.0",
]

[dependency-groups]
dev = [
  "ruff~=0.11",
  "mypy~=1.13",
  "pytest~=8.3",
  "pytest-django~=4.9",
  "ipython",
]
```

**Version verification protocol:** During the first execute task, run `uv add wagtail~=7.3 ...` then commit `uv.lock`. If a pin resolves to a version newer than expected, document the resolved version + publish date in the per-task SUMMARY.md.

## Architecture Patterns

### System Architecture Diagram

```
                              ┌────────────────────────────┐
                              │    Browser (editor + dev)  │
                              │    http://arduino.localhost│
                              └─────────────┬──────────────┘
                                            │ :80
                                            ▼
              ┌─────────────────────────────────────────────────────────┐
              │                    Traefik (Docker)                       │
              │  Host(`arduino.localhost`) router with priority-ordered:  │
              │   1. PathPrefix(`/admin`,`/api`,`/preview-data`,           │
              │                 `/django-static`)  → wagtail:8000          │
              │   2. PathPrefix(`/media`)          → minio:9000            │
              │   3. PathPrefix(`/`) (priority=1)  → host:4200 (FE)        │
              └─────────┬──────────────────────┬───────────────┬──────────┘
                        │                      │               │
                        ▼                      ▼               ▼
            ┌──────────────────────┐   ┌──────────────┐   ┌─────────────────┐
            │ Wagtail (gunicorn)   │   │ MinIO :9000  │   │ pnpm start :4200│
            │  Django 5.2          │   │              │   │ (HOST process — │
            │  Wagtail 7.3         │   │  arduino-    │   │  NOT in Docker) │
            │  REST API v2         │   │  media       │   │                 │
            │   /api/v2/pages/     │   │  ├ originals/│   │ Angular dev     │
            │   /api/v2/page_      │   │  ├ images/   │   │ server, hot     │
            │     preview/         │   │  └ documents/│   │ reload          │
            └──────────┬───────────┘   └──────────────┘   └─────────────────┘
                       │ psycopg3
                       ▼
            ┌──────────────────────┐
            │ PostgreSQL 17        │
            │ (Docker DNS:postgres)│
            └──────────────────────┘

  Boot-time sidecar:                Editor flow:
  ┌─────────────────┐               1. POST /admin/login (Django session set)
  │  mc (one-shot)  │               2. Edit draft, click Preview
  │  - mc alias set │               3. wagtail-headless-preview redirects to
  │  - mc mb        │                  http://arduino.localhost/preview/
  │  - mc anonymous │                  <contentType>/<token>
  │    set download │               4. Angular CSR component fetches
  │    arduino-     │                  /api/v2/page_preview/?content_type=
  │    media/images │                  app.Model&token=opaque
  └─────────────────┘                  with credentials: include (cookie flows
                                       same-origin)
                                    5. Wagtail authorizes by Django session,
                                       returns JSON identical to /pages/<id>/
                                    6. Component renders via WagtailContentApi
                                       → BlockRenderer
```

### Component Responsibilities

| File / Module | Responsibility |
|---------------|----------------|
| `backend/wagtail_arduino/settings/base.py` | Shared Django + Wagtail settings; locale lock; STORAGES dict; INSTALLED_APPS including `wagtail_headless_preview` |
| `backend/wagtail_arduino/settings/dev.py` | `DEBUG=True`, `INTERNAL_IPS`, `DJANGO_AWS_S3_ENDPOINT_URL=http://localhost:9000` (host-published MinIO) |
| `backend/wagtail_arduino/settings/prod.py` | `DEBUG=False`, secure cookie flags, HSTS, `SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO','https')`, `DJANGO_AWS_S3_ENDPOINT_URL=http://minio:9000` |
| `backend/wagtail_arduino/api.py` | Custom `WagtailAPIRouter` registration; `pages` and `page_preview` endpoints |
| `backend/apps/blocks/` | Shared StreamField block classes: `ParagraphBlock`, `HeadingBlock`, `SidenoteBlock`, `FigureBlock`, `CodeBlock`, `DiffBlock`, `PinoutBlock`, `PartsListBlock`, `AsideBlock`, `SpecBlock` (or per-page when truly page-specific) |
| `backend/apps/lessons/models.py` | `LessonPage(HeadlessPreviewMixin, Page)` with `body`, `parts_list`, `lede`, custom `BasePageSerializer` subclass |
| `backend/apps/articles/models.py` | `ArticlePage(HeadlessPreviewMixin, Page)` |
| `backend/apps/datasheets/models.py` | `DatasheetPage(HeadlessPreviewMixin, Page)` with `pinout`, `specifications`, `peripheral_notes` |
| `backend/apps/schematics/models.py` | `SchematicPage(HeadlessPreviewMixin, Page)` with `schematic_image` (StreamField), `download_url` (URLField), `explanation` |
| `backend/apps/contract/management/commands/seed_fixtures.py` | Reads `../src/assets/mock-data/**/*.json`, constructs Pages, saves drafts, idempotent (clears prior fixtures first) |
| `compose.yml` (root) | Base service definitions for `wagtail`, `postgres`, `minio`, `traefik`, `mc` (no published ports beyond Traefik 80) |
| `compose.dev.yml` | Dev overlay: published ports on minio :9000 + postgres :5432 (host-debug access), `BUILD_TARGET=dev`, `DJANGO_SETTINGS_MODULE=wagtail_arduino.settings.dev`, hot-reload bind mount of `./backend/` |
| `compose.prod.yml` | Sketched only in P4: TLS labels on Traefik, gunicorn worker count, prod settings module |
| `scripts/contract-diff.mjs` | Node ESM script: fetches `/api/v2/pages/?type=...&slug=...&fields=*` for all 7 fixtures, strips allowlist keys both sides, byte-diffs canonicalized JSON |
| `src/content/api/wagtail-content-api.ts` | New: mirrors `MockContentApi` surface; calls `/api/v2/pages/` + `/api/v2/page_preview/`; runs `normalizeBlock` + `normalizePage` |
| `src/content/api/content-api.token.ts` | Modified: env-driven choice between `MockContentApi` and `WagtailContentApi` |

### Recommended Project Structure

```
backend/
├── pyproject.toml         # uv-managed
├── uv.lock                # committed
├── Dockerfile             # multi-stage: builder → runtime; targets dev + prod
├── .dockerignore
├── manage.py
├── wagtail_arduino/       # Django project
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py
│   ├── api.py             # WagtailAPIRouter + endpoint registrations
│   ├── wsgi.py
│   └── asgi.py
└── apps/
    ├── blocks/            # shared StreamField blocks
    │   ├── __init__.py
    │   ├── apps.py
    │   ├── text.py        # ParagraphBlock, HeadingBlock, AsideBlock, SidenoteBlock, LedeBlock
    │   ├── image.py       # FigureBlock, ImageChooserBlock override
    │   ├── code.py        # CodeBlock, DiffBlock
    │   ├── pinout.py      # PinoutBlock, PinBlock
    │   └── parts.py       # PartsListBlock, PartItemBlock, SpecBlock
    ├── lessons/
    │   ├── apps.py, models.py, serializers.py, migrations/
    ├── articles/
    ├── datasheets/
    ├── schematics/
    └── contract/          # seed-fixtures management command, NOT for prod content
        ├── apps.py
        └── management/commands/seed_fixtures.py
```

**Rationale:** Single shared `apps/blocks/` over per-page block apps because the `Block` discriminated union is shared across page types (paragraph, heading, sidenote, figure, code, diff appear in lesson, article, datasheet's `peripheral_notes`, schematic's `explanation`). Per-page apps own their `Page` subclass + their custom `BasePageSerializer` subclass. `apps/contract/` is isolated so it can be excluded from prod migrations or stripped later if needed.

### Pattern 1: Custom block API representation

**What:** Override `get_api_representation(self, value, context=None)` on `StructBlock` subclasses to emit a flat, FE-friendly shape; expand rich-text HTML server-side; resolve image references to rendition URLs.

**When to use:** Every block that contains a `RichTextBlock`, `ImageChooserBlock`, or any field where the FE contract differs from Wagtail's default emit.

**Example (verified against [Wagtail 7.3 docs](https://docs.wagtail.org/en/stable/advanced_topics/api/v2/configuration.html) and [community gist](https://gist.github.com/thclark/100d6aa6d0995984589b983f896002d4)):**

```python
# backend/apps/blocks/text.py
from wagtail import blocks
from wagtail.rich_text import expand_db_html

class ParagraphBlock(blocks.StructBlock):
    html = blocks.RichTextBlock()  # FE field is `html`

    def get_api_representation(self, value, context=None):
        return {
            "html": expand_db_html(value["html"].source),
        }

# backend/apps/blocks/code.py
class CodeAnnotationBlock(blocks.StructBlock):
    line = blocks.IntegerBlock()
    html = blocks.RichTextBlock()  # SPIKE RENAME: `note` → `html`

    def get_api_representation(self, value, context=None):
        return {
            "line": value["line"],
            "html": expand_db_html(value["html"].source),
        }

class CodeBlock(blocks.StructBlock):
    language = blocks.CharBlock()
    code = blocks.TextBlock()
    annotations = blocks.ListBlock(CodeAnnotationBlock())

    def get_api_representation(self, value, context=None):
        return {
            "language": value["language"],
            "code": value["code"],
            # tokens intentionally omitted — D-CONTRACT-04 strips both sides
            "annotations": [
                annotation_block.get_api_representation(item, context)
                for item, annotation_block in zip(
                    value["annotations"],
                    [self.child_blocks["annotations"].child_block] * len(value["annotations"]),
                )
            ],
        }
```

### Pattern 2: Custom ImageChooserBlock for `{src, alt, width, height}` shape

**What:** Subclass `ImageChooserBlock` to override `get_api_representation` so it emits the rendition URL + dimensions directly.

**When to use:** Every place an image is consumed by FE: `figure`, `pinout.image`, `schematic_image`.

**Example:**

```python
# backend/apps/blocks/image.py
from wagtail.images.blocks import ImageChooserBlock as BaseImageChooserBlock

class ImageChooserBlock(BaseImageChooserBlock):
    def get_api_representation(self, value, context=None):
        if value is None:
            return None
        rendition = value.get_rendition("width-1600")
        return {
            "src": rendition.url,        # e.g. http://arduino.localhost/media/images/foo.width-1600.jpg
            "alt": value.default_alt_text or "",
            "width": rendition.width,
            "height": rendition.height,
        }

class FigureBlock(blocks.StructBlock):
    image = ImageChooserBlock()  # SPIKE RENAME: `image_src` → flattened to `src` via emit shape
    caption_html = blocks.RichTextBlock(required=False)

    def get_api_representation(self, value, context=None):
        img = self.child_blocks["image"].get_api_representation(value["image"], context)
        return {
            **img,  # spreads {src, alt, width, height}
            "captionHtml": expand_db_html(value["caption_html"].source) if value["caption_html"] else None,
        }
```

### Pattern 3: Per-page custom serializer + APIField

**What:** Subclass `BasePageSerializer` (or use `api_fields = [APIField(...)]` on the Page model) to hoist `slug`, `publishedAt`, `updatedAt` to the top level and shape body fields per FE contract.

**When to use:** Every page model.

**Example (verified pattern from [docs.wagtail.org/en/stable/advanced_topics/api/v2/configuration.html](https://docs.wagtail.org/en/stable/advanced_topics/api/v2/configuration.html)):**

```python
# backend/apps/lessons/models.py
from wagtail.api import APIField
from wagtail.fields import StreamField
from wagtail.models import Page
from wagtail_headless_preview.models import HeadlessPreviewMixin
from rest_framework import serializers

from apps.blocks.text import ParagraphBlock, HeadingBlock, SidenoteBlock, AsideBlock, LedeBlock
from apps.blocks.image import FigureBlock
from apps.blocks.code import CodeBlock, DiffBlock
from apps.blocks.parts import PartsListBlock

LESSON_BODY_BLOCKS = [
    ("paragraph", ParagraphBlock()),
    ("heading", HeadingBlock()),
    ("sidenote", SidenoteBlock()),
    ("figure", FigureBlock()),
    ("code", CodeBlock()),
    ("diff", DiffBlock()),
    ("aside", AsideBlock()),
]

class IsoDateTimeField(serializers.Field):
    """Emit ISO-8601 with timezone, matching FE Date.toISOString()."""
    def to_representation(self, value):
        return value.isoformat() if value else None

class LessonPage(HeadlessPreviewMixin, Page):
    lede = StreamField([("lede", LedeBlock())], min_num=0, max_num=1, use_json_field=True, blank=True)
    body = StreamField(LESSON_BODY_BLOCKS, use_json_field=True)
    parts_list = StreamField(
        [("parts_list", PartsListBlock())],
        min_num=1, max_num=1, use_json_field=True,
    )

    api_fields = [
        APIField("slug"),
        APIField("publishedAt", serializer=IsoDateTimeField(source="first_published_at")),
        APIField("updatedAt", serializer=IsoDateTimeField(source="last_published_at")),
        APIField("title"),
        APIField("lede"),
        APIField("body"),
        APIField("parts_list"),
    ]

    content_panels = Page.content_panels + [
        FieldPanel("lede"),
        FieldPanel("parts_list"),
        FieldPanel("body"),
    ]
```

### Pattern 4: wagtail-headless-preview redirect mode

**What:** Settings + `HeadlessPreviewMixin` + redirect target.

**Verified config (from [github.com/torchbox/wagtail-headless-preview README](https://github.com/torchbox/wagtail-headless-preview/blob/main/README.md) and [CHANGELOG](https://github.com/torchbox/wagtail-headless-preview/blob/main/CHANGELOG.md)):**

```python
# backend/wagtail_arduino/settings/base.py
INSTALLED_APPS = [
    # ... wagtail apps ...
    "wagtail_headless_preview",
    # ... project apps ...
]

WAGTAIL_HEADLESS_PREVIEW = {
    "CLIENT_URLS": {
        "default": "http://arduino.localhost",  # picked up from WAGTAIL_BASE_URL env in dev/prod overlays
    },
    "SERVE_BASE_URL": None,
    "REDIRECT_ON_PREVIEW": True,
    "ENFORCE_TRAILING_SLASH": True,
}
```

⚠️ **Deprecated keys** (verified in CHANGELOG): `HEADLESS_PREVIEW_CLIENT_URLS` and `HEADLESS_PREVIEW_LIVE` were **removed** in 0.x — using them raises a runtime error. Always use the namespaced `WAGTAIL_HEADLESS_PREVIEW = {...}` dict.

```python
# Mixin applied to every page model
from wagtail_headless_preview.models import HeadlessPreviewMixin

class LessonPage(HeadlessPreviewMixin, Page):
    ...
```

**Endpoint shape (verified):** `GET /api/v2/page_preview/?content_type=<app_label.ModelName>&token=<opaque>` returns the same JSON shape as `/api/v2/pages/<id>/`. The library registers it on the `WagtailAPIRouter` instance — the project's `api.py` must call `api_router.register_endpoint("page_preview", PagePreviewAPIViewSet)` (the library exports the viewset).

**Auth:** The endpoint inherits Wagtail's REST permission classes; combined with the editor's authenticated Django session cookie, `withCredentials: true` from the FE is sufficient. Token is opaque — the library uses it to look up the in-memory PagePreview record server-side; it does NOT carry auth claims.

### Pattern 5: django-storages[s3] for MinIO with prefix-scoped public-read

**What:** STORAGES dict (Django 5.x style) + AWS_* env-driven settings + a custom storage subclass for the public renditions prefix.

**Verified from [django-storages 1.14.6 docs](https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html) + community MinIO examples:**

```python
# backend/wagtail_arduino/settings/base.py
import os

# Django 5.x STORAGES dict (replaces DEFAULT_FILE_STORAGE)
STORAGES = {
    "default": {
        "BACKEND": "wagtail_arduino.storage.MediaS3Storage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

AWS_S3_ENDPOINT_URL = os.environ["DJANGO_AWS_S3_ENDPOINT_URL"]
AWS_STORAGE_BUCKET_NAME = os.environ["DJANGO_AWS_STORAGE_BUCKET_NAME"]   # arduino-media
AWS_ACCESS_KEY_ID = os.environ["DJANGO_AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = os.environ["DJANGO_AWS_SECRET_ACCESS_KEY"]
AWS_S3_REGION_NAME = "us-east-1"      # MinIO placeholder
AWS_S3_ADDRESSING_STYLE = "path"      # MinIO requires path-style; verified ✓
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None                # MinIO uses bucket policies, not per-object ACLs

# Wagtail rendition spec registry (D-MINIO-02)
WAGTAILIMAGES_FORMAT_CONVERSIONS = {}  # default; can add webp later
```

```python
# backend/wagtail_arduino/storage.py
from storages.backends.s3 import S3Storage

class MediaS3Storage(S3Storage):
    """Default storage used by Wagtail Image originals + Documents.
    Uses presigned URLs (querystring auth) so originals are not publicly readable.
    Renditions, however, are emitted by `Image.get_rendition()` which uses the
    same default storage but Wagtail strips querystring auth on rendition URLs
    only when the storage class declares `querystring_auth=False`.

    Strategy: keep originals presigned; renditions live under `images/` prefix
    with public-read bucket policy → URL is the same `<endpoint>/<bucket>/images/...`,
    but the public-read policy makes it accessible without query auth. By setting
    `querystring_auth=False`, django-storages emits unsigned URLs for ALL files —
    which is acceptable here because:
      - originals/ + documents/ have NO public-read policy → unsigned URL → 403 to public
      - images/ has public-read policy → unsigned URL → 200 to public

    Wagtail admin uses authenticated S3 API calls to UPLOAD; that path doesn't
    depend on URL signing.
    """
    location = ""
    file_overwrite = False
    querystring_auth = False  # unsigned URLs for all; bucket policy gates public read per-prefix
```

**Why a single storage class with `querystring_auth=False` works (vs. two classes):** D-MINIO-01 picks the prefix-policy approach. The trade-off: unsigned URLs for `originals/` will return 403 to public clients (because no public-read policy on that prefix), which is the desired behavior — only authenticated admin sessions ever load originals (in the Wagtail admin's image library). Public consumption is exclusively via renditions in `images/`. If the project later needs presigned URLs for `documents/` (e.g. for time-limited download links), introduce a second storage class then; not needed in P4.

**Wagtail rendition storage:** `wagtail.images.models.AbstractRendition.file` uses `default_storage`, which is the STORAGES `default` backend. No extra config required — django-storages picks up automatically.

### Pattern 6: Traefik docker-provider routing with priority-ordered rules

**What:** Multiple PathPrefix routes on the same host, with explicit priorities so wildcard `/*` doesn't shadow `/admin`, `/api`, etc.

**Verified from [doc.traefik.io/traefik/providers/docker/](https://doc.traefik.io/traefik/providers/docker/) and Traefik v3 routing docs:**

```yaml
# compose.dev.yml (excerpt)
services:
  traefik:
    image: traefik:v3.2
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --api.insecure=true   # dev-only: Traefik dashboard at :8080
    ports:
      - "80:80"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"   # Linux fallback; macOS Docker Desktop sets this natively but explicit is safe
    networks:
      - arduino

  wagtail:
    build:
      context: ./backend
      target: dev
    labels:
      - "traefik.enable=true"
      # API + admin + preview-data + django-static — high priority
      - "traefik.http.routers.wagtail.rule=Host(`arduino.localhost`) && (PathPrefix(`/admin`) || PathPrefix(`/api`) || PathPrefix(`/preview-data`) || PathPrefix(`/django-static`))"
      - "traefik.http.routers.wagtail.entrypoints=web"
      - "traefik.http.routers.wagtail.priority=100"
      - "traefik.http.services.wagtail.loadbalancer.server.port=8000"
    networks:
      - arduino

  minio:
    image: minio/minio:RELEASE.2025-04-22T22-12-26Z   # planner picks latest stable at execute time
    command: server /data --console-address ":9001"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.minio.rule=Host(`arduino.localhost`) && PathPrefix(`/media`)"
      - "traefik.http.routers.minio.entrypoints=web"
      - "traefik.http.routers.minio.priority=90"
      - "traefik.http.services.minio.loadbalancer.server.port=9000"
      # MinIO serves bucket-relative paths; Traefik strips /media prefix:
      - "traefik.http.middlewares.media-stripprefix.stripprefix.prefixes=/media"
      - "traefik.http.routers.minio.middlewares=media-stripprefix"
    ports:
      - "9000:9000"   # dev: also publish to host so DJANGO_AWS_S3_ENDPOINT_URL=http://localhost:9000 from host works
      - "9001:9001"   # MinIO console for debugging
    volumes:
      - minio-data:/data
    networks:
      - arduino

  # FE-on-host catch-all router — defined as a Traefik file provider OR a no-op container with labels
  # because Docker provider needs a container to attach labels to. Cleanest: a tiny scratch container.
  fe-router:
    image: traefik/whoami   # placeholder; the labels do the work
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.fe.rule=Host(`arduino.localhost`)"
      - "traefik.http.routers.fe.entrypoints=web"
      - "traefik.http.routers.fe.priority=1"
      - "traefik.http.services.fe.loadbalancer.server.url=http://host.docker.internal:4200"
    networks:
      - arduino

networks:
  arduino:
    driver: bridge

volumes:
  minio-data:
  postgres-data:
```

**Critical: Route-to-host pattern.** Traefik can't route to a non-container service via `loadbalancer.server.port` (which expects to discover a container's IP). Two viable patterns:

1. **`loadbalancer.server.url` on a placeholder container** (shown above). The placeholder container exists only to carry the labels; Traefik ignores its actual IP and uses the explicit URL. `host.docker.internal:host-gateway` in `extra_hosts` resolves on Linux. (Docker Desktop macOS resolves it natively.)
2. **File provider** with a static `dynamic.yml` mounting an explicit service definition. Cleaner but adds a second config file.

Recommend pattern 1 for P4 (one fewer file).

**Priority ordering:** Higher priority = earlier match. `100` for `/admin*`, `/api*`, etc. routes; `90` for `/media*`; `1` for the catch-all FE route. Traefik defaults to length-based priority but explicit numeric priority is safer.

### Pattern 7: uv multi-stage Dockerfile

**What:** Stage 1 compiles a venv from `pyproject.toml` + `uv.lock` using `uv sync --frozen --no-dev`; stage 2 copies `/opt/venv` to a clean `python:3.13-slim` runtime.

**Verified from [docs.astral.sh/uv/guides/integration/docker](https://docs.astral.sh/uv/guides/integration/docker/) and [depot.dev optimal Python uv Dockerfile guide](https://depot.dev/docs/container-builds/how-to-guides/optimal-dockerfiles/python-uv-dockerfile):**

```dockerfile
# backend/Dockerfile
# syntax=docker/dockerfile:1.7

# ---------- builder ----------
FROM python:3.13-slim AS builder

# Pin uv to a specific version for reproducibility
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /uvx /bin/

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/opt/venv

WORKDIR /app

# Cache deps layer: copy lock + project metadata first, sync without project,
# then copy source and sync again to install the project itself.
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# ---------- dev (separate target, includes dev group) ----------
FROM builder AS dev

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ---------- prod runtime ----------
FROM python:3.13-slim AS prod

# system deps for psycopg + pillow runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
      libpq5 libjpeg62-turbo libpng16-16 \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled venv only — no uv binary in runtime
COPY --from=builder /opt/venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=wagtail_arduino.settings.prod

WORKDIR /app
COPY . .

EXPOSE 8000
CMD ["gunicorn", "wagtail_arduino.wsgi:application", \
     "--bind=0.0.0.0:8000", "--workers=3", "--timeout=60", "--access-logfile=-"]
```

**Build invocation:**
```bash
# Dev:  docker build --target dev -t arduino-wagtail:dev backend/
# Prod: docker build --target prod -t arduino-wagtail:prod backend/
```

**Compose `BUILD_TARGET` arg** drives target selection per overlay:

```yaml
# compose.yml
services:
  wagtail:
    build:
      context: ./backend
      target: ${BUILD_TARGET:-prod}
```

```yaml
# compose.dev.yml
services:
  wagtail:
    build:
      target: dev
```

### Pattern 8: MinIO bucket bootstrap via `mc` sidecar with prefix-scoped public-read

**What:** A run-once init container that creates the bucket, sets prefix policies, and exits. Idempotent.

**Verified from [min.io docs/minio/linux/reference/minio-mc/mc-anonymous-set.html](https://min.io/docs/minio/linux/reference/minio-mc/mc-anonymous-set.html):**

```yaml
# compose.dev.yml (excerpt)
services:
  mc:
    image: minio/mc:RELEASE.2025-04-08T15-39-49Z   # planner picks latest stable
    depends_on:
      minio:
        condition: service_healthy
    networks:
      - arduino
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        set -e
        mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
        mc mb --ignore-existing local/arduino-media
        # Public-read on images/ prefix — renditions only
        mc anonymous set download local/arduino-media/images
        # originals/ and documents/ left at default (no anonymous access)
        echo "MinIO bucket bootstrap complete."
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    restart: "no"   # one-shot
```

**`mc anonymous set download` is exactly the prefix-scoped public-read policy needed.** Verified: it sets a JSON policy under the hood with `Action: ["s3:GetObject"]` on `arn:aws:s3:::arduino-media/images/*`. No need to author the JSON manually.

**MinIO healthcheck** the `mc` sidecar depends on:
```yaml
  minio:
    image: minio/minio:...
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 3s
      retries: 5
```

### Pattern 9: Seed-fixtures management command

**What:** A Django management command that reads JSON fixtures from `../src/assets/mock-data/` and constructs Wagtail page instances with matching slugs and StreamField bodies.

**Pattern:**

```python
# backend/apps/contract/management/commands/seed_fixtures.py
import json
from pathlib import Path
from django.core.management.base import BaseCommand
from wagtail.models import Site

from apps.lessons.models import LessonPage
# ... other page imports ...

MOCK_DATA_ROOT = Path(__file__).resolve().parents[4] / "src" / "assets" / "mock-data"

class Command(BaseCommand):
    help = "Idempotently seed contract-test fixtures from src/assets/mock-data into Wagtail as drafts."

    def handle(self, *args, **options):
        root = Site.objects.get(is_default_site=True).root_page

        # Idempotent: clear existing fixture pages first (filter by a known marker — slug list)
        FIXTURE_SLUGS = {
            "pershyi-blymayuchyi-svitlodiod",
            "knopka-ta-pidtyahuvalnyi-rezystor",
            "analogovyi-vhid-ta-potentsiometr",
            "chomu-arduino",
            "atmega328p",
            "arduino-uno-r3",
            "blymayuchyi-svitlodiod-shema",
        }
        for slug in FIXTURE_SLUGS:
            for page in LessonPage.objects.filter(slug=slug):
                page.delete()
            # ... other page types ...

        # Re-seed
        for path in (MOCK_DATA_ROOT / "lessons").glob("*.json"):
            data = json.loads(path.read_text(encoding="utf-8"))
            lesson = LessonPage(
                title=data["title"],
                slug=data["slug"],
                # body assembled from data["body"] in the {type, value} envelope shape Wagtail expects
                body=json.dumps([{"type": b["type"], "value": _unflatten(b)} for b in data["body"]]),
                parts_list=json.dumps([{"type": "parts_list", "value": {"items": data["partsList"]["items"]}}]),
                # lede, etc.
            )
            root.add_child(instance=lesson)
            lesson.save_revision()  # save as draft, do NOT publish
            self.stdout.write(f"Seeded lesson: {lesson.slug}")
```

**Key:** `save_revision()` without `.publish()` keeps pages as drafts. The contract diff queries the published API (`/api/v2/pages/?slug=...`); for the contract diff to see them, planner must either publish them or the diff must hit the draft-aware preview-list endpoint. Recommend the diff queries published — the seed publishes once, then the contract diff is a stable comparison.

### Anti-Patterns to Avoid

- **Don't put per-block representation logic in the Page-level serializer.** Per-block `get_api_representation` is the right place. Page serializers handle page-meta hoisting only.
- **Don't roll your own slug transliteration for Ukrainian.** Fixture slugs are pre-transliterated by P2/P3 (`pershyi-blymayuchyi-svitlodiod`); Wagtail accepts ASCII-safe slugs unchanged. Don't enable `WAGTAIL_AUTO_UPDATE_PREVIEW = True` or `WAGTAILADMIN_PERMITTED_LANGUAGE_CODES` games.
- **Don't try to make `originals/` selectively presigned with one storage class.** D-MINIO-01 bets on prefix bucket policies; trust that. If a future need arises, add a second storage class.
- **Don't set `AWS_S3_ADDRESSING_STYLE='virtual'`.** MinIO requires `path` style.
- **Don't add `django-cors-headers`.** D-PREVIEW-04 forbids it; same-origin via Traefik makes it inert.
- **Don't try to share gunicorn workers between dev and prod.** Dev runs `manage.py runserver` (auto-reload); prod runs gunicorn.
- **Don't hardcode Wagtail's preview-token shape.** It's opaque to FE; only the endpoint contract (same JSON shape as `/pages/<id>/`) matters.
- **Don't hand-roll a `pre_save` Shiki tokenizer in P4.** D-CONTRACT-04 explicitly defers it; tokens stripped both sides.
- **Don't publish original-bucket files as public-read.** Only `images/` prefix gets the policy; verifying this is part of the bootstrap-script test.
- **Don't run `pre-commit install` from `backend/`.** D-LAYOUT-04: hooks live at repo root; one install covers both halves.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-block API representation | Custom recursive serializer walking StreamField JSON | `get_api_representation` on each StructBlock subclass | Wagtail's serializer machinery already handles type dispatch + per-block context |
| Rich-text reference resolution (`<a linktype>`, `<embed embedtype>`) | Regex-based HTML rewriter | `wagtail.rich_text.expand_db_html(value.source)` | Wagtail's rewrite handlers correctly resolve page IDs to URL paths and image IDs to rendition URLs; absorbs schema changes across versions |
| Image rendition generation + caching | Custom Pillow pipeline + cache key | `image.get_rendition("width-1600")` | Wagtail caches in DB + storage; supports format conversions; renditions purged via `wagtail_update_image_renditions` |
| S3-compatible upload + URL generation | boto3 `upload_fileobj` + manual URL build | `django-storages.S3Storage` + `default_storage` | Handles file-overwrite, content-type detection, multipart, presigned URL generation (when needed), retry |
| MinIO bucket policies | Hand-authored JSON + `mc admin policy add` | `mc anonymous set download <alias>/<bucket>/<prefix>` | One-line, idempotent, well-tested by MinIO; hand-authored JSON adds maintenance burden |
| Headless preview redirect + token issuance | Custom `previewable_pk` + signed URL | `wagtail-headless-preview` `HeadlessPreviewMixin` + `REDIRECT_ON_PREVIEW=True` | Library handles token storage, expiry, and the `/api/v2/page_preview/` endpoint; manual implementation reinvents PreviewableMixin |
| Multi-stage Python Docker image | Hand-rolled pip + venv copy | uv + `uv sync --frozen --no-dev` | uv compiles the venv ~10x faster than pip; lockfile reproducibility is built-in; PEP 735 dependency-groups for dev exclusion |
| CSRF + ALLOWED_HOSTS handling | Custom middleware | Django's built-in `ALLOWED_HOSTS` + `CSRF_TRUSTED_ORIGINS` from env | D-NET-02 picks; standard Django pattern |
| Same-origin enforcement in dev | Hosts-file + nginx config | Traefik docker provider with PathPrefix routes + `host.docker.internal` | Traefik handles the proxy; same-origin URL space removes CORS/SameSite cookie issues entirely |
| Sidenote anchor-paragraph computation | Wagtail-side annotation in page save | FE-side post-fetch walk over body[] | D-MODEL-04: keeps Wagtail simpler, mock + Wagtail code paths converge after the FE adapter |

**Key insight:** Wagtail 7.3's StreamField + custom block representation system is already the "expert path" for headless API shaping. The temptation to do everything FE-side (because TypeScript is more familiar) is the wrong choice — it concentrates contract knowledge in one place but loses the rich-text-resolution machinery (`expand_db_html`) that Wagtail provides for free. D-DTO-01's split (Wagtail-side close-to-FE shape + thin FE adapter) is correct.

## Common Pitfalls

### Pitfall 1: `WAGTAIL_HEADLESS_PREVIEW` deprecated keys

**What goes wrong:** Using `HEADLESS_PREVIEW_CLIENT_URLS` or `HEADLESS_PREVIEW_LIVE` (deprecated and removed in 0.x) raises a runtime error.
**Why it happens:** Older tutorials and StackOverflow answers reference the pre-namespaced keys.
**How to avoid:** Always use the namespaced dict: `WAGTAIL_HEADLESS_PREVIEW = {"CLIENT_URLS": {...}, "REDIRECT_ON_PREVIEW": True, ...}`.
**Warning signs:** Settings load OK but preview button does nothing or 500s.

### Pitfall 2: MinIO + virtual-host-style addressing

**What goes wrong:** `AWS_S3_ADDRESSING_STYLE='virtual'` (the boto3 default with no `endpoint_url`) generates URLs like `https://bucket.minio:9000/...` which MinIO rejects unless you've set up DNS for the bucket subdomain.
**Why it happens:** boto3's virtual-host default works for AWS S3 but not for MinIO without per-bucket DNS.
**How to avoid:** Always set `AWS_S3_ADDRESSING_STYLE='path'`. Verified.
**Warning signs:** First image upload returns DNS resolution error or 404 from MinIO.

### Pitfall 3: Traefik wildcard route shadowing path-specific routes

**What goes wrong:** The `/*` catch-all FE route matches before `/admin/*` because Traefik's default priority is length-based but ties on specificity can fall the wrong way.
**Why it happens:** Without explicit priority labels, Traefik uses rule-length heuristics that don't always pick the more specific path.
**How to avoid:** Set explicit `traefik.http.routers.<name>.priority` labels — `100` for path-specific, `1` for the wildcard.
**Warning signs:** Visiting `/admin/login/` lands on the FE 404 page.

### Pitfall 4: `host.docker.internal` not resolving on Linux

**What goes wrong:** The FE-on-host catch-all returns 502 because `host.docker.internal` doesn't exist in the container's DNS.
**Why it happens:** Linux Docker Engine doesn't auto-add the host-gateway entry the way Docker Desktop on macOS does.
**How to avoid:** Add `extra_hosts: ["host.docker.internal:host-gateway"]` to every service that needs to reach the host (just Traefik in this setup, since that's the only service routing to host:4200).
**Warning signs:** Traefik logs show `dial tcp: lookup host.docker.internal: no such host`.

### Pitfall 5: `expand_db_html` returns HTML with relative URLs for page links

**What goes wrong:** `<a linktype="page" id="N">` is resolved to a relative path like `/lessons/foo/`, but FE prerender expects absolute (or root-absolute) paths the static build can resolve.
**Why it happens:** Wagtail's PageLinkHandler uses `page.url` (which respects the page's site).
**How to avoid:** Configure `WAGTAIL_BASE_URL` per environment so site-relative URLs resolve correctly. For absolute URLs in prerendered HTML, use `page.full_url` (handler-level customization). For P4, the locked decision (D-DTO-03) accepts root-absolute paths from `WAGTAIL_BASE_URL` + `url_path` — which is what `expand_db_html` produces if `WAGTAIL_BASE_URL` is set.
**Warning signs:** Pre-rendered HTML has `<a href="/lessons/foo/">` works at runtime but breaks if FE bundle is served from a non-root path.

### Pitfall 6: Single-block StreamField wire shape surprises

**What goes wrong:** `parts_list = StreamField([('parts_list', PartsListBlock())], min_num=1, max_num=1)` emits `[{type: 'parts_list', value: {...}, id: '<uuid>'}]` (single-element ARRAY), not `{type: 'parts_list', value: {...}}` (object).
**Why it happens:** StreamField is always an array on the wire, regardless of `max_num`.
**How to avoid:** D-DTO-05's `normalizePage` un-wraps the single-element array FE-side: `lesson.partsList = normalizeBlock(rawPartsList[0])`. Document this clearly in the FE adapter.
**Warning signs:** FE TypeError accessing `lesson.partsList.items` because `partsList` is an array.

### Pitfall 7: Per-block UUID `id` field in StreamField JSON

**What goes wrong:** Contract diff fails because Wagtail emits `{type, value, id: '<some-uuid>'}` and mocks emit `{type, ...value}` flat.
**Why it happens:** Wagtail auto-generates per-block UUIDs at save time for stable references.
**How to avoid:** D-CONTRACT-02 strips `body[*].id` (and per-block envelope) from both sides before diff.
**Warning signs:** Diff fails with "id field unique to Wagtail side" on every fixture.

### Pitfall 8: Django 5.x STORAGES dict vs. legacy `DEFAULT_FILE_STORAGE`

**What goes wrong:** Setting `DEFAULT_FILE_STORAGE = "..."` (legacy) silently doesn't take effect in Django 5.x.
**Why it happens:** Django 4.2 introduced the `STORAGES` dict; 5.x removed `DEFAULT_FILE_STORAGE` as a top-level setting.
**How to avoid:** Use `STORAGES = {"default": {"BACKEND": "..."}, "staticfiles": {...}}`.
**Warning signs:** Image uploads still go to local filesystem.

### Pitfall 9: `code.tokens` regenerated by Wagtail save signals

**What goes wrong:** Wagtail saves trigger `pre_save` hooks; if any third-party app adds a Shiki tokenization hook, `code.tokens` ends up populated and the contract diff allowlist no longer matches both sides.
**Why it happens:** D-SHIKI-04 forward-port is deferred (D-CONTRACT-04). Phase 4 keeps tokens absent on Wagtail side.
**How to avoid:** Don't install any token-computing pre_save hook in P4. Allowlist strips `code.tokens` from both sides defensively.
**Warning signs:** Contract diff fails on `code` blocks with non-empty `tokens` array on Wagtail side.

### Pitfall 10: Editor's Wagtail admin language not switching to Ukrainian

**What goes wrong:** `LANGUAGE_CODE='uk'` is set, but the admin UI still appears in English.
**Why it happens:** Wagtail's admin uses `WAGTAILADMIN_PERMITTED_LANGUAGE_CODES`, which defaults to `["en"]` if the user has no language preference set on their User profile.
**How to avoid:** Wagtail admin language follows `LANGUAGE_CODE` for unauthenticated/default users; for the editor's own User, set the user's "preferred language" to Ukrainian in their Wagtail admin profile after first login. P6 sweep documents any Wagtail strings missing Ukrainian translations.
**Warning signs:** Force-en audit row at phase exit shows admin UI strings in English.

## Code Examples

### Example 1: WagtailContentApi (FE side)

```typescript
// src/content/api/wagtail-content-api.ts
import { ContentApi } from "./content-api";
import { Lesson } from "../models/lesson";
import { Block } from "../models/block";

interface WagtailEnvelope { type: string; value: any; id: string; }
interface WagtailPageMeta { detail_url: string; html_url: string; first_published_at: string; type: string; }
interface WagtailPageResponse {
  id: number;
  meta: WagtailPageMeta;
  title: string;
  slug: string;
  publishedAt: string;
  updatedAt: string | null;
  body: WagtailEnvelope[];
  // page-specific...
}

export class WagtailContentApi implements ContentApi {
  constructor(private baseUrl: string) {}  // e.g. "http://arduino.localhost"

  async getLesson(slug: string): Promise<Lesson> {
    const res = await fetch(
      `${this.baseUrl}/api/v2/pages/?type=lessons.LessonPage&slug=${encodeURIComponent(slug)}&fields=*`,
      { credentials: "include" }
    );
    if (!res.ok) throw new Error(`getLesson: ${res.status}`);
    const list = await res.json();
    if (!list.items?.length) throw new Error(`Lesson not found: ${slug}`);
    return this.normalizeLesson(list.items[0]);
  }

  async getLessonPreview(contentType: string, token: string): Promise<Lesson> {
    const res = await fetch(
      `${this.baseUrl}/api/v2/page_preview/?content_type=${encodeURIComponent(contentType)}&token=${encodeURIComponent(token)}`,
      { credentials: "include" }
    );
    if (!res.ok) throw new Error(`getLessonPreview: ${res.status}`);
    return this.normalizeLesson(await res.json());
  }

  private normalizeLesson(raw: WagtailPageResponse): Lesson {
    const body = raw.body.map(this.normalizeBlock).filter(Boolean) as Block[];
    return {
      slug: raw.slug,
      title: raw.title,
      publishedAt: raw.publishedAt,
      updatedAt: raw.updatedAt ?? raw.publishedAt,
      body: this.computeSidenoteAnchors(body),
      partsList: this.normalizeBlock((raw as any).parts_list[0]) as any,
      // lede, etc.
    };
  }

  private normalizeBlock(env: WagtailEnvelope): Block {
    // Strips {type, value, id} → flat {type, ...value}
    return { type: env.type, ...env.value } as Block;
  }

  private computeSidenoteAnchors(body: Block[]): Block[] {
    let lastParaIndex = -1;
    return body.map((block) => {
      if (block.type === "paragraph") lastParaIndex++;
      if (block.type === "sidenote") {
        return { ...block, anchorParagraphIndex: lastParaIndex };
      }
      return block;
    });
  }
}
```

### Example 2: Contract diff allowlist constant

```javascript
// scripts/contract-diff.mjs
export const STRIP_PATHS = [
  "id",                          // top-level Wagtail PK
  "updatedAt",                   // mocks omit; Wagtail emits if exposed
  "meta.detail_url",
  "meta.html_url",
  "meta.first_published_at",
  "meta.alias_of",
  "meta.parent",
  "meta.seo_title",
  "meta.search_description",
  "meta.show_in_menus",
  "meta.type",
  "body[*].id",                  // per-block UUID Wagtail emits
  "body[*].code.tokens",         // D-CONTRACT-04: deferred Shiki port
  "parts_list[*].id",
];
// Note: top-level `slug` is hoisted by Wagtail per D-DTO-02, so it's NOT stripped.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `DEFAULT_FILE_STORAGE = "..."` | `STORAGES = {"default": {"BACKEND": "..."}}` | Django 4.2 (2023); legacy removed in 5.x | Use STORAGES dict |
| `HEADLESS_PREVIEW_CLIENT_URLS` | `WAGTAIL_HEADLESS_PREVIEW = {"CLIENT_URLS": {...}}` | wagtail-headless-preview 0.x | Old keys raise runtime error |
| pip + requirements.txt | uv + `uv.lock` + `pyproject.toml` PEP 735 dependency-groups | uv 0.4+ (2024) | 10x faster, reproducible, dev/prod split via `--no-dev` |
| Wagtail v1 API | Wagtail v2 API (`wagtail.api.v2`) | Wagtail 2.x (2018); v1 removed long ago | Use `WagtailAPIRouter` + `APIField` |
| `psycopg2-binary` | `psycopg[binary]` (psycopg3) | Django 4.2 added psycopg3 support | Modern, async-capable |
| Per-bucket DNS for S3 | `AWS_S3_ADDRESSING_STYLE='path'` for self-hosted MinIO | Always required for MinIO | Path-style is mandatory |

**Deprecated/outdated:**
- `wagtail-grapple` for GraphQL — out of scope (PROJECT.md).
- `nginx` reverse proxy — replaced by Traefik (PROJECT.md).
- Local-filesystem `MEDIA_ROOT` — forbidden (WAGTAIL-09).
- Bare-metal systemd-managed gunicorn — replaced by Docker (CLAUDE.md).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `wagtail-headless-preview ~=0.8` is the latest stable compatible with Wagtail 7.3 | Standard Stack | LOW — verifiable at `uv add` time; pin can be adjusted to whatever resolves |
| A2 | `mc anonymous set download` produces a JSON policy equivalent to `s3:GetObject` on `arn:aws:s3:::arduino-media/images/*` | Pattern 8 | LOW — verified in MinIO docs; `mc anonymous get-json` confirms after bootstrap |
| A3 | `gunicorn --workers=3 --timeout=60` is appropriate for a single-VPS, single-author, low-traffic Wagtail | Pattern 7 | LOW — conservative defaults; tunable in P5 deploy. Conventional formula `2*N_CPUS+1`; planner picks |
| A4 | Custom `BasePageSerializer` subclass via `api_fields = [APIField(name, serializer=...)]` is sufficient to hoist `slug`, `publishedAt`, `updatedAt` to top level without subclassing the serializer class itself | Pattern 3 | MEDIUM — verified pattern but Wagtail's auto-generated PageSerializer behavior with `APIField(source=...)` should be confirmed during the first execute task. If it doesn't hoist correctly, fall back to a full `BasePageSerializer` subclass with explicit `to_representation` override |
| A5 | The Traefik `loadbalancer.server.url` label on a placeholder container is the cleanest way to route to a non-container service via Docker provider | Pattern 6 | LOW — standard pattern; alternative is a file-provider config |
| A6 | Wagtail 7.3 supports Django 5.2 LTS | Standard Stack | LOW — Wagtail 7.3 release notes confirm Django 5.2 support; verifiable at `uv add` time |
| A7 | `psycopg[binary]~=3.2` is the correct modern pin for Wagtail 7.3 + Django 5.2 + PostgreSQL 17 | Standard Stack | LOW — Django 5.2 supports both psycopg2 and psycopg3; psycopg3 is recommended |
| A8 | `code.tokens` on Wagtail side will be absent (not empty array) when the field is not populated — the diff allowlist must handle both cases | Pattern 1 | LOW — defensive: the allowlist deletes the key on both sides, treating "absent" and "empty array" identically |
| A9 | `Pinout.pins.x/y` are normalized 0..1 floats in the FE component (P2) | Architecture Patterns | MEDIUM — planner verifies by reading `src/app/components/pinout/` source at execute time; if pixel-int, switch `FloatBlock` → `IntegerBlock` |
| A10 | The `mc` sidecar's environment variables for `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` interpolate from `.env` at compose-up time | Pattern 8 | LOW — standard Compose env var substitution |

## Open Questions

1. **Exact `wagtail-headless-preview` version pin compatible with Wagtail 7.3.**
   - What we know: Library is actively maintained; 0.x versions support Wagtail 6.x and 7.x.
   - What's unclear: The exact 0.x version that explicitly lists Wagtail 7.3 in `python_requires`/`Wagtail >= ` declaration.
   - Recommendation: At first execute task, run `uv add wagtail-headless-preview` and let uv resolve. Document the resolved version in SUMMARY.md. If the resolver picks a version that doesn't support 7.3, pin explicitly.

2. **Whether `APIField('publishedAt', serializer=IsoDateTimeField(source='first_published_at'))` correctly emits at top level.**
   - What we know: `APIField(name, serializer=...)` is the documented pattern.
   - What's unclear: Whether the `source=` argument on the serializer class is honored by Wagtail's auto-generated PageSerializer (vs. needing a full `BasePageSerializer` subclass).
   - Recommendation: First-pass implementation uses `APIField(...)` on the model. If contract diff shows `first_published_at` still in `meta` instead of hoisted, switch to a full serializer subclass. Either approach is well-trodden.

3. **Pinout `pins.x/y` field type (FloatBlock 0..1 vs IntegerBlock pixel).**
   - What we know: D-MODEL-02 prescribes `FloatBlock` but flags it as planner discretion.
   - What's unclear: What the P2 `Pinout` Angular component currently consumes.
   - Recommendation: Planner reads `src/app/components/pinout/pinout.component.ts` (or wherever `Pinout` primitive lives) and matches its expectation. Likely 0..1 floats since pinout images change resolution.

4. **gunicorn worker count + timeout for prod.**
   - What we know: D-LAYOUT-02 leaves this to the planner. Convention is `2*N_CPUS+1` workers, 30-60s timeout.
   - What's unclear: VPS sizing isn't decided yet (P5).
   - Recommendation: Sketch `--workers=3 --timeout=60` in `compose.prod.yml` (a 2-vCPU VPS at minimum); P5 tunes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker Engine | Compose stack | Verify at task time | — | — (blocking; planner adds install step or aborts) |
| Docker Compose v2 | Compose stack | Verify | — | — (blocking) |
| Python 3.13 (host) | uv lockfile generation pre-Docker | Verify | — | Pin via uv `python-version` and let uv download |
| uv (host or in container) | Lockfile generation | Verify | — | `pip install uv` or use the `ghcr.io/astral-sh/uv` image |
| pnpm 10 | FE dev server + contract-diff script | Already installed (P1-P3 stack) | 10.x | — |
| Node 22+ | pnpm + scripts/*.mjs | Already installed | — | — |
| `mc` (MinIO client) | Bucket bootstrap | Runs in container | RELEASE.2025-04-08 | — |
| `/etc/hosts` entry `127.0.0.1 arduino.localhost` | Same-origin dev URL | Manual one-time | — | Use `localhost` instead of `arduino.localhost` in the Host rule (degraded experience but functional) |

**Missing dependencies with no fallback:** Docker + Compose v2. Standard developer-laptop tooling.

**Missing dependencies with fallback:** uv (can be downloaded by Docker BuildKit step).

## Validation Architecture

> Skipped: `workflow.nyquist_validation` is `false` in `.planning/config.json`.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Django session-based auth + Wagtail admin password (built-in); NO custom token issuance for preview (D-PREVIEW-01) |
| V3 Session Management | yes | Django session cookie defaults; `SESSION_COOKIE_SECURE=True` in prod (`prod.py`); `SESSION_COOKIE_SAMESITE='Lax'` (default) |
| V4 Access Control | yes | Wagtail admin permission system (built-in); preview API authorizes by Django session; `/api/v2/pages/` exposes only published content |
| V5 Input Validation | yes | Wagtail StreamField validation per-block; Django form validation; URLField/IntegerBlock/FloatBlock enforce types |
| V6 Cryptography | yes | `DJANGO_SECRET_KEY` env-driven, never in repo (D-SEC-01); HSTS in prod via `SECURE_HSTS_SECONDS`; never hand-roll crypto |
| V7 Error Handling & Logging | yes | `DEBUG=False` in prod (D-SEC-02); custom 500 page (P3 already shipped 404, P5 finalizes 500) |
| V8 Data Protection | yes | `.env` gitignored + gitleaks pre-commit (D-SEC-03); presigned URLs for `originals/` (no public list) |
| V9 Communication | yes | Traefik auto-TLS in prod (P5); `SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO','https')` (D-SEC-02) |
| V10 Malicious Code | yes | Wagtail rich text uses allowlisted feature set; `expand_db_html` doesn't introduce XSS beyond what was authored |
| V12 File Upload | yes | Wagtail Image upload validates content-type; MinIO storage class doesn't allow path traversal; `AWS_S3_FILE_OVERWRITE=False` |
| V13 API & Web Service | yes | REST v2 read-only for `/api/v2/pages/`; preview endpoint session-bound; CSRF defaults preserved on admin POST |

### Known Threat Patterns for Wagtail/Django + S3 stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection | Tampering | Django ORM (parameterized queries); never raw SQL with string interpolation |
| XSS via rich text | Tampering | Wagtail's RichTextField + `expand_db_html` use a sanitized tag whitelist |
| CSRF on admin POST | Spoofing | Django's CSRF middleware (default); `CSRF_TRUSTED_ORIGINS` env-driven (D-NET-02) |
| Open redirect via headless-preview redirect target | Tampering | `WAGTAIL_HEADLESS_PREVIEW.CLIENT_URLS` is a fixed allowlist; library validates redirect target |
| Public-read on `originals/` (data exposure) | Information Disclosure | Public-read bucket policy applied ONLY to `images/` prefix; `originals/` unsigned URLs return 403 |
| Hardcoded `DJANGO_SECRET_KEY` | Information Disclosure | env-driven (D-SEC-01); `.env` gitignored; gitleaks pre-commit catches accidental commits |
| Container running as root | Elevation of Privilege | Multi-stage Dockerfile; planner adds `USER appuser` step in stage 2 (recommended; not in CONTEXT.md but standard practice) |
| Postgres exposed to public network | Spoofing/Disclosure | DEPLOY-03 + D-NET-01: Postgres on internal Docker network only; no host port published in prod |
| Stale image renditions ballooning storage | DoS via storage exhaustion | DEPLOY-06 quarterly cron `wagtail_update_image_renditions --purge-only` (P5) |
| Preview endpoint accessible without session | Spoofing | `wagtail-headless-preview` library + Wagtail REST permissions enforce session check |

## Sources

### Primary (HIGH confidence)
- [Wagtail API v2 configuration guide (7.3 stable)](https://docs.wagtail.org/en/stable/advanced_topics/api/v2/configuration.html) — `APIField`, `BasePageSerializer`, custom block representations
- [Wagtail StreamField docs (7.3 stable)](https://docs.wagtail.org/en/stable/topics/streamfield.html) — `min_num`, `max_num`, `use_json_field`
- [Wagtail Rich text internals (latest)](https://docs.wagtail.org/en/latest/extending/rich_text_internals.html) — `expand_db_html`, `<a linktype>`, `<embed embedtype>`
- [django-storages Amazon S3 docs (1.14.6)](https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html) — `AWS_S3_ADDRESSING_STYLE`, `AWS_QUERYSTRING_AUTH`, `AWS_S3_ENDPOINT_URL`
- [wagtail-headless-preview README](https://github.com/torchbox/wagtail-headless-preview/blob/main/README.md) — `WAGTAIL_HEADLESS_PREVIEW` settings, `REDIRECT_ON_PREVIEW`, `HeadlessPreviewMixin`
- [wagtail-headless-preview CHANGELOG](https://github.com/torchbox/wagtail-headless-preview/blob/main/CHANGELOG.md) — deprecation of `HEADLESS_PREVIEW_CLIENT_URLS` and `HEADLESS_PREVIEW_LIVE`
- [Traefik Docker provider docs (v3)](https://doc.traefik.io/traefik/providers/docker/) — labels, `host.docker.internal`, priority
- [uv Docker integration guide](https://docs.astral.sh/uv/guides/integration/docker/) — multi-stage, `uv sync --frozen --no-dev`
- [uv dependency-groups](https://docs.astral.sh/uv/concepts/projects/dependencies/) — PEP 735 `[dependency-groups]`, `--no-dev`
- [MinIO `mc anonymous set` docs](https://min.io/docs/minio/linux/reference/minio-mc/mc-anonymous-set.html) — prefix-scoped policies, `download` value semantics

### Secondary (MEDIUM confidence)
- [Wagtail StreamField custom serializers gist (community)](https://gist.github.com/thclark/100d6aa6d0995984589b983f896002d4) — per-block customization patterns
- [Tommaso Amici: Headless Wagtail pain points (DEV.to)](https://dev.to/tommasoamici/headless-wagtail-what-are-the-pain-points-ji4) — real-world issues with Wagtail v2 API + headless setup
- [Optimal Dockerfile for Python with uv (Depot)](https://depot.dev/docs/container-builds/how-to-guides/optimal-dockerfiles/python-uv-dockerfile) — multi-stage best practices
- [Naomi Aro: Using MinIO with django-storages](https://naomiaro.hashnode.dev/using-minio-with-django-storages) — verified MinIO + django-storages settings
- [Tom Wojcik: Local S3 with Django and MinIO](https://tomwojcik.com/posts/2020-09-18/local-s3-with-django-and-minio/) — MinIO setup patterns

### Tertiary (LOW confidence — verified at execute time)
- Exact wagtail-headless-preview pin (`~=0.8`) — verify with `uv add` when planning lands.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against official docs; only exact pins TBD at `uv add`.
- Architecture: HIGH — CONTEXT.md locks all major decisions; research filled in syntax for the 9 patterns.
- Pitfalls: HIGH — all 10 pitfalls drawn from documented behaviors or community-reported issues.
- Security: HIGH — standard Django/Wagtail patterns; CONTEXT.md security decisions are sound.

**Research date:** 2026-05-02
**Valid until:** 2026-06-02 (30 days; Wagtail 7.3.x patches and django-storages 1.14.x patches are unlikely to break the patterns documented; wagtail-headless-preview is more volatile but the breaking change risk is low for 0.8.x).
