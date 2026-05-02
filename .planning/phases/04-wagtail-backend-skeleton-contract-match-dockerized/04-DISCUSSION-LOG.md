# Phase 4: Wagtail Backend Skeleton & Contract Match (Dockerized) — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `04-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 04-wagtail-backend-skeleton-contract-match-dockerized
**Areas discussed:** Repo layout & Python tooling, MinIO bucket layout & rendition URLs, Preview flow & auth, Contract test scope & location, REST v2 → ContentApi DTO mapping, Page-model shape for non-StreamField fields, Dev networking, 7.3→7.4 LTS bump

---

## Repo Layout & Python Tooling

| Option | Description | Selected |
|--------|-------------|----------|
| `backend/` sibling to `src/` | Single-repo monorepo. `backend/pyproject.toml`, Wagtail Django project, multi-stage Dockerfile, `uv.lock`. | ✓ |
| `apps/web/` + `apps/cms/` (Nx-style) | Reorganize FE under `apps/web/`. Requires moving every existing P1/P2/P3 path. | |
| Flat sub-tree with prefixed names | `cms_pyproject.toml`, `cms/`, `cms.Dockerfile`. Saves a directory; pollutes root. | |

| Option | Description | Selected |
|--------|-------------|----------|
| uv multi-stage Dockerfile, pinned uv.lock | Stage 1 compiles venv; Stage 2 runtime image excludes dev deps. Matches CLAUDE.md tooling. | ✓ |
| uv single-stage Dockerfile | Simpler; ships dev tools in prod image. | |
| pip + requirements.txt | Loses uv resolution speed and lockfile guarantees. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Repo root: `compose.yml` + `compose.dev.yml` + `compose.prod.yml` | Build context `./backend/`. Matches WAGTAIL-10 wording. | ✓ |
| Inside `backend/` | Self-contained but awkward when prod compose references FE-static + Traefik (outside `backend/`). | |
| Inside `infra/` sibling | Good if infra grows; overkill for P4. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Extend root `.pre-commit-config.yaml` with Ruff + mypy | Single `pre-commit install` covers both halves. | ✓ |
| Separate `backend/.pre-commit-config.yaml` | Two installs; team divergence pattern. | |
| No backend pre-commit; CI only | Diverges from existing FE pre-commit discipline. | |

**User's choice:** All recommended options (backend/ sibling, uv multi-stage, root compose, root pre-commit extension).
**Notes:** Direct path forward; aligns with existing patterns and CLAUDE.md tooling pins.

---

## MinIO Bucket Layout & Rendition URLs

| Option | Description | Selected |
|--------|-------------|----------|
| Single bucket `arduino-media` with prefixes | `originals/` (presigned), `images/` (public-read), `documents/` (presigned). One backup target. | ✓ |
| Two buckets: originals (private) + renditions (public) | Cleaner permission model; doubles backup jobs. | |
| Three buckets | Maximum separation; overkill. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Traefik routes `/media/*` → MinIO :9000; public-read on `images/` prefix | URLs `https://arduino.example/media/images/...`. Same-origin, no CORS, prerender-safe. | ✓ |
| Separate `media.arduino.example` subdomain | Bypasses Traefik for media; needs second TLS cert + CORS. | |
| Presigned URLs for everything | Hostile to SSG (URLs expire pre-deploy). | |

| Option | Description | Selected |
|--------|-------------|----------|
| `width-800` + `width-1600` + `width-3200` | Mobile / laptop / FHD+ at 1x and 2x. Editorial-fidelity. | ✓ |
| `width-800` + `width-1600` only | FHD+ users on retina see softer images. | |
| Wagtail defaults (`width-100|200|400|800`) | Wrong shape for editorial book-feel at LAYOUT-04 fidelity. | |

| Option | Description | Selected |
|--------|-------------|----------|
| MinIO published on `localhost:9000` in dev; API emits direct URLs | Simple; FE fetches directly. Compose dev publishes :9000. | ✓ |
| Traefik in dev too with `media.arduino.localhost` | Mirrors prod fully; more dev moving parts. | |
| MinIO Console only (manual upload, no FE consumption) | Misses point of P4 dev parity. | |

**User's choice:** All recommended options.
**Notes:** Single bucket + prefix policy keeps backup story simple (`mc mirror` one path).

---

## Preview Flow & Auth

| Option | Description | Selected |
|--------|-------------|----------|
| `/api/v2/page_preview/?content_type=&token=` returning `/api/v2/pages/{id}/`-shaped JSON | Standard wagtail-headless-preview pattern. Shared adapter for preview + published. | ✓ |
| Per-page-type endpoints | More REST-y; N endpoints + N serializers. | |
| One-shot signed URL with JSON inlined | Fewer round-trips; harder to retry. | |

**User clarification (turn 2 — initial AskUserQuestion was rejected):**
*"Let's just rely on standard Django session. No tokens, no extra logic on refreshes, no thought on support of any other clients, than just web browsers."*

