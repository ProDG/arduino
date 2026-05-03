---
phase: 04-wagtail-backend-skeleton-contract-match-dockerized
plan: 02
subsystem: backend
tags: [minio, storage, docker, django-storages, s3, traefik, bucket-policy]
requires:
  - 04-01 (compose stack base + Traefik + Wagtail container + .env.example)
  - django-storages[s3] 1.14.6 (already pinned in backend/pyproject.toml from Plan 01)
  - boto3 1.43.2 (transitive)
provides:
  - backend/wagtail_arduino/storage.py (MediaS3Storage)
  - STORAGES + AWS_* settings in base.py
  - minio service in compose.yml (healthcheck + Traefik /media route + stripprefix middleware, priority=90)
  - mc one-shot bootstrap sidecar in compose.yml (creates arduino-media, applies public-read on images/ ONLY)
  - minio-data named volume
  - minio :9000 + :9001 published to host in compose.dev.yml
  - .env.example documents DJANGO_AWS_S3_ENDPOINT_URL=http://minio:9000 (Docker DNS) with host-side comment
affects:
  - backend/wagtail_arduino/settings/prod.py (comment marker only — P5 wires prod endpoint via env)
  - backend/wagtail_arduino/settings/base.py (appended AWS_* + STORAGES; locale + prior settings untouched)
  - compose.yml (wagtail depends_on extended to include minio:service_healthy)
