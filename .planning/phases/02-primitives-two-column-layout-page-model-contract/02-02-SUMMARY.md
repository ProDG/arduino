---
phase: 02-primitives-two-column-layout-page-model-contract
plan: 02
subsystem: content
tags: [content-models, mock-data, ukrainian-typography, lint-fixtures, di-token]

requires:
  - phase: 02-01
    provides: src/assets glob in angular.json, @arduino/core-ui boundary tooling

provides:
  - "Locked Block discriminated union (10 variants) at src/content/models/block.ts — Wagtail must conform in P4"
  - "Page models Lesson, Article, Datasheet, Schematic, AnyPage at src/content/models/*.ts"
  - "Abstract ContentApi at src/content/api/content-api.ts (4 get + 4 list methods)"
  - "MockContentApi reading /assets/mock-data/{kind}/{slug}.json — verbatim, no transformation (D-PRE-02)"
  - "CONTENT_API InjectionToken + provideContentApi() factory ready for Plan 06 to wire"
  - "16 vitest unit tests: 11 expectTypeOf narrowing tests + 5 mock round-trip tests"
  - "7 real-Ukrainian-prose mock fixtures (3 lessons, 1 article, 2 datasheets, 1 schematic)"
  - "scripts/lint-fixtures.mjs: editorial-smell + content-gate enforcement, wired into pnpm lint"
  - "scripts/normalize-fixture-nbsp.mjs: authoring helper that inserts NBSP after one-letter Ukrainian prepositions"
  - "docs/copy-style-uk.md: typography style guide reframing UKR-02/UKR-03 as authoring-contract requirements"

affects: 02-03, 02-04, 02-06, 03, 04, 06

tech-stack:
  added: []
  patterns:
    - "DI-token + factory pair (CONTENT_API + provideContentApi) — same shape that Plan 06 will reuse to flip mock → Wagtail in P4"
    - "Authoring-time normalization via Node helper (NOT runtime) — preserves D-PRE-02 verbatim contract while keeping fixture authoring ergonomic"
    - "Vitest expectTypeOf for discriminant-narrowing contracts on TS unions"

key-files:
  created:
    - src/content/models/{block,lesson,article,datasheet,schematic,index}.ts
    - src/content/models/block.spec.ts
    - src/content/api/{content-api,mock-content-api,content-api.token}.ts
    - src/content/api/mock-content-api.spec.ts
    - src/assets/mock-data/lessons/pershyi-blymayuchyi-svitlodiod.json
    - src/assets/mock-data/lessons/knopka-ta-pidtyahuvalnyi-rezystor.json
    - src/assets/mock-data/lessons/analogovyi-vhid-ta-potentsiometr.json
    - src/assets/mock-data/articles/chomu-arduino.json
    - src/assets/mock-data/datasheets/atmega328p.json
    - src/assets/mock-data/datasheets/arduino-uno-r3.json
    - src/assets/mock-data/schematics/blymayuchyi-svitlodiod-shema.json
    - scripts/lint-fixtures.mjs
    - scripts/normalize-fixture-nbsp.mjs
    - docs/copy-style-uk.md
  modified:
    - package.json (lint chain extended with node scripts/lint-fixtures.mjs)

key-decisions:
  - "Block union shape, page-model interfaces, and ContentApi method signatures are byte-identical to UI-SPEC §Page models / §ContentApi interface — no inventions"
  - "MockContentApi performs zero transformation; D-PRE-02 evidence: grep -E 'processUkrainianText|transform\\(' src/content/api/mock-content-api.ts returns nothing"
  - "src/app/app.config.ts intentionally NOT modified — Plan 06 wires provideContentApi() into the providers array once /dev/primitives exists"
  - "Authoring helper (scripts/normalize-fixture-nbsp.mjs) is a tool, not a runtime transform: authors run it once after writing a fixture, then commit. The shipped JSON is the contract; the helper just makes the contract less tedious to type."
  - "`prevSlug: null` removed in fixture 1 (lesson) — interface declares prevSlug?: string, so omission is more correct than null"

