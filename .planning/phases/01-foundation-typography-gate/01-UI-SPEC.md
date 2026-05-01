---
phase: 1
slug: foundation-typography-gate
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-30
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for the foundation & typography gate. Locks the SCSS token system, the `@font-face` pipeline, the base CSS, and the single `/dev/glyph-audit` proof page. Downstream phases (P2 primitives, P3 templates) inherit every value declared here.

This phase has **no component library**. The harness uses raw HTML elements styled by `_base.scss` defaults — primitives are P2. This contract therefore lists tokens, base CSS rules, and the harness page styling, not a component inventory.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — bespoke SCSS token system, no shadcn (Angular project, no Tailwind, hand-authored editorial CSS per CLAUDE.md) |
| Preset | not applicable |
| Component library | none in P1 (`core-ui` primitives ship in P2) |
| Icon library | none in P1 (no icons needed for the harness page) |
| Font | **Body:** Source Serif 4 (variable, roman + italic, wght 200–900, opsz 8–60). **UI:** Inter (variable, roman + italic, wght 100–900). **Mono:** JetBrains Mono (variable, roman + italic, wght 100–800). Self-hosted woff2, subset latin + latin-ext + cyrillic + cyrillic-ext. Pairing A locked in `research/STACK.md`. |

### Token architecture (D-01, D-02, D-03)

Two-tier system:

1. **Raw tokens** — SCSS variables in `src/styles/tokens/_*.scss`. Compile-time only. Composition layer.
2. **Semantic tokens** — CSS custom properties on `:root`. Runtime layer. **Components consume only `var(--…)`** — never raw SCSS variables directly.

Files (each `@forward`ed from `src/styles/tokens/_index.scss`):

- `_typography.scss` — family stacks, six `@font-face` blocks, three Fontaine fallback `@font-face` blocks, type scale, line-heights. **The single-file font-pairing swap target (TYPE-06).**
- `_color.scss` — six-color palette, semantic role mapping.
- `_spacing.scss` — 4px-base scale.
- `_layout.scss` — breakpoints, measure (max line-length), container widths.
- `_radius.scss` — corner radii (single value v1: `--radius-sm: 2px` for code-block frame; book-aesthetic prefers near-square corners).
- `_shadow.scss` — empty shell in P1 (book aesthetic uses hairline rules, not shadows; file exists for P2 to populate if needed).

Consumers: `@use 'styles/tokens' as t;` then read `var(--…)`.

---

## Spacing Scale

4px base, **custom (not strict modular)** — bigger jumps at the top end for editorial breathing room (D-06). All values in px.

| Token (CSS var) | SCSS var | Value | Usage |
|---|---|---|---|
| `--space-0` | `$space-0` | 0 | Reset |
| `--space-1` | `$space-1` | 4px | Inline glyph gaps, hairline offsets |
| `--space-2` | `$space-2` | 8px | Tight inline spacing (badge padding, code inline) |
| `--space-3` | `$space-3` | 12px | Caption-to-figure gap, tight stack rhythm |
| `--space-4` | `$space-4` | 16px | Default paragraph rhythm baseline |
| `--space-5` | `$space-5` | 24px | Inter-paragraph spacing on the prose specimen |
| `--space-6` | `$space-6` | 32px | Sub-section breaks (h3-level), code-block vertical margin |
| `--space-7` | `$space-7` | 48px | Section breaks (h2-level), specimen-to-locale-demo gap |
| `--space-8` | `$space-8` | 72px | Major section breaks, glyph-matrix row gap |
| `--space-9` | `$space-9` | 112px | Top-of-page editorial breathing room (h1 to lede) |
| `--space-10` | `$space-10` | 168px | Page-level whitespace, glyph-matrix → specimen separation |

**Exceptions:** none. The harness page uses only values from this scale. Calibration may shift values during execution (e.g., `--space-9` may settle at 96 or 128) but the scale stays 4px-divisible.

---

## Typography

### Font stacks (semantic, on `:root`)

| CSS var | Stack |
|---|---|
| `--font-body` | `"Source Serif 4", "Source Serif 4 Fallback", Georgia, "Times New Roman", serif` |
| `--font-ui` | `"Inter", "Inter Fallback", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` |
| `--font-mono` | `"JetBrains Mono", "JetBrains Mono Fallback", "SF Mono", Menlo, Consolas, monospace` |

