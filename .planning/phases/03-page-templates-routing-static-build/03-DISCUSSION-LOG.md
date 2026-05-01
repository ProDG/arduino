# Phase 3: Page Templates, Routing & Static Build — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 03-page-templates-routing-static-build
**Areas discussed:** Plan sequencing & spike timing, Shiki build-time mechanics, Block amendment + prerender plumbing, Lighthouse gate enforcement

---

## Gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Plan sequencing & spike timing | Plan ordering + spike runs immediately on Wagtail 7.3 | ✓ |
| Shiki build-time mechanics | Where pre-tokenization runs, theme source, lint policy | ✓ |
| Block amendment + prerender plumbing | `width`/`height` CONTRACT change + `getPrerenderParams()` helper | ✓ |
| Lighthouse gate enforcement | CI vs. manual, fail behavior, thresholds, profiles | ✓ |

Note: most of P3's typical "gray areas" (chrome composition, color, copy, layout, page templates) were already locked by 03-UI-SPEC.md (APPROVED 2026-05-01). This discussion focused only on implementation gray areas the UI-SPEC explicitly defers.

---

## Plan Sequencing & Spike Timing

### Q1 — Plan ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Foundation-first | Amendment → chrome → BlockRenderer → templates (LessonPage first) → SSG → Shiki → NgOptimizedImage → audits → spike | ✓ (Recommended) |
| Templates-first, polish later | Build templates against current model with raw `<img>`, retrofit perf later | |
| Parallel tracks | Sequential template track + independent fixture/Shiki track | |

**User's choice:** Foundation-first (Recommended)
**Notes:** Linear unblocking; each plan settles types/contracts the next consumes.

### Q2 — Wagtail spike timing

| Option | Description | Selected |
|--------|-------------|----------|
| Last plan, blocking exit | Spike is final plan; phase cannot close until PASS | ✓ (Recommended) |
| Run after Lighthouse, parallel to polish | Spike runs immediately on Wagtail 7.3; doesn't block exit | |
| Run early, before templates settle | Spike runs immediately on Wagtail 7.3 | |

**User's choice:** Last plan, blocking exit (Recommended)
**Notes:** Matches UI-SPEC §Wagtail Spike — design-freeze checkpoint, FE contract becomes immutable across P3→P4 once it passes.

### Q3 — Templates ordering

| Option | Description | Selected |
|--------|-------------|----------|
| LessonPage first | Heaviest template (TwoColumn+parts list+TOC+prev/next); siblings are simplifications | ✓ (Recommended) |
| Library/Home first | Build typographic-TOC row visual first (shared idiom) | |
| All templates as one plan | Single plan, commits per template inside | |

**User's choice:** LessonPage first (Recommended)

### Q4 — Phase-exit audits scoping

| Option | Description | Selected |
|--------|-------------|----------|
| Own plan, last before spike | Mirrors P1/P2 phase-exit pattern | ✓ (Recommended) |
| Folded into Lighthouse plan | Single performance + audits plan | |

**User's choice:** Own plan, last before spike (Recommended)

---

## Shiki Build-Time Mechanics

User initially asked for clarification on what Shiki is and how the questions relate. After explaining (Shiki = syntax highlighter; UI-SPEC requires build-time only, no client JS; "tokenization" = baking the highlighted HTML into the static output), user noted that **after Wagtail is connected, editors will modify code and need seamless highlighting after save** — and asked Claude to choose the best options with that in mind.

Claude's reasoning: tokenization can't be a "build on my laptop, push fixtures" thing in P4 — it must run server-side on save. So the P3 implementation should keep the tokenize logic as a small, isolated, re-portable function so P4 can run it inside Wagtail.

