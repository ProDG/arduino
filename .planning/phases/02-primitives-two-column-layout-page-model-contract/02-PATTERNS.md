# Phase 2: Primitives, Two-Column Layout & Page-Model Contract — Pattern Map

**Mapped:** 2026-05-01
**Files analyzed:** 38 new + 6 modified
**Analogs found:** 32 / 38 (6 net-new with no analog — see §No Analog Found)

> Phase 1 shipped a single-app Angular 21 zoneless workspace with `app/pages/{home,glyph-audit}` standalone components, an SCSS token system at `src/styles/`, an `Intl` wrapper at `src/lib/intl.ts`, and a font subset pipeline at `scripts/fonts/`. Phase 2 introduces the workspace **library** `projects/core-ui/` (a structurally new pattern in this repo), 11 standalone components, JSON mock fixtures, a Node lint script, and TypeScript content models. Where Phase 2 patterns are net-new (workspace library, JSON fixture loading via `fetch`, Vitest test files, geometry pure function), this document points to the closest available analog and explicitly flags the gaps.

---

## File Classification

### New files in `projects/core-ui/` (workspace library)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `projects/core-ui/ng-package.json` | config | n/a | none | no-analog |
| `projects/core-ui/tsconfig.lib.json` | config | n/a | `tsconfig.app.json` | role-match |
| `projects/core-ui/src/public-api.ts` | barrel | n/a | none | no-analog |
| `projects/core-ui/src/lib/heading/heading.component.ts` | component | request-response | `src/app/pages/home/home.component.ts` | exact (standalone shell) |
| `projects/core-ui/src/lib/heading/heading.component.scss` | style | n/a | `src/app/pages/home/home.component.scss` | exact |
| `projects/core-ui/src/lib/body/body.component.{ts,scss}` | component | request-response | `home.component.ts` + `_base.scss` `p` | exact |
| `projects/core-ui/src/lib/lede/lede.component.{ts,scss}` | component | request-response | `_base.scss` `.lede` | role-match |
| `projects/core-ui/src/lib/aside/aside.component.{ts,scss}` | component | request-response | `_base.scss` `aside, .sidenote` rule | role-match |
| `projects/core-ui/src/lib/sidenote/sidenote.component.{ts,scss}` | component | request-response | `_base.scss` `aside, .sidenote` rule | role-match |
| `projects/core-ui/src/lib/sidenote-ref/sidenote-ref.component.{ts,scss}` | component | request-response | `_base.scss` anchor `a` rule | partial |
| `projects/core-ui/src/lib/figure/figure.component.{ts,scss}` | component | request-response | `glyph-audit.component.html` `<figure>` block + `_base.scss` `figcaption` | exact |
| `projects/core-ui/src/lib/figure-caption/figure-caption.component.{ts,scss}` | component | request-response | `_base.scss` `figcaption` + `.figure-num` | exact |
| `projects/core-ui/src/lib/code-block/code-block.component.{ts,scss}` | component | event-driven (clipboard) | `_base.scss` `pre` rule + `glyph-audit.component.ts` `inject(Meta)` pattern | partial (frame yes; clipboard interaction is net-new) |
| `projects/core-ui/src/lib/diff/diff.component.{ts,scss}` | component | request-response | `_base.scss` `aside`/`.figure-num` styling vocabulary | partial |
| `projects/core-ui/src/lib/pinout/pinout.component.{ts,scss}` | component | request-response | `glyph-audit.component.html` figure + matrix grid | partial |
| `projects/core-ui/src/lib/page-shell/page-shell.component.{ts,scss}` | component (layout) | request-response | `home.component.html` outer `<article>` + `glyph-audit.component.scss` container | role-match |
| `projects/core-ui/src/lib/two-column/two-column.component.{ts,scss}` | component (layout) | event-driven (ResizeObserver + afterNextRender) | none — net-new layout primitive | no-analog |
| `projects/core-ui/src/lib/two-column/measure.ts` | utility (pure fn) | transform | `src/lib/intl.ts` (pure-function module pattern) | role-match |
| `projects/core-ui/src/lib/two-column/measure.spec.ts` | test | n/a | `src/lib/intl.spec.ts` | exact |
| `projects/core-ui/src/lib/margin-rail/margin-rail.component.{ts,scss}` | component (layout) | request-response | `glyph-audit.component.scss` `.matrix` grid | partial |
| `projects/core-ui/src/lib/code-block/code-block.spec.ts` | test | event-driven | `intl.spec.ts` (Vitest setup) — but DOM-test pattern is net-new | partial |

