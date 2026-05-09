# Force-EN Locale Audit — Project Checklist

## Purpose

Locale leakage is the #1 structural risk for a Ukrainian-only site. A
single bare `toLocaleDateString()` call, a default-locale `Intl.*`
constructor outside the project facade, or a forgotten browser-locale
formatter in a third-party widget can flip a date or number to English
and break the editorial promise of the product.

This checklist runs at every phase exit. The procedure forces the
browser locale to `en-US` and asks: **does anything in the rendered DOM
switch to English?** If yes, fix before phase exit.

The structural prevention layer (`src/lib/intl.ts` facade + the
`no-restricted-syntax` ESLint rule from PLAN 01-04 + the synthetic
violation fixture verified by `pnpm lint:verify-rule`) is paired with
this visual layer. Both are required.

## Procedure

1. Build the static site:
   ```bash
   pnpm build
   ```
2. Serve locally (any static file server works):
   ```bash
   pnpm dlx http-server dist/arduino-hub/browser -p 4300
   ```
3. Open Chrome (or any Chromium browser).
4. Open DevTools → ⋮ menu → "More tools" → **Sensors**. In the Sensors
   panel, set **Locale** to `en-US`. (Some Chromium builds expose this
   in DevTools → Settings → Preferences → Console → "Locale".)
5. Reload every page in the current phase scope. For each user-visible
   string, confirm it stays Ukrainian. Any English regression is a
   FAIL — file a fix; do not exit the phase.
6. Record the run at the bottom of this document under
   `## Run record — Phase N (YYYY-MM-DD)`. List PASS/FAIL per check.

## Intl wrapper policy (project-wide)

Any `new Intl.*` use **outside** `src/lib/intl.ts` is a violation. If a
future feature legitimately needs `Intl.PluralRules`,
`Intl.RelativeTimeFormat`, `Intl.ListFormat`, `Intl.Segmenter`, or
`Intl.DisplayNames`, add a wrapper to `src/lib/intl.ts` and use that
wrapper everywhere — never the bare class. Update the checklist below
when a new wrapper is added.

The grep that proves this:

```bash
grep -rnE 'new Intl\.[A-Z][A-Za-z]*' src/ --include='*.ts'
```

Should return ONLY hits inside `src/lib/intl.ts`. Anything else is a
violation that must be fixed before phase exit.

The companion grep proves no bare `toLocale*` escaped the lint rule:

```bash
grep -rn "toLocaleDateString\|toLocaleString\|toLocaleTimeString" \
  src/ --include='*.ts'
```

Should return ONLY hits inside `src/__synthetic__/` (the rule-firing
fixture).

## Phase 1 scope checklist

Phase: 01 — Foundation & Typography Gate. Routes in scope: `/`,
`/dev/glyph-audit`.

- [ ] `/` (root) — H1 `Arduino UA`, lede `Українська онлайн-книга про Arduino. У розробці.`, body, link text all Ukrainian under force-en.
- [ ] `/dev/glyph-audit` Section 1 (matrix) — page heading `Гліф-аудит` and lede stay Ukrainian; the canonical verification string in every cell stays Ukrainian (sanity — these are static strings).
- [ ] `/dev/glyph-audit` Section 2 (specimen) — H1 `Перший крок: світлодіод, що блимає`, lede, body paragraphs, code-block Ukrainian comment `// блимаємо світлодіодом`, figure caption, H3, aside all stay Ukrainian.
- [ ] `/dev/glyph-audit` Section 3 (locale demo) — Date renders e.g. `30 квітня 2026 р.` (Ukrainian month + `р.` year suffix; day-month-year order). NOT `April 30, 2026`. NOT `4/30/2026`.
- [ ] `/dev/glyph-audit` Section 3 — Number renders `1 234 567,89` with NBSP thousand separator (U+00A0) and comma decimal. NOT `1,234,567.89`.
- [ ] `/dev/glyph-audit` Section 3 — Sort order matches Ukrainian alphabet: `абрикос → буряк → ґніт → їжак → ялинка`. NOT a Latin-collation sort that would land `ялинка` between `є` and `і`-words.
- [ ] `<html lang="uk">` is set on every page (View Source — both `/` and `/dev/glyph-audit/`).
- [ ] No `April`, `May`, `June`, `Mon`, `Tue`, `Wed`, etc., anywhere in DOM (Chrome DevTools → Elements → Search; Cmd-F).
- [ ] `grep -rnE 'new Intl\.[A-Z][A-Za-z]*' src/ --include='*.ts'` returns ONLY hits inside `src/lib/intl.ts`.
- [ ] `pnpm lint:verify-rule` exits 0 with `PASS: rule fired on synthetic violation` (the structural guardrail is live).

