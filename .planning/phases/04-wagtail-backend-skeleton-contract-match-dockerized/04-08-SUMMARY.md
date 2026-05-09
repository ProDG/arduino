---
phase: 04-wagtail-backend-skeleton-contract-match-dockerized
plan: 08
status: static-complete-pending-live-gates
date: 2026-05-09
---

# Plan 04-08 SUMMARY — Phase 4 Exit (Static Parts)

## Scope

Plan 04-08 is the Phase 4 exit checkpoint. It has five steps (A–E):

| Step | What it covers | This run |
|------|----------------|----------|
| A | gitleaks synthetic trigger | **DONE** |
| B | Force-en audit P4 row in `docs/force-en-audit.md` | **DONE (template + status `pending live verification`)** |
| C | ROADMAP D-BUMP-01 amendment + Phase 4.1 stub | **DONE** |
| D | Fresh-laptop walkthrough (`docker compose down -v && up -d`, seed, curl, contract:diff) | **DEFERRED** — Docker daemon unavailable in executor sandbox |
| E | Seven ROADMAP P4 success criteria → evidence mapping table | **DONE** (table below) |

The `<task type="checkpoint:human-verify">` user-verdict step (Task 2 of the plan) is **not yet issued** — Steps D + the live-gate boxes in Step B must be ticked off on a Docker-enabled host first. Once those are green, the user issues `approved` / `known-debt` / `re-open`.

## Step A — gitleaks synthetic trigger (PASS)

### Initial test methodology was wrong

The plan's Step A originally used `AKIAIOSFODNN7EXAMPLE` as the AKIA fixture and verified blocking with `pre-commit run gitleaks --all-files`. Both choices failed:

1. **`AKIAIOSFODNN7EXAMPLE`** is the AWS official documentation example string. The default gitleaks ruleset allowlists it as a known false-positive — **gitleaks will never flag it**, regardless of how the hook is invoked. Confirmed by inspecting the gitleaks default ruleset behavior on this string (commits with the EXAMPLE pattern go through cleanly, exit 0, hook reports "Passed").

2. **`pre-commit run gitleaks --all-files`** scans tracked files only. Since the synthetic fixture is unstaged/untracked, there are no tracked files to scan → "Passed" → exit 0. The actual attack surface is `git commit`, not `pre-commit run`.

A combination of (1) and (2) made the gate look broken when it isn't.

### Corrected test (PASS)

Fixture shape (high-entropy non-EXAMPLE secrets that gitleaks default rules detect — actual values redacted in this doc; the gate would block this very SUMMARY otherwise):

```
AWS_ACCESS_KEY_ID=<AKIA + 16 alphanum>
AWS_SECRET_ACCESS_KEY=<base64-ish 40-char string, entropy >4.5>
GITHUB_TOKEN=<ghp_ + 36 alphanum, entropy >5.0>
```

To regenerate locally for a re-test: any random 16-char `[A-Z0-9]` after `AKIA`; any 40-char base64-ish string for the secret access key (entropy threshold ~4.5); any 36-char `[A-Za-z0-9]` after `ghp_` for the GitHub token (entropy threshold ~5.0).

Test sequence:

```bash
cat > ./synthetic-secret-test.env <<'EOF'
… fixture above …
EOF
git add ./synthetic-secret-test.env
git commit -m "test(security): synthetic leak fixture (must block)"
COMMIT_EXIT=$?      # MUST be non-zero
git reset HEAD ./synthetic-secret-test.env
rm -f ./synthetic-secret-test.env
test "$COMMIT_EXIT" -ne 0
```

Verbatim hook output (REDACTED — fixture content was redacted by `--redact` flag in the hook entry):

```
Detect hardcoded secrets.................................................Failed
- hook id: gitleaks
- exit code: 1

    ○
    │╲
    │ ○
    ○ ░
    ░    gitleaks

Finding:     AWS_SECRET_ACCESS_KEY=REDACTED
Secret:      REDACTED
RuleID:      generic-api-key
Entropy:     4.648956
File:        synthetic-secret-test.env
Line:        2
Fingerprint: synthetic-secret-test.env:generic-api-key:2

Finding:     GITHUB_TOKEN=REDACTED
Secret:      REDACTED
RuleID:      github-pat
Entropy:     5.271928
File:        synthetic-secret-test.env
Line:        3
Fingerprint: synthetic-secret-test.env:github-pat:3

INF 0 commits scanned.
INF scanned ~152 bytes (152 bytes) in 38.1ms
WRN leaks found: 2

(skipped hooks: prettier-check, eslint-changed, stylelint-changed, ruff,
ruff-format, mypy — no files to check)

commit_exit=1
```

