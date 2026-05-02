# Phase 4: Wagtail Backend Skeleton & Contract Match (Dockerized) — Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up Wagtail 7.3 in Docker against PostgreSQL 17 + MinIO; build page models for `Lesson`, `Article`, `Datasheet`, `Schematic` that match the FE TypeScript content models 1:1; expose REST API v2 with custom serializers so the response shape is byte-compatible (modulo allowlisted volatile fields) with `MockContentApi` fixtures; ship `WagtailContentApi` so a single DI registration change flips `MockContentApi` → `WagtailContentApi`; wire `wagtail-headless-preview` so an editor clicking Preview on a draft lands in the Angular `/preview/<contentType>/<token>` route (CSR-only) and sees the unpublished content; configure `django-storages[s3]` + `boto3` against MinIO so original uploads + image renditions live in MinIO (NOT on local disk); enforce day-zero security (`.env` gitignored, gitleaks pre-commit, `DEBUG=False` prod, explicit `ALLOWED_HOSTS`, env-driven secrets); enforce locale (`LANGUAGE_CODE='uk'`, `TIME_ZONE='Europe/Kyiv'`, `USE_TZ=True`); ship a Compose dev stack that brings up the full BE on a fresh laptop with `docker compose -f compose.yml -f compose.dev.yml up -d` while FE dev runs on the host via `pnpm start`.

Phase 4 does **not** ship: production VPS deploy (P5), Traefik production TLS termination (P5), backup automation (P5), real content authoring beyond the seven CONTRACT-04 fixtures (P6 polish), 7.4 LTS bump (deferred — see D-BUMP-01..03 below), drop caps / glossary tooltips / RSS / JSON-LD / OG / print stylesheet / dark mode / WCAG audit (P6).

</domain>

<decisions>
## Implementation Decisions

The FE contract is **immutable**: `src/content/models/block.ts`, `lesson.ts`, `article.ts`, `datasheet.ts`, `schematic.ts`, and `src/content/api/content-api.ts` are NOT amended in P4. Wagtail conforms; FE adapter handles only the structural envelope + image expansion. Three locked field renames from the P3 spike (CONTRACT-02 sign-off, `wagtail-spike-report.md`) are inputs, not decisions:

- Wagtail StructBlock field name `note` → `html` (in `code.annotations`).
- Wagtail StructBlock field name `image_src` → `src` (in `figure` and `pinout`).
- FE `WagtailContentApi` strips the `{type, value, id}` per-block envelope via a `normalizeBlock()` adapter.

### Repo Layout & Python Tooling

- **D-LAYOUT-01:** Wagtail lives in `backend/` as a sibling to `src/`. One `.git` at repo root. `backend/pyproject.toml` (uv-managed), `backend/uv.lock` (committed), `backend/Dockerfile`, `backend/wagtail_arduino/` (Django project package), `backend/apps/` (Wagtail app modules). FE paths under `src/`, `package.json` etc. unchanged.
- **D-LAYOUT-02:** Wagtail container is built from a **multi-stage Dockerfile** keyed on `python:3.13-slim`. Stage 1 copies `backend/pyproject.toml` + `backend/uv.lock`, runs `uv sync --frozen --no-dev` to compile a virtualenv into `/opt/venv`. Stage 2 copies `/opt/venv` into a clean `python:3.13-slim` runtime image, sets `PATH=/opt/venv/bin:$PATH`, copies the `backend/` source, and runs `gunicorn`. Dev image is a separate target that includes the `dev` dependency group (Ruff, mypy, pytest, ipython); prod image excludes dev deps.
- **D-LAYOUT-03:** Compose files at repo root: `compose.yml` (base service definitions for `wagtail`, `postgres`, `minio`, `traefik`), `compose.dev.yml` (dev overlay — published ports for direct access, `BUILD_TARGET=dev`, hot-reload mounts for `backend/`), `compose.prod.yml` (prod overlay — TLS labels on Traefik, no published ports beyond Traefik 80/443, `BUILD_TARGET=prod`). Build context for `wagtail` service is `./backend/`. P4 ships `compose.yml` + `compose.dev.yml`; `compose.prod.yml` is sketched (TLS labels, gunicorn workers) but not exercised — DEPLOY phase (P5) finalizes it.
- **D-LAYOUT-04:** Pre-commit hook scope is unified at the **repo-root `.pre-commit-config.yaml`**. New hooks added: `ruff` + `ruff-format` (scoped to `backend/**/*.py`), `mypy` (scoped to `backend/**/*.py`). Existing hooks (gitleaks, prettier-check, eslint-changed, stylelint-changed) are unchanged. One `pre-commit install` covers both halves of the repo.

### MinIO Bucket Layout & Image Rendition URL Strategy

- **D-MINIO-01:** **Single bucket** named `arduino-media` with three prefixes:
  - `originals/` — uploaded files (Wagtail Image originals + Document originals). Default: presigned access via `django-storages` `querystring_auth=True` for private files. Public-read NOT applied to this prefix.
  - `images/` — Wagtail-generated image renditions. **Public-read bucket policy** applied to this prefix only (set during bucket bootstrap). URLs are unsigned, cacheable, prerender-safe.
  - `documents/` — non-image documents (PDFs, downloadable schematic SVGs/PDFs). Default: presigned. Schematic `downloadUrl` field points here.
