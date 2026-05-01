# Phase 3: Page Templates, Routing & Static Build — Pattern Map

**Mapped:** 2026-05-01
**Files analyzed:** 27 new + 6 modified
**Analogs found:** 32 / 33 (one no-analog: `arduino-paper.json` Shiki theme)

## File Classification

### New files

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/chrome/site-header.component.ts` | chrome component | request-response (router-aware) | `projects/core-ui/src/lib/page-shell/page-shell.component.ts` | role-match (standalone shell composer) |
| `src/app/chrome/site-header.component.scss` | component styles | n/a | `src/app/pages/glyph-audit/glyph-audit.component.scss` | role-match |
| `src/app/chrome/site-footer.component.ts` | chrome component | static render | `projects/core-ui/src/lib/page-shell/page-shell.component.ts` | role-match |
| `src/app/chrome/site-footer.component.scss` | component styles | n/a | `src/app/pages/glyph-audit/glyph-audit.component.scss` | role-match |
| `src/app/chrome/site-nav.component.ts` | chrome subcomponent | router-aware | `projects/core-ui/src/lib/page-shell/page-shell.component.ts` | role-match |
| `src/app/blocks/block-renderer/block-renderer.component.ts` | dispatcher component | transform (Block → primitive) | `src/app/pages/dev-primitives/dev-primitives.component.ts` (consumer of every primitive) | role-match (only existing file that imports the full primitive set) |
| `src/app/blocks/block-renderer/block-renderer.component.scss` | component styles | n/a | (minimal — no analog needed) | n/a |
| `src/app/pages/lesson/lesson.page.ts` | page template (route-bound) | request-response (CONTENT_API) | `src/app/pages/dev-primitives/dev-primitives.component.ts` | exact (data-resolving page that injects CONTENT_API + renders primitives) |
| `src/app/pages/lesson/lesson.page.html` | template | n/a | `src/app/pages/dev-primitives/dev-primitives.component.html` | exact |
| `src/app/pages/lesson/lesson.page.scss` | component styles | n/a | `src/app/pages/glyph-audit/glyph-audit.component.scss` | role-match |
| `src/app/pages/article/article.page.ts` | page template | request-response | `src/app/pages/dev-primitives/dev-primitives.component.ts` | exact |
| `src/app/pages/datasheet/datasheet.page.ts` | page template | request-response | `src/app/pages/dev-primitives/dev-primitives.component.ts` | exact |
| `src/app/pages/schematic/schematic.page.ts` | page template | request-response | `src/app/pages/dev-primitives/dev-primitives.component.ts` | exact |
| `src/app/pages/lesson-library/lesson-library.page.ts` | page template (list) | request-response | `src/app/pages/dev-primitives/dev-primitives.component.ts` | role-match (uses `listLessons()` not `getLesson`) |
| `src/app/pages/about/about.page.ts` | static page template | static | `src/app/pages/glyph-audit/glyph-audit.component.ts` | exact (static page, no CONTENT_API) |
| `src/app/pages/not-found/not-found.page.ts` | static page template | static | `src/app/pages/glyph-audit/glyph-audit.component.ts` | role-match |
| `src/app/pages/preview-stub/preview-stub.page.ts` | CSR-only page template | request-response (route params) | `src/app/pages/glyph-audit/glyph-audit.component.ts` | role-match (static-shape but reads ActivatedRoute) |
| `src/app/pages/home/home.component.*` (rewrite) | page template | request-response (recent lists) | `src/app/pages/dev-primitives/dev-primitives.component.ts` | exact |
| `src/content/api/fixture-loader.ts` | build-time loader (Node) | file-I/O | `scripts/lint-fixtures.mjs` | role-match (only existing fs-reading code in the repo) |
| `src/content/api/content-source.ts` | TS interface | n/a | `src/content/api/content-api.ts` | exact (abstract contract for content surfaces) |
| `src/content/api/fixture-content-source.ts` | concrete impl | file-I/O / fetch | `src/content/api/mock-content-api.ts` | exact |
| `scripts/tokenize-fixtures.mjs` | Node prebuild script | file-I/O / transform | `scripts/lint-fixtures.mjs` | exact (same shape: walk fixtures, mutate) |
| `scripts/lighthouse-lesson.mjs` (or inline pnpm) | Node audit script | request-response (HTTP) | `scripts/lint-fixtures.mjs` | role-match (Node CLI script wired via pnpm) |
| `src/assets/shiki/arduino-paper.json` | TextMate theme JSON | data | (none — see "No Analog Found") | none |

### Modified files

| Modified File | Role | Data Flow | Closest Analog (existing pattern) | Match Quality |
|---|---|---|---|---|
| `src/app/app.routes.ts` | router config | n/a | itself (extends current 3-entry shape) | exact (in-place extension) |
| `src/app/app.routes.server.ts` | SSG server-route config | n/a | itself (extends `RenderMode.Client` + wildcard pattern) | exact |
| `src/app/app.config.ts` | DI providers | n/a | itself | exact |
| `src/content/api/mock-content-api.ts` | DI service | request-response | itself (refactor to consume `ContentSource`) | exact |
| `src/content/models/block.ts` | type definition | n/a | itself (additive `width`/`height`) | exact |
| `scripts/lint-fixtures.mjs` | Node lint script | file-I/O | itself (extend with image-dimension check) | exact |
| `src/assets/mock-data/**/*.json` (every figure/pinout fixture) | content data | n/a | existing fixtures themselves | exact |

---

## Pattern Assignments

### `src/app/pages/lesson/lesson.page.ts` (page template, request-response)

**Analog:** `src/app/pages/dev-primitives/dev-primitives.component.ts`

**Standalone component header** (lines 22–44):
```ts
@Component({
  selector: 'app-dev-primitives',
  standalone: true,
  imports: [
    HeadingComponent, BodyComponent, LedeComponent, AsideComponent,
    SidenoteComponent, SidenoteRefComponent, FigureComponent,
    FigureCaptionComponent, CodeBlockComponent, DiffComponent,
    PinoutComponent, PageShellComponent, TwoColumnComponent,
    MarginRailComponent,
  ],
  templateUrl: './dev-primitives.component.html',
  styleUrl: './dev-primitives.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

**Imports pattern** (lines 1–20): all `core-ui` imports come from the `@arduino/core-ui` barrel; `CONTENT_API` from `'../../../content/api/content-api.token'`; models from `'../../../content/models'`.

**Title + meta + data-resolution pattern** (lines 45–143):
```ts
private readonly meta = inject(Meta);
private readonly title = inject(Title);
private readonly contentApi = inject(CONTENT_API);

readonly lesson = signal<Lesson | null>(null);

ngOnInit(): void {
  this.title.setTitle('Примітиви — Arduino UA');
  this.meta.addTag({ name: 'robots', content: 'noindex' });
  this.contentApi
    .getLesson('pershyi-blymayuchyi-svitlodiod')
    .then((l) => this.lesson.set(l))
    .catch(() => { /* non-fatal */ });
}
```

**File naming exception per UI-SPEC §Module organization:** new pages use `<name>.page.ts` (NOT `.component.ts`) to differentiate from primitives. The existing `home.component.ts` / `glyph-audit.component.ts` predate the rule and remain `.component.ts`. Apply `.page.ts` to all P3 NEW pages: `lesson.page.ts`, `article.page.ts`, etc. The component-class export drops the `Component` suffix in favor of `Page`: `LessonPage`, `ArticlePage`.

**Route input binding (P3-net-new):** RESEARCH.md Pattern 3 introduces `slug = input.required<string>();` reading from route params via `provideRouter(routes, withComponentInputBinding())`. This requires updating `src/app/app.config.ts` to add `withComponentInputBinding()` to `provideRouter`. No existing analog — first time the project uses route input binding.

---

### `src/app/pages/about/about.page.ts` (static page template)

**Analog:** `src/app/pages/glyph-audit/glyph-audit.component.ts`

**Static-content + title-meta pattern** (lines 29–80):
```ts
@Component({
  selector: 'app-glyph-audit',
  standalone: true,
  templateUrl: './glyph-audit.component.html',
  styleUrl: './glyph-audit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlyphAuditComponent implements OnInit {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  // ...readonly inline constants for prose...
  ngOnInit(): void {
    this.title.setTitle('Гліф-аудит — Arduino UA');
    this.meta.addTag({ name: 'robots', content: 'noindex' });
  }
}
```

**Inline prose constants pattern** (`specimen-prose.const.ts`): Authored-prose strings live in a sibling `.const.ts` file alongside the component. Apply this for `about.page.ts` (4–6 hand-authored Ukrainian paragraphs as a sibling const file) and for `not-found.page.ts` / `preview-stub.page.ts` editorial copy.

**SCSS responsive padding pattern** (`glyph-audit.component.scss` lines 1–18):
```scss
.glyph-audit {
  padding: var(--space-6) var(--container-pad-mobile);
  max-width: var(--container-max);
  margin-inline: auto;
}
@media (width >= 768px)  { .glyph-audit { padding-inline: var(--container-pad-tablet); } }
@media (width >= 1200px) { .glyph-audit { padding-inline: var(--container-pad-desktop); } }
```
Apply this `--container-pad-*` breakpoint stair to every page template's outer wrapper. Note `--page-section-gap`, `--header-pad-block`, `--footer-pad-block`, `--toc-rail-width`, `--lesson-row-gap` are NEW layout tokens declared by UI-SPEC — add to `styles/tokens/_layout.scss`, NOT to spacing tokens.

---

### `src/app/blocks/block-renderer/block-renderer.component.ts` (dispatcher)

**Analog:** `src/app/pages/dev-primitives/dev-primitives.component.ts` (only existing consumer of all primitives)

**Imports pattern** (use the same barrel as dev-primitives, lines 3–18 of dev-primitives.component.ts).

**`@switch` template body:** No existing analog uses `@switch (block().type)`; this is net-new but the syntactic shape is locked in RESEARCH.md Pattern 4 (lines 480–530 of 03-RESEARCH.md). Copy that block verbatim.

**Signal-input contract** (per UI-SPEC `BlockRenderer` section):
```ts
@Component({ selector: 'app-block-renderer', standalone: true, ... })
export class BlockRendererComponent {
  block = input.required<Block>();
}
```

**Sidenote/parts-list extraction rule:** Empty `@case` arms — parent template iterates `body` twice (RESEARCH.md "Sidenote + parts-list handling rule"). Locked.

---

### `src/content/api/content-source.ts` (TS interface)

**Analog:** `src/content/api/content-api.ts`

**Abstract-class-as-DI-contract pattern** (lines 1–20):
```ts
import type { Article } from '../models/article';
import type { Datasheet } from '../models/datasheet';
import type { Lesson } from '../models/lesson';
import type { Schematic } from '../models/schematic';

export abstract class ContentApi {
  abstract getLesson(slug: string): Promise<Lesson>;
  abstract listLessons(): Promise<Pick<Lesson, 'slug' | 'title' | 'deck' | 'difficulty' | 'estimatedMinutes' | 'publishedAt'>[]>;
  // ...etc
}
```

**`ContentSource` shape** (per RESEARCH.md Pattern 2 lines 410–420): use a TypeScript `interface` (not abstract class) because there is no DI binding for `ContentSource` — it's a build-time-and-runtime contract that `MockContentApi` and `getPrerenderParams` both consume directly. Type-only imports.

**Consider:** keep `ContentApi` as the runtime DI surface; introduce `ContentSource` as the lower-level data port and have `MockContentApi` adapt one to the other. This preserves the existing `inject(CONTENT_API)` callsites in `dev-primitives.component.ts` without changes.

---

### `src/content/api/fixture-content-source.ts` (concrete impl)

**Analog:** `src/content/api/mock-content-api.ts`

**Class structure** (lines 8–63):
```ts
@Injectable({ providedIn: 'root' })
export class MockContentApi extends ContentApi {
  private async readJson<T>(path: string): Promise<T> {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Mock fixture not found: ${path}`);
    return (await res.json()) as T;
  }

  override getLesson(slug: string): Promise<Lesson> {
    return this.readJson<Lesson>(`/assets/mock-data/lessons/${slug}.json`);
  }
  // ...etc
}
```

**Slug-list rule:** the existing `MockContentApi.listLessons()` hardcodes slugs (lines 21–25). For P3, replace this with a call into `fixture-loader.ts` (`listLessonSlugs()`) so the prerender source matches the runtime list — no drift. The runtime path still uses `fetch('/assets/...')` (works in browser); only the build-time `getPrerenderParams` call uses `fs.readFile` from `fixture-loader.ts`.

---

### `src/content/api/fixture-loader.ts` (build-time loader)

**Analog:** `scripts/lint-fixtures.mjs`

**Node fs + path imports** (lines 27–33):
```js
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const FIXTURE_ROOT = join(REPO_ROOT, 'src', 'assets', 'mock-data');
```

**Walk-fixtures pattern** (lines 167–184 — `listFixtures()` function): iterates `lessons / articles / datasheets / schematics` subdirs, filters `*.json`, returns `{ path, kind }` tuples.

**P3 deviation from analog:** `fixture-loader.ts` is a `.ts` file (consumed by both `MockContentApi` runtime AND `app.routes.server.ts` build-time), so use `node:fs/promises` (per RESEARCH.md Pattern 2 line 385) and named exports `listLessonSlugs()`, `loadLesson(slug)`, etc. The `MOCK_ROOT` constant resolves relative to `process.cwd()` at build time (Angular CLI runs from repo root).

---

### `scripts/tokenize-fixtures.mjs` (Node prebuild script)

**Analog:** `scripts/lint-fixtures.mjs`

**Script header + CLI shape** (lines 1–35):
```js
// Editorial-smell + content-gate lint for mock-data JSON fixtures.
// ... header explaining purpose, exit codes, references to D-* decisions ...

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const FIXTURE_ROOT = join(REPO_ROOT, 'src', 'assets', 'mock-data');
```

**Walk-fixtures + mutate pattern**: tokenize-fixtures uses the same `listFixtures()` / `walkStrings()` recursion (lines 87–98 of lint-fixtures.mjs) but instead of reporting violations, it mutates `code` blocks to add a `tokens` field. RESEARCH.md Pattern 6 (lines 555–600 of 03-RESEARCH.md) provides the Shiki-specific body.

**Help + exit shape** (lines 218–256): `--help` flag, `printHelp()`, `main(argv)` returning exit code, `process.exit(main(process.argv.slice(2)))`. Match exactly.

**`pnpm` wiring**: extend `package.json` scripts with `"prebuild": "node scripts/tokenize-fixtures.mjs"` and `"tokenize": "node scripts/tokenize-fixtures.mjs"`. Same pattern as the existing `"lint": "... && node scripts/lint-fixtures.mjs"` (`package.json` line 15).

---

### `src/app/app.routes.ts` (modified — extend)

**Analog:** itself (current 3 entries).

**Lazy-loaded route pattern** (existing):
```ts
{
  path: 'dev/primitives',
  loadComponent: () =>
    import('./pages/dev-primitives/dev-primitives.component').then(
      (m) => m.DevPrimitivesComponent,
    ),
  title: 'Примітиви — Arduino UA',
},
```
Apply per UI-SPEC routing table for `/lessons`, `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug`, `/about`, `/preview/:contentType/:token`, wildcard `**`. Each gets a `title` from UI-SPEC §Copywriting "<title> —" rows. For dynamic-slug pages, the `title` comes from the resolved data (set via `Title.setTitle()` inside the component, not the static route field).

---

### `src/app/app.routes.server.ts` (modified — extend)

**Analog:** itself.

**Existing pattern** (whole file — 14 lines):
```ts
import { RenderMode, ServerRoute } from '@angular/ssr';
export const serverRoutes: ServerRoute[] = [
  { path: 'dev/primitives', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
```

Extend with `getPrerenderParams()` for each dynamic route per RESEARCH.md Pattern 1 (lines 320–369). `/preview/:contentType/:token` joins `/dev/primitives` as `RenderMode.Client`.

**`getPrerenderParams()` constraint** (RESEARCH.md Pitfall A + Pattern 1 line 371): NEVER call `inject()` after `await` — use the pure `fixture-loader.ts` functions. Locked.

---

### `scripts/lint-fixtures.mjs` (modified — extend)

**Analog:** itself.

**Image-dimension verification extension** (D-AMEND-02): add a new gate that, for each `figure` and `pinout` block, reads the image header at `block.src` (resolved against `src/assets/`) and verifies `width`/`height` match the on-disk dimensions. Use `image-size` (or pure-JS equivalent) — planner picks per CONTEXT.md Claude's Discretion.

**Where to plug in**: extend `checkContentGates(parsed, kind, fileLabel)` (lines 116–165). Same return shape `{ kind, message, file }` so the `main()` violation collation (lines 246–254) requires no change.

---

### `src/content/models/block.ts` (modified — additive)

**Analog:** itself.

**Discriminated-union pattern** (lines 1–37): Adds `width: number; height: number` (required) to:
```ts
| { type: 'figure'; number?: number; src: string; alt: string; captionHtml?: string; fullBleed: boolean; width: number; height: number }
| { type: 'pinout'; src: string; alt: string; pins: { x: number; y: number; label: string; role: string }[]; width: number; height: number }
```
Also add the optional `tokens?: string` field to the `code` variant (D-SHIKI-03 cache field). Order: amend `block.ts` first (Plan 03-01), THEN every fixture, THEN extend the lint rule.

---

## Shared Patterns

### Component file conventions

**Source:** `src/app/pages/dev-primitives/dev-primitives.component.ts` lines 22–44, `src/app/pages/glyph-audit/glyph-audit.component.ts` lines 29–35.

**Apply to:** every NEW page template + chrome component.

- `standalone: true`
- `changeDetection: ChangeDetectionStrategy.OnPush`
- `templateUrl` + `styleUrl` (separate files; NO inline templates over ~10 lines, NO Tailwind, NO inline `styles` array)
- Class fields: `private readonly` for injected services; `readonly` signals for state.
- `inject(Meta)` + `inject(Title)` in `ngOnInit()` to set page title and (for non-public pages) `<meta name="robots" content="noindex">`.
- Editorial pages and library pages are PUBLIC — DO NOT add `noindex` to `LessonPage`, `ArticlePage`, `LessonLibraryPage`, `HomePage`, `AboutPage`, `DatasheetPage`, `SchematicPage`, `NotFoundPage`. ADD `noindex` to `PreviewStubPage` (UI-SPEC §`/preview/*` CSR stub explicit rule).

### `core-ui` boundary

**Source:** UI-SPEC §Module organization, `src/app/pages/dev-primitives/dev-primitives.component.ts` line 18.

**Apply to:** every chrome + page + BlockRenderer file.

Always import primitives from the `@arduino/core-ui` barrel:
```ts
import { HeadingComponent, BodyComponent, /* … */ } from '@arduino/core-ui';
```
NEVER import from `projects/core-ui/src/lib/<name>` directly — the barrel is the public API.

### Intl facade

**Source:** `src/lib/intl.ts` (entire file, 21 lines).

**Apply to:** every call site that formats dates, numbers, or Ukrainian-collated strings. Per UI-SPEC §Copywriting:

- `LessonPage` meta line: `formatDateUk(publishedAt, { dateStyle: 'long' })` + `formatNumberUk(estimatedMinutes)`
- `ArticlePage` meta line: `formatDateUk(publishedAt, { dateStyle: 'long' })`
- `LessonLibraryPage` row meta: `formatNumberUk(estimatedMinutes)`
- `HomePage` recent-list: same as library row

NEVER use `toLocaleDateString()` or `toLocaleString()` — banned by no-restricted-syntax ESLint rule (D-28).

### Difficulty enum mapping

**Source:** UI-SPEC §Copywriting + RESEARCH.md "Difficulty value mapping" (lines 824–832).

**Apply to:** `LessonPage`, `LessonLibraryPage`, `HomePage` recent list.

Define a single `DIFFICULTY_LABELS_UK: Record<'beginner'|'intermediate', string>` const. Place in `src/lib/` (alongside `intl.ts`) so all three callers share it. NEVER inline the mapping per-component.

### Standalone + lazy-loaded route

**Source:** `src/app/app.routes.ts` (whole file).

**Apply to:** every NEW route. The existing `loadComponent: () => import(...)` shape with `.then(m => m.<Class>)` and a `title` field is the locked convention. No `RouterModule.forRoot`, no eager loading.

### `RenderMode.Client` opt-out

**Source:** `src/app/app.routes.server.ts` (whole file, 14 lines).

**Apply to:** `/preview/:contentType/:token` (P3 net-new) + `/dev/primitives` (P2 inherited).

The header comment block on lines 1–9 explaining "RenderMode.Client does NOT introduce a Node SSR runtime" is load-bearing — preserve it and extend with a P3 line for the preview stub.

### Editorial fixture content gate

**Source:** `scripts/lint-fixtures.mjs` lines 116–165.

**Apply to:** Every fixture amendment in Plan 03-01 must continue to pass `checkContentGates()` after `width`/`height` migration. The image-dimension extension is additive — preserves all existing gates.

### Three-breakpoint verification

**Source:** UI-SPEC §Three-Breakpoint Verification + accumulating `docs/typography-checklist.md`.

**Apply to:** every layout-touching plan (chrome, every page template, BlockRenderer). Walk <768 / 768–1199 / ≥1200 manually before phase exit; record findings in `docs/typography-checklist.md` under a P3 section.

### Force-en audit

**Source:** UI-SPEC §Force-en Locale Audit + `docs/force-en-audit.md` (P1, P2 rows already present).

**Apply to:** the phase-exit audit plan. Walk every public route under `en-US` browser locale; verify `<html lang="uk">`, dates, numbers, all static strings render Ukrainian. Append a P3 row to `docs/force-en-audit.md`.

---

## No Analog Found

| File | Role | Data Flow | Reason | Planner Source |
|------|------|-----------|--------|----------------|
| `src/assets/shiki/arduino-paper.json` | TextMate theme JSON | data | Hand-authored theme — first time the project ships a TM theme. | UI-SPEC §Shiki Integration + RESEARCH.md Pattern 6 (D-SHIKI-02). Background = `--color-paper`, foreground = `--color-ink`, comments = italic `--color-ink-muted`, keywords = weight 600, no chromatic alarm. |
| Route input binding (`withComponentInputBinding()`) | router config | n/a | Project does not currently use route inputs; existing pages read params via `inject(ActivatedRoute)`. | RESEARCH.md Pattern 3 lines 437–451. Optional — planner may opt for `inject(ActivatedRoute).snapshot.params` per the existing zero-analog state and avoid touching `app.config.ts`. |
| Lighthouse CLI runner | Node audit | request-response | No prior performance-gate script in repo. | RESEARCH.md Pattern 8 (lines 642–688). `pnpm lighthouse:lesson` invokes `lighthouse` CLI against a static-served `dist/browser/`. |
| `NgOptimizedImage` swap | Angular directive usage | n/a | Project currently uses raw `<img>` in `Figure` + `Pinout`. | RESEARCH.md Pattern 7 (lines 613–641). `[ngSrc]`, `[width]`, `[height]`, `[priority]` for first figure. Requires `provideImgixLoader`/default loader — planner picks. |

---

## Metadata

**Analog search scope:**
- `src/app/` (all pages + config)
- `src/content/api/`
- `src/content/models/`
- `src/lib/`
- `projects/core-ui/src/lib/` (primitives — for selector/imports reference only)
- `scripts/` (Node CLI scripts)
- `package.json` (script wiring)

**Files scanned:** 14 source files read in full, 8 grepped/listed, 1 of 1199 research lines deeply mined (Patterns 1–6).

**Pattern extraction date:** 2026-05-01.