patterns-established:
  - "Authoring discipline: write prose -> normalize-fixture-nbsp -> lint-fixtures -> read-aloud -> commit. Each step is a separate gate."
  - "Per-fixture commit attestation `read-aloud: PASS — <slug>` recorded in commit body (D-MOCK-01 compliance)"
  - "Lint script skips code.code field via JSON path tracking — keeps source code verbatim while enforcing prose typography elsewhere"

requirements-completed:
  - CONTRACT-01
  - CONTRACT-03
  - CONTRACT-04
  - UKR-02
  - UKR-03

duration: ~75min
completed: 2026-05-01
---

# Plan 02-02: Page-Model Contract + Mock Fixtures

**The TypeScript page-model contract is locked, the mock content API is wired (verbatim, no transformation), 7 real-Ukrainian-prose fixtures pass the editorial-smell + content-gate lint, and the descoped pre-processor (UKR-02/UKR-03) is reframed as an authoring contract documented in `docs/copy-style-uk.md`.**

## What landed

### Task 1 — Models, API, DI token, tests

- `src/content/models/block.ts` — `Block` discriminated union, 10 variants verbatim from UI-SPEC §"Shared types".
- `src/content/models/{lesson,article,datasheet,schematic}.ts` — page interfaces verbatim from §"Page models".
- `src/content/models/index.ts` — barrel + `AnyPage` union.
- `src/content/api/content-api.ts` — `abstract class ContentApi` with 8 methods (4 `get*` + 4 `list*`).
- `src/content/api/mock-content-api.ts` — `@Injectable({ providedIn: 'root' })`, `fetch('/assets/mock-data/...')`, returns parsed JSON unchanged.
- `src/content/api/content-api.token.ts` — `CONTENT_API` `InjectionToken<ContentApi>` + `provideContentApi(): Provider`.
- `src/content/models/block.spec.ts` — 11 `expectTypeOf` tests proving the discriminant narrows correctly for each of the 10 variants and for the `BlockType` union.
- `src/content/api/mock-content-api.spec.ts` — 5 tests with `vi.spyOn(globalThis, 'fetch')`: one round-trip per page kind (Lesson/Article/Datasheet/Schematic) plus the not-found error path. Each round-trip asserts byte-identical Cyrillic strings (incl. `«»`, `—`, `ʼ` U+02BC).

`pnpm test --run src/content/`: **16/16 PASS** (~280ms).
`pnpm tsc --noEmit`: **exit 0**.

### Task 2 — 7 fixtures, lint script, style guide, lint chain

#### Fixture inventory

| File | Lines | Bytes | NBSPs | Body shape |
|------|-------|-------|-------|-----------|
| lessons/pershyi-blymayuchyi-svitlodiod.json | 84 | 4 701 | 22 | lede, 2 headings, 2 paragraphs, 1 sidenote, 1 figure, 1 code, 1 aside, partsList (5 items) |
| lessons/knopka-ta-pidtyahuvalnyi-rezystor.json | 92 | 6 170 | 25 | lede, 2 headings, 2 paragraphs, 1 sidenote, 1 figure, 1 code, 2 asides, 1 paragraph, partsList (7 items) |
| lessons/analogovyi-vhid-ta-potentsiometr.json | 90 | 6 335 | 21 | lede, 2 headings, 2 paragraphs, 1 sidenote, 1 figure, 1 code, 1 aside, 1 paragraph, 1 aside, partsList (6 items) |
| articles/chomu-arduino.json | 66 | 6 882 | 54 | lede, 4 paragraphs, 3 asides, 2 headings, 1 sidenote |
| datasheets/atmega328p.json | 106 | 7 572 | 19 | pinout (28 pins), 14 specs, peripheralNotes (lede + 2 paragraphs + 2 asides + 1 sidenote + 2 headings) |
| datasheets/arduino-uno-r3.json | 111 | 7 870 | 22 | pinout (29 pins), 14 specs, peripheralNotes (lede + 3 paragraphs + 2 asides + 1 sidenote + 2 headings) |
| schematics/blymayuchyi-svitlodiod-shema.json | 59 | 4 649 | 22 | fullBleed figure + 4 explanation paragraphs + 2 asides + 2 headings |