- **D-MINIO-02:** Image rendition specs registered in Wagtail settings: **`width-800`, `width-1600`, `width-3200`**. The custom `ImageChooserBlock.get_api_representation` (D-DTO-04 below) emits the `width-1600` rendition URL as the default `src`. P3's NgOptimizedImage `srcset` semantics drive what additional renditions the FE component requests. Renditions are generated on first request and cached in MinIO under `images/`.
- **D-MINIO-03:** Production rendition URL strategy: **Traefik routes `/media/*` → MinIO `:9000`** with the public-read bucket policy on the `images/` prefix making rendition URLs unsigned and same-origin. A prerendered `<img src="/media/images/foo.width-1600.jpg">` works without JS, without TLS headaches, without CORS. Matches DEPLOY-02 wording. Traefik prod label config lands in P5 — P4 designs the URL shape so prod plumbing is mechanical.
- **D-MINIO-04:** Dev environment: **MinIO publishes `:9000` to the host** via `compose.dev.yml`. Wagtail's `DJANGO_AWS_S3_ENDPOINT_URL` in dev is `http://localhost:9000`; in prod it's the internal Docker DNS `http://minio:9000` (Traefik fronts public traffic). API responses in dev contain absolute MinIO URLs (`http://localhost:9000/arduino-media/images/...`). FE on host fetches them directly. No CORS dance because images are loaded as `<img>` not `fetch()`.
- **D-MINIO-05:** MinIO bucket bootstrap is a one-shot **`mc` sidecar service** in `compose.dev.yml` (run-once profile) that: creates `arduino-media`, sets prefix policies (public-read on `images/`, default on `originals/` and `documents/`), waits for MinIO healthcheck. Idempotent — safe to re-run. Same pattern is reused in P5 for prod bucket setup.

### Preview Flow & Auth

