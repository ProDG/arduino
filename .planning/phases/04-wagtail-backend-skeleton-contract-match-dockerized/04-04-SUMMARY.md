---
phase: 04-wagtail-backend-skeleton-contract-match-dockerized
plan: 04
subsystem: backend.contract.seed
tags: [wagtail, seed, fixtures, contract, management-command]
requires:
  - 04-01 (Wagtail app skeleton + Dockerized stack)
  - 04-02 (MinIO + django-storages[s3])
  - 04-03 (Page models + StreamField blocks for lessons/articles/datasheets/schematics)
provides:
  - "`python manage.py seed_fixtures` — idempotent loader for the 7 CONTRACT-04 fixtures"
  - "apps.contract Django app (registered in INSTALLED_APPS)"
  - "compose.dev.yml read-only bind-mount of host src/assets into the wagtail container"
affects:
  - "Plan 04-06 (contract diff) — depends on these 7 published pages existing on /api/v2/pages/"
  - "MinIO bucket — placeholder PNGs land under originals/"
tech-stack:
  added:
    - "Pillow (PIL.Image) used for placeholder PNG generation in the seed command"
  patterns:
    - "Idempotent seeding: filter-by-slug delete + recreate (no get_or_create — page tree edge cases)"
    - "Wagtail StreamField wire-shape: top-level blocks wrap as {type, value}; ListBlock items are plain dicts"
    - "Dual-path MOCK_DATA_ROOT resolution: container path first, host fallback (lets the file run both inside docker and from a host venv)"
key-files:
  created:
    - backend/apps/contract/__init__.py
    - backend/apps/contract/apps.py
    - backend/apps/contract/management/__init__.py
    - backend/apps/contract/management/commands/__init__.py
    - backend/apps/contract/management/commands/seed_fixtures.py
  modified:
    - backend/wagtail_arduino/settings/base.py (appended "apps.contract" to INSTALLED_APPS)
    - compose.dev.yml (added ./src/assets:/repo/src/assets:ro mount on wagtail service)
decisions:
  - "Lesson body's leading lede block is extracted into LessonPage.lede StreamField, since LESSON_BODY_BLOCKS does not include `lede` (Plan 04-03 model)."
  - "Pin coordinates from fixtures (0-100 integer space) are normalized to 0.0-1.0 floats to satisfy PinBlock's FloatBlock(min=0,max=1) constraint."
  - "Code block `highlightLines` is stored as a comma-separated CharBlock string (matching Plan 04-03's `_parse_highlight_lines`); the FE adapter parses CSV → list[int]."
  - "Code block `tokens` field is stripped from fixtures during seed (D-CONTRACT-04 keeps tokens out of BE)."
  - "Sidenote `anchorParagraphIndex` is stripped (D-MODEL-04 — BE does not store it)."
  - "Placeholder images are deduplicated by title (idempotent across re-runs) — no extra MinIO objects per re-seed."
  - "Idempotency uses `delete()` filtered by `slug__in=ALL_FIXTURE_SLUGS` per page model — bounded blast radius (T-04-24 mitigation)."
metrics:
  duration: ~25 min (single executor task)
  completed: 2026-05-03
  tasks_completed: 1
  files_created: 5
  files_modified: 2
---

# Phase 04 Plan 04: seed_fixtures Management Command Summary

Idempotent Django management command `python manage.py seed_fixtures` lives in a new `apps.contract` app and reads the same `src/assets/mock-data/**/*.json` fixtures the FE `MockContentApi` consumes, creating 7 PUBLISHED Wagtail pages (3 lessons + 1 article + 2 datasheets + 1 schematic) matching the CONTRACT-04 slug list verbatim. Re-running clears prior fixture pages by slug before reseeding, so the contract-diff runway in Plan 04-06 is now open.

## What was built

### `apps/contract/` skeleton
A bare Django app — no models, no views, no migrations. Its sole purpose is to host the `seed_fixtures` management command. Registered in `INSTALLED_APPS` via `backend/wagtail_arduino/settings/base.py`.

### `seed_fixtures` command
Located at `backend/apps/contract/management/commands/seed_fixtures.py`. Architecture:

1. **`MOCK_DATA_ROOT` dual resolution** — `/repo/src/assets/mock-data` (container, preferred) → host fallback via `Path(__file__).resolve().parents[4].parent / "src" / "assets" / "mock-data"`. Lets the file run from either context without conditionals.
2. **Slug whitelists** — four module-level `frozen` sets (`LESSON_SLUGS`, `ARTICLE_SLUGS`, `DATASHEET_SLUGS`, `SCHEMATIC_SLUGS`) verbatim from D-CONTRACT-03.
3. **`_placeholder_image(title, w, h)`** — idempotent by title; if an `Image.objects.filter(title=...)` hit exists, return it; otherwise mint a 220-grey PNG via Pillow and upload through `Image.objects.create(file=ImageFile(...))`. With `STORAGES.default = MediaS3Storage` (Plan 04-02), the bytes land in MinIO under `originals/`.
4. **`_block_from_fe(fe)`** — converts each flat FE block `{type, ...fields}` into Wagtail's wire envelope `{type, value: {...}}`. Per-block-type handling:
    - `figure` → uploads a placeholder image, replaces flat `{src,alt,width,height}` with `{image: <id>, captionHtml?, number?, fullBleed}`
    - `code` → strips `tokens`; collapses `highlightLines: list[int]` → CSV string; preserves `annotations` ListBlock as plain dicts (no per-item envelope inside ListBlock)
    - `sidenote` → strips `anchorParagraphIndex`
    - `paragraph`/`heading`/`lede`/`aside`/`diff` → straight pass-through after wrapping
5. **`_pinout_value(fe)`** — uploads a placeholder image, normalizes pin x/y from 0-100 fixture space into 0.0-1.0 (PinBlock FloatBlock constraint).
6. **`_split_lede_from_body(body)`** — lesson fixtures have lede as `body[0]`, but LessonPage's body StreamField does not allow `lede` blocks; this helper pulls it into the dedicated LessonPage.lede StreamField.
7. **`Command.handle`** — verifies `MOCK_DATA_ROOT` exists (raises with actionable hint pointing at the compose.dev.yml mount), looks up the default Site's root_page, deletes prior pages with `slug__in=ALL_FIXTURE_SLUGS` filtered by each page model (idempotency), then runs four per-type seeders. Each seeder calls `root.add_child(instance=page)` then `page.save_revision().publish()` so the REST API surfaces the page.

### `compose.dev.yml` bind-mount
Added `- ./src/assets:/repo/src/assets:ro` under the wagtail service. The seed command's `MOCK_DATA_ROOT` resolves to `/repo/src/assets/mock-data` inside the container. `:ro` enforces T-04-27 (container cannot tamper with host fixtures).

## Acceptance criteria status

| Check | Status |
|-------|--------|
| `test -f backend/apps/contract/management/commands/seed_fixtures.py` | PASS |
| `grep -F "MOCK_DATA_ROOT" seed_fixtures.py` | PASS (3 hits) |
| `grep -cF "save_revision().publish()" seed_fixtures.py` | PASS (4, one per page-type seeder) |
| All seven D-CONTRACT-03 slugs literally present in seed_fixtures.py | PASS (7/7) |
| `grep -F '"apps.contract"' settings/base.py` | PASS |
| Python syntax (`ast.parse`) | PASS |
| `docker compose exec wagtail python manage.py seed_fixtures` | DEFERRED — see Seed-Runtime Gate below |
| API total_count assertions (3/1/2/1) | DEFERRED — same gate |
| MinIO `mc ls` placeholder image listing | DEFERRED — same gate |

## Seed-Runtime Gate (deferred to verifier)

**Docker daemon is not running in this parallel-executor worktree** (`docker info` returns unavailable). The wave structure runs Plans 04-04..04-08 in parallel worktrees, none of which can stand the full Docker stack up. The plan acknowledges this scenario via the `<parallel_execution>` directive: "If Docker unavailable: produce the seed command, document seed-runtime gate in SUMMARY for the verifier."

**What the verifier (post-merge, Wave 5) must execute:**

