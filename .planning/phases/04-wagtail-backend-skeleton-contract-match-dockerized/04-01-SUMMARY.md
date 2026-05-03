---
phase: 04-wagtail-backend-skeleton-contract-match-dockerized
plan: 01
subsystem: backend
tags: [wagtail, django, docker, traefik, bootstrap, locale-lock, settings-split]
requires:
  - .gitignore (.env exclusion, !.env.example allowlist)
  - .pre-commit-config.yaml (existing gitleaks/prettier/eslint/stylelint hooks)
provides:
  - backend/ uv-managed python tree with multi-stage Dockerfile
  - wagtail_arduino settings split (base/dev/prod) with locale lock
  - compose.yml + compose.dev.yml (traefik + wagtail + postgres)
  - .env.example documenting all required env keys
  - pre-commit ruff/ruff-format/mypy hooks scoped to backend/**/*.py
affects:
  - .pre-commit-config.yaml (extended, existing hooks untouched)
tech-stack:
  added:
    - wagtail 7.3.1
    - django 5.2.13
    - psycopg[binary] 3.3.4
    - wagtail-headless-preview 0.8.0
    - django-storages[s3] 1.14.6 (with boto3 1.43.2 transitively)
    - gunicorn 23.0.0
    - python 3.13.1 (interpreter resolved by uv)
    - postgres 17-alpine (compose image)
    - traefik v3.2 (compose image)
  patterns:
    - multi-stage uv Dockerfile (builder → dev → prod) per RESEARCH Pattern 7
    - settings split with env-driven secrets (D-SEC-01..04)
    - locale lock baked into base.py (LANGUAGE_CODE='uk', TIME_ZONE='Europe/Kyiv', WAGTAIL_I18N_ENABLED=False)
    - Traefik label-driven routing on `arduino.localhost` (priority=100 for backend prefixes, priority=1 for FE catch-all)
key-files:
  created:
    - backend/pyproject.toml
    - backend/uv.lock
    - backend/Dockerfile
    - backend/.dockerignore
    - backend/manage.py
    - backend/wagtail_arduino/__init__.py
    - backend/wagtail_arduino/settings/__init__.py
    - backend/wagtail_arduino/settings/base.py
    - backend/wagtail_arduino/settings/dev.py
    - backend/wagtail_arduino/settings/prod.py
    - backend/wagtail_arduino/urls.py
    - backend/wagtail_arduino/api.py
    - backend/wagtail_arduino/wsgi.py
    - backend/wagtail_arduino/asgi.py
    - .env.example
    - compose.yml
    - compose.dev.yml
  modified:
    - .pre-commit-config.yaml
decisions:
  - "Pinned wagtail~=7.3.0; uv resolved 7.3.1. Stays well within D-BUMP-01 deferral window (no 7.4 in P4)."
  - "Pinned django~=5.2.0; uv resolved 5.2.13 (current LTS patch)."
  - "psycopg[binary]~=3.2 resolved to 3.3.4 — uv's tilde resolution honors major.minor lower bound; psycopg3 maintains backward compatibility within 3.x."
  - "compose.yml carries the fe-router stub (`traefik/whoami:latest`) so the catch-all FE route exists from day one — Plan 02/05 swaps in caddy:alpine for prod."
  - "Traefik dashboard exposed on :8080 via --api.insecure=true (T-04-07: dev-only, accepted)."
metrics:
  duration: ~10min
  completed: 2026-05-03
---

# Phase 4 Plan 01: Wagtail backend skeleton (dockerized) — Summary

Stood up Wagtail 7.3.1 + Django 5.2.13 + Python 3.13 + PostgreSQL 17 inside Docker Compose with Traefik fronting `http://arduino.localhost`, locale-locked to Ukrainian / Europe/Kyiv, with env-driven secrets and ruff/mypy pre-commit hooks scoped to `backend/`.

## Resolved version pins (from `backend/uv.lock`)