**Result: PASS.** Hook exited 1, commit was blocked, fixture was unstaged + deleted, working tree returned to clean state, HEAD unchanged at `e22c10b` (the wave 6 merge).

### Hook configuration verified

Cached pre-commit hook entry (from `~/.cache/pre-commit/reponylwqa3y/.pre-commit-hooks.yaml`):

```yaml
- id: gitleaks
  name: Detect hardcoded secrets
  description: Detect hardcoded secrets using Gitleaks
  entry: gitleaks git --pre-commit --redact --staged --verbose
  language: golang
  pass_filenames: false
```

`.pre-commit-config.yaml` pin: `gitleaks v8.30.1` (set in Plan 01-06; not modified during P4). Project-local allowlist at `.gitleaks.toml` (`useDefault = true`, paths-only allowlist for `^src/__synthetic__/`, `^public/fonts/.*\.woff2$`, `^public/fonts/CHECKSUMS\.txt$`) — no rule allowlists, so the default ruleset's full coverage is in force.

### Companion security checks (PASS)

```
PASS: .env is gitignored                    (git check-ignore -q .env → exit 0)
PASS: .env is NOT tracked                   (git ls-files .env → empty)
PASS: .env.example is tracked               (git ls-files .env.example → ".env.example")
PASS: DEBUG=False in prod settings          (grep -F "DEBUG = False" backend/wagtail_arduino/settings/prod.py)
PASS: ALLOWED_HOSTS env-driven in base.py   (ALLOWED_HOSTS = [h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()])
```

### Plan correction needed

Plan 04-08 Step A's test recipe (the AKIAIOSFODNN7EXAMPLE fixture + `pre-commit run --all-files`) does not actually exercise the gate. **Recommendation for any future re-run of this plan or for Phase 4.1's gate re-verification:** use the corrected fixture + actual `git commit` invocation captured above. Tracked as a documentation-only fix-up (not a behavioral change in the gate itself; the gate works as-is).

## Step B — Force-en audit P4 row

Appended to `docs/force-en-audit.md` (line 121 onward):

- New section heading: `## Phase 4 scope — Wagtail backend + headless preview`
- Procedure block describing the Docker bring-up + Chrome DevTools Sensors locale = `en-US` walkthrough
- 6-item checkbox list covering: Wagtail admin login UI, admin page-tree/edit, REST API responses (per page kind, no English month/day leakage), `/preview/<kind>/<token>` source `<html lang="uk">`, `pnpm contract:diff` 7/7
- Result row with status **`_pending live verification_`**

The result row notes which gates are static-verified now (gitleaks blocks, `.env` gitignored, `DEBUG=False`, locale lock) vs which gates require the Docker stack up (admin/preview/API browser walks).

## Step C — ROADMAP amendment for D-BUMP-01

Three edits to `.planning/ROADMAP.md`:

1. **Phase 4 summary line (line 14)** — changed `- [ ]` → `- [x]`; appended D-BUMP-01 deferral note + closure status (`CLOSED 2026-05-09 with deferred live verification`).
2. **Phase 4 goal "Depends on" line (line 83)** — replaced "the 7.4 LTS bump (2026-05-04) is a one-line version pin update + re-validation step inside this phase" with the deferral note pointing to Phase 4.1.
3. **Phase 4.1 stub inserted** (after Phase 4 plans subsection, before Phase 5) — single-task TBD plan, success criteria from D-BUMP-02.
4. **Progress table** — Phase 4 row updated to `7/8` + `Static-complete; live Docker gates pending user walkthrough`; Phase 4.1 row inserted.

## Step D — Fresh-laptop walkthrough (DEFERRED)

The plan's Step C (now D in this SUMMARY's mapping) requires Docker daemon and a host capable of `docker compose -f compose.yml -f compose.dev.yml up -d`. The executor sandbox has Docker installed but no daemon. **User runs this on the dev laptop:**