### New files in `src/content/` (page-model contract)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/content/models/block.ts` | model (type) | n/a | none — net-new domain layer | no-analog |
| `src/content/models/lesson.ts` | model (type) | n/a | none | no-analog |
| `src/content/models/article.ts` | model (type) | n/a | none | no-analog |
| `src/content/models/datasheet.ts` | model (type) | n/a | none | no-analog |
| `src/content/models/schematic.ts` | model (type) | n/a | none | no-analog |
| `src/content/models/index.ts` | barrel | n/a | `src/styles/tokens/_index.scss` (`@forward` aggregator) | role-match |
| `src/content/models/block.spec.ts` | test (type-only) | n/a | `intl.spec.ts` | role-match |
| `src/content/api/content-api.ts` | service (abstract) | request-response | none — first abstract-class service | no-analog |
| `src/content/api/mock-content-api.ts` | service | CRUD (read-only) | `intl.ts` (utility-shaped module) | partial |
| `src/content/api/mock-content-api.spec.ts` | test | CRUD | `intl.spec.ts` | role-match |
| `src/content/api/content-api.token.ts` | DI provider (InjectionToken) | n/a | `app.config.ts` (provider registration site) | partial |

### New mock-data fixtures (`src/assets/mock-data/`)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/assets/mock-data/lessons/{slug}.json` × 3 | data fixture | n/a | `src/app/pages/glyph-audit/specimen-prose.const.ts` (real-Ukrainian-prose authoring discipline) | partial (different format, identical content discipline) |
| `src/assets/mock-data/articles/chomu-arduino.json` | data fixture | n/a | same | partial |
| `src/assets/mock-data/datasheets/{slug}.json` × 2 | data fixture | n/a | same | partial |
| `src/assets/mock-data/schematics/{slug}.json` × 1 | data fixture | n/a | same | partial |

### New Node tooling

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `scripts/lint-fixtures.mjs` | tooling (lint) | file-I/O | `scripts/fonts/subset.mjs` | role-match (Node CLI, ESM, sync FS) |

