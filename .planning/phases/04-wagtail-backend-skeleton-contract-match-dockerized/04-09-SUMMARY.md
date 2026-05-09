---
phase: 04-wagtail-backend-skeleton-contract-match-dockerized
plan: 09
subsystem: backend
tags: [contract-diff, gap-closure, wagtail-serializers, streamfield, page-serializer]
requires: [04-03, 04-04, 04-05, 04-06]
provides:
  - 7/7 PASS on `pnpm contract:diff`
  - backend/apps/blocks/flat_stream_serializer.py (FlatStreamField, SingleBlockField, FlatListField, LessonBodyField, ConstantField)
  - ContractPagesAPIViewSet + ContractPageSerializer in backend/wagtail_arduino/api.py
  - FigureBlock + PinoutBlock src_override / alt_override / width_override / height_override fields
  - _stamp_publish_dates() helper in seed_fixtures
affects:
  - backend/apps/blocks/image.py (override fields)
  - backend/apps/blocks/pinout.py (PinBlock IntegerBlock; override fields)
  - backend/apps/lessons/models.py (hoisted slug/type, LessonBodyField, NeighborSlugField)
  - backend/apps/articles/models.py (hoisted slug/type)
  - backend/apps/datasheets/models.py (SingleBlockField pinout, FlatListField specifications)
  - backend/apps/schematics/models.py (SingleBlockField schematicImage)
  - backend/apps/{lessons,articles,datasheets,schematics}/serializers.py (Kyiv-localtime IsoDateTimeField)
  - backend/apps/contract/management/commands/seed_fixtures.py (override-field seed; first_published_at stamping; treebeard root refresh)
  - backend/wagtail_arduino/api.py (ContractPagesAPIViewSet)
tech-stack:
  added: []
  patterns:
    - Custom DRF Field subclasses for StreamField envelope flattening
    - meta_fields override + ContractPageSerializer.to_representation pop("meta") for slug/type hoisting and meta-envelope omission
    - Override fields on StructBlocks for contract-test seed of unmanaged URLs
    - Post-publish ORM UPDATE to force first_published_at/last_published_at to fixture timestamps
key-files:
  created:
    - backend/apps/blocks/flat_stream_serializer.py
    - .planning/phases/04-wagtail-backend-skeleton-contract-match-dockerized/04-09-SUMMARY.md
  modified:
    - backend/apps/articles/models.py
    - backend/apps/articles/serializers.py
    - backend/apps/blocks/image.py
    - backend/apps/blocks/pinout.py
    - backend/apps/contract/management/commands/seed_fixtures.py
    - backend/apps/datasheets/models.py
    - backend/apps/datasheets/serializers.py
    - backend/apps/lessons/models.py
    - backend/apps/lessons/serializers.py
    - backend/apps/schematics/models.py
    - backend/apps/schematics/serializers.py
    - backend/wagtail_arduino/api.py
decisions:
  - "Wagtail emits flat {type, ...value} shape (no envelope, no id) so contract-diff is byte-equal with mock fixtures in src/assets/mock-data — without changing the diff allowlist or the FE adapter"
  - "Lesson.lede StreamField stays on the model for editor admin UX; LessonBodyField concatenates lede.children + body.children at API time so the wire shape matches the FE contract (no new migration)"
  - "FigureBlock + PinoutBlock got src_override/alt_override/width_override/height_override fields so contract fixtures (which reference /assets/mock-data/figures/*.svg, not real Wagtail Images) can round-trip byte-equal; the editor authoring path still uses ImageChooserBlock"
  - "PinBlock x/y switched from FloatBlock(0..1) to IntegerBlock — mocks emit pixel-space ints; D-MODEL-02 'Claude's discretion' clause allowed this swap"
  - "ContractPagesAPIViewSet removes slug + type from default meta_fields; ContractPageSerializer.to_representation pops the (now-empty-after-strip) meta envelope so JSON matches mocks that lack any meta key"
  - "publish() writes timezone.now() into first_published_at; _stamp_publish_dates does a post-publish ORM UPDATE to force the fixture timestamps. IsoDateTimeField now uses timezone.localtime so the +03:00 offset matches mock baked timestamps"
  - "Lesson.{prevSlug,nextSlug} computed server-side from LessonPage.objects.live().order_by('first_published_at'); raises SkipField at the chain boundaries so the key is omitted entirely (mocks don't bake leading nulls)"
  - "PartsListBlock kept the Wagtail-legal block name 'parts_list'; SingleBlockField type_override='parts-list' translates to FE-contract dashed form (wagtailcore.E001 forbids dashes in block names)"
