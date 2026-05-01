# Phase 2: Primitives, Two-Column Layout & Page-Model Contract — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 02-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 02-primitives-two-column-layout-page-model-contract
**Areas discussed:** Library boundary tooling, Pre-processor (descoped), Mock data authoring, Primitive test depth, Showcase wiring

---

## Gray-Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Library boundary tooling | How to enforce `core-ui` public-API discipline. | ✓ |
| Pre-processor test strategy | Property-test framework + implementation. | ✓ (pivoted to descope) |
| Mock data authoring workflow | How 7 fixtures of Ukrainian prose are authored. | ✓ |
| Primitive test depth | What gets Vitest unit tests beyond pre-processor. | ✓ |
| Showcase page wiring | tsconfig paths, DI, prerender exclusion. | ✓ (added by Claude during discussion) |

**User's choice:** All four area cards selected. Showcase wiring covered as the natural follow-on after the four were discussed.

---

## Library boundary tooling

### Q1: How should `core-ui` public-API discipline be enforced?

| Option | Description | Selected |
|--------|-------------|----------|
| eslint-plugin-boundaries (Recommended) | Declarative element-type rules; scales to future libs cleanly. | ✓ |
| no-restricted-imports patterns | Built-in ESLint, simplest, less expressive at scale. | |
| Path-mapping discipline only | tsconfig paths + author trust. | |
| import/no-internal-modules | From eslint-plugin-import, lighter, less granular. | |

**User's choice:** eslint-plugin-boundaries (Recommended).

### Q2: What's exported from `projects/core-ui/src/public-api.ts`?

| Option | Description | Selected |
|--------|-------------|----------|
| Components + input/output types only (Recommended) | Block stays in `content/models`, no domain leakage into UI lib. | ✓ |
| Components + Block types re-exported | UI-SPEC-suggested ergonomics; couples UI lib to content models. | |
| Components only, no types | Bare classes; worst DX. | |

**User's choice:** Components + input/output types only (Recommended).

---

## Pre-processor (pivoted to descope)

### Q1: How should the Ukrainian text pre-processor be implemented internally?

**User did not answer the implementation questions.** Instead asked: "Do I actually need the pre-processor? What is it for?"

Claude explained: 6-step transform function per UI-SPEC, purpose is editorial typography hygiene (`«…»`, NBSP after one-letter prepositions, em/en-dashes, Ukrainian apostrophe), motivated by REQ UKR-02/UKR-03 and the contract-test sync requirement between MockContentApi and WagtailContentApi in P4. Offered alternatives: skip entirely, run only at render time, run only server-side.

**User's response:** "Let's skip it. Editors are skilled professionals and texts are already high quality, with proper typography, including non-breaking spaces where needed (via proper UTF-8 symbols)."

**Decision recorded as D-PRE-01..D-PRE-05 in 02-CONTEXT.md:**
- No `processUkrainianText` function. No `src/lib/uk-text.ts`.
- Authors deliver verbatim typeset prose; primitives consume verbatim.
- UKR-02/UKR-03 reframed as `docs/copy-style-uk.md` style guide + `scripts/lint-fixtures.mjs` editorial-smell linter (warns, never transforms).
- P4 contract test still works (both sides verbatim, no transformation pair to sync).
- 02-UI-SPEC §"Ukrainian Text Pre-processor" is superseded — must be amended (status → draft) before planning.

---

## Mock data authoring workflow

### Q1: How are the 7 P2 mock fixtures authored?

| Option | Description | Selected |
|--------|-------------|----------|
| You author them yourself (Recommended) | Solo author writes prose directly. Highest quality bar. | |
| AI-drafted, you review and edit | LLM draft + author read-aloud + rewrite per fixture. Faster; design-calibration risk. | ✓ |
| Stub now, real prose deferred to P6 | Placeholder prose; loses calibration gate. | |

**User's choice:** AI-drafted, you review and edit.

### Q2: Source format for mock fixtures?

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-write JSON directly (Recommended) | JSON IS the contract; no abstraction drift. | ✓ |
| Author in TS, no JSON files | Better DX; serialization step in P4 contract test. | |
| Author markdown + frontmatter, build step compiles | Best DX; adds tooling and a drift surface. | |

**User's choice:** Hand-write JSON directly (Recommended).

### Q3: How are per-fixture content gates verified?