The `*Fallback` families are the Fontaine-generated fallback metric `@font-face` blocks (D-14) — they sit between the real font and the system fallback to eliminate CLS during font swap.

### Type scale (D-04, calibrated against real Ukrainian Arduino prose at ~62ch)

Numbers may shift ±2px during execution; structure is locked.

| Role | CSS var | Size | Weight | Line height | Family | Usage |
|------|---------|------|--------|-------------|--------|-------|
| Body | `--text-body` | 19px | 400 | 1.6 | `--font-body` | All prose paragraphs, list items, asides |
| Lede | `--text-lede` | 22px | 400 | 1.55 | `--font-body` | Opening paragraph after h1, italicized for editorial voice |
| Caption | `--text-caption` | 15px | 400 | 1.5 | `--font-ui` | Figure captions, sidenote text, footer notes |
| Mono / inline code | `--text-mono` | 15px | 400 | 1.55 | `--font-mono` | Inline `code`, `<pre>` blocks |
| H3 | `--text-h3` | 24px | 600 | 1.3 | `--font-body` | Sub-section headings inside prose |
| H2 | `--text-h2` | 34px | 600 | 1.2 | `--font-body` | Section headings inside prose |
| H1 / Display | `--text-h1` | 48px | 600 | 1.1 | `--font-body` | Page titles, hero |
| Display XL (matrix) | `--text-display-xl` | 64px | 400 | 1.0 | family-per-cell | Glyph matrix display row (per-cell font) |
| Glyph isolation | `--text-glyph` | 96px | 400 | 1.0 | family-per-cell | Isolated `і ї є ґ Ї Є Ґ ʼ` row beneath each matrix cell |

**Weights used: exactly two — 400 (regular) and 600 (semibold/bold).** No 500, no 700, no 800. Variable fonts can produce these values from a single file each. Italic is a separate `@font-face` (D-09), never synthesized.

**On the size count:** the prose hierarchy uses six sizes (caption 15 / body 19 / lede 22 / h3 24 / h2 34 / h1 48); the matrix display row and isolated-glyph row add two diagnostic sizes (64, 96) used only on the harness page. This intentionally exceeds the generic "max 4 sizes" heuristic. Editorial book typography — explicitly the project's product per CLAUDE.md and PROJECT.md, modeled on the official Arduino Starter Kit book — requires the full caption/body/lede/h1/h2/h3 hierarchy. The scale is cleanly hierarchical (15 → 19 → 22 → 24 → 34 → 48), not muddled. Future maintainers: do **not** trim this on the assumption it violates a primitive-product convention; the breadth is the editorial contract.

### Type rules locked in `_base.scss`

- `body { font-family: var(--font-body); font-size: var(--text-body); line-height: 1.6; color: var(--color-ink); background: var(--color-paper); }`
- `body { text-align: left; hyphens: none; }` — **TYPE-09: ragged-right, no auto-hyphenation**, full stop. CLAUDE.md hard constraint.
- `text-rendering: optimizeLegibility;` on `body`.
- `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;` on `html`.
- `h1, h2, h3 { font-family: var(--font-body); font-weight: 600; text-wrap: balance; }` — `text-wrap: balance` is editorially correct for short headings (browser support is now near-universal in 2026).
- `p { max-width: var(--measure-prose); }` where `--measure-prose: 62ch` — applies to every paragraph in the prose specimen.
- `p + p { margin-top: var(--space-5); }` — paragraph rhythm.
- `em, i { font-style: italic; }` — resolves to the real italic woff2, never synthesized.
- `strong, b { font-weight: 600; }`.
- `code { font-family: var(--font-mono); font-size: 0.9em; }` (inline code reads slightly smaller than body — typographic norm).
- `pre { font-family: var(--font-mono); font-size: var(--text-mono); line-height: 1.55; }`.
- `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; border-radius: 2px; }` — the only place `--color-accent` (Arduino-teal) appears outside links and code-block frame; restrained but unmistakable.

---

## Color

Light-only v1 (TYPE-08, PROJECT.md). Six colors total (D-05). Starting hexes — calibration may shift during execution but the slot count and 60/30/10 split are locked.