metrics:
  duration: ~50min
  completed: 2026-05-09
  tasks_completed: 1
  files_changed: 13
  bugs_found: 7
---

# Phase 4 Plan 09: Contract-Diff Gap Closure Summary

**One-liner:** Replaced @property workarounds with custom DRF Field subclasses (FlatStreamField / SingleBlockField / FlatListField / LessonBodyField / ConstantField); hoisted slug+type out of the meta envelope and dropped the empty meta itself; added override-fields to FigureBlock/PinoutBlock so fixture URLs round-trip; stamped first_published_at to fixture timestamps; achieved `pnpm contract:diff` 7/7 PASS without modifying FE files or relaxing the D-CONTRACT-02 allowlist.

## What Shipped

| File | Change |
|---|---|
| `backend/apps/blocks/flat_stream_serializer.py` (new) | `FlatStreamField`, `SingleBlockField`, `FlatListField`, `LessonBodyField`, `ConstantField` |
| `backend/apps/blocks/image.py` | `FigureBlock` + `ImageChooserBlock` accept `src_override`/`alt_override`/`width_override`/`height_override`; required=False on `image` |
| `backend/apps/blocks/pinout.py` | `PinBlock` x/y → `IntegerBlock`; `PinoutBlock` override fields |
| `backend/apps/{lessons,articles,datasheets,schematics}/models.py` | api_fields use the new serializers; `APIField("type", serializer=ConstantField(...))`; `_NeighborSlugField` (lesson only) |
| `backend/apps/{lessons,articles,datasheets,schematics}/serializers.py` | `IsoDateTimeField` uses `timezone.localtime` |
| `backend/apps/contract/management/commands/seed_fixtures.py` | `_figure_value`/`_pinout_value` use override fields; `_stamp_publish_dates` post-publish; root refresh after `fix_tree` |
| `backend/wagtail_arduino/api.py` | `ContractPagesAPIViewSet` (slug+type out of meta, ContractPageSerializer drops meta) |

## Bugs Found and Fixed (iteratively, one cycle each)

1. **HTTP 500 — `StreamValue is not JSON serializable`**
   The `@property` shims (`partsList`, `peripheralNotes`, `schematicImage`) returned raw `StreamValue` objects. Replaced with `SingleBlockField(source="parts_list")` etc.

2. **DRF redundant-source assertion**
   `FlatStreamField(source="body")` blew up because field name and source were equal. Dropped the redundant `source=` argument when names matched.

3. **Wire-shape envelope vs flat mocks**
   Wagtail's default StreamField emitter wraps every block in `{type, value, id}`; mocks are flat `{type, ...value}`. `FlatStreamField` calls each block's existing `get_api_representation()` (which already returns the flat inner dict) and merges `type` in.

4. **`partsList` / `pinout` / `schematicImage` shape mismatch**
   FE TS contract types these as a single Block, not array of one. `SingleBlockField` unwraps the min=1,max=1 StreamField. For `partsList` the underlying block name is `parts_list` (Wagtail rejects dashes per wagtailcore.E001); `type_override="parts-list"` translates to the FE-contract spelling.

5. **`specifications` had a `type:'spec'` envelope per item**
   Mocks emit raw `[{label, value}, ...]`. `FlatListField` drops the per-item type tag.

6. **`Lesson.lede` rendered as a separate top-level field**
   Mocks treat lede as the first body block, no `lede` field on Lesson. `LessonBodyField` concatenates `instance.lede.children + instance.body.children` into a single flat array. No DB migration.

7. **`pinout.pins[].x/y` were FloatBlock(0..1) but mocks have integer pixel values**
   Switched to `IntegerBlock`. PinoutBlock also missing `width`/`height` in API rep — added via override fields.

## Auth, Locale, Meta, and Discriminator Fixes

