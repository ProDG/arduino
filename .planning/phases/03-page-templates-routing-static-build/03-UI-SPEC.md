---
phase: 3
slug: page-templates-routing-static-build
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-01
reviewed_at: 2026-05-01
---

# Phase 3 — UI Design Contract

> Visual and interaction contract for the public page templates, the global header/footer chrome, the `BlockRenderer` dispatcher, the routing surface, the SSG prerender, the CSR-only `/preview/*` stub, and the Lighthouse-gated performance pass. Inherits **every** token, base CSS rule, layout primitive, editorial primitive, and copywriting punctuation rule from the Phase 1 + Phase 2 UI-SPECs (`01-UI-SPEC.md`, `02-UI-SPEC.md`) — this document only declares **net-new** decisions for P3.

This phase ships:

- Global chrome — `SiteHeader`, `SiteFooter`, `SiteNav` (LAYOUT-05 was satisfied in P2 only as primitive shells inside `PageShell`; P3 fills them with real navigation, real footer copy, and the editorial wordmark).
- `BlockRenderer` (PAGE-10) — the dispatcher that maps every `Block` discriminated-union variant to its `core-ui` primitive.
- Page templates — `LessonPage`, `ArticlePage`, `DatasheetPage`, `SchematicPage`, `LessonLibraryPage`, `HomePage`, `AboutPage`, `NotFoundPage` (PAGE-01..08).
- Routing — `/`, `/lessons`, `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug`, `/about`, `/preview/:contentType/:token`, wildcard 404 (PAGE-09, PAGE-11).
- SSG prerender plumbing — `getPrerenderParams()` for every dynamic route, `outputMode: "static"` static folder output (PERF-01, PERF-02, PERF-06).
- CSR-only `/preview/*` stub (PERF-03) — no Wagtail integration in P3; the route exists, renders a "preview unavailable in mock mode" editorial panel, and proves the CSR opt-out works without introducing a Node SSR runtime.
- Shiki integration inside the existing P2 `CodeBlock` frame — build-time syntax highlighting for `cpp` / `arduino` / `plaintext` / `diff` against the locked editorial palette (PRIM-04 finalization).
- `NgOptimizedImage` swap on every `<img>` inside `Figure` and `Pinout` (PERF-05).
- Lighthouse gates on a representative lesson (PERF-04).
- The 30–60 minute Wagtail 7.3 StreamField spike at phase exit (CONTRACT-02) — design-freeze checkpoint, executed immediately (7.3 is GA today).

Phase 3 does **not** ship: real Wagtail backend, real preview wiring with token auth, drop caps, glossary tooltips, pin/peripheral cross-refs, figure cross-refs (`див. рис. N`), pinout hover hotspots, hanging punctuation, RSS, JSON-LD, OG tags, print stylesheet, dark mode (those are P4, P5, P6).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — bespoke Angular `core-ui` library (P2) on top of the P1 SCSS token system. No shadcn (Angular project, hand-authored editorial CSS per CLAUDE.md). |
| Preset | not applicable |
| Component library | `@arduino/core-ui` — public API surface only, consumed by P3 page templates and `BlockRenderer`. P3 introduces NO new exports from `core-ui` (chrome and template components live in `src/app/`, not in the library). |
| Icon library | none. P3 introduces exactly **two** new inlined SVGs in chrome: a 16×16 chevron-right glyph for prev/next-lesson links, and a 16×16 RSS glyph (in the footer — even though `/feed.xml` is P6, the icon exists in chrome from P3 to lock the visual position; clicking it scrolls to a `<small>` footnote that reads "RSS — у наступних фазах"). No `@angular/material`, no `lucide`, no icon font. |
| Font | Inherited from P1. `--font-body`, `--font-ui`, `--font-mono`. No new families. |

### Module organization (no new lib in P3)

- **Page templates and chrome live in `src/app/`**, not in `@arduino/core-ui`. Rationale: `core-ui` is a presentation primitive library. Page templates are domain assemblies — they import primitives plus call `inject(CONTENT_API)`, which would couple the lib to a domain port. Boundary preserved.
- **`BlockRenderer` lives in `src/app/blocks/block-renderer/`** (the only consumer of `Block` + every primitive). It is a standalone component, signal input `block: Block`, switches on `block.type`, projects to the correct primitive.
- **Page templates as standalone components**, lazy-loaded per route. Each template is `src/app/pages/<name>/<name>.page.ts` (file naming: `.page.ts` to differentiate from primitives).
- **Chrome lives in `src/app/chrome/`**: `site-header.component.ts`, `site-footer.component.ts`, `site-nav.component.ts`. Slotted into the P2 `PageShell` placeholders.

---

## Spacing Scale

Inherited unchanged from P1. All P3 values use `--space-0` … `--space-10`.

**P3-specific exceptions:** none. Two new chrome-relative measurements (header height, lesson library row gap) are layout dimensions and live in `_layout.scss`, not in the spacing scale.

---

## Typography

Inherited unchanged from P1 + P2. **No new font sizes, no new weights, no new line-heights are introduced in P3.** Every page template composes against the existing scale.

P3-specific usage map (which template/chrome element consumes which existing size):

| Element | Default `var(--text-…)` |
|---|---|
| `SiteHeader` wordmark | `--text-h3` (24px), weight 600, `--font-body` italic — gives the wordmark editorial voice without inventing a logotype |
| `SiteHeader` nav links | `--text-body` (19px), weight 400, `--font-ui` |
| `SiteFooter` body | `--text-caption` (15px), `--font-ui`, `--color-ink-muted` |
| Lesson page title | `--text-h1` (48px) |
| Lesson page deck | `--text-lede` (22px) italic |
| Lesson library row title | `--text-h3` (24px) — typographic TOC, not a card grid |
| Lesson library row meta | `--text-caption` (15px), `--color-ink-muted` |
| Home page hero h1 | `--text-h1` |
| Home page hero lede | `--text-lede` italic |
| Home page recent-list | same as lesson library row |
| About page | h1 + lede + body (P1 hierarchy unchanged) |
| 404 page heading | `--text-h1` |
| 404 page body | `--text-lede` italic, then `--text-body` |
| Prev/next nav row | `--text-caption` for the label "Попередній урок" / "Наступний урок", `--text-body` for the lesson title |
| Datasheet specifications table | `--text-caption` for label column, `--text-body` `--font-mono` for value column |
| Schematic download link | `--text-caption`, accent color (link rule from P1) |
| Preview stub editorial panel | `--text-lede` for the heading, `--text-body` for the explanation |

