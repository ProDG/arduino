---
phase: 2
slug: primitives-two-column-layout-page-model-contract
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-01
reviewed_at: 2026-05-01
---

# Phase 2 — UI Design Contract

> Visual and interaction contract for the `core-ui` primitive library, the two-column body+margin layout, the `CodeBlock` interaction model, the TypeScript page-model discriminated union, and the Ukrainian text pre-processor. Inherits **every** token, base CSS rule, and copywriting punctuation rule from the Phase 1 UI-SPEC (`01-UI-SPEC.md`) — this document only declares **net-new** decisions for P2.

This phase ships:

- the `core-ui` Angular library (PRIM-01) with public-API boundary
- the editorial primitives `Heading`, `Body`, `Lede`, `Aside`, `Sidenote`, `Figure`, `FigureCaption`, `CodeBlock`, `Diff`, `Pinout` (PRIM-02, PRIM-04..08)
- the layout primitives `PageShell`, `TwoColumn`, `MarginRail` (PRIM-03)
- the three-breakpoint sidenote behavior (LAYOUT-01..05)
- the locked TypeScript content models in `content/models/*.ts` (`Lesson`, `Article`, `Datasheet`, `Schematic`, shared `Block` discriminated union) (CONTRACT-01)
- the `ContentApi` interface + `MockContentApi` with real Ukrainian fixtures (CONTRACT-03, CONTRACT-04)
- the Ukrainian text pre-processor with idempotency guarantees (UKR-02, UKR-03)
- a single primitive showcase route `/dev/primitives` that exercises every primitive against real Ukrainian content

Phase 2 does **not** ship: Shiki integration, public page templates, routing beyond `/dev/primitives`, header/footer, glossary tooltips, drop caps, pinout hover hotspots beyond a static fallback (those are P3 and P6).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — bespoke Angular `core-ui` library on top of the P1 SCSS token system. No shadcn (Angular project, hand-authored editorial CSS per CLAUDE.md). |
| Preset | not applicable |
| Component library | `core-ui` (in-repo Angular library, public API surface only — no internal reach-through). Standalone components, zoneless, signal inputs. |
| Icon library | none in P2. Two SVG glyphs are inlined directly in the affected primitives: `CodeBlock`'s clipboard icon and `Sidenote`'s superscript marker. Never import `@angular/material`, `lucide`, or any icon font. |
| Font | Inherited from P1. `--font-body` (Source Serif 4), `--font-ui` (Inter), `--font-mono` (JetBrains Mono). No new families. |

### `core-ui` library boundary (PRIM-01)

- **Library path:** `projects/core-ui/` (Angular workspace library project), built standalone, consumed by the app via path mapping in `tsconfig.json`.
- **Public API surface:** `projects/core-ui/src/public-api.ts` exports each primitive component class, its input/output types, and the shared `Block` discriminated-union types from `@arduino/content/models`.
- **Internal reach-through forbidden:** ESLint rule `@nx/enforce-module-boundaries` (or equivalent project-restricted-imports) blocks `import { … } from '@arduino/core-ui/lib/internal/...'`. Only `from '@arduino/core-ui'` is allowed.
- **No NgModules.** Every primitive is a standalone component with `imports: []` self-contained.
- **Co-located styles:** every primitive has `<name>.component.scss` next to its `<name>.component.ts`. Only `styles/tokens/` and `styles/base/` are global (TYPE-10 hard constraint from CLAUDE.md).
- **Tokens consumption:** primitives read **only `var(--…)`** semantic tokens, never SCSS raw `$…` variables (D-01 from P1).

---

## Spacing Scale

Inherited unchanged from P1 (`01-UI-SPEC.md` §Spacing Scale). All P2 values use `--space-0` … `--space-10`.

**P2-specific exceptions:** none. Two new layout-relative measurements (margin-rail width, sidenote gap) live in `_layout.scss`, not in the spacing scale, because they are layout dimensions (in `rem`/`px` from a sizing decision), not vertical-rhythm units.

---

## Typography

Inherited unchanged from P1. **No new font sizes, no new weights, no new line-heights are introduced in P2.** Every primitive composes against the P1 scale.

P2-specific usage map (which primitive consumes which P1 size):

| Primitive | Default `var(--text-…)` | Override allowed via input? |
|---|---|---|
| `Heading[level=1]` | `--text-h1` | no — level governs size |
| `Heading[level=2]` | `--text-h2` | no |
| `Heading[level=3]` | `--text-h3` | no |
| `Body` | `--text-body` | no |
| `Lede` | `--text-lede` (italic) | no |
| `Aside` (block-level pull-quote) | `--text-body`, italic | no |
| `Sidenote` (margin column) | `--text-caption` | no |
| `Figure` caption | `--text-caption` | no |
| `CodeBlock` | `--text-mono` | no |
| `CodeBlock` margin annotation | `--text-caption` | no |
| `Pinout` legend label | `--text-caption` | no |
| `Diff` (text-level inline diff) | inherits from parent (usually `--text-body`) | no |

If any future primitive needs a new size, it must amend `_typography.scss` first and ship via a UI-SPEC update — never a one-off override.

---

## Color

Inherited unchanged from P1. **No new colors introduced.** P2 introduces three additional uses of the existing accent and the existing `--color-highlight`, all listed below for the auditor.

### Accent reserve list — P2 additions to the P1 list

The P1 list is locked. P2 adds:

5. **Sidenote anchor superscript number** (`<sup>` marker in body prose that pairs with the margin sidenote) — color `--color-accent`. Reading the page should make the eye flick from the accent superscript in the body column to the corresponding accent-numbered sidenote in the margin column.
6. **`CodeBlock` copy-button icon and label** — `--color-ink-muted` at rest, `--color-accent` on `:hover` and `:focus-visible`. The button itself sits in the top-right corner of the code-block frame, no fill, no border, only color.
7. **`Diff` line marker** — accent-colored `+` glyph in the gutter for added lines (no background fill); see Diff Visual Treatment below.

**Still never:** body text, headings, primary CTAs (none in P2), background fills, hover surfaces, decorative dividers.

### `--color-highlight` use (locked here)

- `CodeBlock` line-highlight: a single line inside a code block can be highlighted via `<mark>` semantics, rendered as `background: var(--color-highlight);` on the line element. Used sparingly — at most one highlighted line per code block in the showcase.

### Diff colors (P2 NEW, but stay within the existing palette)

The `Diff` primitive and `CodeBlock` diff mode do **not** introduce red/green. Editorial restraint:

- **Added line:** background `var(--color-highlight)` (warm pale yellow), gutter glyph `+` in `var(--color-accent)`. No red/green.
- **Removed line:** background `transparent`, line text color `var(--color-ink-muted)`, `text-decoration: line-through`, gutter glyph `−` in `var(--color-ink-muted)`.
- **Unchanged line:** no special treatment.

Rationale: GitHub-style red/green diff would import a developer-tool aesthetic that fights the book aesthetic. The Starter Kit book differentiates code revisions through typographic weight and margin annotation, not chromatic alarm. The yellow + ink-muted palette is sufficient to read the diff at a glance and harmonizes with `--color-highlight`.

---

## Layout Primitives & Two-Column Contract

### New layout tokens (`_layout.scss`, additions to P1)

| CSS var | Value | Usage |
|---|---|---|
| `--margin-rail-width` | `18rem` (~288px) | Width of the sidenote/margin-annotation column at ≥1200px |
| `--margin-rail-gap` | `var(--space-6)` (32px) | Horizontal gap between body column and margin rail |
| `--sidenote-stack-gap` | `var(--space-5)` (24px) | Vertical gap between consecutive sidenotes in the margin |
| `--sidenote-anchor-leader` | none in v1 | No drawn leader line. Vertical alignment is the only visual link (see anchoring below). |

### `PageShell` (PRIM-03)

The single root layout component for every page. Wraps content in:

```
<header><!-- P3 fills --></header>
<main class="page-shell__main"><ng-content/></main>
<footer><!-- P3 fills --></footer>
```

In P2, `header` and `footer` render as empty `<header></header>` / `<footer></footer>` placeholders so `/dev/primitives` already nests inside the final structural skeleton. Padding follows the inherited P1 `--container-pad-*` per breakpoint. Max width: `var(--container-max)` (1200px). Centered via `margin-inline: auto`.

### `TwoColumn` (PRIM-03, LAYOUT-01..03)

The body+margin layout primitive. Two named slots projected via Angular `<ng-content select="[body]">` and `<ng-content select="[margin]">`.

**Desktop (≥1200px) — true margin column:**

- CSS Grid: `grid-template-columns: minmax(0, var(--measure-prose)) var(--margin-rail-gap) var(--margin-rail-width);`
- Body column gets the prose measure (62ch from P1).
- Margin column is `position: relative` so child sidenotes can be vertically positioned to align with their anchors in the body (see Sidenote Anchoring below).
- The two columns share a single grid container so they are siblings, not nested — required for the absolute positioning of sidenotes against the body's anchor list.

**Tablet (768–1199px) — inline below anchor paragraph:**

- CSS Grid collapses to a single column.
- Each `Sidenote` renders **inline immediately after the closing `</p>` of its anchor paragraph**, NOT at the bottom of the page. Visually distinct: full-width within the prose measure, left border `2px solid var(--color-accent)`, padding-left `--space-4`, font `--text-caption`, color `--color-ink-muted` (matches the P1 `aside` style).
- Sidenote-anchor superscripts in the body remain visible (still `--color-accent`). Tapping the superscript scrolls the next sibling sidenote into view (smooth scroll, default browser behavior; no JS).

**Mobile (<768px) — collapsed disclosure:**