- **`slug` and `type` were stuck inside `meta`** — Wagtail's default `meta_fields` includes both. Subclassed `PagesAPIViewSet.meta_fields` to remove them so `api_fields` surfaces them at the top level.
- **Empty `meta: {}` after contract-diff strips its allowlisted fields** — even after stripping every member, the empty parent dict still leaked. `ContractPageSerializer.to_representation()` does `data.pop("meta", None)` before returning.
- **`type` discriminator at top level** — mocks have `"type": "lesson"`/`"article"`/`"datasheet"`/`"schematic"`. New `ConstantField(constant)` emits the fixed string.
- **`publishedAt`/`updatedAt` timezone offset mismatch** — DB stores UTC; Wagtail's default ISO format emits `+00:00`; mocks bake `+03:00` (Europe/Kyiv). `IsoDateTimeField` now uses `timezone.localtime(value).isoformat()`.
- **`first_published_at` was set to `now()` by `publish()`, not the fixture timestamp** — `_stamp_publish_dates(page, fixture)` does a post-publish ORM UPDATE on `first_published_at` + `last_published_at` from the JSON.
- **`prevSlug`/`nextSlug`** — `_NeighborSlugField` derives from `LessonPage.objects.live().order_by("first_published_at")`. Raises `SkipField` at chain boundaries so the key is omitted entirely (mocks don't bake leading `null`).

## Auto-fixed Issues

**[Rule 3 — Blocking] treebeard `_inc_path on NoneType` after `Page.fix_tree`**
- **Found during:** seed_fixtures re-run
- **Issue:** `qs.delete()` clears the rows but the in-memory `root: Page` object held a stale `numchild`; `fix_tree(destructive=False)` reconciles the DB but doesn't refresh in-memory state. Subsequent `root.add_child()` then crashed.
- **Fix:** `root = Page.objects.get(pk=root.pk)` after `fix_tree`.
- **Files modified:** `backend/apps/contract/management/commands/seed_fixtures.py`

**[Rule 1 — Bug] `figure.alt` had `seed-` prefix on every image**
- **Found during:** first body diff comparison
- **Issue:** `_placeholder_image(title=f"seed-{alt[:80]}", ...)` set `Image.title = "seed-..."`, and `Image.default_alt_text` falls back to `title`.
- **Fix:** Skipped placeholder image creation entirely for fixtures; pass through fixture-shaped `src`/`alt` via the new `*_override` fields. `image=None` is now permitted on FigureBlock/PinoutBlock.

## Final Verification

```
$ pnpm contract:diff
PASS lesson/pershyi-blymayuchyi-svitlodiod
PASS lesson/knopka-ta-pidtyahuvalnyi-rezystor
PASS lesson/analogovyi-vhid-ta-potentsiometr
PASS article/chomu-arduino
PASS datasheet/atmega328p
PASS datasheet/arduino-uno-r3
PASS schematic/blymayuchyi-svitlodiod-shema
7/7 PASS
$ echo $?
0
```

- FE files unchanged: `git diff src/` empty
- contract-diff script unchanged: `git diff scripts/` empty
- D-CONTRACT-02 allowlist not modified

## Deviations from Plan

None at the plan-prompt level. The CLAUDE.md "Frontend owns the contract" rule was followed verbatim — every mismatch was resolved on the BE side.

## Known Stubs / Tradeoffs

- **`FigureBlock` / `PinoutBlock` override fields exist for contract-fixture seeding.** Editor authoring should still use `ImageChooserBlock` (the override fields default to empty and the API rep falls back to the chooser). Once real content authoring begins, set the override fields to empty in real pages — they're an escape hatch, not the primary path.
- **`_NeighborSlugField` does a `LessonPage.objects.live().order_by(...)` per request per field.** Two such queries per lesson detail = N+2 query overhead; fine for 7 fixtures and dev traffic, worth caching once a real list endpoint exists in P5.
- **`_stamp_publish_dates` bypasses Wagtail's revision history** — it writes directly to the page row. Acceptable for contract seeding (the published revision is what counts); inappropriate for real authoring (which Wagtail tracks via `PageRevision`).

## Threat Flags

None — surface introduced (override CharBlock/IntegerBlock fields on FigureBlock/PinoutBlock, additional ORM UPDATE in seed) is internal to the contract-test seed flow, not exposed to editors at large or to unauthenticated traffic.

## Commit

- `3ad9f2a` — `fix(04-09): close contract-diff to 7/7 PASS — flat StreamField wire shape, hoisted slug/type, override fields`

## Self-Check: PASSED

- FOUND: backend/apps/blocks/flat_stream_serializer.py
- FOUND: commit 3ad9f2a in `git log`
- VERIFIED: `pnpm contract:diff` → `7/7 PASS`, exit 0
- VERIFIED: `git diff src/ scripts/` → empty

---

## Phase 4 closure addendum (2026-05-09)

After the contract-diff executor finished, the user ran the live-gate browser walkthrough. That surfaced **four additional Plan 04-01/07 defects** distinct from the contract-shape issues handled above. All four were fixed inline (no further executor); the bugs and fixes follow.

### Bug 8 — fe-router was `traefik/whoami` debug stub, not a proxy [Plan 04-01]

`compose.yml` defined `fe-router` with `image: traefik/whoami:latest` and a Traefik `services.fe.loadbalancer.server.url=http://host.docker.internal:4200` label. Two problems:
1. `traefik/whoami` is a debug echo — it ignores any backend, just prints request headers.
2. `services.X.loadbalancer.server.url` is a **file-provider-only** label; the Docker provider only honors `services.X.loadbalancer.server.port`. So even if the image were a proxy, Traefik wasn't pointing it anywhere meaningful.

Result: every FE route on `arduino.localhost` (homepage, lessons, `/preview/*`) hit the whoami stub and rendered as `Hostname: <container-id>` text.

**Fix (commit `07bcf4b`):** replaced `fe-router` with `caddy:2-alpine` running `caddy reverse-proxy --from :80 --to host.docker.internal:4200`. Caddy actually proxies; Traefik routes `Host(arduino.localhost)` priority=1 (catch-all) → fe-router :80 → host's `pnpm start` on :4200.

### Bug 9 — `ng serve` bound to localhost only [package.json / dev workflow]

Angular CLI's `ng serve` defaults to `127.0.0.1:4200` (or `[::1]:4200`). Caddy in the fe-router container reaches the host via `host.docker.internal` (Docker Desktop's host gateway, ~192.168.5.2) — that's a non-loopback address and gets `connection refused`.