```bash
docker compose -f compose.yml -f compose.dev.yml up -d
docker compose restart wagtail   # picks up apps.contract in INSTALLED_APPS
docker compose exec wagtail python manage.py seed_fixtures
docker compose exec wagtail python manage.py seed_fixtures   # idempotency re-run

curl -s "http://arduino.localhost/api/v2/pages/?type=lessons.LessonPage"     | jq '.meta.total_count'   # → 3
curl -s "http://arduino.localhost/api/v2/pages/?type=articles.ArticlePage"   | jq '.meta.total_count'   # → 1
curl -s "http://arduino.localhost/api/v2/pages/?type=datasheets.DatasheetPage" | jq '.meta.total_count' # → 2
curl -s "http://arduino.localhost/api/v2/pages/?type=schematics.SchematicPage" | jq '.meta.total_count' # → 1

curl -s "http://arduino.localhost/api/v2/pages/?type=lessons.LessonPage&slug=pershyi-blymayuchyi-svitlodiod" \
  | jq -r '.items[0].meta.slug'   # → "pershyi-blymayuchyi-svitlodiod"

docker compose exec -T minio sh -c \
  'mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" \
   && mc ls --recursive local/arduino-media/originals/ | head -5'
```

Expected first-run stdout shape:

```
MOCK_DATA_ROOT = /repo/src/assets/mock-data
  seeded LessonPage: analogovyi-vhid-ta-potentsiometr
  seeded LessonPage: knopka-ta-pidtyahuvalnyi-rezystor
  seeded LessonPage: pershyi-blymayuchyi-svitlodiod
  seeded ArticlePage: chomu-arduino
  seeded DatasheetPage: arduino-uno-r3
  seeded DatasheetPage: atmega328p
  seeded SchematicPage: blymayuchyi-svitlodiod-shema
Seed complete.
```

Expected second-run stdout (idempotency proof) prepends `cleared N prior … fixture pages` lines for each page type that had prior fixtures.

## Field-name translations encountered (FE camelCase ↔ BE snake_case)

| FE (fixture key) | BE (model attribute / StreamField) | Direction handled in seed |
|---|---|---|
| `estimatedMinutes` | `estimated_minutes` | seed maps explicitly on LessonPage init |
| `partsList` | `parts_list` (StreamField) | seed maps explicitly |
| `peripheralNotes` | `peripheral_notes` (StreamField) | seed maps explicitly |
| `schematicImage` | `schematic_image` (StreamField) | seed maps explicitly |
| `downloadUrl` | `download_url` (URLField) | seed maps explicitly |
| `partsList.items[].quantity` | `quantity` (IntegerBlock) | preserved as int |
| `partsList.items[].note` | `note` (CharBlock, optional) | omitted from value dict if absent |
| `code.highlightLines: list[int]` | CSV string in CharBlock | `_highlight_lines_to_csv` |
| `figure.{src,width,height}` | `image: <Image PK>` | `_figure_value` uploads placeholder |
| `pinout.{src,width,height}` | `image: <Image PK>` | `_pinout_value` uploads placeholder |
| `pinout.pins[].{x,y}` (0-100) | `{x,y}` FloatBlock (0.0-1.0) | `_norm_coord` divides by 100 |

The reverse direction (BE → FE camelCase on read) is handled by APIField `name`/`source` mappings on the page models (Plan 04-03).

## FE-only fields stripped during seed (NOT round-tripped to BE)

| Field | Where | Why |
|---|---|---|
| `code.tokens` | Code blocks | D-CONTRACT-04 — Shiki tokens are an FE build-time concern; not stored in BE |
| `sidenote.anchorParagraphIndex` | Sidenote blocks | D-MODEL-04 — anchoring is an FE rendering concern |
| `lesson.publishedAt` / `lesson.updatedAt` (etc.) | All page fixtures | Wagtail manages these on `save_revision().publish()`; the FE adapter pulls them back from `meta` |
| `lesson.prevSlug` / `lesson.nextSlug` | Lesson fixtures | Navigation hints not part of the page model; FE computes these from a separate manifest |

These intentional strips are why the contract-diff allowlist in Plan 04-06 will skip them.

## Threat-register status

