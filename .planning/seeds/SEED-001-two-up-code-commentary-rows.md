---
id: SEED-001
status: dormant
planted: 2026-05-02
planted_during: v1, Phase 03 (page-templates-routing-static-build) — verification walk
trigger_when: starting any content-authoring or design-system phase after P3 ships — most naturally during the milestone where real lessons get authored and the current single-block + line-anchored-annotations model starts feeling cramped
scope: Large
---

# SEED-001: Two-up code/commentary rows (Arduino Starter Kit book layout)

## Why This Matters

The original Arduino Starter Kit book — which CLAUDE.md names as the project's
core inspiration ("Reading and learning here feels as good as reading a
beautifully typeset book") — uses a two-up layout where each "code block" is a
**row** with code on the left and a commentary block on the right. The
commentary can be much taller than the code chunk; the code column then
**stretches vertically** to match, and the next row of code starts aligned with
where the prior commentary ended (not where the prior code ended).

This is fundamentally different from the v1 model. Today we have one
self-contained `<ui-code-block>` with line-anchored margin annotations
(`annotations: { line, html }[]`). The annotations sit at line offsets within
the same vertical band as the code. That works for short contextual notes but
falls apart when an explanation needs a quarter-page paragraph for two lines of
code — exactly the case the Starter Kit handles best.

Achieving the book-feel for in-depth lesson walkthroughs requires the two-up
row model. It's the kind of editorial primitive that defines whether the
project hits its core value or merely approximates it.

## Definition (clarified during seed conversation)

- **Lines** stay as-is: numbered, syntax-highlighted, the same atomic unit.
- **"Code block"** in this seed = one row in the two-up structure, pairing a
  contiguous code chunk with one commentary block.
- A **listing** is a stack of rows. Multiple rows compose the full code sample
  the lesson is walking through.
- **Line numbers continue across rows** (row 1: lines 1–3, row 2: lines 4–8, …).
- **Syntax highlighting** must look as if the entire listing were tokenized as
  one — cross-row context preserved (e.g., a function opened in row 1 and
  closed in row 4 must highlight consistently).
- **Hover** on either column highlights both (one logical unit visually).
- The whole thing should look seamless — one big component, not two side-by-side.

## When to Surface

**Trigger:** starting any content-authoring or design-system phase after P3
ships — most naturally during the milestone where real lessons get authored.

This seed should be presented during `/gsd-new-milestone` when the milestone
scope matches any of these conditions:
- Authoring real lessons (not just calibration fixtures) → the
  three-fixture set used in P3 doesn't exercise the multi-row pattern, but the
  moment a lesson author tries to walk readers through a non-trivial sketch the
  current annotations model will visibly fall short.
- Re-evaluating the editorial design system / `core-ui` primitives →
  this is a new primitive (`<ui-code-row>` + `<ui-code-listing>`) and a new
  block type, not a tweak to existing ones. Best handled when other primitives
  are already on the table.
- Any post-MVP design refinement milestone aimed at "make this feel like the
  book."

**Anti-trigger:** do NOT surface this during pure infrastructure or backend
phases (Wagtail wiring, deployment, monitoring) — the work is editorial and
needs design + content attention, not infra context.

## Scope Estimate

**Large** — this is a full milestone-sized change, not a phase. It touches:

- New content model variant (or significant change to the `code` block).
- New build-time tokenization mode in `tokenize-fixtures.mjs` (chunked output).
- New `<ui-code-row>` + `<ui-code-listing>` primitives in `core-ui`.
- New StreamField shape on the Wagtail side (P4+ contract impact).
- Editorial choice: when does an author use the two-up listing vs. the v1
  single-block? Authoring guidelines need writing.
- Possible deprecation path for the existing line-anchored annotations, OR an
  explicit coexistence policy.

A reasonable cut: spike the layout in a sketch first (`/gsd-sketch`), then
draft a phase that lands the FE primitive against fixtures, then a follow-up
phase for the Wagtail StreamField + authoring docs.

## Open Questions for the Future Spec

- **Data model:** should each row carry its own `code: string` plus
  `commentaryHtml`, with the parent listing tokenized as one virtual
  concatenation? Or one parent `code: string` chunked by line-range markers?
  The first feels more natural for authoring; the second is easier to
  serialize through Wagtail's StreamField.
- **Build pipeline:** likely tokenize the whole listing (full file or full
  concatenation) → split the resulting `<span class="line">` HTML across
  declared row boundaries → emit per-row tokens cache. `tokenize-fixtures.mjs`
  would gain a "chunked" mode. The hard part is splitting cleanly without
  breaking nested spans (e.g., a multi-line string that spans rows). Worth
  prototyping.
- **Layout primitive:** probably a new `<ui-code-row>` (code slot +
  commentary slot, horizontal grid that vertically aligns to whichever side is
  taller) and a parent `<ui-code-listing>` that groups rows and provides
  shared hover state via signal. Stretching the code column to match the
  commentary's height visually is what creates the seamless look.
- **Coexistence with current annotations:** probably yes — the two-up row is
  for in-depth lesson walkthroughs (chapters of code paced by long
  commentary), the line-anchored `annotations: { line, html }[]` is for short
  contextual notes on otherwise-flowing code. Keeping both gives editorial
  range. Decision should be confirmed during spec.
- **Hover-link mechanism:** per-row signal in `<ui-code-listing>` that both
  slots subscribe to. Keyboard equivalent (focus on one column highlights
  both) is an a11y must-have; sketch should explore the focus ring style.
- **Line-number continuity at the data layer:** how is the line offset
  computed — implicit (sum prior rows' line counts) or explicit (each row
  declares its `startLine`)? Implicit is less error-prone; explicit allows
  out-of-order or skipped lines. Probably implicit for v1 of the feature.

## Breadcrumbs

Code and decisions in the current codebase that will be touched or referenced:

- `projects/core-ui/src/lib/code-block/code-block.component.ts` — current
  CodeBlock primitive (single-block, three-mode annotations).
- `projects/core-ui/src/lib/code-block/code-block.component.scss` — current
  margin-rail escape via negative margin-right (commit `3d58a39`).
- `src/content/models/block.ts` — `code` block variant with
  `annotations: { line, html }[]` field.
- `src/content/models/block.spec.ts` — block model contract tests.
- `scripts/tokenize-fixtures.mjs` — build-time Shiki tokenization with
  per-line transformer (commit `43149dc`); would need a chunked mode.
- `.planning/ROADMAP.md` line 46 — Phase 2 success criterion #3 explicitly
  scopes "per-line margin annotations vertically aligned to their target lines"
  as the v1 model. This seed describes the v2 escalation.
- `.planning/ROADMAP.md` line 67 — Phase 3 Wagtail spike validates
  `CodeBlock = StructBlock(language, code, annotations=ListBlock({line, note}))`.
  The two-up model would require either a new StructBlock variant or a
  separate `CodeListingBlock` containing a `ListBlock` of rows.
- `CLAUDE.md` "Core value" line — *"Reading and learning here feels as good as
  reading a beautifully typeset book."* This seed exists to honour that.

## Notes

- Discovered during the Phase 3 verification walk on 2026-05-02. The user was
  inspecting the live lesson page and remembered the Starter Kit pattern while
  looking at the rendered code block + annotations. The current
  implementation looks correct, but is visibly *less* than the book.
- The user explicitly accepted that cross-row syntax highlighting may be hard
  and is open to discussion if the build pipeline can't deliver a clean split.
  A reasonable v0.5 of this feature could re-tokenize per-row (losing
  cross-row context for long constructs); v1 attempts the full-listing
  tokenize + split.
- Plant this seed, do NOT replan Phase 3. Finish current verification clean.
  Promote to a phase only after a milestone boundary, ideally after some real
  lesson authoring has happened.
- Probable companion seeds (file separately if/when noticed): authoring tools
  for long-form lessons, a "preview pane" that shows code + commentary
  side-by-side while editing, a "compact view" toggle for readers who want to
  collapse the commentary.