This collapses several questions:
- Token TTL → N/A (auth is the Django session cookie; the URL token is opaque).
- Autosave polling cadence → N/A (no polling).
- CORS / CSRF posture → same-origin in dev (locked under Dev Networking below); standard Django session-cookie auth.

| Option (post-clarification) | Description | Selected |
|--------|-------------|----------|
| Same-origin in dev: Traefik proxies FE :4200 + Wagtail :8000 under `arduino.localhost` | Cookies flow; mirrors prod. | ✓ |
| FE dev-server proxy (Angular CLI proxy.conf.json) | Simpler; slight prod-dev divergence. | |
| Defer to Area 5 | (User chose to lock now.) | |

| Option | Description | Selected |
|--------|-------------|----------|
| Plain browser refresh, no in-app button | Editor saves, switches tabs, hits Cmd-R. Zero new UI. | ✓ |
| Small "Reload preview" button | One <button> + one fetch. Slightly nicer ergonomics. | |

**User's choice:** `/api/v2/page_preview/...` endpoint shape; standard Django session auth (no tokens for auth — token is opaque); same-origin in dev via Traefik; plain browser refresh.
**Notes:** No autosave, no polling, no other clients. Browser-only. Maximum simplicity.

---

## Contract Test — Strictness, Location, Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Structural diff with allowlisted volatile fields stripped | Strip `meta.first_published_at`, UUIDs, etc.; byte-equal on the rest. | ✓ |
| Strict byte-equal | Mocks would need synthetic `meta` blocks to match. Most fragile. | |
| Schema diff only | Catches shape drift; misses value bugs. Weaker than goal wording. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone Node script `scripts/contract-diff.mjs` | Mirrors `lint-fixtures.mjs` pattern. Runnable any phase. | ✓ |
| FE Vitest integration test | Tied to FE runner; awkward for BE-only changes. | |
| BE pytest test | Cross-tree dependency on FE mock fixtures. | |

| Option | Description | Selected |
|--------|-------------|----------|
| All 7 fixtures (3 lessons, 1 article, 2 datasheets, 1 schematic) | Catches per-content-type and per-block variations. Modest runtime. | ✓ |
| One per content type (4 fixtures) | Faster; misses block-shape variation across the 3 lessons. | |
| One golden mega-fixture | Doesn't exist yet; better as P6 polish addition. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Strip `code.tokens` from diff; FE re-tokenizes after fetch | Wagtail doesn't compute tokens in P4. Untokenized preview accepted. Defers D-SHIKI-04. | ✓ |
| Wagtail computes `code.tokens` on `pre_save` (port D-SHIKI-04 now) | Adds a plan; closes D-SHIKI-04 inside P4. Risk: Shiki output stability. | |
| Wagtail leaves empty; FE re-tokenizes lazily | Hostile to editorial design. Rejected. | |

**User's choice:** All recommended options.
**Notes:** Allowlist-based diff is small, code-reviewed, additive. `code.tokens` deferral lets P4 stay narrowly scoped.

---

## REST v2 → ContentApi DTO Mapping Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Wagtail-side custom serializers emit close-to-FE shape; FE adapter does only envelope strip + image expansion | Two narrow contracts; easy to audit. | ✓ |
| Pure Wagtail-side serializers (FE adapter is identity) | Maximum Wagtail customization; fragile across version bumps. | |
| Pure FE-side adapter (Wagtail emits stock REST v2) | Largest FE adapter surface; concentrates contract knowledge in TS. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Wagtail hoists `slug` + `publishedAt` + `updatedAt`; rest stays in `meta` and is ignored | FE only declares hoisted fields; allowlist strips the rest. | ✓ |
| Wagtail emits everything flat (no `meta` wrapper) | Fights Wagtail conventions; bad citizen. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Expanded HTML at API time; `<a linktype="page">` resolves via `expand_db_html` to absolute paths | Prerender works without runtime link resolution. | ✓ |
| Raw editor HTML | Hostile to SSG. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Custom `ImageChooserBlock.get_api_representation` returns `{src, alt, width, height}` directly using `width-1600` rendition | Simplest end-to-end; FE consumes shape unchanged. | ✓ |
| Custom representation emits `{srcset, sizes, ...}` with all renditions inlined | Heavier API payload; NgOptimizedImage already handles selection. | |
| Stock representation; FE makes second request per image | N+1 fetches; hostile to SSG. | |

**User's choice:** All recommended options.
**Notes:** "Wagtail emits close-to-FE shape, FE adapter handles envelope + image expansion" is the spike's implicit boundary — this discussion makes it explicit.

---