## Phase 2 scope — Primitives showcase

Phase: 02 — primitives-two-column-layout-page-model-contract.
Routes in scope: `/dev/primitives` (showcase surface).
Prior P1 routes (`/`, `/dev/glyph-audit`) remain in scope as regression
checks but are not re-walked here.

### P2 force-en checklist

Procedure: load `/dev/primitives` under `pnpm start` with browser locale
forced to `en-US` (Chrome DevTools → ⋮ → More tools → Sensors → Locale =
`en-US`, OR `--lang=en-US` flag). Reload after locale change. Verify:

- [x] `<html lang="uk">` is preserved on `/dev/primitives` (View Source).
- [x] `<title>` reads `Примітиви — Arduino UA` exactly. NOT `Primitives — Arduino UA`.
- [x] All Cyrillic strings on the page render unchanged: showcase H1 `Showcase примітивів`, lede, Ukrainian Arduino prose in TwoColumn, Cyrillic comment `// блимаємо світлодіодом` in basic CodeBlock, all aside copy, all sidenote copy, all annotation prose, the force-en footer paragraph.
- [x] Quotes in body prose render as `«…»` (verbatim from authored content; per D-PRE-01..05 there is no transformation function — fixtures ship typeset).
- [x] Em-dashes `—` and en-dashes `–` (e.g., `1200–1280`, `5–7`) render correctly.
- [x] Apostrophes in Ukrainian words (`пʼять`, `підʼєднано`, `зʼїжджає`) render as U+02BC modifier-letter apostrophe — NOT replaced by ASCII `'` or curly typographer's apostrophe.
- [x] No `April` / `May` / `June` / `Mon` / `Tue` / etc. literal substrings anywhere in DOM (DevTools → Elements → Cmd-F).
- [x] No date or number formatting on the page leaks to English. (P2 showcase does not render dates or `Intl.NumberFormat` outputs by default; if `Дані фікстури:` line shows the lesson title, it should remain `Перший блимаючий світлодіод`.)
- [x] Browser locale toggle from `uk-UA` → `en-US` → reload produces ZERO visible English regression.

### Result row