### Q1 — Where Shiki runs

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone Node script run before build | `scripts/tokenize-fixtures.mjs` as `prebuild`; tokenize function reusable in P4 | ✓ (Claude's choice given P4 editor flow) |
| ng builder hook (custom esbuild plugin) | Tighter Angular integration, but harder to reuse in Wagtail | |
| Inline at fixture authoring time | Manual; no automation | |

**User's choice:** Claude's choice — Standalone script with reusable `tokenize()` module
**Notes:** The function is the artifact; the script is just one caller. P4 will call the same logic from Wagtail's `pre_save`.

### Q2 — Theme source

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-authored TM theme JSON in repo | `src/assets/shiki/arduino-paper.json`, consumed by P3 script + P4 Wagtail | ✓ (Claude's choice) |
| Override stock light theme programmatically | Smaller surface, less inspectable | |

**User's choice:** Claude's choice — Hand-authored theme JSON
**Notes:** Versioned, diffable, content-shaped data. Same file works in both P3 (Node) and P4 (Wagtail container).

### Q3 — Lint policy on `code.tokens`

| Option | Description | Selected |
|--------|-------------|----------|
| Optional, ignored by lint | `tokens` is a regeneratable cache; CodeBlock falls back to plain `<pre>` | ✓ (Claude's choice) |
| Required field, lint enforces presence | Stricter contract; couples lint to tokenize ordering | |

**User's choice:** Claude's choice — Optional cache field
**Notes:** Critical for the P4 editor flow — tokens must never be a load-bearing contract or every editor save risks a broken site if tokenization lags.

---

## Block Amendment + Prerender Plumbing

### Q1 — How the `width`/`height` amendment lands

| Option | Description | Selected |
|--------|-------------|----------|
| First plan in P3, isolated | Plan 03-01: model + fixtures + lint, single CONTRACT-bumping commit | ✓ (Recommended) |
| Folded into NgOptimizedImage plan | Single plan: amend + migrate + swap | |
| Just-in-time per template | Amend when first template needs it | |

**User's choice:** First plan in P3, isolated (Recommended)

### Q2 — Where the prerender helper lives

| Option | Description | Selected |
|--------|-------------|----------|
| Shared module read by both runtime + build | `src/content/api/fixture-loader.ts` consumed by `MockContentApi` + `getPrerenderParams()` | ✓ (Recommended) |
| Separate build-time helper, parallel to MockContentApi | Two paths; risk of drift | |
| Inline in each page component | Duplication; no central swap point | |

**User's choice:** Shared module (Recommended)

### Q3 — P4 swap strategy

| Option | Description | Selected |
|--------|-------------|----------|
| DI port: `ContentSource` interface | P3 ships `FixtureContentSource`; P4 ships `WagtailContentSource`; single DI swap | ✓ (Recommended) |
| Just rewrite the loader file in P4 | No abstraction; harder to test side-by-side during P4 transition | |

**User's choice:** ContentSource interface (Recommended)

### Q4 — Lint enforces image-on-disk dimensions

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, lint reads image headers | Catches CLS-causing mismatches at commit time | ✓ (Recommended) |
| No, fixture values are trusted | Lower tooling cost; LH catches at phase exit | |

**User's choice:** Yes (Recommended)

---

## Lighthouse Gate Enforcement

### Q1 — Where Lighthouse runs

| Option | Description | Selected |
|--------|-------------|----------|
| Local + manual phase-exit only | `pnpm lighthouse:lesson`, no CI overhead, matches P1/P2 audit pattern | ✓ (Recommended) |
| Local + CI on every PR | Earlier feedback; flaky on CI runners | |
| CI only | Worst feedback loop | |

**User's choice:** Local + manual phase-exit only (Recommended)

### Q2 — On Lighthouse miss

| Option | Description | Selected |
|--------|-------------|----------|
| Halt phase exit, executor produces remediation note | Matches UI-SPEC §Lighthouse Gates | ✓ (Recommended) |
| Soft warning, phase can still close | Risks shipping below thresholds | |

**User's choice:** Halt + remediation note (Recommended)

### Q3 — Tolerance band

| Option | Description | Selected |
|--------|-------------|----------|
| Hard pass/fail at locked thresholds | Industry CWV "good"; tolerance band quietly becomes the new threshold | ✓ (Recommended) |
| ±10% tolerance band | Forgives LH variance; risks drift | |

**User's choice:** Hard pass/fail (Recommended)

### Q4 — Profiles enforced

| Option | Description | Selected |
|--------|-------------|----------|
| Both desktop + mobile, both must PASS | Mobile is strictest constraint | ✓ (Recommended) |
| Mobile-only is the gate | Slightly faster phase-exit walk | |

**User's choice:** Both (Recommended)

---

## Done check

**Question:** Ready for context?
**User's choice:** I'm ready for context.

---

## Claude's Discretion

- Exact filenames + class names within the locked module organization (planner finalizes per P2 conventions).
- Test coverage scope per template (planner picks DOM-test vs. showcase-only proportion).
- Image-size library choice (any small zero/low-dep PNG/JPG/SVG header reader).
- `cpp`/`arduino` Shiki language registration mechanism (built-in vs. tiny alias config).

## Deferred Ideas

None — all ideas surfaced during discussion stayed within P3 scope or were already enumerated in UI-SPEC §Open Decisions Carried Forward.