| Role | CSS var | Hex | Usage | Share |
|------|---------|-----|-------|-------|
| **Paper (60% — dominant)** | `--color-paper` | `#FAF8F3` | Page background, all surfaces. Warm off-white, not pure white — book feel. | 60% |
| **Ink (30% — secondary)** | `--color-ink` | `#1A1A1A` | Body text, headings. Soft black, not pure black — easier on the eye against warm paper. | ~25% |
| Ink-muted | `--color-ink-muted` | `#5C5C5C` | Captions, sidenotes, figure labels, secondary metadata. | ~5% |
| **Arduino-teal (10% — accent)** | `--color-accent` | `#007A80` | **Reserved use only — see below.** Hard-locked at the WCAG-AA-passing hex (≈4.6:1 on Paper). The brand-feel teal `#00979D` fails AA 4.5:1 (~3.0:1) for body link text — the darker hex is the v1 starting value. | <8% |
| Rule | `--color-rule` | `#E5E0D5` | Hairline borders, horizontal rules between sections, table borders. Warm-tinted to harmonize with Paper. | ~1% |
| Highlight | `--color-highlight` | `#FFF4D6` | Code-line highlight (single-line emphasis inside a code block). Warm pale yellow — book margin-marker feel. | <1% |

### Accent reserved for (explicit list — nowhere else)

1. Hyperlink text color (`a { color: var(--color-accent); }`) and the link underline.
2. Code-block frame (the 1px border around `<pre>` blocks).
3. Figure numbers ("Рис. 1" prefix in figure captions).
4. `:focus-visible` outline (keyboard-focus ring on every focusable element).

**Never** used for: headings, body text, primary CTAs (there are no CTAs in P1), background fills, hover-state surfaces, decorative dividers.

### No destructive color in P1

There are no destructive actions in this phase. Slot reserved for P2+ if needed; v1 must stay within these six colors per D-05.

### Contrast (WCAG AA — verified at execution time, declared here)

- Ink `#1A1A1A` on Paper `#FAF8F3` — ~17:1 (AAA easily).
- Ink-muted `#5C5C5C` on Paper `#FAF8F3` — ~7.5:1 (AAA for body).
- Arduino-teal accent `#007A80` on Paper `#FAF8F3` — ~4.6:1 (passes AA for normal-size body link text). The brand-feel `#00979D` fails AA at ~3.0:1 and is therefore not used; `#007A80` is the locked v1 starting hex. Re-verify on the deployed VPS as part of the typography checklist.

---

## Layout & Breakpoints

D-07: two breakpoints, three bands.

| CSS var | SCSS var | Value | Band |
|---|---|---|---|
| `--bp-tablet` | `$bp-tablet` | 768px | Mobile → tablet boundary |
| `--bp-desktop` | `$bp-desktop` | 1200px | Tablet → desktop boundary |
| `--measure-prose` | `$measure-prose` | 62ch | Max body line length (prose specimen, real Ukrainian) |
| `--container-max` | `$container-max` | 1200px | Max page container width |
| `--container-pad-mobile` | — | 16px | Page side padding < 768px |
| `--container-pad-tablet` | — | 32px | Page side padding 768–1199px |
| `--container-pad-desktop` | — | 48px | Page side padding ≥ 1200px |

P1 ships only the harness page; multi-column primitives are P2. The harness page is single-column at all three breakpoints.

---

## The Harness Page — `/dev/glyph-audit`

Triple-duty single page (D-15). Excluded from sitemap, ships `<meta name="robots" content="noindex">`. The page itself must already feel editorial — it is the first proof of the core value.

### Page chrome

- `<html lang="uk">` (D-27).
- `<title>Гліф-аудит — Arduino UA</title>`.
- `<meta name="robots" content="noindex">`.
- Body padding follows `--container-pad-*` per breakpoint.
- Vertical rhythm between the three sections: `--space-10` (168px) on desktop, scaling to `--space-8` (72px) at <768px.
- A single hairline rule (`border-top: 1px solid var(--color-rule)`) between sections.

### Section 1 — Glyph matrix (D-16)

**Page heading.** `<h1>` "Гліф-аудит" + `<p class="lede">` "Перевірка кириличного покриття для Source Serif 4, Inter та JetBrains Mono — кожна вага, кожен стиль."

**Grid:** CSS Grid, `grid-template-columns: repeat(4, 1fr)` at ≥1200px, `repeat(2, 1fr)` at 768–1199px, `1fr` (stacked) at <768px. Row gap `--space-8` (72px), column gap `--space-6` (32px).