| Package                  | Pin              | Resolved   |
|--------------------------|------------------|------------|
| wagtail                  | `~=7.3.0`        | 7.3.1      |
| django                   | `~=5.2.0`        | 5.2.13     |
| psycopg[binary]          | `~=3.2`          | 3.3.4      |
| wagtail-headless-preview | `~=0.8`          | 0.8.0      |
| django-storages[s3]      | `~=1.14`         | 1.14.6     |
| boto3 (transitive)       | (via storages)   | 1.43.2     |
| gunicorn                 | `~=23.0`         | 23.0.0     |
| ruff (dev)               | `~=0.11`         | 0.11.x     |
| mypy (dev)               | `~=1.13`         | 1.13.x     |
| pytest (dev)             | `~=8.3`          | 8.3.x      |
| pytest-django (dev)      | `~=4.9`          | 4.9.x      |

`uv lock` reported `Resolved 73 packages in 724ms` against CPython 3.13.1.

## Tasks

### Task 1 — backend/ scaffold + settings split + pre-commit hooks (commit `94a9e60`)

Created the full `backend/` python tree as RESEARCH §"Recommended Project Structure" specifies (omitting `apps/`; that lands in Plan 03). All settings, manage.py, urls.py, api.py, wsgi.py, asgi.py written verbatim from the plan. `uv lock` committed. `.env.example` documents every required key with empty values for secrets. `.pre-commit-config.yaml` extended with three new local hooks (`ruff`, `ruff-format`, `mypy`) scoped to `^backend/.*\.py$`; existing gitleaks / prettier-check / eslint-changed / stylelint-changed hooks untouched.

Verified all acceptance criteria (one-line greps from PLAN.md):

```
✓ LANGUAGE_CODE = 'uk'
✓ TIME_ZONE = 'Europe/Kyiv'
✓ USE_TZ = True
✓ WAGTAIL_CONTENT_LANGUAGES = [('uk', 'Українська')]
✓ WAGTAIL_I18N_ENABLED = False
✓ DEBUG = False (in prod.py)
✓ DEBUG = True (in dev.py)
✓ wagtail~=7.3 / django~=5.2 / psycopg[binary]~=3.2 in pyproject.toml
✓ FROM python:3.13-slim AS builder
✓ uv sync --frozen --no-dev
✓ backend/uv.lock present
✓ POSTGRES_PASSWORD= and DJANGO_SECRET_KEY= keys in .env.example (no values)
✓ id: ruff / id: mypy / id: gitleaks all present in .pre-commit-config.yaml
✓ git check-ignore -q .env → exit 0
✓ git check-ignore .env.example → exit 1 (committable)
```

### Task 2 — Compose stack (commit `2efef46`)

`compose.yml` defines `postgres`, `wagtail`, `traefik`, `fe-router` on a single `arduino` bridge network with named volume `postgres-data`. Traefik labels:
- `wagtail` route: `Host(arduino.localhost) && PathPrefix(/admin|/api|/preview-data|/django-static|/django-admin|/documents)`, priority=100, target port 8000.
- `fe-router` catch-all (`traefik/whoami` placeholder): `Host(arduino.localhost)`, priority=1, forwards to `http://host.docker.internal:4200` (FE dev server on host).
- Traefik service declares `extra_hosts: ["host.docker.internal:host-gateway"]` for Linux dev parity.

`compose.dev.yml` overlay pins `target: dev`, sets `DJANGO_SETTINGS_MODULE=wagtail_arduino.settings.dev`, bind-mounts `./backend:/app` for hot-reload, runs `python manage.py runserver 0.0.0.0:8000`, and publishes Postgres `:5432` to host.

`.env` was generated locally (gitignored — verified via `git check-ignore -q .env`) with a freshly-generated `DJANGO_SECRET_KEY` (`secrets.token_urlsafe(50)`) and `POSTGRES_PASSWORD` (`secrets.token_urlsafe(24)`).

Static verifications:

```
✓ docker compose -f compose.yml -f compose.dev.yml config → exit 0 (merged config valid)
✓ image: postgres:17-alpine
✓ image: traefik:v3.2
✓ traefik.http.routers.wagtail.priority=100
✓ traefik.http.routers.fe.priority=1
✓ host.docker.internal:host-gateway
✓ target: dev (compose.dev.yml)
✓ git check-ignore -q .env → exit 0
```