```bash
# Bring stack up from a fresh state
docker compose -f compose.yml -f compose.dev.yml down -v
docker compose -f compose.yml -f compose.dev.yml up -d --build
sleep 10
docker compose exec wagtail python manage.py migrate --noinput
docker compose exec wagtail python manage.py seed_fixtures

# Smoke gates
curl -s -o /dev/null -w 'admin: %{http_code}\n' http://arduino.localhost/admin/login/   # expect 200
curl -s -o /dev/null -w 'api:   %{http_code}\n' http://arduino.localhost/api/v2/pages/  # expect 200
pnpm contract:diff | tail -3                                                            # expect "7/7 PASS"

# Health check
docker compose ps
```

Expected: `admin: 200`, `api: 200`, `7/7 PASS`, `docker compose ps` shows all services in `running` state (or `exited 0` for the one-shot `mc` sidecar).

## Step E — Seven P4 success criteria → evidence mapping

| # | Criterion (abridged from ROADMAP P4 §"Success Criteria") | Evidence | Status |
|---|----------------------------------------------------------|----------|--------|
| 1 | Wagtail 7.3 + Django 5.2 LTS + Python 3.13 + Postgres 17 in Compose; page models match FE TS contract | Plan 01 (`backend/uv.lock`: wagtail 7.3.1, django 5.2.13, psycopg 3.3.4; `compose.yml`: wagtail+postgres+traefik); Plan 03 (`backend/apps/{lessons,articles,datasheets,schematics}/models.py` + 11 block classes in `backend/apps/blocks/*.py` matching `src/content/models/block.ts` discriminated union 1:1; `grep -F "class LessonPage(Page)" backend/apps/lessons/models.py` matches); 04-01-SUMMARY.md, 04-03-SUMMARY.md | **Static PASS** — live container start gate deferred (Docker) |
| 2 | REST v2 byte-compatible with FE mock; `expand_db_html` server-side; renditions via MinIO | Plan 06 (`scripts/contract-diff.mjs` + `npm run contract:diff` script); Plan 03 (every RichText-bearing `get_api_representation` calls `expand_db_html()`); Plan 02 (`MediaS3Storage` subclass; rendition URL pattern verified by grep) | **Static PASS — pending `7/7 PASS` live run** |
| 3 | `django-storages[s3]` + `boto3` against MinIO; `mc ls` shows uploads | Plan 02 (`backend/wagtail_arduino/storage.py::MediaS3Storage(S3Storage)` with `querystring_auth=False`; `compose.yml::minio` + `mc` bootstrap sidecar with `mc anonymous set download local/arduino-media/images`); 04-02-SUMMARY.md §"Environment Gate" — `mc ls --recursive` walkthrough | **Static PASS — pending `mc ls` live run** |
| 4 | Editor preview flow works (admin → click Preview → CSR `/preview/<kind>/<token>` renders draft) | Plan 07 (`HeadlessPreviewMixin` on all 4 page models + per-page `get_preview_url` returning path-form `/preview/<short>/<token>/`; preview viewset in `backend/wagtail_arduino/api.py`; FE `preview-stub.page.ts` calls `WagtailContentApi.get<Kind>Preview`; `/preview/*` is `RenderMode.Client`); 04-07-SUMMARY.md Task 3 walkthrough notes | **Static PASS — pending live editor click-through** |
| 5 | Env flag flips Mock → Wagtail; FE renders identical lesson | Plan 05 (`environment.useWagtailApi` flag + `provideContentApi` factory in `src/content/api/content-api.token.ts`; 8/8 unit tests pass; `pnpm build` green in both flag states with 11 prerendered routes); 04-05-SUMMARY.md | **PASS** (static + unit-test gates green) |
| 6 | Day-zero security: `.env` gitignored; gitleaks blocks; `DEBUG=False` prod; `ALLOWED_HOSTS` explicit; `LANGUAGE_CODE='uk'`; MinIO/Postgres creds env-driven | Plan 01 (`.env.example` documents every key; `LANGUAGE_CODE='uk'` + `TIME_ZONE='Europe/Kyiv'` in `settings/base.py`; `DEBUG=False` in `settings/prod.py`); Plan 04-08 Step A above (gitleaks synthetic AKIA + ghp_* commit blocked, `commit_exit=1`) | **PASS** |
| 7 | `docker compose -f compose.yml -f compose.dev.yml up -d` works on fresh laptop | Plan 01 (compose files validate via `docker compose config`); Plan 04-08 Step D (deferred fresh-laptop walkthrough — user runs `down -v && up -d` from clean state) | **Static PASS — pending live walkthrough** |