- Each `Sidenote` renders as a `<details>` element placed immediately after its anchor paragraph.
- `<summary>` reads: `Примітка {N}` (where `{N}` is the sidenote's 1-based index within the page), styled as a tiny accent-colored chip (`--text-caption`, `--color-accent`, no underline, dotted underline on `:focus-visible`).
- Body of the disclosure renders the sidenote contents.
- The `<details>` is closed by default. The reader's tap is the ergonomically correct affordance for revealing a margin note on a small screen.

### Sidenote anchoring mechanism (≥1200px)

The hardest decision in this phase. **Locked decision: no JavaScript layout, no `anchor-name`/`position-anchor` (browser support not yet universal in 2026 across mobile WebKit), no leader lines.**

The anchoring is achieved by **sibling-positioned absolutely-placed sidenotes inside the margin column, with their `top` set by a small per-page measurement step at component init.**

- Body column has anchor paragraphs marked `<p data-sidenote-anchor="N">`. The body's superscript reference renders as `<sup class="sidenote-ref">N</sup>` inside the paragraph at the exact position the author marks (typically end-of-clause).
- Margin column receives a list of sidenotes; on `afterNextRender`, the `TwoColumn` primitive measures the `top` of each `[data-sidenote-anchor]` (relative to the grid container) and assigns `style.top` (in px) to the matching `Sidenote` in the margin column, then `position: absolute` it.
- A `ResizeObserver` on the body column re-runs the measurement on viewport changes (debounced 50ms). On window resize across the 1200px breakpoint, the layout switches between absolute-positioned (desktop) and inline-flow (tablet/mobile) by toggling a class.
- **Collision rule:** if two sidenotes' computed `top` would overlap (sidenote N+1 starts before sidenote N ends + `--sidenote-stack-gap`), the later sidenote slides down to `top(N) + height(N) + var(--sidenote-stack-gap)`. The visual link is broken by design — overlap is the larger error.
- **No leader line drawn.** Vertical alignment is the only signal. If alignment ever feels weak in real content (validated on the showcase page with real Ukrainian prose), a single-pixel `--color-rule` leader can be added in a future phase without changing the contract.

This mechanism is testable: the showcase page must demonstrate at least 3 sidenotes anchored to 3 different paragraphs with the first sidenote starting **above the page fold** and the last starting near the **bottom** of a long article — vertical alignment must match within 4px of the anchor superscript's `top`.

### `MarginRail` (PRIM-03)

A thin wrapper for the margin column slot. Used by both `TwoColumn` (sidenote stack) and the `Lesson` page template (parts list, P3) and `Datasheet` (peripheral notes, P3). Provides:

- Width: `var(--margin-rail-width)` (desktop only — collapses to inline at <1200px).
- Vertical gap between children: `var(--space-6)` (default; override via input).
- Sticky positioning is **not** included in v1 (the parts list does not stick on scroll — book aesthetic prefers content that sits where it was placed).

### Three-breakpoint verification gate (LAYOUT-01..03)

The showcase page `/dev/primitives` must visually pass at:

- **<768px** (mobile): single column, sidenotes collapsed to `<details>`, no horizontal scroll.
- **768–1199px** (tablet): single column, sidenotes inline immediately after anchor paragraph, no overlap.
- **≥1200px** (desktop): true two-column with absolute-positioned sidenotes vertically aligned to anchors within 4px tolerance, no overlap.

This is a phase-exit checkpoint, not a P3 concern — recorded in `docs/typography-checklist.md` as a P2 addition.

---

## Editorial Primitives — Visual & API Contract

Each primitive's component file is `projects/core-ui/src/lib/<name>/<name>.component.ts`. Inputs are signal inputs (Angular 21 zoneless idiom).

### `Heading` (PRIM-02)

```ts
@Component({ selector: 'ui-heading', standalone: true, ... })
export class HeadingComponent {
  level = input.required<1 | 2 | 3>();
  id = input<string | undefined>();   // anchor target for in-page links
}
```

Renders `<h1|h2|h3>` with the P1 base styles. `id` enables `div. рис. N` cross-refs (POLISH-03, P6) without API changes.

**Visual:** identical to P1 `_base.scss` h1/h2/h3 rules. No shadow, no border, no decorative element.

### `Body` (PRIM-02)

```ts
@Component({ selector: 'ui-body', standalone: true, ... })
export class BodyComponent {
  // No inputs — pure semantic wrapper.
}
```

Renders `<p>` constrained to `var(--measure-prose)`. The Ukrainian pre-processor runs on string children of `Body` automatically (see Pre-processor section).

**Visual:** identical to P1 `_base.scss` `p` rule.

### `Lede` (PRIM-02)

```ts
@Component({ selector: 'ui-lede', standalone: true, ... })
export class LedeComponent {}
```

Renders `<p class="lede">`. Italic, `--text-lede`. Used once per article, immediately after `Heading[level=1]`.

### `Aside` (PRIM-02)

A block-level pull-quote / call-out, **not** a sidenote. Sits inline in the body column, full prose-measure width. Used for "warning", "note", "Arduino fact" style content.

```ts
@Component({ selector: 'ui-aside', standalone: true, ... })
export class AsideComponent {
  variant = input<'note' | 'warning' | 'fact'>('note');
}
```

**Visual (all three variants):** left border `2px solid var(--color-accent)`, padding-left `--space-4`, font `--text-body` italic, color `--color-ink`, `margin-block: var(--space-5)`. The three variants are **identical visually in v1** — `variant` is a semantic-only input that lets P3 page templates and P6 polish differentiate them later (e.g., `warning` could grow a Cyrillic glyph icon, `fact` could grow a hairline rule above) without an API change. v1 ships visual identity to keep the editorial palette restrained.

### `Sidenote` (PRIM-02)

A margin-column note paired with a body-column anchor superscript. See Sidenote Anchoring above for layout mechanism.

```ts
@Component({ selector: 'ui-sidenote', standalone: true, ... })
export class SidenoteComponent {
  number = input.required<number>();   // 1-based, page-scoped, visible to reader
}
```

**Visual (desktop, in margin):** no border, no background, `--text-caption`, `--color-ink-muted`. Begins with `<span class="sidenote__number">{N}.</span>` in `--color-accent` `--font-ui` 600-weight, immediately followed by the note prose. Number is the visual anchor — it matches the body superscript exactly.

**Visual (tablet, inline):** matches the P1 `aside` rule — left border `2px solid var(--color-accent)`, padding-left `--space-4`. The number is still rendered as a prefix in accent.

**Visual (mobile, `<details>`):** see breakpoint section above.

### Sidenote anchor in body prose

A small inline component used inside `Body` content:

```ts
@Component({ selector: 'ui-sidenote-ref', standalone: true, ... })
export class SidenoteRefComponent {
  number = input.required<number>();   // matches Sidenote[number]
}
```

Renders `<sup class="sidenote-ref">{N}</sup>` — `--color-accent`, `--font-ui`, font-size `0.75em`, `vertical-align: super`. On `:hover` and `:focus-visible` (it's wrapped in an `<a href="#sn-{N}">` for keyboard nav), text-decoration: underline. Tapping/clicking on tablet+mobile scrolls the matching sidenote into view (default browser hash-link scroll, no custom JS).

### `Figure` + `FigureCaption` (PRIM-02)

```ts
@Component({ selector: 'ui-figure', standalone: true, ... })
export class FigureComponent {
  number = input<number | undefined>();   // for "Рис. N" prefix
  fullBleed = input<boolean>(false);      // false = body-measure width (default), true = container width
}

@Component({ selector: 'ui-figure-caption', standalone: true, ... })
export class FigureCaptionComponent {}
```

**Visual (default, `fullBleed=false`):** body-measure width (62ch). Image inside via `<img>` with explicit `width`/`height` (PERF-05 prep — NgOptimizedImage swap is P3). Caption renders below the image, `--text-caption`, `--color-ink-muted`. If `number` is set, caption is prefixed with `<span class="figure-num">Рис. {N}</span>` (accent, 600 weight) followed by an em-dash separator and the caption prose.

**Visual (`fullBleed=true`):** image breaks out to `var(--container-max)` width using a CSS escape: `width: var(--container-max); margin-inline: calc(50% - 50vw); max-width: 100vw;` clamped at the container. Caption stays at body-measure width below, centered. Used for hero schematics.

**Caption position:** **always below the image.** Above-image captions are rejected — the book convention is below.

**Margin-extending figures (figure that bleeds into the margin column):** **deferred to P3.** v1 uses only body-measure or full-bleed; the third option requires a third grid column variant that is not worth the API surface in P2.

### `CodeBlock` (PRIM-04, PRIM-05, PRIM-06)

The most interaction-rich primitive. **Shiki integration is P3** — P2 ships the visual frame, the line-numbered structure, the copy-to-clipboard interaction, the diff visual treatment, and the margin-annotation alignment. Lines render as plain monospace text in P2; Shiki tokens swap into the same DOM in P3 without changing the contract.

```ts
@Component({ selector: 'ui-code-block', standalone: true, ... })
export class CodeBlockComponent {
  language = input.required<'cpp' | 'arduino' | 'plaintext' | 'diff'>();
  code = input.required<string>();
  annotations = input<{ line: number; html: string }[]>([]);
  showLineNumbers = input<boolean>(true);
  highlightLines = input<number[]>([]);   // 1-based; rendered with --color-highlight
  diffMode = input<boolean>(false);       // true = lines starting with '+'/'-'/' ' get diff treatment
  filename = input<string | undefined>(); // optional caption above the frame
}
```

**Visual frame (locked from P1, augmented):**

- Outer container: `<figure>` (so a code block can be cross-referenced like a figure).
- Optional filename strip above the code: `--text-caption`, `--color-ink-muted`, `--font-mono`, padding `var(--space-2) var(--space-4)`. No background — just a hairline rule below.
- Code container: `<pre>` with the P1 code-block treatment (1px accent border, 2px radius, `padding: var(--space-5) var(--space-6)`, mono 15px / 1.55, paper background, horizontal scroll on overflow).
- Top-right of the `<pre>`: copy button (see below).

**Line numbers (locked):**

- Rendered as a left-side gutter inside `<pre>`, **not as `<ol>`** — the gutter is a fixed-width column inside a CSS Grid container so `position: sticky` or scroll-clipping work cleanly.
- Each line is `<span class="code-line"><span class="code-line__num">N</span><span class="code-line__content">…</span></span>`.
- Number color: `--color-ink-muted`. Number font: `--font-mono` at `0.85em` of the code text (slightly smaller, book convention). Number alignment: right, 3-char min width (so 1-digit through 999-line files align without re-flow).
- Numbers are NOT selectable (`user-select: none`) — copy-to-clipboard must yield clean code without line numbers. The copy interaction reads from the `code` input directly, not from the DOM, which makes this a guarantee.
- Toggleable via `showLineNumbers=false` (datasheet inline snippets may not want them). When false, the gutter collapses entirely (no whitespace).

**Copy-to-clipboard interaction (locked):**

- Position: top-right of the `<pre>`, `position: absolute; top: var(--space-2); right: var(--space-2);`. Sits over the code area; on horizontal scroll the `<pre>` scrolls underneath the button.
- Visual: text label `Копіювати` in `--font-ui` 13px / `--color-ink-muted`, with a 14×14 SVG clipboard glyph at `var(--space-1)` margin-right. No background, no border at rest.
- Hover: `color: var(--color-accent)`. Focus-visible: P1 focus ring.
- Click behavior: copies `code` (raw input string) to clipboard via `navigator.clipboard.writeText`. Label text swaps to `Скопійовано` for 2s, then reverts. Glyph swaps to a checkmark for the same 2s.
- Keyboard: button is a real `<button type="button">`; Enter/Space activate. `aria-label="Копіювати код"`; `aria-live="polite"` region announces `Скопійовано`.
- Failure: if clipboard API rejects (HTTP context, browser denial), label swaps to `Не вдалося скопіювати` for 4s, no error thrown, no console noise in production.

**Diff visual treatment (PRIM-05) — locked:**

When `diffMode=true` OR `language='diff'`:

- Each line is parsed for the leading character: `+ ` (added), `- ` (removed), `  ` or anything else (unchanged). The leading two characters are NOT rendered (they govern styling only — readability requirement).
- **Added line:** `background: var(--color-highlight)` (warm pale yellow, full line width within the `<pre>` content area), gutter glyph `+` in `--color-accent` `--font-mono` 600, replacing or sitting beside the line number depending on `showLineNumbers`.
- **Removed line:** `color: var(--color-ink-muted)`, `text-decoration: line-through`, gutter glyph `−` (U+2212, true minus, not hyphen) in `--color-ink-muted`. No background.
- **Unchanged line:** no background, no glyph (number renders as normal).
- **No red, no green.** See Color section above for rationale.
- Line numbers in diff mode reflect the **target file's line numbers** (i.e., post-application). For "before/after" content where both numbering schemes matter, the showcase uses two adjacent `CodeBlock`s rather than a unified diff — keeps the API simple.

**Margin annotation alignment (PRIM-06) — locked:**

- `annotations` input lists `{ line, html }` pairs.
- At ≥1200px: each annotation renders as a `<small>` in the margin column, vertically aligned to the corresponding `code-line`'s `top` using the same measurement mechanism as Sidenote anchoring (`afterNextRender` measurement of the line's `top` relative to the grid container). Annotation styling: `--text-caption`, `--color-ink-muted`, prefixed by the line number in `--color-accent` `--font-ui` 600 (matching sidenote prefix idiom). Max width `var(--margin-rail-width)`.
- At 768–1199px: annotations render below the code block as a definition-list-style sequence: `<dl><dt>Рядок {N}</dt><dd>{html}</dd></dl>` — `dt` in accent, `dd` in ink-muted, separated by `--space-3`.
- At <768px: annotations render inside a single `<details>` placed immediately after the code block. `<summary>`: `Примітки до коду ({count})`. Body: same definition-list as tablet.
- **Same anchoring tolerance:** ≤4px deviation from the line's `top`.
- Collision rule: same as sidenotes — overlap forces stack-down.

### `Diff` (PRIM-08)

Text-level inline content diff (NOT a code-block diff — that's `CodeBlock` with `diffMode`). Used for showing "this paragraph was rewritten" in progressive lesson sections.

```ts
@Component({ selector: 'ui-diff', standalone: true, ... })
export class DiffComponent {
  before = input.required<string>();
  after = input.required<string>();
}
```

**Visual:** two stacked `<p>` blocks within a `<figure>`. The `before` block has `color: var(--color-ink-muted)` and `text-decoration: line-through`. The `after` block has `background: var(--color-highlight)` extending to `--measure-prose` width, padding `var(--space-2) var(--space-3)`. A hairline `--color-rule` separates them. No red/green. No "+/−" glyphs at the prose level — the strike/highlight is sufficient.

This primitive is NOT a word-level diff in v1. Word-level diff is a v2 nice-to-have; v1 swaps the entire passage.

### `Pinout` (PRIM-07)

Renders an Arduino board's pinout as a static labeled image, used on `Datasheet` pages.

```ts
@Component({ selector: 'ui-pinout', standalone: true, ... })
export class PinoutComponent {
  src = input.required<string>();          // image URL (asset path in v1, MinIO URL in P4+)
  alt = input.required<string>();
  pins = input<{ x: number; y: number; label: string; role: string }[]>([]);
  // x/y are percentages of the image dimensions (0-100) for layout-independent positioning
}
```

**Visual (v1, locked):**

- Container: `<figure>` at body-measure width by default; `fullBleed` may be set in P3 page templates.
- Image: `<img src alt>` with explicit `width`/`height` (NgOptimizedImage in P3).
- Pin labels: rendered as a **legend below the image** (NOT as hover hotspots). Two-column legend at ≥768px, single column at <768px. Each pin renders as `<span class="pin-num">{N}</span> <span class="pin-label">{label}</span> <span class="pin-role">{role}</span>` — pin-num in `--color-accent` `--font-ui` 600, label in `--font-mono`, role in `--color-ink-muted` `--font-ui`.
- **No hover hotspots in v1.** Hotspots, click-to-highlight, and pin-reference cross-linking land in P6 (POLISH-05). The static legend serves the same informational purpose at a fraction of the implementation cost.
- Rationale: SVG-driven hotspots require co-ordinate authoring tooling (or per-image hand-coding) that is wildly out of proportion to v1 needs. Legend-below is the book's actual convention for component reference pages and reads cleanly on mobile.

### `BlockRenderer` is **not** in P2

`BlockRenderer` (PAGE-10) is a P3 concern — it dispatches the `Block` discriminated union to the right primitive. P2 only locks the union shape and the primitives. The showcase page hand-composes primitives in template markup; no dispatcher needed.

---

## TypeScript Page-Model Contract (CONTRACT-01)

**Location:** `src/content/models/*.ts`. **Status after P2 exit: locked.** Wagtail must conform to this in P4, not the inverse (CLAUDE.md hard constraint).

### Shared types

```ts
// src/content/models/block.ts
export type Block =
  | { type: 'heading'; level: 2 | 3; text: string; id?: string }
  | { type: 'paragraph'; html: string }                      // pre-processor applied at API boundary
  | { type: 'lede'; html: string }
  | { type: 'aside'; variant: 'note' | 'warning' | 'fact'; html: string }
  | { type: 'sidenote'; number: number; html: string; anchorParagraphIndex: number }
  | { type: 'figure'; number?: number; src: string; alt: string; captionHtml?: string; fullBleed: boolean }
  | { type: 'code'; language: 'cpp' | 'arduino' | 'plaintext' | 'diff';
      code: string; filename?: string; showLineNumbers: boolean;
      highlightLines: number[]; diffMode: boolean;
      annotations: { line: number; html: string }[] }       // CONTRACT-02 shape
  | { type: 'diff'; before: string; after: string }
  | { type: 'pinout'; src: string; alt: string;
      pins: { x: number; y: number; label: string; role: string }[] }
  | { type: 'parts-list'; items: { name: string; quantity: number; note?: string }[] };

export type BlockType = Block['type'];
```

**Locked block-type list:** `heading | paragraph | lede | aside | sidenote | figure | code | diff | pinout | parts-list`. **Ten types in v1.** Future block types (e.g., `glossary-term`, `cross-reference`) require a UI-SPEC amendment and a Wagtail StreamField match — not a unilateral additive change.

### Page models

```ts
// src/content/models/lesson.ts
export interface Lesson {
  type: 'lesson';
  slug: string;
  title: string;
  deck: string;                    // short subhead under title, plain text
  estimatedMinutes: number;        // for "≈ 12 хв" rendering via Intl
  difficulty: 'beginner' | 'intermediate';
  partsList: Extract<Block, { type: 'parts-list' }>;   // always exactly one, in margin
  body: Block[];
  prevSlug?: string;
  nextSlug?: string;
  publishedAt: string;             // ISO 8601, rendered via P1 intl wrapper
  updatedAt: string;
}

// src/content/models/article.ts
export interface Article {
  type: 'article';
  slug: string;
  title: string;
  deck: string;
  body: Block[];                   // no parts-list, no prev/next
  publishedAt: string;
  updatedAt: string;
}

// src/content/models/datasheet.ts
export interface Datasheet {
  type: 'datasheet';
  slug: string;
  title: string;                   // e.g., "ATmega328P"
  manufacturer: string;
  pinout: Extract<Block, { type: 'pinout' }>;          // exactly one
  specifications: { label: string; value: string }[]; // structured key-value
  peripheralNotes: Block[];                            // prose blocks
  publishedAt: string;
  updatedAt: string;
}

// src/content/models/schematic.ts
export interface Schematic {
  type: 'schematic';
  slug: string;
  title: string;
  schematicImage: Extract<Block, { type: 'figure' }>;  // exactly one, fullBleed=true
  explanation: Block[];
  downloadUrl: string;             // direct image link, P4+ MinIO URL
  publishedAt: string;
  updatedAt: string;
}

// src/content/models/index.ts
export type AnyPage = Lesson | Article | Datasheet | Schematic;
```

### `ContentApi` interface (CONTRACT-03)

```ts
// src/content/api/content-api.ts
export abstract class ContentApi {
  abstract getLesson(slug: string): Promise<Lesson>;
  abstract listLessons(): Promise<Pick<Lesson, 'slug' | 'title' | 'deck' | 'difficulty' | 'estimatedMinutes' | 'publishedAt'>[]>;
  abstract getArticle(slug: string): Promise<Article>;
  abstract listArticles(): Promise<Pick<Article, 'slug' | 'title' | 'deck' | 'publishedAt'>[]>;
  abstract getDatasheet(slug: string): Promise<Datasheet>;
  abstract listDatasheets(): Promise<Pick<Datasheet, 'slug' | 'title' | 'manufacturer'>[]>;
  abstract getSchematic(slug: string): Promise<Schematic>;
  abstract listSchematics(): Promise<Pick<Schematic, 'slug' | 'title'>[]>;
}
```

`MockContentApi` extends `ContentApi`, reads `/assets/mock-data/*.json`, and applies the Ukrainian text pre-processor at the API boundary (so primitives downstream receive already-processed HTML and `paragraph.html` strings).

### Mock data fixtures (CONTRACT-04)

`/src/assets/mock-data/`:

- `lessons/{slug}.json` — at least 3, real Ukrainian Arduino prose. Slugs (locked for traceability across P3 testing): `pershyi-blymayuchyi-svitlodiod`, `knopka-ta-pidtyahuvalnyi-rezystor`, `analogovyi-vhid-ta-potentsiometr`.
- `articles/{slug}.json` — at least 1. Slug: `chomu-arduino`.
- `datasheets/{slug}.json` — at least 2. Slugs: `atmega328p`, `arduino-uno-r3`.
- `schematics/{slug}.json` — at least 1. Slug: `blymayuchyi-svitlodiod-shema`.

Each JSON file is the serialized form of the matching TypeScript page model. Field names are byte-identical to the model — Wagtail's REST serializer in P4 must produce the same shape.

---

## Ukrainian Text Pre-processor (UKR-02, UKR-03)

**Location:** `src/lib/uk-text.ts` (alongside `intl.ts` from P1).

### Function signature

```ts
export function processUkrainianText(input: string): string;
```

Pure function, no side effects, deterministic, idempotent.

### Transformations (locked, in this order)

1. **Em-dash:** ASCII `--` between word characters → ` — ` (em-dash with NBSP before, regular space after). Use `—` (`—`).
2. **En-dash for numeric ranges:** `\d+-\d+` → `\d+–\d+` (`–` between digits). Hyphenated words (`будь-який`) are NOT touched (regex requires digits on both sides).
3. **Outer quotes:** `"…"` containing word characters → `«…»` (`«`, `»`). Greedy left-to-right pairing.
4. **Inner quotes:** within an already-converted `«…»`, any remaining `"…"` → `„…"` (`„`, `“`). Single pass; nested-deeper quotes are left as-is and flagged in dev mode.
5. **NBSP after one-letter prepositions:** the regular space following any of `в у і й з а о та не на до за по` (case-insensitive, when preceded by start-of-string or whitespace and followed by a Cyrillic letter) → ` ` (NBSP). Locked preposition list (matches UKR-02 + the P1 specimen authoring rule, alphabetized): `а в до за з і й на не о по та у`.
6. **Apostrophe:** ASCII `'` between two word characters where at least one is Cyrillic → `ʼ` (`ʼ`, MODIFIER LETTER APOSTROPHE). Latin contractions (`don't`) are NOT touched (requires at least one Cyrillic neighbor).

### Idempotency contract

`processUkrainianText(processUkrainianText(s)) === processUkrainianText(s)` for every `s`. Verified by:

- Each transformation regex matches only its **input** form, never its **output** form. Em-dash regex matches `--`, never `—`. NBSP regex matches `\x20` not `\xA0`. Quote regex matches `"`, not `«` or `„`.
- A property test in `uk-text.spec.ts` runs 1,000 random Ukrainian-prose samples (drawn from the mock fixtures plus permutations) twice through the function and asserts byte equality.

### When it runs

- **At the `MockContentApi` boundary** for every `paragraph.html`, `lede.html`, `aside.html`, `sidenote.html`, `caption.html`, and `peripheralNotes[].html` field. Run ONCE per fetch; the result is cached because mock data is static.
- **Not at render time** — primitives consume already-processed HTML. This guarantees a single deterministic processing point and prevents double-processing on Angular re-renders.
- **Not on `code.code`** — code blocks ship verbatim. Comments and strings inside code are author's responsibility.
- **Not on `Heading.text`** — headings are plain strings, no inline punctuation transformation needed at v1 (em-dashes in headings can be hand-authored).

In P4, `WagtailContentApi` runs the same function on the same fields after Wagtail's `expand_db_html`. UKR-03 is then satisfied by sharing this single utility.

### Force-en audit (UKR-06)

The pre-processor is purely string-mechanical and does NOT touch any locale-sensitive code. The phase-exit force-en audit walks `/dev/primitives` under `en-US` browser locale and verifies:

- Quotes still render as `«…»` (the function doesn't depend on browser locale).
- Em-dashes and en-dashes still render correctly.
- The estimated-read-time string (`≈ 12 хв`) still uses `Intl.NumberFormat('uk-UA')` via the P1 `intl.ts` wrapper.
- Date strings on the showcase page still render as `30 квітня 2026 р.`, never `April 30, 2026`.

Audit results recorded as a P2 row in `docs/force-en-audit.md` (the same accumulating doc started in P1).

---

## The Showcase Page — `/dev/primitives`

A second `noindex` developer page. Triple-duty same as `/dev/glyph-audit`:

1. Visual proof every primitive renders editorial-quality on real Ukrainian content.
2. Three-breakpoint manual verification surface for LAYOUT-01..03.
3. Living usage example for the planner's plans and the executor's reference.

### Page structure (top to bottom)

1. **Header:** `<h1>` `Showcase примітивів` (Ukrainian-Latin mix is fine in dev page titles), `<p class="lede">` `Кожен примітив core-ui на реальних даних. Відкрий у трьох ширинах: <768, 768–1199, ≥1200.`
2. **Section: Body & Heading.** Three paragraphs of real Ukrainian prose calibrated for hierarchy: h2 → body → h3 → body. No primitive new types — this section verifies P1 hierarchy still holds when wrapped in P2 components.
3. **Section: Lede & Aside.** Lede paragraph followed by one of each `Aside` variant (`note`, `warning`, `fact`).
4. **Section: TwoColumn + Sidenote (the LAYOUT verification).** A long `<article>` of ~6 paragraphs with **three** `Sidenote`s anchored to paragraphs 1, 3, and 6 — first sidenote near the top, last near the bottom of a tall section, middle sidenote in between. Each sidenote contains 2-3 sentences of real prose.
5. **Section: Figure.** One `Figure` at `fullBleed=false` with a real schematic placeholder, numbered `Рис. 1`. One `Figure` at `fullBleed=true` for a hero schematic, numbered `Рис. 2`.
6. **Section: CodeBlock — basic.** A 12-line Arduino C++ snippet with line numbers, copy button, one highlighted line (`highlightLines: [7]`), no annotations, no diff. Includes the Ukrainian comment `// блимаємо світлодіодом` to prove mono Cyrillic still renders.
7. **Section: CodeBlock — diff mode.** A 16-line snippet in `diffMode=true` with at least 2 added lines and 2 removed lines. Verifies the editorial yellow-highlight + strike-through treatment.
8. **Section: CodeBlock — annotated.** A 20-line snippet with 4 margin annotations (`{ line: 3, html: '…'}`, `{ line: 8, … }`, `{ line: 13, … }`, `{ line: 18, … }`). Verifies annotation alignment within 4px on desktop, definition-list collapse on tablet, `<details>` collapse on mobile.
9. **Section: Diff (text-level).** One `Diff` showing a rewritten paragraph.
10. **Section: Pinout.** One `Pinout` for the Arduino Uno R3 with 14 pins listed in the legend.
11. **Section: Force-en audit footer** (same pattern as P1). Reminds the auditor to load this page under `en-US` browser locale and verifies all listed primitives still render Ukrainian.

### Page chrome

- `<html lang="uk">` (inherited).
- `<title>Примітиви — Arduino UA</title>`
- `<meta name="robots" content="noindex">`
- Wrapped in `PageShell` so the `header`/`footer` placeholders also get exercised.
- The page route is `/dev/primitives`. Excluded from `getPrerenderParams` for production sitemap; renders only in dev/preview builds.

---

## Copywriting Contract

All copy in Ukrainian. Inherits P1 punctuation rules (now enforced by the P2 pre-processor). Net-new copy strings:

| Element | Copy |
|---------|------|
| Showcase page `<title>` | `Примітиви — Arduino UA` |
| Showcase page h1 | `Showcase примітивів` |
| Showcase page lede | `Кожен примітив core-ui на реальних даних. Відкрий у трьох ширинах: <768, 768–1199, ≥1200.` |
| Sidenote anchor superscript pattern | `<sup>{N}</sup>` (number only — no decoration) |
| Sidenote inline number prefix | `{N}.` (period after the number, accent color) |
| Sidenote mobile `<summary>` | `Примітка {N}` |
| Code-block copy button — rest | `Копіювати` |
| Code-block copy button — success (2s) | `Скопійовано` |
| Code-block copy button — failure (4s) | `Не вдалося скопіювати` |
| Code-block copy button — `aria-label` | `Копіювати код` |
| Code-block annotation — tablet `<dt>` | `Рядок {N}` |
| Code-block annotation — mobile `<summary>` | `Примітки до коду ({count})` |
| Figure caption — number prefix | `Рис. {N}` (period after Рис, no period after digit) |
| Aside variants — visual labels | none in v1 (see Aside primitive — variant is semantic-only, no visible label) |
| Pinout legend column header | not rendered in v1 — legend reads as `{N} {label} {role}` directly |
| Mock-data lesson titles (3 minimum) | `Перший блимаючий світлодіод` / `Кнопка та підтягувальний резистор` / `Аналоговий вхід та потенціометр` |
| Mock-data article title (1 minimum) | `Чому Arduino?` |
| Mock-data datasheet titles (2 minimum) | `ATmega328P` / `Arduino Uno R3` |
| Mock-data schematic title (1 minimum) | `Схема: блимаючий світлодіод` |
| Read-time format (Lesson) | `≈ {N} хв` (e.g., `≈ 12 хв`) — N from `Intl.NumberFormat('uk-UA')` |
| Difficulty markers (Lesson list, P3-facing but locked here) | `початківець` / `проміжний` |
| Primary CTA | not applicable in P2 — no calls-to-action; `/dev/primitives` is a developer page. Lesson page CTAs (`Наступний урок →`) land in P3. |
| Empty state | not applicable in P2 — `MockContentApi` always returns fixtures. The empty-list state for `/lessons` lands in P3. |
| Error state | applies to one path: `CodeBlock` copy button failure — copy `Не вдалося скопіювати`, no modal, no toast, no console error. |
| Destructive confirmation | not applicable — P2 has no destructive actions. |

### Mock-data prose calibration rule

Every fixture must pass these gates before commit (recorded in plan-level summaries):

1. Contains at least one instance of `ґ` in body prose (not just headings).
2. Contains at least one `«…»` quote pair.
3. Contains at least one em-dash `—` and one en-dash range `5–7`.
4. Contains at least one inline `<code>` reference (e.g., `pin 13`).
5. Lesson fixtures contain at least one `<sidenote>` and one `<figure>` and one `<code>` block.
6. Reads as native Ukrainian — not machine-translated, not Lorem-ipsum-shaped Ukrainian. Author's reading-aloud test is the verification.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — no shadcn in this project (Angular + bespoke SCSS, see Design System table) |
| third-party | none | not applicable |

No registry safety gate required for P2.

---

## Open Decisions Carried Forward (still locked, but flagged for re-validation in execution)

These are decisions where I locked a default rather than ask interactively (subagent constraint). The planner and executor must re-validate against real content during execution. If real content forces a change, amend this UI-SPEC and bump `status` back to `draft`.

1. **Sidenote anchor mechanism = JS measurement, not CSS `anchor-name`.** Re-evaluate at start of P3 if browser support has improved meaningfully — `STATE.md` already flags this open question. If we switch, `TwoColumn`'s API stays the same.
2. **Diff color palette = yellow + ink-muted, no red/green.** If first reader feedback finds the diff hard to scan, revisit in P6 polish.
3. **Pinout = static legend, no hover hotspots in v1.** Hotspots land in P6 (POLISH-05). v1 ships the static legend only.
4. **Aside variants visually identical in v1.** Differentiation lands when P3 page templates need it. The `variant` input is shipped now to avoid an API break.
5. **Margin-extending figures deferred.** v1 ships only body-measure and full-bleed.
6. **Pre-processor runs at API boundary, not at render time.** This forces the contract assumption that primitives consume already-processed HTML — which P4 Wagtail must also honor.
7. **`BlockRenderer` is P3.** P2 ships only the union shape and the primitives.

---

## Out of Scope for This UI-SPEC (will be specified in later phases)

- **Public page templates** (lesson, article, datasheet, schematic, library index, home, about, 404). **P3.**
- **`BlockRenderer`** — dispatches `Block` union to primitives. **P3.**
- **Routing beyond `/dev/primitives`.** **P3.**
- **Header/footer global navigation.** **P3.**
- **Shiki syntax highlighting** — `CodeBlock` ships its frame and structure in P2; Shiki tokens land in P3.
- **NgOptimizedImage** swap for `<img>` — **P3.**
- **Drop caps, hanging punctuation, glossary tooltips, pin-reference cross-links, figure cross-references, pinout hover hotspots.** **P6.**
- **Print stylesheet, RSS, JSON-LD, OG tags.** **P6.**
- **Dark mode.** Out of scope for v1 entirely.
- **Word-level inline diff for `Diff` primitive.** v2 nice-to-have.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: pending — all strings Ukrainian, real prose, punctuation rules locked, copy-button states defined.
- [ ] Dimension 2 Visuals: pending — primitive frames defined, sidenote anchoring mechanism declared, no decorative gimmicks.
- [ ] Dimension 3 Color: pending — no new colors; accent reserve list extended with three explicit additions; diff palette locked at yellow + ink-muted.
- [ ] Dimension 4 Typography: pending — no new sizes or weights; full inheritance from P1.
- [ ] Dimension 5 Spacing: pending — inherited unchanged; two new layout dimensions (margin-rail width, sidenote gap) declared as layout tokens not spacing tokens.
- [ ] Dimension 6 Registry Safety: pending — no third-party registry, not applicable.

**Approval:** pending — awaiting `gsd-ui-checker` review.