**Fix (commit `07bcf4b`):** `package.json` `"start"` and `"dev"` scripts use `ng serve --host 0.0.0.0`. Caveat: also exposes the dev server to the LAN — acceptable for local dev, lock down behind the host firewall if hostile networks matter.

### Bug 10 — Angular dev-server Host check rejected proxied requests [angular.json]

After Bugs 8/9, the next failure: `Blocked request. This host ("host.docker.internal") is not allowed.` Initial caddy config used `--change-host-header`, rewriting `Host: arduino.localhost` → `Host: host.docker.internal:4200` for the upstream. Angular's dev-server host check refuses unknown hosts.

**Fix (commit `3415b67`):** dropped `--change-host-header` from the caddy command so the original `Host: arduino.localhost` flows end-to-end; added `"allowedHosts": ["arduino.localhost"]` to `angular.json` `serve.options`. This is the more correct pattern — a transparent reverse proxy preserves the Host header, and the upstream explicitly accepts the public-facing hostname.

### Bug 11 — `useWagtailContentApi: false` blocked the preview-stub [environment.development.ts]

The FE preview-stub component refuses to load if `useWagtailContentApi` is `false` (a deliberate safety toggle from Plan 04-05 keeping the FE on `MockContentApi` until contract parity was proven). With contract-diff now 7/7 PASS, the toggle can flip.

**Fix (commit `d7d92cb`):** `environment.development.ts` `useWagtailContentApi: true`. The dev FE now talks to Wagtail directly for both list/detail pages and the preview-stub.

### Round-trip verification

After all four fixes, the user pasted a programmatically-minted preview URL — `http://arduino.localhost/preview/lesson/id=46:1wLe6M:NTmORzjkb_aCAjVhnneeVVJOj6r-2Crguuq6qoXAPhk/` — into Chrome. The page rendered with the draft slug shown in the FE preview-stub component:

```
Ця сторінка показує чернетку матеріалу до публікації.
contentType: lesson
token: id=46:1wLe6M:NTmORzjkb_aCAjVhnneeVVJOj6r-2Crguuq6qoXAPhk
slug: pershyi-blymayuchyi-svitlodiod
```