## Deviations from Plan

### Auto-fixed Issues

None.

### Environment Gate (not a deviation, documented for verifier)

**Live-stack smoke test could not be executed in this worktree.**

The plan's runtime acceptance — `docker compose ... up -d --build` followed by `curl http://arduino.localhost/admin/login/ → 200` — could not be executed because the **Docker daemon is not reachable from this parallel-executor sandbox** (`docker info` exits non-zero). All static verifications pass; compose merge validates. The runtime smoke MUST be executed by the verifier on a Docker-enabled developer laptop using the documented dev setup below. This matches the plan's expectation that smoke runs on the developer host (the plan does not require the parallel executor to spin up Docker).

The verifier will run:
```bash
docker compose -f compose.yml -f compose.dev.yml up -d --build
docker compose exec wagtail python manage.py migrate
docker compose exec wagtail python manage.py createsuperuser --noinput --username admin --email admin@example.invalid || true
curl -s -o /dev/null -w 'admin_login: %{http_code}\n' http://arduino.localhost/admin/login/   # expect 200
curl -s -o /dev/null -w 'api_pages:   %{http_code}\n' http://arduino.localhost/api/v2/pages/  # expect 200
docker compose ps   # expect wagtail, postgres (healthy), traefik, fe-router all running
docker compose exec wagtail python -c "from django.conf import settings; print(settings.LANGUAGE_CODE, settings.TIME_ZONE, settings.USE_TZ)"
# expect: uk Europe/Kyiv True
```

## Dev-laptop setup (from a fresh clone)

1. **Add hosts entry** (one-time, requires sudo):
   ```bash
   echo "127.0.0.1 arduino.localhost" | sudo tee -a /etc/hosts
   ```
2. **Generate `.env`:**
   ```bash
   cp .env.example .env
   # POSTGRES_PASSWORD: any local value (e.g. `python3 -c 'import secrets; print(secrets.token_urlsafe(24))'`)
   # DJANGO_SECRET_KEY: `python3 -c 'import secrets; print(secrets.token_urlsafe(50))'`
   ```
   `.env` is gitignored — confirmed by `git check-ignore -q .env`.
3. **Bring up the stack:**
   ```bash
   docker compose -f compose.yml -f compose.dev.yml up -d --build
   docker compose exec wagtail python manage.py migrate
   docker compose exec wagtail python manage.py createsuperuser
   ```
4. **Smoke:**
   ```bash
   curl -i http://arduino.localhost/admin/login/
   ```

## Threat Flags

None — surface introduced (Wagtail admin, REST API v2 endpoints, Postgres on internal network, Traefik :80 + dashboard :8080) is fully covered by the plan's `<threat_model>` (T-04-01..T-04-09). No new boundaries opened.

## Self-Check: PASSED

Files (verified existing on disk):
```
FOUND: backend/pyproject.toml
FOUND: backend/uv.lock
FOUND: backend/Dockerfile
FOUND: backend/.dockerignore
FOUND: backend/manage.py
FOUND: backend/wagtail_arduino/__init__.py
FOUND: backend/wagtail_arduino/settings/__init__.py
FOUND: backend/wagtail_arduino/settings/base.py
FOUND: backend/wagtail_arduino/settings/dev.py
FOUND: backend/wagtail_arduino/settings/prod.py
FOUND: backend/wagtail_arduino/urls.py
FOUND: backend/wagtail_arduino/api.py
FOUND: backend/wagtail_arduino/wsgi.py
FOUND: backend/wagtail_arduino/asgi.py
FOUND: .env.example
FOUND: compose.yml
FOUND: compose.dev.yml
FOUND (modified): .pre-commit-config.yaml
```

Commits (verified in git log):
```
FOUND: 94a9e60  feat(04-01): scaffold backend/ wagtail+django uv project, multi-stage Dockerfile, settings split
FOUND: 2efef46  feat(04-01): compose stack — traefik + wagtail + postgres on arduino.localhost (dev overlay)
```