| Option | Description | Selected |
|--------|-------------|----------|
| CI lint script (Recommended) | `scripts/lint-fixtures.mjs` Node script in `pnpm lint`. Doubles as editorial-smell lint. | ✓ |
| Vitest test file | `fixtures.spec.ts`; idiomatic; less ergonomic for non-developer editors. | |
| Author's reading-aloud check + commit message proof | No automation; trusts authorial discipline. | |

**User's choice:** CI lint script (Recommended).

**Notes:** Read-aloud native-Ukrainian check stays as a per-fixture author-attested commit-message line (`read-aloud: PASS`) in addition to the lint script — flatness can't be lint-detected. AI-drafted choice raises the design-calibration risk; mitigated by per-fixture rewrite pass and the option to redraft any fixture that fails read-aloud.

---

## Primitive test depth

### Q1: What gets Vitest unit tests in Phase 2?

| Option | Description | Selected |
|--------|-------------|----------|
| TwoColumn measurement logic (Recommended) | Pure-ish geometry, highest-value test. | ✓ |
| CodeBlock copy-button interaction | Mock clipboard, assert label transitions and aria-live. | ✓ |
| Block discriminated-union type-narrowing | `expectTypeOf` test against TS contract. | ✓ |
| Fixture-loading by MockContentApi | Happy-path round-trip per page type. | ✓ |

**User's choice:** All four (multi-select).

### Q2: How are visuals verified at phase exit?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual breakpoint walk on /dev/primitives (Recommended) | Extends P1's `docs/typography-checklist.md`. No new tooling. | ✓ |
| Manual + Playwright screenshot baseline | Adds regression net; tends to fight typographic calibration. | |
| Manual + Storybook for primitive isolation | Long-term value; net-new scope not in REQUIREMENTS.md. | |

**User's choice:** Manual breakpoint walk on /dev/primitives (Recommended).

---

## Showcase page wiring

### Q1: How is `@arduino/core-ui` wired up?

| Option | Description | Selected |
|--------|-------------|----------|
| tsconfig paths only (Recommended) | Single-app workspace; lib consumed by source; ng-packagr exercised once at phase exit. | ✓ |
| ng-packagr build + dist consumption | Production-grade; adds dev iteration cost. | |
| tsconfig paths + ng-packagr in CI only | Hybrid; modest setup. | |

**User's choice:** tsconfig paths only (Recommended).

### Q2: How is `MockContentApi` provided?

| Option | Description | Selected |
|--------|-------------|----------|
| InjectionToken with useClass (Recommended) | `CONTENT_API` token + `provideContentApi()` factory; one-line P4 flip. | ✓ |
| Abstract class + useClass | Slightly less ceremony; abstract class IS the token. | |
| Direct import of MockContentApi | Rejected by REQ CONTRACT-03/PAGE-11. | |

**User's choice:** InjectionToken with useClass (Recommended).

### Q3: How is `/dev/primitives` excluded from prod prerender / sitemap?

| Option | Description | Selected |
|--------|-------------|----------|
| Excluded from getPrerenderParams + noindex meta (Recommended) | Mirrors P1 `/dev/glyph-audit` pattern. | ✓ |
| Dev-only route via environment flag | Stronger guarantee; minor build complexity. | |
| Always prerendered, never linked | Auditable on live VPS; matches P1. | |

**User's choice:** Excluded from getPrerenderParams + noindex meta (Recommended).

---

## Claude's Discretion

Areas where the user explicitly or implicitly deferred to Claude (recorded in 02-CONTEXT §"Claude's Discretion"):

- Internal file/folder structure inside `projects/core-ui/src/lib/<primitive>/`.
- Exact `eslint-plugin-boundaries` element-type names.
- Exact wording of `docs/copy-style-uk.md`.
- Internal structure and CLI ergonomics of `scripts/lint-fixtures.mjs`.
- AI-drafting cadence (batch all 7 vs interleave per fixture).
- Vitest test file organization (co-located vs central).

---

## Deferred Ideas

Captured in 02-CONTEXT.md `<deferred>` section. Notable mid-discussion deferrals:

- `processUkrainianText` function — descoped this phase; may return in a future phase only if evidence demands it.
- `ng build core-ui` as a CI step — single-app workspace doesn't need it yet; revisit at P3/P4 if a second consumer appears.
- Playwright / Storybook — revisit at P3 exit when page templates stabilize.