**Twelve cells.** Rows = families (Source Serif 4, Inter, JetBrains Mono). Columns = styles (Regular 400, Italic 400, Bold 600, Bold-Italic 600).

**Per-cell content:**
1. Cell label, top, in `--font-ui` 13px / `--color-ink-muted`: e.g. `Source Serif 4 · italic · 400`. Traceability — a tofu box must trace to the exact face.
2. Body-size render of the canonical verification string (D-17) at 19px in the cell's font/style/weight, max-width 100% of cell, ragged-right, no hyphens.
3. Display-size render of the same string at 64px (`--text-display-xl`), `font-size` only — same family/style/weight as the cell. Truncation allowed via overflow on narrow screens (intentional — bigger is for shape inspection, not full-string reading).
4. Hairline rule (`--color-rule`) below the display row.
5. Isolated critical glyphs `і ї є ґ Ї Є Ґ ʼ` at 96px (`--text-glyph`), letter-spacing 0.1em, in the cell's font/style/weight. This row is the litmus test: the diaeresis on `ї`, the upper-comma on `ґ`, and the typographic apostrophe `ʼ` (U+02BC, NOT `'` U+0027) must all render correctly without falling back.

**Cell padding:** `--space-5` (24px). **Cell background:** `--color-paper` (no fill, no card). **Cell border:** none — the matrix is structured by whitespace and rules, not by boxes. Editorial restraint.

### Section 2 — Real-prose specimen (D-18, the calibration page for TYPE-07)

**Layout.** Centered `<article>`, `max-width: var(--measure-prose)` (62ch), horizontal margins `auto`. Single column at all breakpoints.

**Content sequence (every element required, real Ukrainian Arduino prose, never Lorem Ipsum):**

1. `<h1>` — page-level title, calibrated for h1 size.
2. `<p class="lede">` — italic lede paragraph (single sentence or two), `--text-lede`, `font-style: italic`, `color: var(--color-ink)`. Sets editorial voice.
3. `<p>` body paragraphs — at least three, separated by `--space-5`. At least one paragraph contains an inline `<em>` (italic Cyrillic test), an inline `<strong>` (bold Cyrillic test), an inline `<code>` reference like `pin 13` or `INPUT_PULLUP`, an em-dash `—`, an en-dash range `5–7`, and `«…»` Ukrainian quotes.
4. `<h2>` — section heading mid-prose.
5. More body prose, including a sentence using `ґ` in context (e.g. `ґніт`, `ґанок`, `Ґаздиня`).
6. `<pre><code>` — a code block, ~6–10 lines of Arduino C++. Must include `setup()`, `loop()`, `pinMode(LED_BUILTIN, OUTPUT);`, `digitalWrite`, and a Ukrainian comment line (`// блимаємо світлодіодом`) — proving Cyrillic renders correctly in the mono face.
7. `<figure>` with `<img>` placeholder (or a CSS-drawn box if no image asset is in P1) and a `<figcaption>` formatted as `<span class="figure-num">Рис. 1</span> Опис...`. The "Рис. 1" span is `--color-accent`, the rest of the caption is `--color-ink-muted` at `--text-caption`.
8. `<h3>` — sub-section heading.
9. Final body paragraph + an `<aside>` styled visually as a sidenote (visual only — the `Sidenote` primitive is P2). Aside styling: left border `2px solid var(--color-accent)`, padding-left `--space-4`, font `--text-caption`, color `--color-ink-muted`.

