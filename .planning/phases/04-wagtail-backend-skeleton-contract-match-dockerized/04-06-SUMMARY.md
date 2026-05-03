---
phase: 04-wagtail-backend-skeleton-contract-match-dockerized
plan: 06
subsystem: contract-testing
tags: [contract, testing, script, wagtail, gate]
requires: [04-04, 04-05]
provides:
  - scripts/contract-diff.mjs
  - pnpm contract:diff
affects:
  - package.json
tech-stack:
  added: []
  patterns:
    - "Code-committed allowlist constant (STRIP_PATHS) for volatile-field tolerance"
    - "Recursive sorted-key JSON canonicalization for byte-equal diffing"
    - "Manual phase-exit gate (not CI per D-CONTRACT-06)"
key-files:
  created:
    - scripts/contract-diff.mjs
  modified:
    - package.json
decisions:
  - "STRIP_PATHS shipped verbatim from D-CONTRACT-02 — no additions needed during authoring"
  - "Live 7/7 PASS run is deferred to the verifier gate (requires Dockerized Wagtail BE from plans 01-05 to be up + seeded)"
  - "Script not chained into lint/prebuild per D-CONTRACT-06"
metrics:
  duration: ~5m
  completed: 2026-05-03
  tasks_completed: 1
  files_changed: 2
---

# Phase 04 Plan 06: Contract Diff Script Summary

**One-liner:** Node 22 ESM `scripts/contract-diff.mjs` byte-compares Wagtail REST API v2 pages against the FE mock fixtures for the 7 CONTRACT-03 slugs, stripping the D-CONTRACT-02 volatile-field allowlist from both sides; wired as `pnpm contract:diff` (manual gate, not CI).

## What Shipped

- **`scripts/contract-diff.mjs`** (ESM, Node 22): walks 7 fixtures, fetches `/api/v2/pages/?type=<wagtailType>&slug=<slug>&fields=*` from `WAGTAIL_API_BASE` (default `http://arduino.localhost`), loads matching mock JSON from `src/assets/mock-data/<kind>/<slug>.json`, strips allowlist from both, canonicalizes (recursive sorted-key), and byte-compares. Per-fixture `PASS`/`FAIL` output; on FAIL emits a colored unified diff. Final summary `N/7 PASS`. Exit 0 on full match, 1 on any drift, 2 on unknown `--fixture` slug.
- **`STRIP_PATHS` constant** ships verbatim from D-CONTRACT-02:
  - `meta.detail_url`, `meta.html_url`, `meta.first_published_at`, `meta.alias_of`, `meta.parent`, `meta.seo_title`, `meta.search_description`, `meta.show_in_menus`, `meta.type`, `meta.locale`
  - top-level `id`, `updatedAt`
  - per-block `id` for `body`, `lede`, `parts_list`, `partsList`, `pinout`, `specifications`, `peripheralNotes`, `schematicImage`, `explanation`
  - per D-CONTRACT-04: `body[*].code.tokens`, `body[*].tokens`, `peripheralNotes[*].code.tokens`, `peripheralNotes[*].tokens`, `explanation[*].code.tokens`, `explanation[*].tokens`
  - per D-MODEL-04: `body[*].anchorParagraphIndex`, `peripheralNotes[*].anchorParagraphIndex`, `explanation[*].anchorParagraphIndex`
- **`FIXTURES` array** enumerates all 7 D-CONTRACT-03 slugs with `kind` + `wagtailType` for the API query.
- **CLI affordances:** `--fixture <slug>` filter, `--help`/`-h` flag, `WAGTAIL_API_BASE` env override.
- **Stack-down handling:** fetch failures throw with the actionable message
  ```
  contract-diff: cannot reach <url>
    Is the dev stack up? Run:
      docker compose -f compose.yml -f compose.dev.yml up -d
      docker compose exec wagtail python manage.py seed_fixtures
    underlying error: <msg>
  ```
- **`package.json`**: added `"contract:diff": "node scripts/contract-diff.mjs"` next to existing `tokenize`. NOT chained into `lint` or `prebuild` per D-CONTRACT-06.

## Verification (this worktree)

- `node --check scripts/contract-diff.mjs` → OK
- `node scripts/contract-diff.mjs --help` → exit 0, prints usage
- `WAGTAIL_API_BASE=http://127.0.0.1:9 node scripts/contract-diff.mjs` → exit 1, prints actionable "Is the dev stack up?" message for every fixture
- All grep acceptance criteria pass (STRIP_PATHS, all 10 verbatim allowlist entries, `body[*].id`, `body[*].code.tokens`, `anchorParagraphIndex`, all 7 fixture slugs, `"contract:diff"` entry, `node scripts/contract-diff.mjs` body, NOT in `lint` chain).

## Iteration Log

| Iteration | Failure cause | Fix applied | Result |
| --- | --- | --- | --- |
| 0 | Script authored from PLAN spec verbatim | n/a | Static verification PASS; live run deferred to verifier (BE not running in this parallel worktree) |

No `STRIP_PATHS` additions beyond the verbatim D-CONTRACT-02 list were required during authoring. Any future addition must include a comment + Decision-ID reference per the threat-register mitigation for T-04-33.

## Deferred Verifier Gate

The live `pnpm contract:diff` execution against a seeded Wagtail BE is deferred to a verifier session that has the Dockerized stack from Plans 01-05 running:

```bash
docker compose -f compose.yml -f compose.dev.yml up -d
docker compose exec wagtail python manage.py seed_fixtures
pnpm contract:diff
```

Expected output: `7/7 PASS` and exit 0. Any failure represents a serializer drift to be fixed in Plan 03 (`get_api_representation`) or seed in Plan 04 — iterate per the playbook in 04-06-PLAN.md §"Step C — Run and iterate".

## Deviations from Plan

None — script implements the PLAN.md §Step A spec verbatim. The only documented deviation is the **deferred live run**, which was explicitly anticipated in the parent prompt's `<parallel_execution>` instruction ("If running the script live requires Docker BE: produce script, document Docker-side run as deferred verifier gate in SUMMARY").

## Known Stubs

None.

## Commit

- `2220a1d` — `feat(04-06): add contract-diff script comparing Wagtail API to FE mocks`

## Self-Check: PASSED

- FOUND: scripts/contract-diff.mjs
- FOUND: package.json (contains `"contract:diff"`)
- FOUND: commit 2220a1d