This proves the full headless-preview round-trip: FE route param → `WagtailContentApi.getLessonPreview()` → `/api/v2/page_preview/?content_type=…&token=…` → Wagtail's `PagePreviewAPIViewSet.detail_view()` → `PagePreview.objects.get(token=…)` → `as_page()` → serialized → FE renders.

### Known Debt — carried into Phase 4 close (option C, mirroring P3)

| ID | Severity | Description | Tracked for |
|----|----------|-------------|-------------|
| KD4-01 | low | Wagtail admin's **inline preview pane** uses `Page.get_url()` → `/<slug>/` (the published URL), bypassing the headless-preview redirect. Editors must use the standalone "Open preview in new tab" button instead, which calls `serve_preview()` → mints a token → redirects to `/preview/<kind>/<token>/`. The inline-pane fix requires a Wagtail admin template/JS override — out of scope for P4. | P6 editorial polish |
| KD4-02 | low | `FigureBlock` / `PinoutBlock` `*_override` fields exist for contract-fixture seeding only. Real editor authoring should leave them empty (chooser fallback handles the typical case). | P6 — hide override fields in admin panels for non-fixture pages |
| KD4-03 | low | `_NeighborSlugField` runs `LessonPage.objects.live().order_by(...)` per request per field (2 queries per lesson detail). Fine at 7 fixtures, becomes a hot path at scale. | P5 — replace with a list-endpoint-driven prev/next denormalization |
| KD4-04 | low | `_stamp_publish_dates` writes directly to the page row, bypassing Wagtail's `PageRevision`. Acceptable for contract seeding; inappropriate for real authoring (which already uses Wagtail's revision tracking — this only affects fixture seed). | n/a — fixture-seed-only by design; flag if anyone reuses the helper outside seed_fixtures |
| KD4-05 | ~~low~~ | ~~Live-gate browser force-en walk deferred to user run.~~ **RESOLVED 2026-05-09:** user walked admin under DevTools Sensors `en-US` (Ukrainian PASS, residual upstream-Wagtail strings deferred to P6 per CONTEXT.md); programmatic scan of all 4 REST endpoints zero English month/day literals; `/preview/<token>/` view source has `<html lang="uk">`; FE homepage Ukrainian. Audit row in `docs/force-en-audit.md` updated to `**ALL PASS**`. | n/a — closed |
| KD4-06 | low | Wagtail 7.4 LTS bump (D-BUMP-01..03) carried out of P4 entirely per ROADMAP amendment. Single-task plan TBD. | P4.1 |

### Live-gate scoreboard (final)

| Gate | Status |
|------|--------|
| `docker compose up -d --build` clean from a fresh checkout | ✓ PASS |
| All 6 services healthy (postgres/wagtail/minio Up; mc Exited 0) | ✓ PASS |
| `migrate --noinput` applies all migrations | ✓ PASS |
| `seed_fixtures` creates 7 published pages | ✓ PASS |
| `curl /admin/login/` → 200 | ✓ PASS |
| `curl /api/v2/pages/` → 200 | ✓ PASS |
| `curl /` → 200 (Angular FE homepage proxied via fe-router) | ✓ PASS |
| `pnpm contract:diff` → `7/7 PASS` | ✓ PASS |
| Editor preview round-trip via programmatically-minted token | ✓ PASS |
| Browser force-en walk (admin + preview + API + DevTools sensors) | ✓ PASS — admin Ukrainian (upstream defaults to P6), API zero English literals, `<html lang="uk">` on FE + preview |

### Verdict

Phase 4 **closes 2026-05-09 with known debt (option C, mirroring P3 closure pattern).** Six items KD4-01..06 carried for tracking; none blocking the move to Phase 5 deployment work. Wagtail backend conforms 1:1 to the FE TS contract for all 7 fixture pages; preview round-trip operational; gitleaks gate enforcing; locale lock verified statically; live browser walks are the only remaining unfinished item and are tracked.

### Commits added in this addendum

- `07bcf4b` — `fix(04-09): replace fe-router whoami stub with caddy reverse-proxy; bind ng serve to 0.0.0.0`
- `3415b67` — `fix(04-09): preserve Host header end-to-end (drop --change-host-header; allow arduino.localhost in ng serve)`
- `d7d92cb` — `fix(04-09): flip useWagtailContentApi: true in dev env`