### New showcase page

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/app/pages/dev-primitives/dev-primitives.component.ts` | page | request-response | `src/app/pages/glyph-audit/glyph-audit.component.ts` | exact |
| `src/app/pages/dev-primitives/dev-primitives.component.html` | template | n/a | `src/app/pages/glyph-audit/glyph-audit.component.html` | exact |
| `src/app/pages/dev-primitives/dev-primitives.component.scss` | style | n/a | `src/app/pages/glyph-audit/glyph-audit.component.scss` | exact |

### New docs

| New File | Role | Closest Analog |
|----------|------|----------------|
| `docs/copy-style-uk.md` | doc | `docs/typography-checklist.md` (existing 1-page accumulating doc) |

### Modified files

| Modified File | Modification | Relevant Pattern |
|---------------|--------------|------------------|
| `tsconfig.json` | add `paths: { "@arduino/core-ui": ["projects/core-ui/src/public-api.ts"] }` | net-new |
| `angular.json` | add `core-ui` library project entry | net-new |
| `eslint.config.js` | add `eslint-plugin-boundaries` block | extend existing flat-config pattern (see §Shared) |
| `src/app/app.config.ts` | add `provideContentApi()` | extend existing `appConfig.providers` array |
| `src/app/app.routes.ts` | add `/dev/primitives` route | exact pattern from existing `/dev/glyph-audit` route |
| `src/app/app.routes.server.ts` | NO CHANGE — global `**` Prerender already covers `/dev/primitives`. **Action item:** add a `getPrerenderParams`-style exclusion (decision per CONTEXT D-WIRE-02). Closest pattern: none yet — this is the first explicit prerender exclusion in the project. |
| `package.json` | extend `lint` script: `&& node scripts/lint-fixtures.mjs` | exact (script-chain idiom already used in `lint`) |
| `docs/typography-checklist.md` | append P2 section | exact (P1 left a section; P2 appends following the same shape) |
| `docs/force-en-audit.md` | append P2 row | exact (P1 left rows; P2 appends following the same shape) |

---

## Pattern Assignments

### `projects/core-ui/src/lib/<name>/<name>.component.ts` — every editorial primitive

**Analog:** `src/app/pages/glyph-audit/glyph-audit.component.ts`

**Component decorator pattern** (lines 29-35):
```ts
@Component({
  selector: 'app-glyph-audit',
  standalone: true,
  templateUrl: './glyph-audit.component.html',
  styleUrl: './glyph-audit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

**Apply to all primitives** with these adjustments:
- `selector` becomes `ui-<kebab-name>` (per UI-SPEC, e.g., `ui-heading`, `ui-code-block`) — note the `ui-` prefix is a **deviation** from the `app-` rule in `eslint.config.js` `@angular-eslint/component-selector`. The lib must override that rule with `prefix: 'ui'` for `projects/core-ui/**`.
- Keep `standalone: true`, `changeDetection: OnPush`, co-located `templateUrl`/`styleUrl`.
- `imports: []` (self-contained — D-LIB-04).
- Use **signal inputs** (`input.required<T>()`, `input<T>(default)`) — Angular 21 idiom locked in UI-SPEC. The Phase 1 components have no inputs, so signal-input syntax has no analog yet; refer to UI-SPEC §"Editorial Primitives" for every primitive's exact input shape.

**Imports pattern (Angular 21)** to apply at top of every primitive:
```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
```

For primitives that need DOM measurement (`TwoColumn`, `CodeBlock` annotations):
```ts
import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, input, viewChild } from '@angular/core';
```

For `CodeBlock` clipboard signal state — net-new pattern, no in-repo analog. Use `signal<'rest' | 'copied' | 'failed'>('rest')` and clear it via `setTimeout` inside the click handler. The `ngOnInit` + `inject(Meta)` pattern from `glyph-audit.component.ts` (lines 36-39, 77-80) is the nearest example of a component holding internal state.

---

### `projects/core-ui/src/lib/<name>/<name>.component.scss` — every primitive's co-located styles

**Analog:** `src/app/pages/glyph-audit/glyph-audit.component.scss`

**Token-only consumption pattern** (lines 1-17):
```scss
.glyph-audit {
  padding: var(--space-6) var(--container-pad-mobile);
  max-width: var(--container-max);
  margin-inline: auto;
}

@media (width >= 768px) {
  .glyph-audit { padding-inline: var(--container-pad-tablet); }
}

@media (width >= 1200px) {
  .glyph-audit { padding-inline: var(--container-pad-desktop); }
}
```

**Apply to every primitive style file:**
- Read tokens **only** as `var(--…)` — never SCSS `$…`. (P1 D-02; tokens at `src/styles/tokens/` `@forward` aggregator already exposes every variable.)
- Three-breakpoint media queries follow the `@media (width >= 768px)` / `@media (width >= 1200px)` exact form (CSS Modern Range Syntax — Phase 1 idiom).
- No `@import`, no `@use 'tokens'` at the top of component SCSS — globals are already loaded via `src/styles/main.scss` (line 1: `@use './tokens';`). Component scss reads CSS custom properties only.

**Specific style anchors to copy from `_base.scss`** (these are the canonical primitive looks already drafted in P1):
- `Heading` h1/h2/h3 — `_base.scss` lines 27-47.
- `Body` `<p>` measure — `_base.scss` lines 49-56.
- `Lede` italic — `_base.scss` lines 58-62.
- `Aside`/`Sidenote` (tablet inline form) — `_base.scss` lines 139-146.
- `Figure` + caption + `Рис. N` prefix — `_base.scss` lines 123-137.
- `CodeBlock` outer `<pre>` frame — `_base.scss` lines 105-121.

> **Important:** The base rules in `_base.scss` apply to bare `<aside>`/`<pre>`/`<figure>` elements. Each primitive should render the same semantic element so it inherits the base rule, then override only what UI-SPEC demands (e.g., `CodeBlock` adds line-number gutter + copy button; `Aside` is the bare base style with a `variant` input that is currently visual-no-op per CONTEXT D-PRE-* and UI-SPEC §Aside).

---

### `projects/core-ui/src/lib/two-column/measure.ts` — pure-function geometry

**Analog:** `src/lib/intl.ts` (the only pure-function utility module in the project)

**Module shape** (entire file, lines 1-21):
```ts
// Project-wide locale formatting facade. Every Intl.* call in the
// codebase MUST go through this module …

const UK = 'uk-UA';
const TZ = 'Europe/Kyiv';

export function formatDateUk(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(UK, { dateStyle: 'long', timeZone: TZ, ...options }).format(date);
}
```

**Apply to `measure.ts`:**
- One header comment block explaining the WHY (collision-stack-down rule per UI-SPEC §"Sidenote anchoring mechanism"). Otherwise no comments — match the project's "comments only when WHY is non-obvious" rule (CLAUDE.md).
- Named exports only (no default export).
- Pure functions, deterministic, side-effect-free. Inputs: anchor `top`s + sidenote heights + stack-gap; output: array of `{ top: number }` for each sidenote.
- Strict TS — `tsconfig.json` enables `strict`, `noImplicitOverride`, `noImplicitReturns`. Match by giving every function an explicit return type.

---

### `projects/core-ui/src/lib/two-column/measure.spec.ts` — pure-function unit test

**Analog:** `src/lib/intl.spec.ts`

**Test file shape** (lines 1-26):
```ts
import { describe, expect, it } from 'vitest';
import { collatorUk, formatDateUk, formatNumberUk } from './intl';

describe('formatDateUk', () => {
  it('formats dates in Ukrainian long style with Europe/Kyiv tz', () => {
    const out = formatDateUk(new Date('2026-04-30T12:00:00Z'));
    expect(out).toMatch(/квітря/);
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/р\./);
  });
});
```

**Apply to `measure.spec.ts`:**
- Vitest's `describe` / `it` / `expect` import line, identical.
- Co-locate spec next to source (matches `intl.spec.ts` next to `intl.ts`; matches D-TEST-01 default).
- One `describe` per exported function. One `it` per behavior (collision-no-overlap, collision-with-overlap-stacks-down, single-sidenote, empty-input).
- No mocking — pure-function geometry takes plain numbers in.

---

### `projects/core-ui/src/lib/code-block/code-block.spec.ts` — DOM interaction test

**Analog:** `src/lib/intl.spec.ts` (Vitest config) + Angular CDK `TestBed` patterns from Angular docs.

**Vitest setup** (matches `intl.spec.ts` import header). The `package.json` `test` script (`vitest run --passWithNoTests`) and the `angular.json` test architect (`@angular/build:unit-test` with `runner: vitest`) already wire jsdom — `jsdom` is in `devDependencies`.

**Net-new pattern (no in-repo analog):**
- Mount the component via Angular's `TestBed.createComponent(CodeBlockComponent)`.
- Stub `navigator.clipboard.writeText` with `vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)` (success) and `.mockRejectedValue(new Error())` (failure).
- Use `vi.useFakeTimers()` to advance the 2s/4s revert timers.
- Assert the button's textContent transitions through `Копіювати` → `Скопійовано` → `Копіювати` for success, and `Копіювати` → `Не вдалося скопіювати` → `Копіювати` for failure (strings locked in UI-SPEC §Copywriting Contract).

> Planner note: this is the only DOM-interaction test in P2. If the executor is uncertain about Angular 21 `TestBed` zoneless setup, default to Angular's official guide referenced in CONTEXT §Canonical References.

---

### `src/content/api/mock-content-api.ts` — JSON fixture loader

**Analog (closest, partial):** `src/lib/intl.ts` (single-purpose service module).

**No exact analog in repo** — Phase 1 has no `fetch`-based asset loading. UI-SPEC §"`ContentApi` interface" + CONTEXT D-WIRE-01 lock the design.

**Pattern guidance:**
- Class extends the abstract `ContentApi` from `./content-api.ts`.
- Per fetch method: `const res = await fetch('/assets/mock-data/lessons/' + slug + '.json'); const json = await res.json(); return json as Lesson;` — typed cast at the boundary (CONTEXT D-MOCK-05 explicitly accepts the `as` cast over runtime validation).
- `MockContentApi` registers in `app.config.ts` via the `CONTENT_API` `InjectionToken` (D-WIRE-01).
- Per CONTEXT D-PRE-02: **no transformation** at the API boundary. Return JSON verbatim. Drop the UI-SPEC §"Ukrainian Text Pre-processor" `processUkrainianText` call entirely — that section is superseded.

**Asset wiring:** `angular.json` already maps `public/` to the build output (lines 14-19). Mock JSON lives under `src/assets/mock-data/`, so the executor must add an `assets` glob entry to `angular.json` for `src/assets/**` — this is the first time assets ship from `src/`. Existing pattern in `angular.json`:
```json
"assets": [
  { "glob": "**/*", "input": "public" }
]
```
Extend to:
```json
"assets": [
  { "glob": "**/*", "input": "public" },
  { "glob": "**/*", "input": "src/assets" }
]
```

---

### `src/content/api/content-api.token.ts` — Angular DI registration

**Analog:** `src/app/app.config.ts` (provider registration site, lines 1-13)

**Provider pattern** (entire file):
```ts
import { ApplicationConfig, LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'uk-UA' },
  ],
};
```

**Apply to `content-api.token.ts` + `app.config.ts` modification:**
- Define `export const CONTENT_API = new InjectionToken<ContentApi>('ContentApi');` in `content-api.token.ts`.
- Define `export function provideContentApi(): Provider { return { provide: CONTENT_API, useClass: MockContentApi }; }` next to the token.
- In `app.config.ts`, append `provideContentApi()` to the `providers` array — same shape as the existing `provideRouter(routes)` call. **One-line P4 flip:** swap `MockContentApi` for `WagtailContentApi`.

---

### `src/app/pages/dev-primitives/dev-primitives.component.ts` — showcase page

**Analog:** `src/app/pages/glyph-audit/glyph-audit.component.ts` (exact match — same role, same data flow, same `noindex` purpose)

**Full structural copy** (lines 29-80 of the analog, abridged):
```ts
@Component({
  selector: 'app-dev-primitives',
  standalone: true,
  templateUrl: './dev-primitives.component.html',
  styleUrl: './dev-primitives.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevPrimitivesComponent implements OnInit {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  ngOnInit(): void {
    this.title.setTitle('Примітиви — Arduino UA');
    this.meta.addTag({ name: 'robots', content: 'noindex' });
  }
}
```

**Title and lede** are locked in UI-SPEC §Copywriting Contract:
- `title`: `Примітиви — Arduino UA`
- `<h1>`: `Showcase примітивів`
- lede `<p class="lede">`: `Кожен примітив core-ui на реальних даних. Відкрий у трьох ширинах: <768, 768–1199, ≥1200.`

**Imports:** must import every `core-ui` primitive component class via the `@arduino/core-ui` path alias (D-LIB-03). The component's `imports: [...]` array lists every primitive used (HeadingComponent, BodyComponent, …, PageShellComponent, TwoColumnComponent).

---

### `src/app/app.routes.ts` — add `/dev/primitives` route

**Analog:** the existing `/dev/glyph-audit` entry in the same file (lines 9-14).

**Pattern to copy** (exact):
```ts
{
  path: 'dev/glyph-audit',
  loadComponent: () =>
    import('./pages/glyph-audit/glyph-audit.component').then((m) => m.GlyphAuditComponent),
  title: 'Гліф-аудит — Arduino UA',
},
```

**New entry to append:**
```ts
{
  path: 'dev/primitives',
  loadComponent: () =>
    import('./pages/dev-primitives/dev-primitives.component').then((m) => m.DevPrimitivesComponent),
  title: 'Примітиви — Arduino UA',
},
```

**Prerender exclusion (CONTEXT D-WIRE-02):** `app.routes.server.ts` currently uses a single `RenderMode.Prerender` for `**`. To exclude `/dev/primitives` from production prerender output, the executor must either (a) add an explicit route entry for `dev/primitives` with `RenderMode.Server` (won't work — SSG-only, no Node SSR ever), or (b) set `RenderMode.Client` for that path so it ships as CSR-only. Closest existing pattern: none — `/dev/glyph-audit` is currently prerendered. **Planner decision required:** confirm whether Phase 1's `/dev/glyph-audit` exclusion was deferred or whether D-WIRE-02 is the first time this is implemented.

---

### `scripts/lint-fixtures.mjs` — Node CLI lint script

**Analog:** `scripts/fonts/subset.mjs`

**Script header pattern** (lines 1-30 of analog):
```js
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
```

**Apply to `lint-fixtures.mjs`:**
- ESM (matches `package.json` `"type": "module"`).
- Sync FS (`readFileSync`, `readdirSync`) — matches subset.mjs choice.
- `process.exit(1)` on any violation (matches subset.mjs `process.exit(1)` on missing pyftsubset, line 87).
- Print findings as `path:line: <message>` with absolute or repo-relative paths.
- `REPO_ROOT = resolve(__dirname, '..')` (script lives at `scripts/`, not `scripts/fonts/`).
- One pass over `src/assets/mock-data/**/*.json` — recursive glob via `fs.readdirSync(dir, { recursive: true })`.

**Violations to detect** (from CONTEXT D-PRE-03 + D-MOCK-04):
- straight ASCII `"` in body prose
- `--` between word characters
- ASCII `'` between two Cyrillic letters
- regular space (U+0020) immediately after a one-letter preposition `[вуійзаоТанеНаДоЗаПо]` followed by a Cyrillic letter
- per-fixture content gates: at least one `ґ`, one `«…»`, one `—`, one `\d+–\d+`, one `<code>` ref
- lesson-only: at least one `sidenote`, one `figure`, one `code` block in `body[]`

**Hooked into:** `package.json` `lint` script. Existing line:
```json
"lint": "eslint . && stylelint \"src/**/*.scss\""
```
Extends to:
```json
"lint": "eslint . && stylelint \"src/**/*.scss\" && node scripts/lint-fixtures.mjs"
```

---

### `src/assets/mock-data/**/*.json` — Ukrainian prose fixtures

**Analog (content discipline only):** `src/app/pages/glyph-audit/specimen-prose.const.ts`

**Pattern to mirror — real Ukrainian Arduino prose** (lines 6-42 of the analog show the calibration target):
```ts
export const SPECIMEN_BODY_PARAS = [
  'Плата Arduino Uno побудована на мікроконтролері <strong>ATmega328P</strong>. Вбудований світлодіод підʼєднано до цифрового виходу <code>pin 13</code> через резистор — саме тому ми можемо керувати ним <em>без жодних додаткових компонентів</em>. …',
];

export const SPECIMEN_CODE = `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}
…`;
```

**Apply to JSON fixtures:**
- Real Arduino prose. No Lorem Ipsum (CLAUDE.md hard constraint).
- HTML-bearing fields (`paragraph.html`, `lede.html`, `aside.html`, `sidenote.html`) ship inline `<strong>`, `<em>`, `<code>` as in the specimen — the primitives render via `[innerHTML]` per glyph-audit lines 35, 38, 45, 46.
- Code samples in `code.code` ship verbatim including the Ukrainian comment idiom `// блимаємо світлодіодом` (specimen line 25 — verifies mono Cyrillic).
- Punctuation forms locked per CONTEXT D-PRE-03 — and **already used correctly** in the specimen: `«…»` outer quotes, `—` em-dash with NBSP before, `–` for ranges, `ʼ` (U+02BC) Ukrainian apostrophe (specimen line 12 `підʼєднано`), NBSP after one-letter prepositions.

**JSON byte-shape:** must match the matching TypeScript page model exactly (UI-SPEC §Page models locks every interface). Use the page-model `.ts` file as the schema; field names byte-identical.

**Slugs locked** (CONTEXT D-MOCK-03): see CONTEXT.

---

### `docs/copy-style-uk.md` — author/editor style guide

**Analog:** `docs/typography-checklist.md` (existing one-page accumulating doc)

The executor should read `docs/typography-checklist.md` for the project's doc voice (terse, ASCII-table-friendly, lives in repo root `docs/`). The new file replicates that shape, listing the punctuation forms enumerated in CONTEXT D-PRE-03, and links to `scripts/lint-fixtures.mjs` for enforcement.

---

## Shared Patterns

### Token-only styling

**Source:** `src/styles/base/_base.scss` + `src/styles/tokens/_index.scss`
**Apply to:** every primitive `*.component.scss`

Every CSS custom property used in P2 already exists. **No new tokens unless declared at top of `_layout.scss`** (UI-SPEC §"New layout tokens" calls out `--margin-rail-width`, `--margin-rail-gap`, `--sidenote-stack-gap` — these are P2-net additions to that file).

```scss
/* GOOD — what every primitive scss file does */
:host {
  font-size: var(--text-body);
  color: var(--color-ink);
}

/* BANNED — never read SCSS variables in component scss */
@use 'tokens' as *;
:host { font-size: $text-body; }   /* P1 D-02 violation */
```

### Co-located component files

**Source:** `src/app/pages/glyph-audit/` directory layout

Every Phase 1 component co-locates `.component.ts`, `.component.html`, `.component.scss`. A constant file ships next to the component (`specimen-prose.const.ts`). P2 follows: `<name>.component.ts` + `.component.scss` (HTML inline OR co-located template — match P1's choice of separate file for non-trivial templates, inline string for trivial ones; lede + sidenote-ref + figure-caption can use inline templates given their tiny markup). Co-located unit test: `<name>.spec.ts` (matches `intl.spec.ts` placement next to `intl.ts`).

### Real-Ukrainian prose for design calibration

**Source:** `src/app/pages/glyph-audit/specimen-prose.const.ts`
**Apply to:** every mock fixture, every showcase markup, every primitive default content used in unit tests.

Never Lorem Ipsum, never English placeholder. CLAUDE.md hard constraint.

### Ukrainian locale via `src/lib/intl.ts`

**Source:** `src/lib/intl.ts` (lines 10-20)
**Apply to:** any P2 primitive that renders a Date or formatted Number (the only known P2 use is the Lesson page-model's `estimatedMinutes`, rendered as `≈ {N} хв` — not in P2 templates yet, but if it appears on the showcase, it routes through `formatNumberUk`).

ESLint rule (`eslint.config.js` lines 6-23) bans bare `toLocale*`. Already enforced — primitives only need to obey.

### `/dev/*` namespace, noindex, ship in production

**Source:** `src/app/pages/glyph-audit/glyph-audit.component.ts` (lines 77-80)

```ts
ngOnInit(): void {
  this.title.setTitle('Гліф-аудит — Arduino UA');
  this.meta.addTag({ name: 'robots', content: 'noindex' });
}
```

The route registers in `app.routes.ts`; the page gets a `noindex` meta in `ngOnInit`. P2's `/dev/primitives` follows verbatim with new strings.

### ESLint flat-config extension

**Source:** `eslint.config.js` — uses TypeScript-ESLint `tseslint.config()` flat-config arrays.

To add `eslint-plugin-boundaries` (CONTEXT D-LIB-01), the executor appends a new config block to the existing `tseslint.config(...)` call. The `eslint.config.js` already shows two pattern blocks: file-globbed rule overrides (lines 31-38 for `src/**/*.ts` excluding `src/lib/intl.ts`) and per-file-extension blocks (lines 40-47 for `**/*.html`). The boundaries config follows the same shape — add a config object with `files: ['**/*.ts']`, `plugins: { boundaries }`, and the element-types rule.

---

## No Analog Found

| File | Role | Reason |
|------|------|--------|
| `projects/core-ui/ng-package.json` | ng-packagr config | First Angular library in the repo. Use Angular CLI `ng generate library core-ui` once and then commit the generated files. |
| `projects/core-ui/src/public-api.ts` | barrel | First library public surface. Pattern: `export * from './lib/heading/heading.component';` per primitive + input/output type re-exports. |
| `projects/core-ui/src/lib/two-column/two-column.component.ts` | layout primitive with `afterNextRender` + `ResizeObserver` | No in-repo example of `afterNextRender` or `ResizeObserver`. Reference: Angular docs (CONTEXT §Canonical References). |
| `src/content/models/*.ts` | TypeScript discriminated-union domain models | First domain model layer in repo. UI-SPEC §"Shared types" + §"Page models" provide the locked shapes verbatim — copy them exactly into individual files. |
| `src/content/api/content-api.ts` | abstract service class | First abstract service in repo. UI-SPEC §"`ContentApi` interface" provides the full signature. |
| `src/app/app.routes.server.ts` modification (prerender exclusion of `/dev/primitives`) | server-route config | First explicit prerender exclusion. Planner must confirm exact `RenderMode` (Client vs Prerender-skip) — `RenderMode.Client` is the in-Angular-21 supported route to keep a path out of the prerender sitemap while serving in dev. |

---

## Metadata

**Analog search scope:**
- `src/app/**/*.ts`, `src/lib/**/*.ts`
- `src/styles/**/*.scss`
- `scripts/**/*.mjs`
- `eslint.config.js`, `tsconfig.json`, `angular.json`, `package.json`
- `docs/**/*.md`

**Files scanned (read in full):**
- `src/app/pages/glyph-audit/glyph-audit.component.{ts,html,scss}`
- `src/app/pages/glyph-audit/specimen-prose.const.ts`
- `src/app/pages/home/home.component.{ts,html,scss}`
- `src/app/app.{component.ts,component.html,config.ts,routes.ts,routes.server.ts}`
- `src/lib/intl.{ts,spec.ts}`
- `src/styles/main.scss`, `src/styles/base/_base.scss`, `src/styles/tokens/_{index,layout,typography,color,spacing}.scss`
- `src/index.html`
- `scripts/fonts/subset.mjs`
- `eslint.config.js`, `tsconfig.json`, `angular.json`, `package.json`

**Pattern extraction date:** 2026-05-01

**Notes for planner:**
- The biggest gap is `TwoColumn`'s measurement engine — no in-repo analog. Plan it as a meaningful chunk in its own right (CONTEXT §Specifics confirms this) and front-load `measure.ts` + `measure.spec.ts` so the geometry is locked before the component wires DOM measurement.
- The `core-ui` workspace library is structurally novel — `ng-package.json`, `tsconfig.lib.json`, `public-api.ts`, and the `angular.json` library project entry should be one focused plan early in the phase. Once the empty library builds (`ng build core-ui` smoke per D-LIB-03), every primitive is a leaf addition.
- The `eslint.config.js` extension for `eslint-plugin-boundaries` and the override of `@angular-eslint/component-selector` from prefix `app` to `ui` for `projects/core-ui/**` are easy-to-miss configuration details — both flagged here so they end up in PLAN.md actions.
- UI-SPEC §"Ukrainian Text Pre-processor" must be amended (status → draft, strikethrough or removal) **before** PLAN.md is produced — CONTEXT D-PRE-05 makes this a planner phase-prep task.