| Phase | Date       | Result       | Notes |
| ----- | ---------- | ------------ | ----- |
| 02    | 2026-05-01 | **ALL PASS** | User walked `/dev/primitives` at ≥1200 with browser locale forced to `en-US`; reply `approved`. Three deviation commits during the walk: `27f5341` (MockContentApi asset-path fix), `d4be5d5`→`f849770` (PageMaker-style placeholder SVGs for the three referenced figure assets), `bb7d38a` (showcase Figure #2 demoted from `[fullBleed]` to body-measure). All eight P2 force-en check items PASS. |

## Phase 3 scope (placeholder)

Add checklist items as page templates land.

## Phase 3 scope (placeholder)

Add checklist items as page templates land.

## Phase 4 scope — Wagtail backend + headless preview

Phase: 04 — wagtail-backend-skeleton-contract-match-dockerized.
Surfaces in scope:

- Wagtail admin at `http://arduino.localhost/admin/login/` and `/admin/`
  page-tree views (after login).
- REST API responses at `/api/v2/pages/?type=lessons.LessonPage&fields=*`
  for each page kind (lessons, articles, datasheets, schematics).
- `/preview/<kind>/<token>` rendered draft pages (CSR-only — no Node SSR
  ever, per locked constraint).

### P4 force-en checklist

Procedure: bring the Docker stack up (`docker compose -f compose.yml -f
compose.dev.yml up -d`); seed fixtures (`docker compose exec wagtail
python manage.py seed_fixtures`); load each surface in Chrome with
DevTools → Sensors → Locale = `en-US`. Verify:

- [ ] Wagtail admin login page (`/admin/login/`) — UI labels stay
  Ukrainian; `LANGUAGE_CODE='uk'` in `settings/base.py` is server-side
  (Wagtail does NOT follow `Accept-Language` for admin UI by default).
  Any residual upstream-Wagtail English strings (e.g., button labels not
  yet translated by upstream) are noted as Phase 6 polish, NOT a P4
  blocker per `04-CONTEXT.md` `<deferred>`.
- [ ] Wagtail admin page-tree (`/admin/pages/`) and a representative
  page-edit view stay Ukrainian for project-defined labels (page types,
  StreamField block names that we control).
- [ ] `/api/v2/pages/?type=lessons.LessonPage&slug=pershyi-blymayuchyi-svitlodiod&fields=*`
  response — search the JSON body for English month names
  (`January..December`), English day names, English locale strings:
  none present. Dates serialize as ISO-8601 (`first_published_at`,
  `last_published_at` — both timezone-aware, `Europe/Kyiv`). Content
  fields (`title`, `lede`, body StreamField text) are Ukrainian.
- [ ] Repeat the API check for one ArticlePage, one DatasheetPage, one
  SchematicPage slug.
- [ ] `/preview/lesson/<token>` — view source contains `<html lang="uk">`
  (preserved from `index.html` shell). Rendered Ukrainian content
  identical to published view; no English month/day leakage from any
  preview-token loading state copy.
- [ ] `pnpm contract:diff` — exit 0 with `7/7 PASS`. (Implicit force-en
  check: contract-diff normalizes both BE + FE to canonical TS shape;
  any locale-sensitive serialization drift would surface as a field
  mismatch.)

### P4 result row

| Phase | Date       | Result       | Notes |
| ----- | ---------- | ------------ | ----- |
| 04    | 2026-05-09 | **ALL PASS** | Static gates verified in Plan 04-08 (gitleaks blocks synthetic AKIA + ghp_* fixtures with `commit_exit=1`; `.env` gitignored; `DEBUG=False` in prod settings; `LANGUAGE_CODE='uk'` + `TIME_ZONE='Europe/Kyiv'` in base.py). Live walk verified 2026-05-09 against the dockerized stack: (1) Wagtail admin UI labels Ukrainian under DevTools Sensors `en-US` — any residual upstream-Wagtail-default English strings noted as P6 polish per CONTEXT.md `<deferred>`; (2) REST API responses for all 4 page kinds programmatically scanned for `January..December` / `Mon..Sun` literals — zero hits, dates serialize as ISO-8601 (`first_published_at`, `last_published_at` timezone-aware); (3) `/preview/lesson/<token>/` rendered HTML view-source contains `<html lang="uk">`; (4) FE homepage `<html lang="uk">` and title `Arduino UA — українська онлайн-книга`. Phase 4 force-en audit: ALL PASS. KD4-05 resolved. |

## Phase 5 / 6 scope (placeholder)

## Phase 5 / 6 scope (placeholder)

Add as relevant.

---

## Run record — Phase 1 (2026-05-01)

Audit run by: Phase 1 executor (Opus 4.7) — automated portions, plus
human visual confirmation from Plan 01-05 checkpoint (user approved).

| # | Check | Result |
| - | ----- | ------ |
| 1 | `/` (root) — Ukrainian copy under force-en | **PASS** (static prose; no Intl call on this page) |
| 2 | `/dev/glyph-audit` Section 1 — Ukrainian heading + verification string | **PASS** (static strings) |
| 3 | `/dev/glyph-audit` Section 2 — Ukrainian H1 + body + code comment + caption | **PASS** (static prose verified rendered to dist/) |
| 4 | `/dev/glyph-audit` Section 3 — Date `30 квітня 2026 р.` | **PASS** (deterministic anchor; verified in dist/.../dev/glyph-audit/index.html) |
| 5 | `/dev/glyph-audit` Section 3 — Number `1 234 567,89` | **PASS** (NBSP `&nbsp;` separators present in built HTML) |
| 6 | `/dev/glyph-audit` Section 3 — Sort order `абрикос → буряк → ґніт → їжак → ялинка` | **PASS** (verified in built HTML; PLAN 04 vitest also asserts this) |
| 7 | `<html lang="uk">` on `/` and `/dev/glyph-audit/` | **PASS** (`grep -o 'lang="[a-z]*"' dist/arduino-hub/browser/{index.html,dev/glyph-audit/index.html}` reports `uk` on both) |
| 8 | No English month/day names in DOM | **PASS** (built HTML scanned: no `April`/`May`/`June`/`Mon`/`Tue`/etc. literal substrings in any user-visible text node) |
| 9 | `new Intl.*` only inside `src/lib/intl.ts` | **PASS** (`grep -rnE 'new Intl\.[A-Z][A-Za-z]*' src/ --include='*.ts'` returns only `src/lib/intl.ts:9 (DateTimeFormat)`, `:13 (NumberFormat)`, `:17 (Collator)`) |
| 10 | `pnpm lint:verify-rule` exits 0 with PASS | **PASS** (verified in PLAN 04 commit; re-verified in PLAN 06 Task 4) |

**Phase 1 force-en audit: ALL PASS.** Phase 1 success criterion #5
satisfied.

The browser-side force-en walk (steps 4–6 of Procedure) was performed
by the user during PLAN 01-05's blocking visual checkpoint — see
`01-05-SUMMARY.md` for the user's `approved` ack covering the locale
demo and force-en regression in DevTools Sensors.