If any future template needs a new size, it must amend `_typography.scss` first.

---

## Color

Inherited unchanged from P1 + P2. **No new colors introduced in P3.** P3 introduces additional uses of the existing accent and `--color-rule`, all listed below.

### Accent reserve list — P3 additions (cumulative)

The P1 list (4 entries) and P2 list (3 entries — sidenote anchor sup, code copy button, diff `+` glyph) are locked. P3 adds:

8. **Wordmark** in `SiteHeader` — `Arduino UA` rendered in `--color-accent`, italic, `--font-body` 600. The single editorial flourish at the top of every page; matches the book-spine convention of an accent-colored title.
9. **Active nav link underline** — when the current route matches a primary nav item (`/lessons`, `/about`), its underline thickens to `0.12em` (matching the P1 `a:hover` rule) and color stays `--color-accent`. No background, no pill, no chip.
10. **Prev/next-lesson chevron** — the inline 16×16 chevron-right SVG in `--color-accent`. Used in `Наступний урок →` (right chevron) and `← Попередній урок` (left chevron, mirrored via CSS `transform: scaleX(-1)`).
11. **Lesson library row number** — each row in `/lessons` is prefixed by its 1-based index `01.`, `02.`, … in `--color-accent` `--font-ui` 600. Editorial table-of-contents convention (matches the figure-number and sidenote-number idiom from P2).
12. **Active TOC anchor** — in the lesson page in-page table of contents (h2/h3 outline in the margin rail), the link whose target is currently in viewport gets `color: var(--color-accent)` (rest state is `--color-ink-muted`). No background, no border.
13. **Schematic download link icon** — a 12×12 inline arrow-down SVG in `--color-accent`, sitting `--space-1` to the right of the "Завантажити схему" label.
14. **Datasheet pin-role accent in the spec table** — the `role` column (e.g., `PWM`, `INPUT`, `GND`) renders in `--color-accent` `--font-ui` 600, matching the legend treatment in the P2 `Pinout` primitive.
15. **404 page hairline rule under "404"** — a single `--color-accent` 2px rule across the prose measure under the numeral. The only time accent is used as a rule (P1 hairline rules use `--color-rule`); deliberately editorial — the 404 page is one of the few moments accent gets to be a graphic element.

**Still never:** body text, headings (other than the wordmark which is the wordmark, not a heading), primary CTAs (none in P3 — see Copywriting), background fills on tappable elements, hover-state surfaces, decorative dividers between unrelated sections.

### `--color-rule` use (P3 additions)

- Lesson library row separator — 1px hairline between TOC rows. Editorial restraint: no card surfaces, just rules.
- `SiteHeader` bottom rule — single 1px `--color-rule` line below the header on every page (anchors the header without a fill or shadow).
- `SiteFooter` top rule — same, above the footer.
- Datasheet specification-table row rule — 1px between each spec row. No alternating-row backgrounds, no vertical column rules.

### No destructive color in P3

There are no destructive actions in this phase. Slot reserved for P4+ (Wagtail admin actions) if needed; v1 must stay within the six-color palette per P1 D-05.

---

## Layout — Chrome, Page-Level Containers, Margin-Rail Composition

### New layout tokens (`_layout.scss`, P3 additions)

| CSS var | Value | Usage |
|---|---|---|
| `--header-height` | `auto` (intrinsic, not fixed) | Header is **not** sticky in v1 — book aesthetic prefers chrome that scrolls away. Using intrinsic height keeps the layout calm. |
| `--header-pad-block` | `var(--space-6)` (32px) | Vertical padding inside header |
| `--footer-pad-block` | `var(--space-7)` (48px) | Vertical padding inside footer |
| `--toc-rail-width` | `var(--margin-rail-width)` (18rem, inherited) | Lesson page in-page TOC reuses the existing margin-rail dimension. **No new width token** — the same physical column position serves sidenotes, parts list, and the in-page TOC depending on the page template. |
| `--lesson-row-gap` | `var(--space-7)` (48px) | Vertical gap between rows in `/lessons` typographic TOC |
| `--page-section-gap` | `var(--space-9)` (112px) | Vertical breathing room between top-level sections of a lesson template (title-deck → body, body → prev/next nav). Editorial book convention. |

### `SiteHeader` (LAYOUT-05 fulfillment)

Slotted into `PageShell`'s `<header>` placeholder. Single horizontal row at all breakpoints.

**Visual:**
- Container: full-width, content centered to `var(--container-max)`. Padding: `--header-pad-block` vertical, `--container-pad-*` horizontal per breakpoint.
- Background: `--color-paper` (no fill — the paper is the surface).
- Bottom border: 1px `--color-rule`.
- No box-shadow, no backdrop-filter, no sticky behavior.
- Layout: CSS Flex, `justify-content: space-between; align-items: baseline;` — wordmark on the left, nav on the right. Baseline alignment, not center, so the italic wordmark sits on the same baseline as the nav links.

**Wordmark (left):**
- Text: `Arduino UA` in `--font-body` italic, weight 600, `--text-h3` (24px), `--color-accent`.
- Wrapped in `<a href="/" rel="home">`. No underline at rest (the wordmark is its own visual signal); underline appears on `:hover` and `:focus-visible`.

**Nav (right):**
- Three primary items: `Уроки` (`/lessons`), `Про проєкт` (`/about`), `Сайт` (the current state — links to `/`). Item order locked.
- Each is `<a>` with the P1 link rule (accent text, accent underline). At `<768px` the nav collapses to a single trailing item — `Уроки` only — and `Про проєкт` migrates to the footer. Rationale: a hamburger menu is editorially out of place; the most useful primary nav link is "Lessons" and the rest can live in the footer at mobile width.
- No active-state background. Active state = thicker underline (see Color §accent additions item 9).

### `SiteFooter` (LAYOUT-05 fulfillment)

Slotted into `PageShell`'s `<footer>` placeholder.

**Visual:**
- Container: same width math as header. Top border: 1px `--color-rule`. Padding: `--footer-pad-block` vertical, `--container-pad-*` horizontal.
- Two columns at `≥768px`: editorial colophon block on the left (~⅔ width), meta-links block on the right (~⅓ width).
- Single column at `<768px`, colophon on top, meta-links below.

**Colophon (left):**
- A short Ukrainian editorial paragraph at `--text-caption`, `--color-ink-muted`, max-width `40ch`. Authored as real prose, not bullet-list "About / Privacy / Terms" — the footer is part of the editorial voice.
- See Copywriting Contract for the exact string.