**Total prose body across fixtures:** ~44 KB serialized.

#### Calibration-gate evidence (per UI-SPEC §"Mock-data prose calibration rule")

Every one of the 7 fixtures clears all 5 universal gates plus the 3 lesson-specific gates where applicable. Verifiable via `node scripts/lint-fixtures.mjs` exiting 0.

| Gate | Evidence |
|------|----------|
| ≥1 `ґ` per fixture | All 7 fixtures contain at least one (`ґрунтовно`, `ґатунок`, `ґрунт`, `ґатунково`); the lint script enforces it |
| ≥1 `«…»` quote pair | All 7 fixtures contain `«` and `»` |
| ≥1 em-dash `—` | All 7 fixtures contain at least one (most have 5–15) |
| ≥1 en-dash range `\d+–\d+` | All 7 fixtures contain at least one (`220–330 Ом`, `1–2 секунди`, `100–150 типів`, `0–1023`, `7–12 В`, etc.) |
| ≥1 `<code>` HTML tag | All 7 fixtures contain at least one |
| Lessons: ≥1 `sidenote` block | All 3 lessons contain exactly one |
| Lessons: ≥1 `figure` block | All 3 lessons contain exactly one |
| Lessons: ≥1 `code` block | All 3 lessons contain exactly one |

#### Editorial-smell coverage

The lint catches:
1. ASCII `"` between Cyrillic letters or surrounded by whitespace (signals missing «…»).
2. `--` between word characters (signals missing em-dash).
3. ASCII `'` between Cyrillic letters (signals missing `ʼ` U+02BC).
4. Regular space (NOT NBSP) after a one-letter Ukrainian preposition followed by a Cyrillic letter.

It explicitly skips the `code.code` field of `Block.type === 'code'` blocks: source code ships verbatim per D-PRE-02, and the rules above are about prose, not C++.

#### Why an authoring helper

When typing JSON via the file-write tools, NBSP characters are inconsistently preserved — sometimes they ride through, sometimes they are normalized to regular spaces. To keep authoring fluid AND lint passing, `scripts/normalize-fixture-nbsp.mjs` does a deterministic post-processing pass: walk the file, find `(boundary)(prep) (Cyrillic)`, replace the regular space with NBSP. Idempotent (re-running on a clean file changes nothing).

This is **not** a runtime transformation — D-PRE-02 still holds. It runs once at authoring time, the result is committed, and the runtime reads the committed bytes verbatim. Same conceptual category as Prettier or ESLint --fix.

#### `docs/copy-style-uk.md`

Single-page style guide. Lists the required typography forms with codepoints and examples (`«…»`, `„…"`, `—`, `–`, `ʼ`, NBSP), the things never to type (straight `"`, `--`, ASCII `'` between Cyrillic, regular space after one-letter prepositions), the carve-out for code, and the read-aloud commit-message attestation.

#### Lint chain wiring

`package.json` `lint` script extended:

```diff
- "lint": "eslint . && stylelint \"src/**/*.scss\""
+ "lint": "eslint . && stylelint \"src/**/*.scss\" && node scripts/lint-fixtures.mjs"
```

`pnpm lint`: **exit 0**.

#### Read-aloud attestations (D-MOCK-01)

Each fixture's commit body carries one `read-aloud: PASS — <slug>` line:

- `read-aloud: PASS — pershyi-blymayuchyi-svitlodiod` (commit ebf3539)
- `read-aloud: PASS — knopka-ta-pidtyahuvalnyi-rezystor` (commit 6946483)
- `read-aloud: PASS — analogovyi-vhid-ta-potentsiometr` (commit 6946483)
- `read-aloud: PASS — chomu-arduino` (commit 8251a0a)
- `read-aloud: PASS — atmega328p` (commit 8251a0a)
- `read-aloud: PASS — arduino-uno-r3` (commit 8251a0a)
- `read-aloud: PASS — blymayuchyi-svitlodiod-shema` (commit c522d58)

All seven attestations are AI (Claude). The author retains the right to re-write any fixture before phase exit if a native read-aloud reveals voice issues — this is the cost of the AI-drafted choice (D-MOCK-01) and is mitigated by the read-aloud gate being repeatable on demand.

## Deviations from the plan

| # | Deviation | Why | Impact |
|---|-----------|-----|--------|
| 1 | Created `scripts/normalize-fixture-nbsp.mjs` — an authoring helper not specified in the plan | Typing literal NBSP characters via the editing tools was unreliable; the helper makes the authoring contract sustainable. The shipped JSON is identical to what the plan required (NBSPs in the right places). | Adds one file, supports the same final state. |
| 2 | `lint-fixtures.mjs` preposition rule is **case-sensitive** (lowercase prepositions only) | Capital `В` is a unit symbol for volts (`5 В`), not a preposition. A case-insensitive rule produced false positives. | Sentence-initial capitalized prepositions remain editor's choice. |
| 3 | `prevSlug: null` removed in lesson 1 — replaced with omitted field | The TS interface declares `prevSlug?: string` (optional), so JSON `null` would not satisfy it. Subsequent lessons follow suit. | Tight contract, no breaking change. |

None of these weaken the plan's success criteria.

## Verification evidence

- ✅ `src/content/models/block.ts` defines `Block` with exactly 10 variants. Verifiable: `grep -c "  | {" src/content/models/block.ts` returns 10.
- ✅ All page models exist and export the right symbols.
- ✅ `ContentApi` declares 8 abstract methods.
- ✅ `MockContentApi` extends `ContentApi`, fetches from `/assets/mock-data/{kind}/${slug}.json`, contains zero transformation calls.
- ✅ `CONTENT_API` and `provideContentApi` exported from `content-api.token.ts`.
- ✅ `pnpm test --run src/content/`: 16/16 PASS.
- ✅ `pnpm tsc --noEmit`: exit 0.
- ✅ `src/app/app.config.ts`: untouched (`git diff` returns 0 lines).
- ✅ All 7 fixture files exist at the locked paths with locked slugs (D-MOCK-03).
- ✅ `node scripts/lint-fixtures.mjs`: exit 0, all 7 fixtures clean.
- ✅ `package.json` `lint` script ends with `&& node scripts/lint-fixtures.mjs`.
- ✅ `docs/copy-style-uk.md` exists and contains the typography-forms table with `«…»`, `«—»`, `«–»`, `ʼ`, and NBSP entries.
- ✅ `pnpm lint`: exit 0.

## Followups for downstream plans

- **Plan 02-03** continues to consume `Block` and the page models from `src/content/models` — the contract is locked.
- **Plan 02-06** wires `provideContentApi()` into `app.config.ts` once `/dev/primitives` lands.
- **Plan 04 (Wagtail)** must produce REST output that round-trips through `MockContentApi`'s test fixtures byte-for-byte. The mock-vs-Wagtail equivalence test is implicit in the contract.
- **Image SVG placeholders**: the figure/pinout/schematic `src` paths reference SVGs under `/assets/mock-data/figures/...` that do not exist yet. Plan 06 may add throwaway placeholders, or images can be added at content population time. Per D-MOCK-02, the JSON is the contract; the rendering test in 02-06 tolerates missing images via `alt` text fallback.
- **Lint script v2** (low priority): adopt the `boundaries/dependencies` v6 selector syntax now that we depend on the v6 plugin (separate from this plan's scope; see 02-01-SUMMARY).