| Threat | Disposition | Where mitigated |
|---|---|---|
| T-04-24 (broad delete) | mitigated | `qs = model.objects.filter(slug__in=all_slugs)` — bounded by 7-slug whitelist + 4-model loop |
| T-04-25 (apps.contract in prod) | accepted | acknowledged; Plan 05 may exclude `apps.contract` from prod settings |
| T-04-26 (image flood) | accepted | placeholders deduped by title; ~7 placeholders total |
| T-04-27 (writable bind-mount) | mitigated | `:ro` flag on the compose.dev.yml mount |

## Deviations from Plan

The PLAN's reference template fed `data["lede"]` straight into the lede StreamField. **Lesson fixtures don't have a top-level `lede` key** — the lede is `body[0]`. Without splitting it out, two failures would occur: (a) `data.get("lede")` is None so the lede StreamField stays empty, and (b) the body StreamField rejects the `lede`-typed first block (LESSON_BODY_BLOCKS does not include lede). Added `_split_lede_from_body(body)` to handle this. **[Rule 3 — Blocking issue auto-fix].**

The PLAN reference template encoded annotations as `_block_from_fe` recursion (which would have wrapped each annotation in a `{type, value}` envelope). **StructBlock items inside a ListBlock are stored as plain dicts** in StreamField wire format, not envelopes. Added a dedicated `_annotations_listblock` helper that emits plain dicts. **[Rule 1 — Bug fix prevented future StreamField parse error].**

The PLAN reference template did not normalize pinout pin coordinates. **Fixtures use 0-100 integer space; PinBlock FloatBlock constrains 0.0-1.0.** Added `_norm_coord`. **[Rule 1 — Bug fix prevented save validation error].**

The PLAN reference template fed `highlightLines` straight from the FE (a list[int]) into the CodeBlock value. **Plan 04-03's CodeBlock stores `highlightLines` as a CharBlock with `_parse_highlight_lines` doing CSV → list[int].** Without translation, Wagtail would reject the StreamField save. Added `_highlight_lines_to_csv`. **[Rule 1 — Bug fix prevented save validation error].**

The PLAN reference template applied `_block_from_fe` to the schematic's `schematicImage` (using `{type: "figure", **data["schematicImage"]}`). The PinoutBlock has its own field shape; the same generic figure path was right for schematic, but for pinout I introduced a dedicated `_pinout_value` helper to handle the `pins` ListBlock with coordinate normalization. **[Rule 2 — Missing critical functionality auto-add].**

## Known stubs

None. Every fixture field is either (a) round-tripped through Wagtail or (b) intentionally stripped per a documented contract decision (D-CONTRACT-04 / D-MODEL-04 / publish-time fields). The placeholder PNGs are explicitly part of the seed contract — D-CONTRACT-03's slug list says nothing about image binary identity, only the URL surface and width/height.

## Threat Flags

None. The seed command introduces no new network surface (it is a Django management command, not an HTTP endpoint). The compose.dev.yml mount is `:ro` and only exposed to the wagtail service in dev.

## Self-Check: PASSED

Files created/exist:
- `backend/apps/contract/__init__.py` FOUND
- `backend/apps/contract/apps.py` FOUND
- `backend/apps/contract/management/__init__.py` FOUND
- `backend/apps/contract/management/commands/__init__.py` FOUND
- `backend/apps/contract/management/commands/seed_fixtures.py` FOUND
- `backend/wagtail_arduino/settings/base.py` (modified — INSTALLED_APPS appended) FOUND
- `compose.dev.yml` (modified — bind-mount appended) FOUND

Commits:
- `4b4c92c` feat(04-04): add apps.contract seed_fixtures management command — FOUND in `git log`

Static verifications:
- Python syntax (ast.parse) PASS
- `grep -cF "save_revision().publish()" seed_fixtures.py` → 4 (≥4 required) PASS
- All 7 D-CONTRACT-03 slugs present verbatim PASS
- `"apps.contract"` present in INSTALLED_APPS PASS
- `MOCK_DATA_ROOT` symbol present PASS

Runtime verifications (Docker exec, curl, mc ls): DEFERRED to verifier per `<parallel_execution>` gate documented above.