**Meta-links (right):**
- Vertical stack of three lines, all `--text-caption`:
  1. `Про проєкт` link (mobile-only at `<768px`; hidden on `≥768` because it's already in the header).
  2. `RSS` link with the inline 16×16 RSS SVG glyph in `--color-accent`. Until P6, this link's `href` is `/feed.xml` and the page returns 404 (or a placeholder); the link carries an `aria-disabled` hint and tooltip text "У наступних фазах".
  3. License + author line: `© 2026 · CC BY-SA 4.0` in `--color-ink-muted`. Text only, no icon.

### `PageShell` composition for each template (P2 + P3 wiring)

Every public page is wrapped in `PageShell` (P2). P3 fills:
- `<header>` slot ← `SiteHeader`
- `<main>` slot ← page-template content
- `<footer>` slot ← `SiteFooter`

`<main>` content for each template is described in §Page Templates below.

---

## Routing & SSG Contract

### Route table (PAGE-09, locked)

| Path | Template | Render mode | Prerender source |
|---|---|---|---|
| `/` | `HomePage` | Prerender | static |
| `/lessons` | `LessonLibraryPage` | Prerender | `ContentApi.listLessons()` (build-time) |
| `/lessons/:slug` | `LessonPage` | Prerender | `getPrerenderParams()` from `listLessons()` |
| `/articles/:slug` | `ArticlePage` | Prerender | `getPrerenderParams()` from `listArticles()` |
| `/datasheets/:slug` | `DatasheetPage` | Prerender | `getPrerenderParams()` from `listDatasheets()` |
| `/schematics/:slug` | `SchematicPage` | Prerender | `getPrerenderParams()` from `listSchematics()` |
| `/about` | `AboutPage` | Prerender | static (Markdown-authored prose loaded as inline TS template) |
| `/preview/:contentType/:token` | `PreviewStubPage` | **Client (CSR)** | not prerendered |
| `/dev/glyph-audit` | (P1) | Prerender | inherited |
| `/dev/primitives` | (P2) | Client (CSR) | inherited |
| `**` (wildcard) | `NotFoundPage` | Prerender | renders once as `dist/browser/404.html` |

### `getPrerenderParams()` rule (PERF-02)

Each dynamic-route page exports a `getPrerenderParams` function. The function uses the SAME `MockContentApi` that the runtime route uses (`inject(CONTENT_API)` is not available at build-time — instead, the template's static `getPrerenderParams` calls into a build-time helper that reads the same JSON fixtures via `fs`). At build time, every slug present in `src/assets/mock-data/{lessons,articles,datasheets,schematics}/*.json` is enumerated and emitted. **Mock data IS the prerender source in P3** — the swap to Wagtail at P4 will replace the helper, not the prerender API.

**Build output (PERF-06, locked):**
- `dist/browser/` contains: `index.html`, `lessons/index.html`, `lessons/<slug>/index.html` per fixture, `articles/<slug>/index.html` per fixture, `datasheets/<slug>/index.html` per fixture, `schematics/<slug>/index.html` per fixture, `about/index.html`, `404.html`, all hashed JS/CSS bundles, all woff2 files.
- **No `arduino-ssr.service`, no Node runtime, no `dist/server/` bundle.** Verified by checking that `dist/server/` either does not exist or contains only the Angular SSR build artifacts that `outputMode: "static"` strips at the end of the build.
- The CSR-only routes (`/preview/*`, `/dev/primitives`) are present as `RenderMode.Client` entries in `app.routes.server.ts` — they ship as a thin CSR shell `index.html` that hydrates client-side. **`RenderMode.Client` does NOT introduce a Node runtime** (already locked in P2 wiring); P3 reuses the pattern.

### `/preview/*` CSR stub (PERF-03)

P3 ships the route shell only — no Wagtail integration (that's P4). On navigation:
- Route loads as CSR (`RenderMode.Client` in server routes).
- Component reads `:contentType` and `:token` from route params. **Does not call `ContentApi`** (mock has no preview tokens).
- Renders an editorial panel with title `Попередній перегляд` and body explaining that preview will activate once Wagtail is wired (Ukrainian copy locked in §Copywriting). Includes a back-link to `/`.
- Wrapped in `PageShell` so chrome renders. `<title>Попередній перегляд — Arduino UA</title>`. `<meta name="robots" content="noindex">`.
- This route exercises the CSR opt-out so P4 can swap in a real preview component without changing the routing surface.

---

## `BlockRenderer` (PAGE-10) — Visual & API Contract

The dispatcher that maps every `Block` discriminated-union variant (P2) to its rendering primitive.

```ts
@Component({ selector: 'app-block-renderer', standalone: true, ... })
export class BlockRendererComponent {
  block = input.required<Block>();
}
```

Internal template uses Angular `@switch (block().type)` (control flow, zoneless idiom). Mapping (locked, no API extension):

| `block.type` | Primitive | Notes |
|---|---|---|
| `heading` | `<ui-heading [level]="…" [id]="…">{{ block.text }}</ui-heading>` | `level` from `block.level`; `id` propagated for in-page TOC anchors |
| `paragraph` | `<ui-body [innerHTML]="block.html"></ui-body>` | `block.html` is already typeset (D-PRE-01..05) — set via `[innerHTML]`. Sanitized by Angular's default DomSanitizer; the mock fixtures contain only safe inline tags (`<em>`, `<strong>`, `<code>`, `<a>`). |
| `lede` | `<ui-lede [innerHTML]="block.html"></ui-lede>` | same |
| `aside` | `<ui-aside [variant]="block.variant" [innerHTML]="block.html"></ui-aside>` | inline content only |
| `sidenote` | **does NOT render in `BlockRenderer`'s body slot.** Sidenotes are extracted and forwarded to `TwoColumn`'s margin slot by the parent template. The dispatcher emits **nothing** for `sidenote` blocks when invoked in the body context, and the parent template iterates separately. |
| `figure` | `<ui-figure [number]="block.number" [fullBleed]="block.fullBleed">…</ui-figure>` with `<img>` swapped to `NgOptimizedImage` |
| `code` | `<ui-code-block [language]="block.language" [code]="block.code" [annotations]="block.annotations" [showLineNumbers]="block.showLineNumbers" [highlightLines]="block.highlightLines" [diffMode]="block.diffMode" [filename]="block.filename"></ui-code-block>` |
| `diff` | `<ui-diff [before]="block.before" [after]="block.after"></ui-diff>` |
| `pinout` | `<ui-pinout [src]="block.src" [alt]="block.alt" [pins]="block.pins"></ui-pinout>` (used in datasheet template, not via `BlockRenderer` typically — but the dispatcher supports it) |
| `parts-list` | **does NOT render in `BlockRenderer`'s body slot.** Like `sidenote`, extracted by the lesson template into the margin rail. |

**Sidenote + parts-list handling rule:** the lesson template iterates `body` twice — once for inline blocks (everything except `sidenote` and `parts-list`), once for sidenotes (forwarded to `TwoColumn`'s margin slot, ordered by `anchorParagraphIndex`). The parts-list (lesson only) lives outside `body` already (`Lesson.partsList: Block`) and is rendered by the lesson template directly into the margin rail above any sidenotes.

This dispatch rule is locked. Adding a new block type in v1 requires (a) a new variant in `content/models/block.ts`, (b) a new `@case` arm here, (c) a Wagtail StreamField match in P4. Per CONTRACT-02 the spike at phase exit must confirm at minimum the `code` block shape; the same exercise validates the dispatch contract end-to-end against a future Wagtail emission.

---

## Page Templates — Visual & Layout Contract

Each template's component file is `src/app/pages/<name>/<name>.page.ts`. All templates use signal inputs / `inject(CONTENT_API)` / Angular's resolved-data pattern (Plan-defined detail).

### `LessonPage` (PAGE-01) — the hero template

The most editorially loaded template. Demonstrates two-column body+margin, in-page TOC, parts list, prev/next navigation.

**Structure (top to bottom):**

1. **Title block** (full prose-measure, single column, no margin rail).
   - `Heading[level=1]` from `lesson.title`.
   - Below the title: a meta line at `--text-caption`, `--color-ink-muted`: `{difficulty} · ≈ {estimatedMinutes} хв · {publishedAt formatted via intl}`. Difficulty value-mapped via §Copywriting (`beginner` → `початківець`, `intermediate` → `проміжний`). Read-time uses `formatNumberUk(estimatedMinutes)`. Date uses `formatDateUk(publishedAt, { dateStyle: 'long' })` (P1 wrapper).
   - `Lede` from `lesson.deck`.
   - Vertical gap below: `--page-section-gap` (112px).

2. **Body section** — wrapped in `TwoColumn` (P2).
   - **Body slot (`[body]`):**
     - Inline TOC at the top, only at `<1200px` (the desktop variant lives in the margin rail; see below). Visual: `<nav aria-label="Зміст">` with `<ol>` of h2-level entries from `body.filter(b => b.type === 'heading' && b.level === 2)`. Item style: `--text-caption`, `--color-ink-muted`, accent number prefix `01.`, `02.` (matching the lesson library convention). Hidden via `display: none` at `≥1200px`.
     - `BlockRenderer` iteration over `body` excluding `sidenote` and `parts-list` blocks.
     - Spec rule: `parts-list` is moved to the margin slot (see below); `sidenote` blocks are also forwarded.
   - **Margin slot (`[margin]`)** — only renders content at `≥1200px` (P2 `TwoColumn` collapses below):
     - **Top of rail:** parts list rendered as a vertical stack — small heading `<h2 class="parts-list__heading">Що знадобиться</h2>` at `--text-caption` `--color-ink-muted` 600, followed by an `<ul>` of items. Each item: `<li>` with quantity prefix `{quantity}×` in `--color-accent` `--font-ui` 600, then name in `--font-body`, then optional `note` on a second line in `--text-caption` `--color-ink-muted`. Vertical gap between items: `--space-3` (12px).
     - **Below parts list (gap `--space-7` / 48px):** in-page TOC. Same shape as the inline one but sticky-aware-CSS-NOT-applied (P2 D-rule: book aesthetic prefers chrome that doesn't follow scroll). Active-link rule per Color §addition 12.
     - **Below TOC (gap `--space-7`):** sidenotes anchored via the P2 mechanism. The TOC and parts list are **not** subject to the JS measurement — they sit at fixed `top` and the JS measurement only governs `Sidenote` placement, starting at `top: max(naturalTop, partsListBottom + tocHeight + --space-7)`. **Collision rule extension:** if the first sidenote's natural anchor `top` would overlap the TOC, the sidenote slides down per the existing P2 collision rule. Locked.

3. **Prev/next navigation** — full prose-measure, single column.
   - Renders only when `lesson.prevSlug` or `lesson.nextSlug` is set.
   - Two-column flex row at `≥768px`, single stacked column at `<768px`.
   - Left side (when `prevSlug`): `<a>` with three-line content: small label `← Попередній урок` in `--text-caption` `--color-ink-muted`, then lesson title in `--text-body` `--color-ink`, then nothing. Hover: lesson title gets the standard accent-underline rule.
   - Right side (when `nextSlug`): mirror, label `Наступний урок →`, right-aligned text.
   - Top hairline rule above the row: `--color-rule`, padding-top `--space-6`.
   - Vertical gap above this section from preceding body: `--page-section-gap`.

4. **Footer is `SiteFooter`** via `PageShell`.

### `ArticlePage` (PAGE-02)

Same structure as `LessonPage` minus parts-list, minus prev/next navigation, minus difficulty/read-time meta.

- **Title block:** `Heading[level=1]` + meta line `{publishedAt formatted}`(only) at `--text-caption` `--color-ink-muted` + `Lede` from `article.deck`.
- **Body:** `TwoColumn`. Body slot: inline TOC (mobile/tablet) + `BlockRenderer` iteration. Margin slot (desktop only): in-page TOC at the top + sidenotes below. **No parts list** (article model has none).
- **No prev/next nav.**
- **Footer:** `SiteFooter`.

### `DatasheetPage` (PAGE-03)

Component metadata block + pinout figure + specifications + peripheral notes.

**Structure:**

1. **Title block** (full prose-measure):
   - `Heading[level=1]` from `datasheet.title` (e.g., `ATmega328P`).
   - Meta line: manufacturer at `--text-caption` `--color-ink-muted`, prefixed with `Виробник: ` label.
   - Vertical gap: `--page-section-gap`.

2. **Pinout** — `<ui-pinout>` rendered with `fullBleed=true` on the desktop breakpoint to fill the container, body-measure at smaller widths. The pinout's static legend (P2) does the labeling.

3. **Specifications table** — full prose-measure, single column.
   - Heading: `<h2>Характеристики</h2>`.
   - `<dl>` semantic structure (NOT `<table>` — editorial spec lists read better as definition lists; book convention).
   - Each spec: `<dt>` label in `--text-caption` `--font-ui` `--color-ink-muted`, `<dd>` value in `--text-body` `--font-mono` `--color-ink`.
   - 1px `--color-rule` between rows. Vertical padding per row: `--space-3` (12px).
   - `dt`/`dd` arranged as a CSS Grid two-column row at `≥768px` (label column ~⅓ width, value column ~⅔), single column stacked at `<768px`.

4. **Peripheral notes** — wrapped in `TwoColumn` to inherit margin-rail behavior for any sidenotes.
   - Heading: `<h2>Периферія</h2>`.
   - `BlockRenderer` iteration over `peripheralNotes`.

5. **Footer:** `SiteFooter`.

### `SchematicPage` (PAGE-04)

Large schematic figure + explanation + download link.

**Structure:**

1. **Title block** (full prose-measure): `Heading[level=1]` from `schematic.title`. No deck or meta line — schematics are visual-first.

2. **Schematic figure** — `schematic.schematicImage` (always `fullBleed=true` per P2 model contract). Click-to-zoom (PAGE-04) implemented as a native `<a href="{schematicImage.src}" target="_blank" rel="noopener">` wrap around the `<img>`. **No JS lightbox** in v1 — opening the image in a new tab is the editorially appropriate "zoom" affordance and matches the book convention of "see appendix for full-size diagram". The cursor changes to `zoom-in` on hover.

3. **Download link** — full prose-measure, single line below the figure.
   - Markup: `<a href="{schematic.downloadUrl}" download>Завантажити схему<svg class="dl-arrow"/></a>` in `--text-caption` `--color-accent`. The 12×12 arrow-down SVG sits to the right of the label (Color §addition 13).

4. **Explanation** — wrapped in `TwoColumn`. `BlockRenderer` iteration over `schematic.explanation`. Margin slot used only for sidenotes (no parts list, no in-page TOC for schematics — explanations are short).

5. **Footer:** `SiteFooter`.

### `LessonLibraryPage` (PAGE-05) — typographic table-of-contents

**Hard editorial constraint (PAGE-05, PROJECT.md, Out-of-Scope):** **NOT a card grid.** Typographic TOC.

**Structure:**

1. **Title block:** `Heading[level=1]` `Уроки` + `Lede` short Ukrainian editorial sentence (see Copywriting).

2. **TOC list** — full prose-measure, single column at all breakpoints.
   - Container: `<ol>`. **No card surfaces, no bordered box per row.**
   - Each row (`<li>`):
     - Two lines.
     - Line 1: number prefix `01.` (2-digit zero-padded, accent color, `--font-ui` 600), gap `--space-3`, lesson title in `--text-h3` `--color-ink` `--font-body` 600. The title is wrapped in `<a href="/lessons/{slug}">` with the P1 link rule (accent underline). The `01.` number prefix is **not** part of the link target — it's a static span before the link.
     - Line 2: meta in `--text-caption` `--color-ink-muted`: `{difficulty} · ≈ {estimatedMinutes} хв`.
   - Vertical gap between rows: `--lesson-row-gap` (48px).
   - 1px `--color-rule` between rows (top border on each row except the first).

3. **Footer:** `SiteFooter`.

**Empty state (locked, exercised once mock fixtures are removed in tests):** if `listLessons()` returns `[]`, the TOC body is replaced by an editorial `<aside>` with the empty-state copy (see Copywriting). The lede stays.

### `HomePage` (PAGE-06) — editorial home

**Structure:**

1. **Hero** — full prose-measure, single column.
   - `Heading[level=1]` from a locked title string (see Copywriting).
   - `Lede` italic, locked editorial sentence.
   - Vertical gap below: `--page-section-gap`.

2. **Recent lessons section** — `<h2>Останні уроки</h2>`, then a typographic mini-TOC of the **3 most recent** lessons (sorted by `publishedAt` descending). Same row visual as `LessonLibraryPage` (number prefix + title + meta + hairline rule). **No "see more" link**; instead, a single trailing line in `--text-caption` `--color-accent` reading `Усі уроки →` linked to `/lessons`.

3. **Recent articles section** — `<h2>Статті</h2>`, mini-TOC of the **2 most recent** articles. Same visual idiom as the lesson mini-TOC, minus the difficulty marker (articles have no difficulty). Trailing line `Усі статті →` linked **not yet wired in P3** — the article library page is deferred (PAGE-05 specifies the lesson library only). Trailing line in v1 is omitted; the section ends with the last article row.

4. **Entry points footer block** — a single short paragraph at `--text-body` containing two inline links: one to `/lessons`, one to `/about`. Editorial, not a button bar.

5. **Footer:** `SiteFooter`.

### `AboutPage` (PAGE-07)

A single-column editorial prose page. No mock-data dependency — copy is hand-authored as inline TS template constants.

**Structure:**

1. **Title block:** `Heading[level=1]` `Про проєкт` + `Lede` italic editorial sentence (see Copywriting).
2. **Body:** 4–6 hand-authored Ukrainian paragraphs explaining the project's purpose, authorship, design philosophy, and content roadmap. Authored to match the editorial voice. Includes one inline `<code>` reference (`Wagtail`) and one em-dash for typographic completeness.
3. **Footer:** `SiteFooter`.

### `NotFoundPage` (PAGE-08)

**Structure:**

1. **Numeral** — `<h1>404</h1>` rendered at `--text-h1` (48px), `--color-ink`, `--font-body` 600.
2. **Hairline rule** — 2px `--color-accent`, full prose-measure (Color §addition 15). The single graphic moment of the page.
3. **Body** — `Lede` italic with the editorial 404 message (see Copywriting), then a `Body` paragraph with a single inline link to `/lessons` reading `повернутися до уроків`.
4. **Footer:** `SiteFooter`.

The page is centered vertically using `min-height: calc(100vh - var(--header-pad-block) - var(--footer-pad-block) - 96px); display: grid; place-content: center;`. Single editorial moment, no decoration.

### `PreviewStubPage` (`/preview/:contentType/:token` — PERF-03)

**Structure:**

1. **Title block:** `Heading[level=1]` `Попередній перегляд` + `Lede` italic editorial sentence explaining what this route is for.
2. **Body:** A single `Aside[variant="note"]` with the explanatory copy (see Copywriting) — the route works, the Wagtail wiring is the next phase.
3. **Footer:** `SiteFooter`.

The route reads `:contentType` and `:token` from params and renders them in a small `<pre>` for diagnostic purposes (`--text-caption`, `--color-ink-muted`, no border) so a P4 author can confirm the route receives params correctly.

---

## Shiki Integration (PRIM-04 finalization, completes P2)

P2 shipped the visual frame. P3 wires Shiki at build time. **Locked editorial palette (Shiki theme):**

- **Light theme only** (no dark theme — TYPE-08 inheritance, single light theme v1).
- **Theme name:** custom in-repo theme `arduino-paper.json` (or selected lightest theme from `@shikijs/themes` and overridden via `shiki` color overrides). Background: `--color-paper`. Foreground: `--color-ink`. Comments: `--color-ink-muted` italic. Strings: `--color-ink` (no chromatic alarm — typography-driven). Keywords: `--color-ink` 600 (weight only). Numbers, types: `--color-ink` italic. **No bright reds, greens, blues, yellows.** The palette is restrained; differentiation is by weight and style.
- Rationale: matches P2 §Diff visual treatment principle — chromatic alarm fights the book aesthetic. Editorial code presentation differentiates by weight, italic, and rule, not by rainbow tokens.

**Build-time integration:**
- `@shikijs/transformers` runs at build time during fixture preparation OR at component init in CSR — locked decision: **at build time, output stored as pre-tokenized HTML in the JSON fixture**. Fixtures gain an optional `code.tokens` field (per-line span structure) that the `CodeBlock` primitive consumes when present, falling back to plain `<pre>{{ code }}</pre>` rendering when absent.
- `@shikijs/transformers` provides `transformerNotationDiff` and `transformerNotationHighlight` for diff / highlight markers — these are **not** used; the P2 `CodeBlock` API already handles diff and highlight via component inputs (`diffMode`, `highlightLines`) which the executor wires to the same span-class system Shiki produces.
- **No client-side Shiki bundle** — the JS runtime ships zero Shiki code. The transformation is build-time only. This satisfies PRIM-04's "NO client-side highlighting JS" constraint.

**Languages:** `cpp`, `arduino` (registered as a TextMate variant or aliased to `cpp`), `plaintext`, `diff` — exactly the four `Block.code.language` enum values.

---

## NgOptimizedImage Swap (PERF-05)

Every `<img>` inside `Figure` and `Pinout` migrates to `<img ngSrc="…" [width]="…" [height]="…" [priority]="…">` in P3.

**Rules:**
- Every `Block.figure.src` and `Block.pinout.src` must have explicit `width` × `height` in the fixture JSON. Adding the dimension fields to the `Block` model is a P3 amendment — see §Block model amendment below.
- `priority` set to `true` for the **first figure on the lesson/article/datasheet/schematic page** (typically above-the-fold) to drive LCP < 2.5s (PERF-04). All subsequent figures use the default lazy behavior.
- `placeholder="blur"` is **not** used in v1 — book aesthetic prefers a clean fade-in. `loading="lazy"` (default) is sufficient.
- `sizes` attribute: not required in P3 since images are bounded by `--measure-prose` or `--container-max`; the build emits a single rendition. P4 + MinIO renditions land later — `sizes` becomes meaningful then.

### `Block` model amendment (P3 ships this)

Adds `width: number` and `height: number` (required) to:
- `{ type: 'figure'; …; width: number; height: number }`
- `{ type: 'pinout'; …; width: number; height: number }`

This is a CONTRACT change. Recorded as a P3 amendment in the planner's work; mock fixtures must be updated. P4 Wagtail must also emit these fields (CONTRACT-02 spike includes verification of the amended shape, not just `code`).

---

## Lighthouse Gates (PERF-04)

Run on a representative lesson — locked: `pershyi-blymayuchyi-svitlodiod`. Production build (`ng build` with no dev flags). Tested at desktop and mobile profiles.

**Locked thresholds (PERF-04):**
- LCP < 2.5s
- CLS < 0.1 (the P1 Fontaine fallback metrics are the structural defense; P3 adds explicit image dimensions everywhere)
- INP < 200ms (P3 ships zero new client-side JS interaction beyond the P2 `CodeBlock` copy button and the `TwoColumn` measurement; INP should remain trivially under threshold)

**Recorded as a P3 row in `docs/typography-checklist.md`** under a new "Performance" section, with raw Lighthouse numbers per audit + a PASS/FAIL verdict per gate. Re-run on every meaningful FE change in P3.

**On miss:** the executor halts the phase exit and a remediation plan is produced. Most likely causes (and pre-locked responses):
- LCP miss → ensure `priority` on first figure; ensure font preloads in `index.html` (P1 already locked); inspect woff2 sizes (P1 budget enforced).
- CLS miss → audit any unmeasured `<img>`; verify Fontaine metrics still apply.
- INP miss → audit `TwoColumn` measurement debounce (50ms locked); audit Shiki-produced DOM for excessive node count.

---

## Wagtail StreamField Spike (CONTRACT-02, phase exit)

**When:** at the end of P3, immediately (Wagtail 7.3 is GA today). Re-validate the same shape diff against 7.4 LTS after the 2026-05-04 bump in Phase 4.

**Duration:** 30–60 minutes. This is a **timeboxed spike**, not a feature.

**Deliverable:** a single throwaway Wagtail project (separate folder, never merged) with one StreamField defined as:

```python
class CodeBlock(blocks.StructBlock):
    language = blocks.ChoiceBlock(choices=[
        ('cpp', 'C++'), ('arduino', 'Arduino'),
        ('plaintext', 'Plain'), ('diff', 'Diff')])
    code = blocks.TextBlock()
    annotations = blocks.ListBlock(
        blocks.StructBlock([
            ('line', blocks.IntegerBlock()),
            ('note', blocks.RichTextBlock())]))
```

Save a single test page, hit `/api/v2/pages/<id>/`, capture the JSON response.

**Validation gate (PASS/FAIL):**
- The serialized shape of the `code` block in the response is **byte-compatible** with `Block.code` in `content/models/block.ts`. Specifically: `language` is a string from the locked enum, `code` is a string, `annotations` is an array of `{line, html}` objects (Wagtail's `RichTextBlock` serializes to HTML on the API side).
- If the field name `note` in the spike StreamField doesn't match `html` in the FE model → **FAIL** → adjust the FE model (rename `html` to `note`) **before phase 3 exits**, OR adjust the Wagtail model in P4. Decision is captured in the spike report.
- If `width`/`height` on figures don't have a clean StreamField match → revisit the P3 amendment.

**Output:** `.planning/phases/03-page-templates-routing-static-build/wagtail-spike-report.md` with the captured JSON, a diff against the FE model, and a PASS/FAIL verdict per CONTRACT-02. Spike folder is deleted after the report is written; the FE model is the source of truth, not the spike.

This is the design-freeze checkpoint. The FE contract becomes immutable across P3→P4 once this passes.

---

## Three-Breakpoint Verification

Every page template must visually pass at:

- **<768px** (mobile): single column, `SiteHeader` collapses to wordmark + `Уроки` link only, `SiteFooter` stacks colophon-then-meta-links, lesson page shows inline TOC + `<details>` sidenotes + parts list inline below the title block (not in a margin), prev/next nav stacks vertically.
- **768–1199px** (tablet): single column body, `SiteHeader` shows full nav, sidenotes inline below their anchor paragraphs (P2 rule), parts list **inlines below the title block as a `<aside>`** styled like a `Sidenote` inline variant (left border, padding-left), in-page TOC inline at the top of body.
- **≥1200px** (desktop): true two-column body, parts list + in-page TOC + sidenotes all in the margin rail, prev/next nav full-width below body.

Recorded in `docs/typography-checklist.md` as P3 sections (extending the existing accumulating doc).

---

## Force-en Locale Audit (UKR-06, PERF-04 alignment)

Phase-exit force-en audit walks **every public route** under `en-US` browser locale and verifies:

- Every page's `<html lang="uk">` is set.
- All dates render as Ukrainian (`30 квітня 2026 р.`, never `April 30, 2026`).
- All numbers render with NBSP thousands and comma decimal (`1 234,56`, never `1,234.56`).
- All read-time strings render as `≈ 12 хв`.
- All static UI strings (header nav, footer, prev/next labels, library row meta, 404 copy, preview stub copy) remain Ukrainian.
- The 404 page (visited via a deliberately wrong URL like `/no-such-thing`) renders Ukrainian content.
- Recorded as a P3 row in `docs/force-en-audit.md`.

---

## Copywriting Contract

All copy in Ukrainian. Inherits P1 + P2 punctuation rules (`«…»`, `—`, `–`, NBSP after one-letter prepositions, `ʼ` U+02BC). No English in any user-visible string. Net-new copy strings:

| Element | Copy |
|---------|------|
| `<title>` — home | `Arduino UA — українська онлайн-книга` |
| `<title>` — lesson library | `Уроки — Arduino UA` |
| `<title>` — lesson page (template) | `{lesson.title} — Arduino UA` |
| `<title>` — article page (template) | `{article.title} — Arduino UA` |
| `<title>` — datasheet page (template) | `{datasheet.title} — Arduino UA` |
| `<title>` — schematic page (template) | `{schematic.title} — Arduino UA` |
| `<title>` — about | `Про проєкт — Arduino UA` |
| `<title>` — 404 | `Сторінку не знайдено — Arduino UA` |
| `<title>` — preview stub | `Попередній перегляд — Arduino UA` |
| Header wordmark | `Arduino UA` |
| Header nav — link 1 | `Уроки` (`/lessons`) |
| Header nav — link 2 | `Про проєкт` (`/about`) — hidden at `<768px` |
| Header nav — link 3 (mobile fallback for «Сайт»: not rendered, omit) | — |
| Footer colophon | `Arduino UA — це повільний, ретельний переклад світу мікроконтролерів українською мовою. Один автор, одна тема, одна верстка. Книжкова типографіка — наш головний інструмент.` |
| Footer meta — about link (mobile only) | `Про проєкт` |
| Footer meta — RSS link | `RSS` (with inline 16×16 SVG glyph; tooltip `У наступних фазах`) |
| Footer meta — license + author | `© 2026 · CC BY-SA 4.0` |
| Lesson page meta separator | ` · ` (space · space — non-breaking on either side via NBSP) |
| Lesson difficulty — `beginner` | `початківець` |
| Lesson difficulty — `intermediate` | `проміжний` |
| Lesson read-time | `≈ {N} хв` (`N` from `formatNumberUk`) |
| Lesson date | `{D MMMM YYYY р.}` (from `formatDateUk(date, { dateStyle: 'long' })` — already produces this shape) |
| Datasheet manufacturer label | `Виробник` |
| Datasheet specs heading | `Характеристики` |
| Datasheet peripheral notes heading | `Периферія` |
| Lesson parts-list heading | `Що знадобиться` |
| Lesson parts-list quantity prefix | `{N}×` (digit + multiplication sign U+00D7, no space) |
| Lesson page TOC heading (visually hidden, `aria-label`) | `Зміст` |
| Article page TOC heading (visually hidden, `aria-label`) | `Зміст` |
| Prev-lesson label | `← Попередній урок` |
| Next-lesson label | `Наступний урок →` |
| Lesson library page h1 | `Уроки` |
| Lesson library page lede | `Послідовний шлях через мікроконтролери Arduino — українською мовою. Кожен урок калібрований так, щоб його можна було прочитати ввечері за чашкою чаю.` |
| Lesson library row number prefix | `{NN}.` (zero-padded 2-digit, period, accent color) |
| Lesson library empty state | h2: `Уроки готуються` / body: `Перші публікації з'являться у наступних фазах. Зазирай знову.` |
| Home page h1 | `Arduino UA` |
| Home page lede | `Українська онлайн-книга про Arduino. Лекції, статті, схеми та довідники — у книжковій верстці.` |
| Home page recent-lessons heading | `Останні уроки` |
| Home page recent-articles heading | `Статті` |
| Home page "all lessons" inline link | `Усі уроки →` |
| Home page entry-points paragraph | `Почни з {link:Уроки} або прочитай {link:про проєкт}.` (the two link targets are `/lessons` and `/about`; em-dash and «…» rules apply if rephrased) |
| About page h1 | `Про проєкт` |
| About page lede | `Чому існує цей сайт, як він зроблений і куди рухається.` |
| About page body | hand-authored 4–6 paragraphs (drafted by Claude in execution, author-reviewed per the P2 D-MOCK-01 read-aloud gate). Must include: motivation paragraph, design-philosophy paragraph (mentioning *Arduino Starter Kit* book inspiration), stack paragraph (mentions Angular + Wagtail), authorship paragraph, content-roadmap paragraph. |
| 404 numeral | `404` |
| 404 lede | `Цієї сторінки немає. Можливо, її ще не написано — або адреса змінилась.` |
| 404 body | `Спробуй {link:повернутися до уроків} або {link:на головну}.` (links to `/lessons` and `/`) |
| Preview stub h1 | `Попередній перегляд` |
| Preview stub lede | `Ця сторінка показує чернетку матеріалу до публікації.` |
| Preview stub body (Aside, variant=note) | `Поки що Wagtail не підключений — попередній перегляд активується у наступній фазі (P4). Сама маршрутизація вже працює: токен у URL отримано, але контент звідки взяти ще немає.` |
| Schematic download link | `Завантажити схему` (with inline 12×12 down-arrow SVG, accent color) |
| Schematic image alt-text rule | each schematic fixture's `schematicImage.alt` must be a real Ukrainian description — NOT the slug, NOT a placeholder. Verified by `lint-fixtures.mjs` extension. |
| Primary CTA | **not applicable** — no calls-to-action in P3. The site is a read-only learning hub. The closest analogues are the inline `Усі уроки →` link on the home page and the `Наступний урок →` link in lesson navigation; neither is treated as a button, both are inline editorial links. **This is intentional and not a missing element.** |
| Empty state | applies to one path: `LessonLibraryPage` when fixtures empty (locked above). All other lists (recent on home, datasheet/schematic libraries) are not exposed in P3, so empty-state copy is not required. |
| Error state | applies to two paths: (1) wildcard 404 page (locked above); (2) `/preview/*` stub explaining preview-not-yet-wired (locked above). No toast notifications, no modal errors, no console output in production. |
| Destructive confirmation | not applicable — P3 has no destructive actions (no edits, no deletes, no admin surface). |

### Editorial voice rules

- Footer colophon and About page body must read as the author's voice — first-person plural is acceptable ("наш", "ми"), but not the marketing "ми створюємо найкращий…" register.
- No exclamation marks anywhere in user-facing prose. Editorial calm.
- "лекція" is **not** used — the project uses "урок" (locked vocabulary; matches P2 fixtures and the existing Ukrainian Arduino learning vocabulary). Verified by `lint-fixtures.mjs` extension.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — no shadcn in this project (Angular + bespoke SCSS, see Design System table) |
| third-party | none | not applicable |

No registry safety gate required for P3. P3 introduces one new third-party runtime dependency (`shiki` + `@shikijs/transformers`) at **build time only**, not as a UI component registry — that supply-chain consideration is recorded in the planner's research notes, not in this UI-SPEC.

---

## Open Decisions Carried Forward (still locked, but flagged for re-validation)

These are decisions where the researcher locked a default rather than ask interactively (subagent constraint). Re-validate during execution — if real content forces a change, amend this UI-SPEC and bump `status` back to `draft`.

1. **Header is non-sticky.** Book aesthetic. Re-evaluate at P6 polish if reader feedback finds nav awkward on long lesson pages.
2. **Mobile nav: drop `Про проєкт` to footer, no hamburger.** If usability testing finds users miss the link, consider a single inline link in the lesson page footer (NOT a hamburger).
3. **Lesson library = typographic TOC, not card grid.** Hard locked by PROJECT.md Out-of-Scope — non-negotiable.
4. **Schematic click-to-zoom = open in new tab, no JS lightbox.** Editorially correct for v1; a real lightbox lands in P6 only if reader feedback demands it.
5. **Specifications = `<dl>`, not `<table>`.** Editorial choice — book-style spec lists. Tables are for tabular data with multiple comparison columns; datasheet specs are key-value.
6. **Shiki theme is hand-authored, not a stock theme.** The book aesthetic requires color restraint that no out-of-the-box Shiki theme provides. Hand-authored TM theme JSON in repo.
7. **Pre-tokenized HTML stored in fixture JSON, not Shiki at runtime.** PRIM-04 prohibits client-side highlighting JS; build-time tokenization fits the SSG architecture cleanly.
8. **Preview stub renders a static editorial panel, no Wagtail wiring.** The route surface is the v1 deliverable; the integration is P4.
9. **`Block` model amendment for `width`/`height` on figure + pinout.** Required for `NgOptimizedImage`; touches CONTRACT-01 (the P2 lock). Treated as a P3-scoped extension because the field count grows but no existing field changes shape.
10. **Home page recent counts: 3 lessons + 2 articles.** Editorial calibration; revisit if more content lands before P6.
11. **No `/articles` library page in P3.** The article library is not a PAGE-* requirement; articles surface only via the home page recent list. Considered for P6 if article volume grows.
12. **No "edit this page" / "report typo" links.** Out of editorial scope; if needed, lands in P6.

---

## Out of Scope for This UI-SPEC (will be specified in later phases)

- **Real Wagtail backend integration.** P4.
- **`WagtailContentApi`** — flips `MockContentApi` to real source. P4.
- **Real preview-token wiring** with `wagtail-headless-preview`. P4.
- **MinIO image renditions** + `sizes` attribute on `NgOptimizedImage`. P4 (renditions exist) + P5 (deployed). P3 ships single-rendition images.
- **Drop caps**, **hanging punctuation**, **OpenType refinements**. P6.
- **Glossary tooltips**, **pin/peripheral cross-links**, **figure cross-references** (`див. рис. N`). P6.
- **Pinout hover hotspots.** P6.
- **SEO meta tags**, **Open Graph**, **JSON-LD**, **RSS feed** (`/feed.xml`), **print stylesheet**. P6.
- **WCAG AA full audit.** P6 (P3 verifies focus rings, keyboard nav on chrome, alt text — but the comprehensive contrast walk is a P6 concern).
- **Dark mode.** Out of scope for v1 entirely.
- **Site-wide search.** Out of scope for v1 entirely.
- **`/articles` library page.** Considered for P6.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS — every chrome string, page title, meta string, error path, and empty state defined in Ukrainian; punctuation rules inherited; no English in user-visible strings.
- [x] Dimension 2 Visuals: PASS — chrome composition declared, `BlockRenderer` dispatch table locked, eight page templates structurally specified, no decorative gimmicks introduced.
- [x] Dimension 3 Color: PASS — no new colors; accent reserve list extended with eight explicit P3 additions; `--color-rule` additions enumerated.
- [x] Dimension 4 Typography: PASS — no new sizes or weights; full inheritance from P1 + P2; per-template usage map declared.
- [x] Dimension 5 Spacing: PASS — inherited unchanged; six new layout dimensions declared as layout tokens not spacing tokens.
- [x] Dimension 6 Registry Safety: PASS — no third-party registry, not applicable.

**Approval:** APPROVED 2026-05-01 by `gsd-ui-checker` — 6/6 dimensions pass, no recommendations.