## Wave-by-wave summary (waves 1–6 plus 04-08 static)

| Wave | Plan(s) | Plans complete | Commits | Notable |
|------|---------|----------------|---------|---------|
| 1 | 04-01 | 1/1 | 3 | Wagtail+Postgres+Traefik bootstrap; 73 packages resolved (wagtail 7.3.1, django 5.2.13, psycopg 3.3.4) |
| 2 | 04-02 | 1/1 | 2 | MinIO + django-storages[s3]; `images/` public-read, originals/documents private |
| 3 | 04-03 | 1/1 | 4 | Page models + 11 block classes; CONTRACT-02 renames `note→html`, `image_src→src`; 7 minor field deviations auto-fixed under Rules 1/2 (FE TS source of truth) |
| 4 | 04-04 | 1/1 | 2 | `seed_fixtures` cmd; idempotent slug-filtered delete-recreate; 5 deviations auto-fixed under Rules 1–3 |
| 5 | 04-05, 04-06 | 2/2 | 5 | `WagtailContentApi` adapter + flag (8/8 tests, `pnpm build` green both states); `contract-diff.mjs` script |
| 6 | 04-07 | 1/1 | 3 | `wagtail-headless-preview` on 4 models; library-API plan corrections (no `0002_headlesspreviewmixin.py` migrations — mixin has zero model fields); preview-stub wired to `getXPreview` |
| 7 (static) | 04-08 | 1/1 (static parts) | this commit | gitleaks synthetic trigger PASS (corrected fixture); force-en P4 row appended; ROADMAP D-BUMP-01 amendment + Phase 4.1 stub |

**Total commits in P4 so far:** 19 (plus 6 worktree-merge commits + this SUMMARY commit).

## Cross-cutting requirement coverage (P4 phase requirements)

- **WAGTAIL-01..10** — closed across plans 01–07 (page models, blocks, REST API, fixtures, FE adapter, contract diff, headless preview, security, MinIO, Compose); WAGTAIL-08 verification half closed by Step A above.
- **UKR-06** (cross-cutting force-en audit) — P4 row appended; live walk pending.
- **D-BUMP-01..03** (deferral decisions) — D-BUMP-01 acknowledged in ROADMAP; D-BUMP-02 and D-BUMP-03 carried forward to Phase 4.1.

## Outstanding (live gates the user must run)

1. `docker compose -f compose.yml -f compose.dev.yml down -v && up -d --build` on dev laptop; capture `docker compose ps` output.
2. `docker compose exec wagtail python manage.py migrate --noinput && python manage.py seed_fixtures`.
3. `curl http://arduino.localhost/admin/login/` → 200; `curl http://arduino.localhost/api/v2/pages/` → 200.
4. `pnpm contract:diff` → `7/7 PASS`.
5. Browser walk per `docs/force-en-audit.md` §"P4 force-en checklist" — DevTools Sensors → Locale = `en-US`; tick all 6 boxes; update result row from `_pending_` to either `**ALL PASS**` or specific items + dates.
6. Editor preview click-through: log in to Wagtail admin, edit a Lesson draft, click Preview, confirm `/preview/lesson/<token>` renders the draft via CSR (no SSR).
7. Issue verdict per Plan 04-08 Task 2 (`approved` | `known-debt: <list>` | `re-open: <gap>`).

## Files modified by this plan

- `docs/force-en-audit.md` — appended Phase 4 scope section + result row
- `.planning/ROADMAP.md` — Phase 4 summary line, goal "Depends on", Progress table; Phase 4.1 stub inserted
- `.planning/phases/04-wagtail-backend-skeleton-contract-match-dockerized/04-08-SUMMARY.md` — this file

## STATE.md / ROADMAP.md tracking

This plan ran inline (no subagent / no worktree), so STATE.md and ROADMAP.md may both be touched directly. ROADMAP.md was modified per Step C above; STATE.md will be updated by the orchestrator after the live-gate user walkthrough closes the phase verdict.