- **D-PREVIEW-01:** **Authentication is the standard Django session cookie**. `wagtail-headless-preview` redirect mode is configured to point at the Angular `/preview/<contentType>/<token>` route. The `<token>` segment is opaque to P4 — Wagtail still issues one (the library requires it) but the preview-data API (`/api/v2/page_preview/?content_type=&token=`) authorizes the request **solely by the editor's authenticated Django session**, not by the token contents. No custom token issuance, no JWT, no API key, no service-account flow.
- **D-PREVIEW-02:** Preview data endpoint is `GET /api/v2/page_preview/?content_type=<app.Model>&token=<opaque>` returning the **same JSON shape as `GET /api/v2/pages/<id>/`** (after the standard Wagtail page-detail serializer + custom block representations). The FE `WagtailContentApi.getLessonPreview()` etc. method hits this endpoint with `withCredentials: true` (so the editor's Wagtail admin session cookie flows). Single shape on the FE adapter side — no parallel adapter for preview vs published.
- **D-PREVIEW-03:** Reload UX on the Angular `/preview/*` route is **plain browser refresh — no in-app button, no autosave, no polling**. Editor saves a draft in the admin tab, switches to the preview tab, hits Cmd-R. The Angular preview component fetches fresh JSON on every component init (no caching beyond Angular's standard view re-init). Honors PROJECT.md's "preview ergonomics solved with CSR" wording without scope creep into autosave.
- **D-PREVIEW-04:** **Same-origin in dev is mandatory** (cookies otherwise wouldn't flow cleanly). Locked via D-NET-01 (Traefik in dev) below. CORS is therefore not configured in P4 (`django-cors-headers` is NOT added). CSRF defaults are kept; the preview-data endpoint is GET-only and session-bound, so CSRF token requirements are inert for read traffic. Admin POST traffic uses Wagtail's standard CSRF flow (cookie + form token).

### Dev Networking — FE-on-Host ↔ Wagtail-in-Container

- **D-NET-01:** Dev Compose overlay runs **Traefik on the host port 80** with two routes scoped to host header `arduino.localhost`:
  - `arduino.localhost/admin/*`, `arduino.localhost/api/*`, `arduino.localhost/preview-data/*`, `arduino.localhost/django-static/*` → `wagtail:8000` (the Wagtail container, Docker-internal).
  - `arduino.localhost/*` (everything else) → `host.docker.internal:4200` (the FE pnpm dev server running natively on the host). Linux fallback: Traefik service declares `extra_hosts: ["host.docker.internal:host-gateway"]`.
  - `arduino.localhost/media/*` → `minio:9000` (Docker-internal). Mirrors the prod URL shape so dev and prod share the same Wagtail `MEDIA_URL` template.
  Editor and FE traffic both browse `http://arduino.localhost`. Single same-origin URL space; cookies flow; no CORS. One developer-machine setup step: add `127.0.0.1 arduino.localhost` to `/etc/hosts`. The `pnpm start` dev server runs unchanged on `:4200`; no `--host` flag needed (Docker Desktop's `host.docker.internal` reaches loopback by default on macOS).
- **D-NET-02:** **Two env vars** for Django host/CSRF config (no `BASE_DOMAIN` derivation):
  - `DJANGO_ALLOWED_HOSTS` (comma-separated list). Dev: `arduino.localhost,localhost,127.0.0.1`. Prod: `arduino.example` (replace at deploy).
  - `DJANGO_CSRF_TRUSTED_ORIGINS` (comma-separated list, schemes required). Dev: `http://arduino.localhost`. Prod: `https://arduino.example`.
  Settings split each on `","`. `.env.example` documents both. Standard Django pattern; no surprise derivation.
- **D-NET-03:** Wagtail's `BASE_URL` setting (used for rendition URLs and headless-preview redirects) is env-driven: `WAGTAIL_BASE_URL`. Dev: `http://arduino.localhost`. Prod: `https://arduino.example`. Used by `wagtail-headless-preview` to construct the redirect target, by `expand_db_html` for `<a linktype="page">` resolution to absolute paths, and by image rendition URLs.

### Contract Test — Scope, Location, Strictness

- **D-CONTRACT-01:** Contract test lives at `scripts/contract-diff.mjs` (Node, ESM, runnable as `pnpm contract:diff`). Mirrors the existing `scripts/lint-fixtures.mjs` and `scripts/tokenize-fixtures.mjs` patterns: a small, runnable, root-level script with no test-runner ceremony. Output is a per-fixture PASS/FAIL with a colored unified diff on FAIL.
- **D-CONTRACT-02:** **Diff strictness is structural with a fixed, code-committed allowlist of volatile fields stripped before comparison.** The allowlist:
  - Page-meta: `meta.detail_url`, `meta.html_url`, `meta.first_published_at`, `meta.alias_of`, `meta.parent`, `meta.seo_title`, `meta.search_description`, `meta.show_in_menus` (only `slug` is hoisted out by Wagtail per D-DTO-02).
  - Top-level Page `id` (Wagtail's auto-int PK).
  - Top-level `updatedAt` (mocks omit it; Wagtail emits `last_published_at` if exposed — strip on both sides).
  - Per-block `id` (Wagtail emits a UUID per StreamField block; mocks have none — strip on both sides).
  - `code.tokens` (per D-CONTRACT-04 below).
  After stripping, the comparison is **byte-equal on the canonicalized JSON** (sorted keys, identical separators). Allowlist is a single exported constant in `contract-diff.mjs`; PR review owns the gate when new volatile fields are added.
- **D-CONTRACT-03:** **All seven CONTRACT-04 fixtures** are diffed: `pershyi-blymayuchyi-svitlodiod`, `knopka-ta-pidtyahuvalnyi-rezystor`, `analogovyi-vhid-ta-potentsiometr` (lessons), `chomu-arduino` (article), `atmega328p`, `arduino-uno-r3` (datasheets), `blymayuchyi-svitlodiod-shema` (schematic). Wagtail must be seeded with byte-equivalent draft pages before each diff run.
- **D-CONTRACT-04:** **`code.tokens` is stripped from both sides before diff.** Wagtail does NOT compute Shiki tokenization on `pre_save` in P4 — the field stays empty/absent on Wagtail-emitted JSON, while mock fixtures retain tokens baked in by P3's `scripts/tokenize-fixtures.mjs`. Diff allowlist removes `body[*].code.tokens` from both sides. **The forward-port to a `pre_save` Shiki sidecar (D-SHIKI-04 from P3) is deferred to a later polish phase** — preview shows untokenized code in P4. Documented in `<deferred>` below.
- **D-CONTRACT-05:** **Wagtail seed mechanism** is a Django management command `python manage.py seed_fixtures` (in a new `apps/contract/` Wagtail app). The command reads `src/assets/mock-data/**/*.json` (relative path from `backend/` to `../src/assets/mock-data`), constructs Wagtail page instances with matching slugs and StreamField bodies, saves them as drafts. Idempotent — safe to re-run; clears prior fixture pages first.
- **D-CONTRACT-06:** **Test execution model** is contract-diff-runs-against-running-stack: the developer runs `docker compose -f compose.yml -f compose.dev.yml up -d`, then `docker compose exec wagtail python manage.py seed_fixtures`, then `pnpm contract:diff`. The script assumes the stack is up; clear error message if `:8000/api/v2/pages/` is unreachable. Not in CI for v1 (matches P3 D-LH-01 manual-phase-exit pattern).

### REST v2 → ContentApi DTO Mapping Ownership

- **D-DTO-01:** **Wagtail-side custom serializers emit close-to-FE shape; FE adapter does only envelope strip + image expansion.** Two narrow contracts: Wagtail's per-block `get_api_representation` overrides + per-page `BasePageSerializer` subclass own field-name + structure decisions; the FE `WagtailContentApi.normalizeBlock(raw)` and `normalizePage(raw)` functions own the per-block envelope strip + page-meta handling. No "pure FE adapter" (concentrates contract knowledge in TS), no "pure Wagtail serializer" (fights Wagtail conventions).
- **D-DTO-02:** **Page-meta hoisting:** Wagtail custom Page serializers expose `slug`, `publishedAt` (mapped from `first_published_at`), and `updatedAt` (mapped from `last_published_at` or current `updated_at` if exposed) as **top-level fields** on the page response. Other `meta.*` fields (`detail_url`, `html_url`, `seo_title`, `search_description`, `show_in_menus`, `alias_of`, `parent`) stay inside the `meta` envelope; the FE adapter ignores them; the contract diff strips them per D-CONTRACT-02. Top-level `id` (auto-int PK) is left in place but stripped by the diff allowlist.
- **D-DTO-03:** **Rich-text expansion:** Every RichText-bearing field (`paragraph.html`, `lede.html`, `aside.html`, `sidenote.html`, `figure.captionHtml`, `parts-list.items[].note` if rich, `code.annotations[].html`) goes through `expand_db_html()` server-side in `get_api_representation`. Internal page links `<a linktype="page" id="N">` resolve to absolute paths derived from `WAGTAIL_BASE_URL` + the page's `url_path` (e.g. `/lessons/<slug>`) so prerendered HTML works without runtime link resolution. Embedded image references `<embed embedtype="image" id="N">` resolve to `<img src=".../images/...width-800.jpg">` at the configured rendition.
- **D-DTO-04:** **Custom `ImageChooserBlock` API representation** in `apps/blocks/image.py`: `get_api_representation(self, value, context=None)` returns `{src, alt, width, height}` directly, where `src` is the URL of the `width-1600` rendition (or `original` if smaller), `alt` is the Image model's `alt_text`, `width` and `height` are the rendition's actual pixel dimensions. The FE `figure`, `pinout`, and `Schematic.schematicImage` blocks all consume this same envelope. No `srcset` in the API payload — NgOptimizedImage requests additional renditions on demand via predictable URL conventions.
- **D-DTO-05:** **FE adapter scope** (in `src/content/api/wagtail-content-api.ts`):
  - `normalizeBlock(raw: WagtailEnvelope): Block` — strips `{type, value, id}`, returns flat `{type, ...value}`.
  - `normalizePage(raw: WagtailPageResponse, modelKind: 'lesson'|'article'|...): Lesson|Article|...` — copies hoisted top-level fields; calls `normalizeBlock` over `body[]`; un-wraps single-block StreamFields per D-MODEL-01..03 below; computes `sidenote.anchorParagraphIndex` per D-MODEL-04.
  - No HTML rewriting on the FE side (rich text is already expanded server-side).
  - No image fetching on the FE side (URLs are baked in by the Wagtail block representation).

### Page-Model Shape — Non-StreamField Fields

- **D-MODEL-01:** **`Lesson.partsList`** is modeled as `parts_list = StreamField([('parts_list', PartsListBlock())], min_num=1, max_num=1, use_json_field=True)` on `LessonPage`. `PartsListBlock` is a `StructBlock(items=ListBlock(StructBlock([(name, CharBlock), (quantity, IntegerBlock), (note, CharBlock(required=False))])))`. Wire shape: `parts_list: [{type: 'parts_list', value: {items: [...]}, id}]` (single-element array because StreamField is `min_num=1, max_num=1`). The FE `normalizePage` un-wraps the array to `lesson.partsList = normalizeBlock(parts_list[0])`, yielding the flat `Block<'parts-list'>` shape the existing TS interface declares.
- **D-MODEL-02:** **`Datasheet`** non-body fields:
  - `pinout = StreamField([('pinout', PinoutBlock())], min_num=1, max_num=1, use_json_field=True)`. `PinoutBlock` is a `StructBlock([(image, ImageChooserBlock), (alt, CharBlock), (pins, ListBlock(StructBlock([(x, FloatBlock), (y, FloatBlock), (label, CharBlock), (role, CharBlock)])))])`. The custom `ImageChooserBlock.get_api_representation` (D-DTO-04) emits `{src, alt, width, height}` for `image`; the FE adapter merges `image` + `alt` + `pins` into the flat `Block<'pinout'>` shape.
  - `specifications = StreamField([('spec', StructBlock([(label, CharBlock), (value, CharBlock)]))], use_json_field=True)`. Wire shape: `[{type: 'spec', value: {label, value}, id}, ...]`. FE adapter strips envelopes, yielding `{label, value}[]` matching the FE interface.
  - `peripheral_notes` is a body StreamField mirroring Article/Lesson body shape (paragraph, heading, sidenote, figure, code, diff, aside).
- **D-MODEL-03:** **`Schematic`** non-body fields:
  - `schematic_image = StreamField([('figure', FigureBlock())], min_num=1, max_num=1)`. Single-block envelope un-wrapped FE-side per the D-MODEL-01 pattern.
  - `download_url = models.URLField(max_length=500)` — a plain Django URLField on `SchematicPage`. Editor pastes the full MinIO URL of the original (e.g. `http://arduino.localhost/media/originals/blymayuchyi-svitlodiod-shema.svg` in dev). Auto-derivation from a companion `schematic_original = ImageChooserBlock` is **deferred** as a polish item — see `<deferred>`.
  - `explanation` is a body StreamField mirroring the standard body shape.
- **D-MODEL-04:** **`sidenote.anchorParagraphIndex` is computed FE-side post-fetch.** Mock fixtures keep the index baked in (P2 contract). Wagtail emits `sidenote` blocks WITHOUT this field. The FE `normalizePage` walks `body` after envelope-stripping and computes, for each `sidenote`, the index of the nearest preceding `paragraph` in the post-stripped body. Both code paths (mock + Wagtail) yield identical post-adapter `Lesson` objects. The contract diff explicitly strips `anchorParagraphIndex` from mocks before comparison (or runs the comparison post-FE-adapter — D-CONTRACT-07 below).
- **D-MODEL-05:** **All Wagtail page models declare `slug` as the canonical lookup key** (Wagtail's default). The FE `WagtailContentApi.getLesson(slug)` method translates to `GET /api/v2/pages/?type=lessons.LessonPage&slug=<slug>&fields=*` (or equivalent), then unwraps the single-result list. List endpoints (`listLessons()` etc.) hit the same endpoint without the slug filter and project to the FE list-DTO shape.

### Plan Sequencing & Spike Compliance

- **D-SEQ-01:** Plan sequencing is **infrastructure-first, then contract, then preview, then verification**:
  1. Repo scaffold + Compose base + Wagtail bootstrap (empty Django project, smoke test `:8000` returns 200).
  2. MinIO + django-storages wiring + bucket bootstrap sidecar + image upload smoke test (`mc ls` shows file in `originals/`).
  3. Page models for `Lesson`, `Article`, `Datasheet`, `Schematic` with full StreamField + non-body shapes per D-MODEL-01..03.
  4. Custom block API representations + page serializers per D-DTO-01..04 (the field renames `note→html`, `image_src→src` land here).
  5. Seed-fixtures management command per D-CONTRACT-05.
  6. `WagtailContentApi` Angular implementation + DI flag in `provideContentApi()`.
  7. Contract diff script per D-CONTRACT-01..06; iterate on Wagtail serializers until all 7 fixtures pass.
  8. `wagtail-headless-preview` install + redirect config + `/api/v2/page_preview/` endpoint + Angular `/preview/*` data fetch wiring per D-PREVIEW-01..04.
  9. Day-zero security plan: `.env.example`, env-driven settings, gitleaks pre-commit verify, `DEBUG=False` prod settings file, force-en audit row in `docs/force-en-audit.md`.
  10. Phase-exit verification: full contract diff PASS + manual preview-flow walkthrough + MinIO upload smoke + force-en audit clean + `docker compose -f compose.yml -f compose.dev.yml up -d` works on a fresh laptop checkout.
- **D-SEQ-02:** **The 7.4 LTS bump is NOT a P4 plan.** Deferred entirely. See D-BUMP-01..03 below.

### 7.3 → 7.4 LTS Bump (Deferred)

- **D-BUMP-01:** **The 7.3→7.4 bump is deferred out of Phase 4 entirely.** Phase 4 ships on Wagtail 7.3.x and exits on 7.3.x. The 2026-05-04 release date no longer governs P4 scope. Rationale: bundling a major-release bump into the same phase that's locking the FE↔BE contract concentrates two large risk surfaces; the bump is a near-zero-effort version pin once the contract is stable, but a contract regression caused by 7.4 internals would be hard to attribute. **This is a deviation from the ROADMAP.md Phase 4 goal** ("the 7.4 LTS bump is a one-line version pin update + re-validation step inside this phase") — ROADMAP.md should be amended at phase-exit transition to reflect the actual decision, and the bump migrated to a dedicated entry (e.g. Phase 4.1 inserted, or rolled into P5/P6 polish).
- **D-BUMP-02:** **Gates the deferred bump must pass** when it eventually runs (recorded here for the future bump plan): full P4 verification re-run = contract diff (all 7 fixtures PASS) + preview flow walkthrough (login → edit draft → click Preview → see content) + MinIO upload smoke (`mc ls` shows new rendition) + force-en audit row clean + manual Wagtail admin smoke (login + edit + save + view list).
- **D-BUMP-03:** **Rollback strategy** for the deferred bump: if regressions can't be fixed within ~1 day of effort, pin back to the latest 7.3.x and record the blocker as known debt with a follow-up issue. The bump becomes a separate, named follow-up effort. Single-author bandwidth cost is bounded.

### Day-Zero Security & Locale (Foundational)

- **D-SEC-01:** Secrets are env-driven from `.env` (gitignored — already in repo, verified). `.env.example` documents required keys: `POSTGRES_PASSWORD`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, `WAGTAIL_BASE_URL`, `DJANGO_AWS_S3_ENDPOINT_URL`, `DJANGO_AWS_STORAGE_BUCKET_NAME`, `DJANGO_AWS_ACCESS_KEY_ID`, `DJANGO_AWS_SECRET_ACCESS_KEY`. Plus a leading comment on each prod-vs-dev distinction.
- **D-SEC-02:** Settings file split: `backend/wagtail_arduino/settings/base.py` (shared), `dev.py` (`DEBUG=True`, dev-only `INTERNAL_IPS`, console email), `prod.py` (`DEBUG=False`, secure cookie flags, HSTS, `SECURE_PROXY_SSL_HEADER` for Traefik). `DJANGO_SETTINGS_MODULE` env var picks. Compose dev overlay sets `dev`, prod overlay sets `prod`.
- **D-SEC-03:** gitleaks pre-commit hook **already installed** (`.pre-commit-config.yaml` v8.30.1). P4 verifies it blocks a contrived `.env`-shaped commit during phase exit (force-en-audit-style verification).
- **D-SEC-04:** Locale lock in `base.py`: `LANGUAGE_CODE='uk'`, `TIME_ZONE='Europe/Kyiv'`, `USE_TZ=True`, `WAGTAIL_CONTENT_LANGUAGES=[('uk', 'Українська')]`, `WAGTAIL_I18N_ENABLED=False` (matches PROJECT.md "no i18n architecture ever" hard constraint). Force-en audit row appended to `docs/force-en-audit.md` at phase exit.

### Claude's Discretion

- Exact Python package version pins (within the locked stack: Wagtail `~=7.3`, Django `~=5.2`, psycopg `~=3.2`, etc.) — planner picks at the time of `uv lock`.
- Exact gunicorn worker count + timeout in prod settings — planner picks based on conventional Django defaults; tunable later.
- Whether `apps/blocks/` is one Wagtail app or several (`apps/lessons/`, `apps/articles/`, `apps/datasheets/`, `apps/schematics/`, `apps/blocks/`) — planner picks based on cross-cutting block concerns; one-app vs multi-app is a tactical Django choice.
- Whether the Pinout's `pins` `x`/`y` fields use `FloatBlock` (0..1 normalized) or `IntegerBlock` (pixel) — planner picks; matches whatever the FE Pinout component currently consumes (P2 sets the answer).
- Exact `mc` sidecar container image tag (e.g. `minio/mc:RELEASE.2024-...`) — planner picks the latest stable.
- Whether `wagtail-headless-preview` configuration uses redirect mode or response mode — D-PREVIEW-01..02 prescribes redirect mode at the route level; the planner verifies the library's exact config syntax during research.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 4 anchor docs
- `.planning/ROADMAP.md` §"Phase 4" — phase goal + success criteria + dependencies.
- `.planning/REQUIREMENTS.md` §"Wagtail Backend" — WAGTAIL-01 through WAGTAIL-10 (the requirements P4 must close).
- `.planning/PROJECT.md` — vision, hard constraints (Ukrainian only, no SSR ever, MinIO, Docker for BE / pnpm on host for FE, Cyrillic-Ext, ragged-right, no Tailwind).
- `CLAUDE.md` — coding conventions, locked stack, hard constraints.

### Phase 3 inputs (FE contract is immutable; spike findings are mandatory)
- `.planning/phases/03-page-templates-routing-static-build/wagtail-spike-report.md` — **CONTRACT-02 sign-off**. Locks the three field renames (`note→html`, `image_src→src`, envelope adapter FE-side). P4 conforms to this report.
- `.planning/phases/03-page-templates-routing-static-build/03-CONTEXT.md` — D-PRERENDER-02 (`ContentSource` interface as the P4 swap point), D-SHIKI-04 (forward-port to `pre_save` is deferred per D-CONTRACT-04 above), D-MOCK-01..05 (fixture lint patterns reused).
- `.planning/phases/03-page-templates-routing-static-build/03-UI-SPEC.md` — Wagtail spike protocol § (the agreed shape diff procedure P4 must satisfy).

### Phase 2 inputs (FE content layer)
- `.planning/phases/02-primitives-two-column-layout-page-model-contract/02-CONTEXT.md` — `MockContentApi` DI shape, D-MOCK fixture patterns, sidenote `anchorParagraphIndex` baking.
- `src/content/models/block.ts` — `Block` discriminated union (immutable in P4).
- `src/content/models/lesson.ts`, `article.ts`, `datasheet.ts`, `schematic.ts` — content interfaces (immutable in P4).
- `src/content/api/content-api.ts` — `ContentApi` abstract class (immutable in P4).
- `src/content/api/content-api.token.ts` — `provideContentApi()` registration site (the single DI swap target).
- `src/content/api/mock-content-api.ts` — reference implementation; `WagtailContentApi` mirrors its public surface.
- `src/content/api/fixture-content-source.ts`, `fixture-loader.ts` — `ContentSource` interface (P3 D-PRERENDER-02). `WagtailContentSource` will be its sibling implementation in P4.
- `src/assets/mock-data/{lessons,articles,datasheets,schematics}/*.json` — the seven contract fixtures the diff runs against.
- `src/app/pages/preview-stub/preview-stub.page.ts` — existing `/preview/*` CSR stub that P4 wires the actual Wagtail data fetch into.
- `src/app/app.config.ts` — DI registration site for `provideContentApi()`.

### External docs the planner/researcher will need
- Wagtail 7.3 docs — StreamField + `BasePageSerializer` + REST API v2 + `expand_db_html` + `wagtail.images.blocks.ImageChooserBlock.get_api_representation`.
- `wagtail-headless-preview` docs — redirect mode configuration + token issuance + `/api/v2/page_preview/` endpoint shape + `HeadlessPreviewMixin` usage.
- `django-storages[s3]` + `boto3` docs — `AWS_S3_ENDPOINT_URL` (MinIO compatibility), `AWS_S3_ADDRESSING_STYLE='path'` (MinIO requires path-style), `AWS_QUERYSTRING_AUTH=False` for the public-read renditions prefix, custom storage class for renditions vs originals if needed.
- MinIO server docs — bucket policies (prefix-scoped public-read), `mc` CLI for bootstrap, healthcheck endpoint.
- Traefik docs — Docker label-driven routing, host header rules, path prefix rules, `host.docker.internal` patterns on Linux.
- Django docs — `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `SECURE_PROXY_SSL_HEADER`, settings split pattern, `DJANGO_SETTINGS_MODULE`.
- `uv` docs — `uv sync --frozen --no-dev`, lockfile workflow, dependency groups (`dev` group exclusion in prod image).
- `gitleaks` — pre-commit hook config (already installed; just verify scope).
- Python Slugify-style URL conventions for Ukrainian — Wagtail's `unicode_slugs=True` setting + `django.utils.text.slugify(allow_unicode=True)` (so Ukrainian slugs work) — but **fixture slugs are pre-transliterated** (existing pattern: `pershyi-blymayuchyi-svitlodiod`), so this is just ensuring Wagtail accepts them.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`MockContentApi` (P2/P3, `src/content/api/mock-content-api.ts`)** — concrete reference implementation. `WagtailContentApi` mirrors its public surface. The DI swap is one-line in `content-api.token.ts`.
- **`ContentApi` abstract class (P2, `src/content/api/content-api.ts`)** — locked interface; `WagtailContentApi extends ContentApi`. No new methods added in P4.
- **`provideContentApi()` (P2, `src/content/api/content-api.token.ts`)** — the single DI registration target. P4 changes `useClass: MockContentApi` → `useClass: WagtailContentApi` behind an env flag (or refactors to read an env var).
- **`Block` discriminated union (P2/P3, `src/content/models/block.ts`)** — immutable; `normalizeBlock(raw)` outputs values shaped exactly like its variants.
- **`fixture-loader.ts` + `fixture-content-source.ts` (P3)** — `ContentSource` interface ships in P3; `WagtailContentSource` lands in P4 as a sibling implementation. Prerender path is unchanged.
- **`scripts/lint-fixtures.mjs` + `scripts/tokenize-fixtures.mjs` (P2/P3)** — pattern reused for `scripts/contract-diff.mjs`. Same Node + ESM + pnpm wiring.
- **`docs/force-en-audit.md` + `docs/typography-checklist.md`** — accumulating phase-exit audit docs; P4 appends rows.
- **`.pre-commit-config.yaml` + `.gitleaks.toml` (P1)** — gitleaks already installed. P4 extends with Ruff + mypy hooks scoped to `backend/`.
- **`.gitignore` already excludes `.env` + `.env.*` (allowing `!.env.example`)** — verified via `cat .gitignore`. No change needed for `.env` discipline.
- **`src/app/pages/preview-stub/preview-stub.page.ts` (P3)** — existing `/preview/*` route component. P4 wires the actual data fetch (`WagtailContentApi.getLessonPreview()` etc.) into it; the route already declares `RenderMode.Client` in `app.routes.server.ts`.

### Established Patterns
- **DI swap as single-line config change** — P3 D-PRERENDER-02 pattern. P4 lands `WagtailContentApi` as the second implementation; `useClass` is the swap point (or an env-conditional factory).
- **Real Ukrainian content for design calibration; never Lorem Ipsum** — applies to seed fixtures: Wagtail's seeded pages must contain the SAME Ukrainian content as the mocks.
- **Force-en audit at every phase exit (UKR-06)** — P4 row appended; checks Wagtail admin doesn't leak English to admin-rendered editor strings (Wagtail's admin language follows `LANGUAGE_CODE='uk'`).
- **Three-breakpoint manual walk** — `/preview/<contentType>/<token>` rendering verified at <768 / 768–1199 / ≥1200 in the preview-flow walkthrough plan.
- **Manual phase-exit gates over CI** — P3 D-LH-01 pattern. Contract diff runs locally; not in CI for v1.
- **Repo-root `.pre-commit-config.yaml` is canonical** — P4 extends it (D-LAYOUT-04), not forks it.
- **One scripts/ directory at repo root for cross-cutting build/test scripts** — `lint-fixtures.mjs`, `tokenize-fixtures.mjs`, and now `contract-diff.mjs`.

### Integration Points
- `src/content/api/wagtail-content-api.ts` — new file; mirror of `mock-content-api.ts`.
- `src/content/api/wagtail-content-source.ts` — new file; sibling of `fixture-content-source.ts` for prerender path (P5+ uses).
- `src/content/api/content-api.token.ts` — modified to support env-driven choice between `MockContentApi` and `WagtailContentApi`.
- `src/app/pages/preview-stub/preview-stub.page.ts` — modified to fetch preview JSON via `WagtailContentApi.getLessonPreview()` etc.
- `src/app/app.config.ts` — verifies `provideContentApi()` DI is read in the right environment(s).
- `package.json` — adds `contract:diff` script entry.
- `scripts/contract-diff.mjs` — new file.
- `backend/` — entire new tree (`pyproject.toml`, `uv.lock`, `Dockerfile`, `wagtail_arduino/settings/{base,dev,prod}.py`, `apps/lessons|articles|datasheets|schematics|blocks|contract/`, `manage.py`, `.dockerignore`).
- `compose.yml` + `compose.dev.yml` — new files at repo root; build context `./backend/`.
- `.env.example` — new file at repo root; documents all secrets keys.
- `.pre-commit-config.yaml` — extended with Ruff + mypy hooks scoped to `backend/`.
- `docs/force-en-audit.md` — P4 row appended.
- ROADMAP.md — amended at phase-exit transition to reflect the deferred 7.4 bump (D-BUMP-01).

</code_context>

<specifics>
## Specific Ideas

- **Same-origin via Traefik in dev** is the linchpin: it removes CORS, removes cookie SameSite=None workarounds, and keeps the dev URL space identical to prod (modulo TLS). One `/etc/hosts` entry is the only host setup. Editor flow and FE dev iteration share `http://arduino.localhost`.
- **Allowlist-based contract diff** is small, code-reviewed, and grows by addition: when a new volatile field appears, it's a one-line PR with rationale in the comment.
- **`code.tokens` strip + deferred `pre_save` Shiki port**: reduces P4 scope by one entire plan and keeps the contract test honest. Preview shows untokenized code in P4 — the editor sees plain `<pre>` instead of styled Shiki output, which is acceptable for a contract-match phase. The polish phase (or a P6 ticket) restores parity.
- **Single bucket with prefixes** beats multi-bucket for backup simplicity (`mc mirror arduino-media b2://arduino-backup/media` is one cron line). Public-read at the prefix level is supported by MinIO bucket policies and well-documented.
- **`apps/contract/` Wagtail app for the seed command** keeps test-only code out of `apps/lessons|articles|...` — easy to exclude from prod migrations or strip later.

</specifics>

<deferred>
## Deferred Ideas

- **`code.tokens` `pre_save` Shiki sidecar (forward-port of P3 D-SHIKI-04)** — P4 strips this field from the contract diff and accepts that preview shows untokenized code. A later polish phase (or a P6 polish ticket) ports the `tokenize()` logic into a Wagtail container `pre_save` hook (Python Shiki port or a tiny Node sidecar invocation). Same `arduino-paper.json` theme file consumed in both environments per D-SHIKI-04.
- **Wagtail 7.4 LTS bump (2026-05-04 release)** — deferred entirely out of P4. Becomes a dedicated Phase 4.1 (or rolled into P5/P6) per D-BUMP-01..03. ROADMAP.md amended at P4 phase-exit transition to reflect this.
- **Auto-derived `Schematic.downloadUrl` from a companion `schematic_original = ImageChooserBlock`** — D-MODEL-03 picks the URLField paste-the-URL approach for P4. A polish iteration could add a `schematic_original` ImageChooserBlock and have a model `save()` populate `download_url` from its rendition URL. Editor convenience win; not contract-blocking.
- **Reusable `PartsList` Snippet across multiple lessons** — D-MODEL-01 picks dedicated single-block StreamField. If real authoring reveals duplicated parts lists across lessons, a Snippet refactor is a clean swap (the FE adapter + contract test don't change shape).
- **`django-cors-headers`** — not added in P4 (D-PREVIEW-04). Only relevant if a future phase introduces a cross-origin client (mobile app, third-party widget) — explicitly out of scope for v1.
- **Autosave polling on `/preview/*`** — D-PREVIEW-03 picks plain browser refresh. A later polish phase can add focus-aware polling (5–30s) if the editor flow demands it.
- **In-CI contract diff** — D-CONTRACT-06 keeps it manual phase-exit. CI integration becomes feasible only after a Compose-test-stack pattern is established (likely P6 or post-launch).
- **Production Compose overlay (`compose.prod.yml`) finalization** — P4 sketches it; P5 (DEPLOY phase) closes Traefik prod TLS labels, gunicorn worker tuning, prod MinIO bucket bootstrap, etc.
- **Wagtail admin English-string sweep** — P4 verifies admin loads in Ukrainian via `LANGUAGE_CODE='uk'`; if any admin strings remain English (Wagtail's translation completeness for `uk` varies), they're noted for polish.

</deferred>

---

*Phase: 04-wagtail-backend-skeleton-contract-match-dockerized*
*Context gathered: 2026-05-02*