tech-stack:
  added:
    - minio/minio:RELEASE.2025-04-22T22-12-26Z (server)
    - minio/mc:RELEASE.2025-04-08T15-39-49Z (one-shot bootstrap sidecar)
  patterns:
    - default-storage-with-prefix-policy (D-MINIO-01): single bucket, public-read scoped to images/, originals/ + documents/ stay private
    - path-style S3 addressing (Pitfall 2): AWS_S3_ADDRESSING_STYLE='path' is mandatory for MinIO
    - unsigned rendition URLs (D-MINIO-02..04): AWS_QUERYSTRING_AUTH=False; bucket policy gates public access; cacheable + prerender-safe
    - Traefik /media/* route → minio:9000 with stripprefix middleware (D-MINIO-03 dev; same shape lands in prod via P5)
    - mc sidecar idempotent bootstrap (D-MINIO-05): mc mb --ignore-existing + mc anonymous set download
key-files:
  created:
    - backend/wagtail_arduino/storage.py
    - .planning/phases/04-wagtail-backend-skeleton-contract-match-dockerized/04-02-SUMMARY.md
  modified:
    - backend/wagtail_arduino/settings/base.py
    - backend/wagtail_arduino/settings/prod.py
    - compose.yml
    - compose.dev.yml
    - .env.example
decisions:
  - "Pinned MinIO server image at RELEASE.2025-04-22T22-12-26Z (latest stable as of 2026-05-03)."
  - "Pinned mc client image at RELEASE.2025-04-08T15-39-49Z (most recent client release compatible with the server pin)."
  - "Switched .env.example DJANGO_AWS_S3_ENDPOINT_URL from http://localhost:9000 (Plan 01 placeholder) to http://minio:9000 (Docker DNS) — the Wagtail container reaches MinIO via the internal network. Host-side mc/console use http://localhost:9000 / :9001 (dev only); documented inline."
  - "MediaS3Storage.location='' to keep Wagtail's conventional originals/ + images/ prefix routing intact (Wagtail decides per-model upload_to). The bucket policy split (public images/, private originals/) is enforced at the bucket-policy layer, not via per-storage-class location prefixes."
  - "AWS_S3_REGION_NAME='us-east-1' as MinIO placeholder (boto3 requires the parameter; MinIO ignores the value)."
  - "compose.yml wagtail.depends_on extended with minio:service_healthy. wagtail container will not boot until both Postgres AND MinIO pass healthcheck — eliminates a class of dev startup races where Wagtail tries to upload before the bucket sidecar has finished."
metrics:
  duration: ~6min
  completed: 2026-05-03
---

# Phase 4 Plan 02: MinIO + django-storages[s3] wiring — Summary

Wired Wagtail media to MinIO via `django-storages[s3]` + `boto3`. Single `arduino-media` bucket; `images/` prefix is public-read (cacheable rendition URLs, prerender-safe), `originals/` + `documents/` stay private. An idempotent `mc` sidecar bootstraps the bucket and applies the prefix-scoped public-read policy. Traefik fronts MinIO at `http://arduino.localhost/media/*` via stripprefix middleware so dev and prod share the same `MEDIA_URL` shape.

## Tasks

### Task 1 — MinIO + mc + MediaS3Storage + STORAGES wiring (commit `1dd0eb1`)

#### Files written

- `backend/wagtail_arduino/storage.py` (new): `MediaS3Storage(S3Storage)` with `location=""`, `file_overwrite=False`, `querystring_auth=False`. Module docstring documents the per-prefix bucket-policy posture.
- `backend/wagtail_arduino/settings/base.py` (appended): `STORAGES` dict pointing default at `wagtail_arduino.storage.MediaS3Storage`; `AWS_S3_ENDPOINT_URL`, `AWS_STORAGE_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` from env; `AWS_S3_REGION_NAME='us-east-1'`, `AWS_S3_ADDRESSING_STYLE='path'`, `AWS_S3_FILE_OVERWRITE=False`, `AWS_DEFAULT_ACL=None`, `AWS_QUERYSTRING_AUTH=False`. Inline comments document the rendition spec strategy (`width-800`, `width-1600`, `width-3200` registered implicitly per Wagtail conventions; `ImageChooserBlock.get_api_representation` in Plan 03 emits `width-1600` as default `src`).
- `backend/wagtail_arduino/settings/prod.py` (appended): comment marker only — prod endpoint override is driven by `DJANGO_AWS_S3_ENDPOINT_URL` env in `compose.prod.yml` (owned by P5).
- `compose.yml` (extended): added `minio` service (image `minio/minio:RELEASE.2025-04-22T22-12-26Z`, command `server /data --console-address ":9001"`, healthcheck on `/minio/health/live`, Traefik labels for `Host(arduino.localhost) && PathPrefix(/media)` route at priority=90, `media-stripprefix` middleware mapping `/media` → empty); added `mc` one-shot sidecar (image `minio/mc:RELEASE.2025-04-08T15-39-49Z`, runs `mc alias set local …`, `mc mb --ignore-existing local/arduino-media`, `mc anonymous set download local/arduino-media/images`, then echoes "MinIO bootstrap complete: arduino-media bucket; public-read on images/ only.", `restart: "no"`); extended `wagtail.depends_on` with `minio: { condition: service_healthy }`; added `minio-data` named volume.
- `compose.dev.yml` (extended): `minio.ports: ["9000:9000", "9001:9001"]` so the host can reach the API for ad-hoc `mc` and the console UI for visual debugging.
- `.env.example` (modified): `DJANGO_AWS_S3_ENDPOINT_URL=http://minio:9000` (Docker DNS, used by Wagtail container). Inline comment notes ad-hoc host-side scripts use `http://localhost:9000` and the console at `http://localhost:9001` (dev only).

#### Static acceptance verifications (all passed)

```
class MediaS3Storage(S3Storage):                                                          ✓ storage.py
querystring_auth = False                                                                  ✓ storage.py
location = ""                                                                             ✓ storage.py
"BACKEND": "wagtail_arduino.storage.MediaS3Storage",                                      ✓ base.py
AWS_S3_ADDRESSING_STYLE = "path"                                                          ✓ base.py
AWS_QUERYSTRING_AUTH = False                                                              ✓ base.py
AWS_DEFAULT_ACL = None                                                                    ✓ base.py
image: minio/minio:RELEASE.2025-04-22T22-12-26Z                                           ✓ compose.yml
image: minio/mc:RELEASE.2025-04-08T15-39-49Z                                              ✓ compose.yml
mc anonymous set download local/arduino-media/images                                      ✓ compose.yml
grep -cF "mc anonymous set" compose.yml = 1                                               ✓ (no public-read on originals or documents)
traefik.http.middlewares.media-stripprefix.stripprefix.prefixes=/media                    ✓ compose.yml
traefik.http.routers.minio.priority=90                                                    ✓ compose.yml
"9000:9000"                                                                               ✓ compose.dev.yml
"9001:9001"                                                                               ✓ compose.dev.yml
docker compose -f compose.yml -f compose.dev.yml config                                   ✓ exit 0 (merged config valid)
```

Compose merge sample (excerpted from `docker compose config` output):

```yaml
mc:
  image: minio/mc:RELEASE.2025-04-08T15-39-49Z
  command: |
    mc alias set local http://minio:9000 "$$MINIO_ROOT_USER" "$$MINIO_ROOT_PASSWORD"
    mc mb --ignore-existing local/arduino-media
    mc anonymous set download local/arduino-media/images
    echo "MinIO bootstrap complete: arduino-media bucket; public-read on images/ only."
minio:
  image: minio/minio:RELEASE.2025-04-22T22-12-26Z
  healthcheck:
    test: [CMD, curl, -f, http://localhost:9000/minio/health/live]
  labels:
    traefik.http.routers.minio.priority: "90"
    traefik.http.middlewares.media-stripprefix.stripprefix.prefixes: /media
volumes:
  minio-data:
```

## Deviations from Plan

### Auto-fixed Issues

None.

### Environment Gate (not a deviation, documented for verifier)

**Live-stack runtime smoke (image upload + `mc ls --recursive` + anonymous-fetch curls) could NOT be executed in this parallel-executor sandbox.**

`docker info` exits non-zero → Docker daemon is not reachable from this worktree (matches the same environment gate documented in 04-01-SUMMARY.md "Environment Gate"). All static verifications pass; `docker compose -f compose.yml -f compose.dev.yml config` validates the merged stack. The runtime smoke MUST be executed by the verifier on a Docker-enabled developer laptop. Exact playbook (run from repo root with a populated `.env`):

```bash
docker compose -f compose.yml -f compose.dev.yml down
docker compose -f compose.yml -f compose.dev.yml up -d --build

# 1. mc sidecar exits successfully and prints the bootstrap-complete marker
docker compose logs mc | tail -20
# expect:    "MinIO bootstrap complete: arduino-media bucket; public-read on images/ only."

# 2. minio is healthy
docker compose ps minio --format json | jq -r '.[0].Health'
# expect: healthy

# 3. bucket exists; images/ has public-read policy
docker compose exec -T minio sh -c 'mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" && mc ls local/ && mc anonymous get local/arduino-media/images'
# expect: "arduino-media/" listed; "Access permission for `local/arduino-media/images` is `download`"

# 4. Image upload smoke via Wagtail
docker compose exec wagtail python manage.py migrate
docker compose exec wagtail python -c "
import io
from PIL import Image as PIL
from django.core.files.images import ImageFile
from wagtail.images.models import Image
buf = io.BytesIO()
PIL.new('RGB', (100, 80), color=(200, 80, 60)).save(buf, format='PNG')
buf.seek(0)
img = Image.objects.create(title='smoke-test', file=ImageFile(buf, name='smoke-test.png'))
rend = img.get_rendition('width-50')
print('ORIGINAL:', img.file.name, '->', img.file.url)
print('RENDITION:', rend.file.name, '->', rend.file.url)
"
# expect ORIGINAL name like 'original_images/smoke-test.png' or similar Wagtail upload_to convention

# 5. Bucket contents
docker compose exec -T minio sh -c 'mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" && mc ls --recursive local/arduino-media/'
# expect: at least one entry under originals/ (or original_images/) AND one under images/

# 6. Public rendition fetch via Traefik
REND_BASENAME=$(...)   # take rendition file name from step 4 output
curl -s -o /dev/null -w 'public-rendition-via-traefik: %{http_code}\n' "http://arduino.localhost/media/arduino-media/images/$REND_BASENAME"
# expect: 200

# 7. Private original fetch via Traefik
ORIG_PATH=$(...)       # take original file name from step 4 output
curl -s -o /dev/null -w 'private-original-via-traefik: %{http_code}\n' "http://arduino.localhost/media/arduino-media/$ORIG_PATH"
# expect: 403
```

The verifier captures the verbatim output of `mc ls --recursive local/arduino-media/`, the rendition + original URL strings emitted by Wagtail, and the two curl status codes; appends them to this SUMMARY (or a sibling `04-02-VERIFICATION.md`) before phase exit.

#### Note on Wagtail's S3 upload_to conventions

Wagtail's stock `Image.file.upload_to` callable yields `original_images/<name>.<ext>`; rendition `Rendition.file.upload_to` yields `images/<name>.<width>x<height>.<spec>.<ext>`. The plan-text "originals/" prefix is conventional shorthand — the actual on-disk layout is `original_images/` for originals and `images/` for renditions. The bucket-policy is applied to `images/` ONLY (per `mc anonymous set download local/arduino-media/images`), so:

- public 200 on `…/arduino-media/images/<rendition>`     ← matches plan acceptance
- private 403 on `…/arduino-media/original_images/<orig>` ← achieves T-04-10 mitigation regardless of the prefix string differing from "originals/" verbatim

The plan acceptance criteria for the bucket layout (`mc ls --recursive` shows entries under originals/ AND images/) is therefore phrased as "at least one entry under each of `original_images/` (or `originals/` if Wagtail upload_to is overridden in a later plan) AND `images/`". No code change required in this plan; documented for verifier so a `original_images/` listing is not flagged as a regression.

## Threat Flags

None — surface introduced (MinIO :9000/:9001 published to host in dev only, Traefik `/media/*` route to MinIO, single bucket with prefix-scoped policy, mc bootstrap sidecar) is fully covered by the plan's `<threat_model>` (T-04-10..T-04-16). No new boundaries opened.

## Self-Check: PASSED

Files (verified existing on disk):

```
FOUND: backend/wagtail_arduino/storage.py
FOUND (modified): backend/wagtail_arduino/settings/base.py
FOUND (modified): backend/wagtail_arduino/settings/prod.py
FOUND (modified): compose.yml
FOUND (modified): compose.dev.yml
FOUND (modified): .env.example
```

Commit (verified in `git log`):

```
FOUND: 1dd0eb1  feat(04-02): wire MinIO + django-storages[s3] for Wagtail media (originals + renditions)
```