## Page-Model Shape — Non-StreamField Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated `parts_list` StreamField with single allowed block (`min_num=1, max_num=1`) | Editor UX is standard StreamField editor; FE adapter unwraps single-element array. | ✓ |
| Dedicated PartsListBlock as JSONField with custom panel | Lighter on the wire; diverges from how every other Wagtail field looks. | |
| Wagtail Snippet referenced via ForeignKey | Reusable across lessons; premature. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Two dedicated StreamFields for Datasheet (`pinout` single-block, `specifications` ListBlock-via-StreamField) + body | Same pattern as partsList; uniform shape. | ✓ |
| Custom non-StreamField fields with bespoke admin panels | Inconsistent editor UX. | |

| Option | Description | Selected |
|--------|-------------|----------|
| `schematic_image` single-block StreamField; `download_url = URLField`; body StreamField | Editor pastes URL; consistent with sibling models. | ✓ |
| `schematic_image` as top-level ImageChooserBlock | Cleaner on the wire; breaks the uniform pattern. | |

| Option | Description | Selected |
|--------|-------------|----------|
| FE computes `sidenote.anchorParagraphIndex` post-fetch; mocks keep it baked in | ~10 lines of adapter; both code paths yield same shape post-adapter. | ✓ |
| Wagtail computes the field in serializer | Tighter coupling; more BE complexity. | |
| Editor manually picks an anchor paragraph | Hostile to editor experience. | |

**User's choice:** All recommended options.
**Notes:** Uniform single-block StreamField pattern across all three "non-body" fields keeps the FE adapter pattern symmetric.

---

## Dev Networking — FE-on-Host ↔ Wagtail-in-Container

| Option | Description | Selected |
|--------|-------------|----------|
| Traefik routes FE to `host.docker.internal:4200` | macOS-native; Linux fallback via `extra_hosts`. Single same-origin URL. | ✓ |
| FE runs in dev container too | Diverges from CLAUDE.md ("FE NOT containerized in dev"). | |
| Traefik only proxies BE; FE on `localhost:4200` directly | Mixed-origin browsing; confusing two-URL model. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Two env vars: `DJANGO_ALLOWED_HOSTS` + `DJANGO_CSRF_TRUSTED_ORIGINS` (comma-lists) | Standard Django pattern; explicit. | ✓ |
| One `BASE_DOMAIN` env var; settings derive both | Less to read; surprising behavior. | |

**User's choice:** All recommended options.
**Notes:** Same-origin via Traefik in dev was already locked under Preview Flow. This area finalizes the routing details and Django config shape.

---

## 7.3 → 7.4 LTS Bump

| Option | Description | Selected |
|--------|-------------|----------|
| Final plan in P4, gates phase exit | Bump runs as last plan; rollback to 7.3.x with known-debt entry on regression. | |
| Side-pocket plan, runnable mid- or post-phase | Looser; risks the bump never happening. | |
| **No plan; defer the bump entirely to a later phase** | P4 ships on 7.3.x; bump becomes Phase 4.1 / P5 / P6 polish. | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Full P4 verification re-run when the deferred bump runs | Contract diff + preview flow + MinIO smoke + force-en + admin smoke. | ✓ |
| Subset (contract diff + admin smoke only) | Faster; misses preview-flow and MinIO regressions. | |
| Automated tests only | Misses admin UI regressions only humans catch. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Pin back to 7.3 + record blocker as known debt | Bounded effort; bump becomes a separate follow-up. | ✓ |
| Block phase exit until 7.4 works | Strict; risks weeks of stalled progress for solo author. | |
| Always exit phase regardless | Lets bugs leak forward. | |

**User's choice:** Defer the bump entirely (deviates from ROADMAP.md Phase 4 goal — explicitly confirmed); apply full re-validation gates when the deferred bump eventually runs; rollback to 7.3 with known-debt entry.
**Notes:** Rationale captured in D-BUMP-01: bundling a major-release bump into the same phase that's locking the FE↔BE contract concentrates two large risk surfaces. ROADMAP.md will be amended at phase-exit transition to reflect the actual decision.

---

## Claude's Discretion

Areas the planner is empowered to finalize without further user input:

- Exact Python package version pins within the locked stack.
- gunicorn worker count + timeout in prod settings.
- Whether `apps/blocks/` is one Wagtail app or several (one per content type).
- Whether Pinout `pins` `x`/`y` are normalized floats (0..1) or pixel ints — must match the FE Pinout component's existing consumption (P2 sets the answer).
- Exact `mc` sidecar image tag.
- Exact `wagtail-headless-preview` config syntax (redirect vs response mode — D-PREVIEW prescribes redirect; planner verifies during research).

## Deferred Ideas

(See `04-CONTEXT.md` `<deferred>` section for full list with rationale.)

- `code.tokens` `pre_save` Shiki sidecar (forward-port of P3 D-SHIKI-04).
- Wagtail 7.4 LTS bump.
- Auto-derived `Schematic.downloadUrl` from companion `schematic_original` ImageChooserBlock.
- Reusable `PartsList` Snippet across multiple lessons.
- `django-cors-headers`.
- Autosave polling on `/preview/*`.
- In-CI contract diff.
- Production Compose overlay (`compose.prod.yml`) finalization.
- Wagtail admin English-string sweep.