**Suggested specimen prose (Ukrainian Arduino content; final wording is Claude's discretion per CONTEXT.md, must include all required glyphs and elements):**

> ## Перший крок: світлодіод, що блимає
>
> *Це найпростіша і водночас найважливіша вправа в роботі з Arduino — ваш «Hello, World!» у світі електроніки.*
>
> Плата Arduino Uno побудована на мікроконтролері **ATmega328P**. Вбудований світлодіод під'єднано до цифрового виходу `pin 13` через резистор — саме тому ми можемо керувати ним *без жодних додаткових компонентів*. Достатньо завантажити скетч і спостерігати, як ґніт цифрового життя загорається й гасне з інтервалом 5–7 разів на секунду.
>
> ### Налаштування виходу
>
> У функції `setup()` ми один раз повідомляємо мікроконтролеру, що `pin 13` має працювати у режимі виходу. Ґаздиня цифрового світу — функція `pinMode()` — приймає номер ніжки та режим: `OUTPUT` або `INPUT_PULLUP`.
>
> ```cpp
> void setup() {
>   pinMode(LED_BUILTIN, OUTPUT);
> }
>
> void loop() {
>   // блимаємо світлодіодом
>   digitalWrite(LED_BUILTIN, HIGH);
>   delay(500);
>   digitalWrite(LED_BUILTIN, LOW);
>   delay(500);
> }
> ```
>
> *(Рис. 1)* — Електрична схема ілюструє, як струм проходить через вбудований резистор плати до світлодіода й назад до спільної землі.

(The above is a starting draft; calibration on real type may force minor edits.)

**Code-block visual treatment (Shiki integration is P3 — locking only the *visual frame* here):**

- Container: `<pre>` with `padding: var(--space-5) var(--space-6)` (24px / 32px), `background: var(--color-paper)` (no fill — book aesthetic), `border: 1px solid var(--color-accent)`, `border-radius: var(--radius-sm)` (2px), `overflow-x: auto`, `margin-block: var(--space-6)`.
- Font: `--font-mono` at `--text-mono` (15px / 1.55).
- **No line numbers in P1.** Line-numbered, diff-marked, annotation-aligned code blocks land with the `CodeBlock` primitive in P2 + Shiki in P3. The harness shows the *frame* and the mono face; the rich features attach later without changing the frame.
- A code-line highlight token exists (`--color-highlight` `#FFF4D6`) and is documented here so P3 can pick it up unchanged. Not exercised in the P1 harness.

**Inline-code visual treatment:**

- `code` (inline): `font-family: var(--font-mono); font-size: 0.9em; padding: 0 var(--space-1); background: var(--color-rule); border-radius: 2px;` — soft warm-grey pill, no border. Reads as part of the prose, not as a callout.

### Section 3 — Locale demo (D-19, TYPE-04 + UKR-04)

**Layout.** Inline at the bottom of the page, same `--measure-prose` container as Section 2. Heading + three demo lines + an audit-instruction footer note.

**Content:**

- `<h2>` "Локалізація"
- Three lines, each in `<p>`:
  1. **Дата** (today, formatted via `Intl.DateTimeFormat('uk-UA', { dateStyle: 'long', timeZone: 'Europe/Kyiv' })`) — must read e.g. "30 квітня 2026 р." (Ukrainian month, "р." suffix, day-month-year order).
  2. **Число** `1234567.89` formatted via `Intl.NumberFormat('uk-UA')` — must read "1 234 567,89" (NBSP thousands, comma decimal).
  3. **Сортування**: a `<ul>` of `["ялинка", "абрикос", "ґніт", "їжак", "буряк"]` sorted via `Intl.Collator('uk-UA')`. Verifies that `ґ` and `ї` sort to their correct Ukrainian alphabet positions (after `г` and after `і` respectively), not the Latin/Russian-alphabet position.
- **Audit footer** — `<p class="audit-note">` styled at `--text-caption` / `--color-ink-muted` with a left border `2px solid var(--color-accent)` and `padding-left: var(--space-4)`:
  > Аудит: завантажте цю сторінку з налаштуваннями локалі браузера `en-US`. Дата, число та порядок сортування вище МАЮТЬ залишитись українськими. Якщо хоч щось перемкнулось на англійську — це регрес. Чек-ліст: `docs/force-en-audit.md`.

This is the executable check for Phase 1 success criterion 4 and TYPE-04 / UKR-04 / UKR-06.

---

## The Placeholder Root Page — `/`

D-25. Single short page, no nav, no footer, no chrome.

**Content (Ukrainian, full):**

```
<h1>Arduino UA</h1>
<p class="lede">Українська онлайн-книга про Arduino. У розробці.</p>
<p>
  Фундамент готовий: типографіка, шрифти, локаль, токени.
  Подальші розділи з’являться у наступних фазах.
</p>
<p>
  Перевірка типографіки та кириличного покриття:
  <a href="/dev/glyph-audit">/dev/glyph-audit</a>.
</p>
```

Styling: same `--measure-prose` container, same body type, same color tokens. Vertical centering optional (`min-height: 100vh; display: grid; place-content: center;`) for editorial restraint — a single quiet page.

This page is shipped to production and indexable. It must not look like a dev placeholder; it must already feel like the cover of a book in progress.

---

## Base CSS Rules (`src/styles/base/_base.scss`)

Locked rules for P1 — every downstream phase inherits these.

```scss
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
body {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: 1.6;
  color: var(--color-ink);
  background: var(--color-paper);
  text-align: left;
  hyphens: none;
  text-rendering: optimizeLegibility;
}
h1, h2, h3 { font-family: var(--font-body); font-weight: 600; text-wrap: balance; margin: 0; }
h1 { font-size: var(--text-h1); line-height: 1.1; }
h2 { font-size: var(--text-h2); line-height: 1.2; }
h3 { font-size: var(--text-h3); line-height: 1.3; }
p  { margin: 0; max-width: var(--measure-prose); }
p + p { margin-top: var(--space-5); }
.lede { font-size: var(--text-lede); line-height: 1.55; font-style: italic; }
em, i { font-style: italic; }
strong, b { font-weight: 600; }
a {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 0.18em;
  text-decoration-thickness: 0.06em;
}
a:hover { text-decoration-thickness: 0.12em; }
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 2px;
}
hr { border: 0; border-top: 1px solid var(--color-rule); margin: var(--space-7) 0; }
code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  padding: 0 var(--space-1);
  background: var(--color-rule);
  border-radius: 2px;
}
pre {
  font-family: var(--font-mono);
  font-size: var(--text-mono);
  line-height: 1.55;
  padding: var(--space-5) var(--space-6);
  border: 1px solid var(--color-accent);
  border-radius: 2px;
  overflow-x: auto;
  margin-block: var(--space-6);
}
pre code { background: transparent; padding: 0; font-size: 1em; border-radius: 0; }
figure { margin: var(--space-6) 0; }
figcaption { font-size: var(--text-caption); color: var(--color-ink-muted); margin-top: var(--space-3); }
.figure-num { color: var(--color-accent); font-weight: 600; margin-right: var(--space-2); }
aside, .sidenote {
  font-size: var(--text-caption);
  color: var(--color-ink-muted);
  border-left: 2px solid var(--color-accent);
  padding-left: var(--space-4);
  margin-block: var(--space-5);
}
img { max-width: 100%; height: auto; }
```

These rules **do not constitute a primitive library**. They are base styles that raw HTML elements receive. P2 primitives will compose against them.

---

## Copywriting Contract

All copy in Ukrainian. No English in any user-visible string anywhere in P1 (CLAUDE.md, UKR-06).

| Element | Copy |
|---------|------|
| Site title (browser tab) | `Arduino UA` (root page) / `Гліф-аудит — Arduino UA` (harness page) |
| Root page heading | `Arduino UA` |
| Root page lede | `Українська онлайн-книга про Arduino. У розробці.` |
| Root page body | `Фундамент готовий: типографіка, шрифти, локаль, токени. Подальші розділи з’являться у наступних фазах.` |
| Root page link | `Перевірка типографіки та кириличного покриття: /dev/glyph-audit` |
| Harness page h1 | `Гліф-аудит` |
| Harness page lede | `Перевірка кириличного покриття для Source Serif 4, Inter та JetBrains Mono — кожна вага, кожен стиль.` |
| Glyph matrix cell label | `{Family} · {style} · {weight}` (e.g. `Source Serif 4 · italic · 400`) |
| Canonical verification string (D-17, locked) | `Ґаздиня їсть її їжу — є ґедзь, ґніт, ґанок. Цей рядок має бути ідеально набраним. ATmega328P, INPUT_PULLUP. «Лапки» „вкладені" — апостроф ʼ.` |
| Critical-glyph row | `і ї є ґ Ї Є Ґ ʼ` (literal, letter-spaced) |
| Specimen page h1 | `Перший крок: світлодіод, що блимає` |
| Specimen lede | `Це найпростіша і водночас найважливіша вправа в роботі з Arduino — ваш «Hello, World!» у світі електроніки.` |
| Specimen h2 | `Налаштування виходу` |
| Code-block Ukrainian comment | `// блимаємо світлодіодом` |
| Figure caption | `Рис. 1 — Електрична схема ілюструє, як струм проходить через вбудований резистор плати до світлодіода й назад до спільної землі.` |
| Locale demo h2 | `Локалізація` |
| Locale demo labels | `Дата:` / `Число:` / `Сортування:` |
| Audit footer note | `Аудит: завантажте цю сторінку з налаштуваннями локалі браузера en-US. Дата, число та порядок сортування вище МАЮТЬ залишитись українськими. Якщо хоч щось перемкнулось на англійську — це регрес. Чек-ліст: docs/force-en-audit.md.` |
| Primary CTA | not applicable — P1 has no calls-to-action. The root page has one informational link to the harness. |
| Empty state | not applicable — P1 has no data-driven views. |
| Error state | not applicable — P1 has no error paths beyond Angular's default 404 (no custom 404 in P1; that lands in P3). |
| Destructive confirmation | not applicable — P1 has no destructive actions. |

### Typographic punctuation rules (locked here, enforced by the P2 pre-processor — UKR-02)

Already correct in the locked specimen and verification strings:

- Quotes: `«…»` outer, `„…"` inner. Never straight `"…"` in prose.
- Apostrophe: `ʼ` (U+02BC, MODIFIER LETTER APOSTROPHE). Never `'` (U+0027) in prose.
- Em-dash: `—` (U+2014) for parenthetical breaks. Never `--`.
- En-dash: `–` (U+2013) for ranges (`5–7`). Never `-` between numbers.
- Non-breaking space after one-letter Ukrainian prepositions (`в`, `у`, `і`, `й`, `з`, `а`, `о`) — automated by the P2 pre-processor; in the P1 harness, hand-author them as `&nbsp;` or ` `.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — no shadcn in this project (Angular + bespoke SCSS, see Design System table) |
| third-party | none | not applicable |

No registry safety gate required for P1.

---

## Out of Scope for This UI-SPEC (will be specified in later phases)

Listed explicitly so the P1 executor does not creep on these, and so the P2/P3 UI-SPEC authors know what they own:

- **Primitives** — `Heading`, `Body`, `Lede`, `Aside`, `Sidenote`, `Figure`, `FigureCaption`, `CodeBlock`, `Diff`, `Pinout`, `PageShell`, `TwoColumn`, `MarginRail`. **All P2.**
- **Two-column body+margin layout.** P2.
- **Page templates** (lesson, article, datasheet, schematic, library index, home, about, 404). **P3.**
- **Header / footer / global navigation.** P3 (the harness and root page in P1 have no chrome — intentional editorial silence).
- **Shiki syntax highlighting, line numbers, diff markers, margin annotations.** P3.
- **Drop caps, hanging punctuation, pin/peripheral tooltips, glossary tooltips, figure cross-refs, pinout hotspots.** P6.
- **Print stylesheet, RSS feed, JSON-LD, OG tags.** P6.
- **Dark mode.** Out of scope for v1 entirely (PROJECT.md, PITFALLS.md). The two-tier token architecture leaves the door open for a future *parallel* dark theme — but no work in v1.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: **PASS** — all strings Ukrainian, real Arduino prose, no Lorem Ipsum, typographic punctuation correct.
- [x] Dimension 2 Visuals: **PASS** — single editorial harness page, no decorative gimmicks, hairline-rule structure not box-card structure.
- [x] Dimension 3 Color: **PASS** — six colors, 60% Paper / ~30% Ink-family / <10% Accent, accent reserve list explicit and short. Accent hex hard-locked at `#007A80` (passes WCAG AA on Paper at ≈4.6:1) per checker recommendation.
- [x] Dimension 4 Typography: **PASS (project-override)** — three families self-hosted, Cyrillic-Ext subsets, Fontaine fallback metrics, two weights only (400 + 600), italic from real woff2 not synthesized, ragged-right + `hyphens:none`. Six prose sizes + 2 diagnostic sizes intentionally exceed the generic 4-size rule; editorial book typography is the project's explicit product (CLAUDE.md / PROJECT.md override) and the scale is cleanly hierarchical.
- [x] Dimension 5 Spacing: **PASS** — 4px-base scale with editorial-large top end, all values in scale, no exceptions.
- [x] Dimension 6 Registry Safety: **PASS** — no third-party registry, not applicable.

**Approval:** APPROVED 2026-04-30 by gsd-ui-checker. Ready for `/gsd-plan-phase 1`.
