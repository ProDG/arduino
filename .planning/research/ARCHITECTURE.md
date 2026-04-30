# Architecture Research

**Domain:** Headless editorial site (Wagtail 7.4 LTS BE + Angular 21 zoneless FE, single VPS)
**Researched:** 2026-04-30
**Confidence:** HIGH on FE structure and topology; MEDIUM-HIGH on Wagtail headless choices (verified against current Wagtail 7.x docs); MEDIUM on annotated-code StreamField modeling (no canonical pattern in docs — recommendation is opinionated).

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Browser (Ukrainian readers)                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Caddy (or nginx) reverse proxy :443                 │
│   /api/*, /cms/*, /media/*, /documents/*  →  Wagtail (Gunicorn)     │
│   everything else                          →  Angular SSR (Node)    │
└──────────────────┬───────────────────────────────────┬──────────────┘
                   │                                   │
                   ▼                                   ▼
        ┌──────────────────────┐         ┌────────────────────────────┐
        │  Angular 21 SSR      │         │  Wagtail 7.4 LTS           │
        │  Node :4000          │         │  Gunicorn :8000            │
        │  zoneless, signals   │         │  DRF v2 API + admin        │
        │  ContentApi service  │◀───────▶│  + wagtail-headless-preview│
        └──────────────────────┘  HTTP   └────────────┬───────────────┘
                                                       │
                                                       ▼
                                          ┌────────────────────────┐
                                          │  PostgreSQL :5432       │
                                          │  (local socket, not net)│
                                          └────────────────────────┘
                                          ┌────────────────────────┐
                                          │  Local FS: /srv/media/  │
                                          │  (Wagtail-managed)      │
                                          └────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Caddy/nginx** | TLS termination, path-based routing, static media serving, gzip/brotli | Caddy preferred (auto-TLS, simpler config) |
| **Angular SSR (Node)** | Render every page server-side for SEO + first-paint quality; hydrate to zoneless client | `@angular/ssr` (built-in v17+, mature in v21) |
| **ContentApi service (Angular)** | Single typed seam between FE and content source; swappable mock ↔ Wagtail | Interface + two implementations (`MockContentApi`, `WagtailContentApi`) |
| **Wagtail 7.4 LTS** | Page models, StreamField content, admin UX, image renditions, autosave, preview | Django + Wagtail; DRF v2 for read API |
| **wagtail-headless-preview** | Bridge editor preview → Angular renders draft via signed token | Official Torchbox package, redirect-mode (Wagtail 7.1+) |
| **PostgreSQL** | Pages, revisions, users, search index | Single instance, listening on UNIX socket only |
| **Media FS** | Originals + Wagtail-generated renditions | `/srv/media/` mounted into both Wagtail (write) and Caddy (read) |
| **systemd** | Process supervision for `wagtail.service`, `angular-ssr.service`, `caddy.service` | No Docker required v1; can add later |

---

## Recommended Project Structure

### Repository layout (monorepo, two top-level apps)

```
arduino-hub/
├── frontend/                      # Angular 21 workspace
│   ├── projects/
│   │   ├── web/                   # main app (SSR-enabled)
│   │   │   └── src/app/
│   │   │       ├── core/          # ContentApi, http, error, SEO meta
│   │   │       ├── content/       # typed page-model contracts (lives here, FE owns the shape v1)
│   │   │       │   ├── models/    # Lesson, Article, Datasheet, Schematic, blocks
│   │   │       │   ├── api/       # ContentApi interface + Mock/Wagtail impls
│   │   │       │   └── stores/    # signal stores (lessonIndex, currentPage)
│   │   │       ├── features/      # one folder per route family
│   │   │       │   ├── home/
│   │   │       │   ├── lessons/   # list + detail
│   │   │       │   ├── articles/
│   │   │       │   ├── datasheets/
│   │   │       │   └── schematics/
│   │   │       ├── layout/        # header, footer, two-column shell, sidenote rail
│   │   │       └── app.routes.ts
│   │   └── core-ui/               # PUBLISHABLE library: design system primitives
│   │       └── src/lib/
│   │           ├── primitives/    # Heading, Body, Aside, Sidenote, Figure, CodeBlock, Diff, Pinout
│   │           ├── layout/        # PageShell, TwoColumn, MarginRail
│   │           └── public-api.ts
│   ├── styles/                    # global SCSS — tokens + base only, NO components
│   │   ├── tokens/
│   │   │   ├── _typography.scss   # font stacks, scale, line-heights
│   │   │   ├── _spacing.scss      # spacing scale (rhythm units)
│   │   │   ├── _color.scss        # raw palette
│   │   │   ├── _semantic.scss     # semantic mapping (--color-text-body etc.)
│   │   │   └── _breakpoints.scss
│   │   ├── base/
│   │   │   ├── _reset.scss
│   │   │   ├── _typography.scss   # base prose styles, Cyrillic font-face
│   │   │   └── _layout.scss
│   │   └── styles.scss            # entry: forwards tokens + base
│   ├── mock-data/                 # JSON fixtures matching content/models/
│   │   ├── lessons/
│   │   ├── articles/
│   │   ├── datasheets/
│   │   └── schematics/
│   └── angular.json
│
├── backend/                       # Wagtail 7.4 LTS Django project (Phase 4+)
│   ├── arduino_hub/               # settings, urls, wsgi
│   ├── apps/
│   │   ├── lessons/               # LessonPage, LessonIndexPage
│   │   ├── articles/              # ArticlePage
│   │   ├── datasheets/            # DatasheetPage, PinoutBlock
│   │   ├── schematics/            # SchematicPage
│   │   └── content_blocks/        # shared StreamField blocks (Paragraph, Heading, Sidenote, CodeBlock, Diff, Figure)
│   ├── api/                       # DRF v2 customizations, custom serializers
│   └── manage.py
│
├── deploy/                        # systemd units, Caddyfile, backup scripts
│   ├── caddy/Caddyfile
│   ├── systemd/
│   │   ├── arduino-wagtail.service
│   │   └── arduino-ssr.service
│   └── backup.sh
│
└── .planning/                     # GSD artifacts (already exists)
```

### Structure Rationale

- **Monorepo with `frontend/` and `backend/`:** Two deploy units, one git history. Avoids cross-repo coordination for a solo author. Phase 1-3 commits touch only `frontend/`; `backend/` arrives in Phase 4.
- **`core-ui` as a library project (not just a folder):** Forces a public API boundary. Components in `features/` cannot reach into `core-ui` internals — they consume the published surface only. This is what keeps editorial primitives reusable and prevents one feature from special-casing a `Heading` for itself.
- **`styles/` holds tokens + base only, never components:** Component styles live next to their component (`*.component.scss`). Global SCSS is reserved for the things that must be global: token definitions, font-face, reset, prose base. A font-pairing change is then literally a one-file edit (`tokens/_typography.scss`).
- **`content/` directory in the main app (not in core-ui):** The page-model contracts are application concerns, not design-system concerns. `core-ui` should not know what a "Lesson" is — it knows what a `Heading` and `CodeBlock` are. This boundary is what lets the design system stay reusable for future content types.
- **`mock-data/` as flat JSON files:** Static JSON beats programmatic mocks because (a) it forces the contract to be serializable from day one (which Wagtail will produce), (b) it can be served via `assets/` or a tiny mock interceptor without ceremony, (c) reviewers can read it.

---

## Architectural Patterns

### Pattern 1: ContentApi seam (mock ↔ Wagtail swap)

**What:** A single TypeScript interface, two implementations. DI provides whichever is configured at build time. Components never know which is active.

```typescript
// content/api/content-api.ts
export interface ContentApi {
  getLesson(slug: string): Observable<Lesson>;
  listLessons(): Observable<LessonSummary[]>;
  getArticle(slug: string): Observable<Article>;
  getDatasheet(slug: string): Observable<Datasheet>;
  getSchematic(slug: string): Observable<Schematic>;
  getHomePage(): Observable<HomePage>;
}
export const CONTENT_API = new InjectionToken<ContentApi>('CONTENT_API');

// content/api/mock-content-api.ts — reads /assets/mock-data/*.json
// content/api/wagtail-content-api.ts — hits /api/v2/pages/?type=lessons.LessonPage&slug=...

// app.config.ts
{ provide: CONTENT_API,
  useClass: environment.useMockContent ? MockContentApi : WagtailContentApi }
```

**When to use:** Always — this is the FE-first discipline made structural.
**Trade-offs:** Forces you to commit to the contract early (good). Mock implementation must keep parity with real one (small ongoing cost).

### Pattern 2: Signal stores for page state, services for fetching

**What:** Use RxJS to fetch (`HttpClient` returns `Observable`); convert to signals at the component boundary using `toSignal()`. Component templates read signals only. Cross-route shared state (e.g., the lesson index for the navigation menu) lives in a thin signal store.

**When:** Default. Editorial content is mostly read-once-per-page; you do not need NgRx or signal-store libraries for v1. A handful of `signal()` and `computed()` calls in a service is enough.
**Trade-offs:** If shared mutable state grows beyond ~3 stores, consider `@ngrx/signals`. For v1, vanilla signals win on simplicity.

### Pattern 3: Page-type → component dynamic mapping

**What:** Every Wagtail page exposes `meta.type` (e.g., `"lessons.LessonPage"`). Angular maps that string to a component. Useful for the preview flow and any "render whatever this URL is" route.

```typescript
const PAGE_COMPONENTS: Record<string, Type<unknown>> = {
  'lessons.LessonPage': LessonPageComponent,
  'articles.ArticlePage': ArticlePageComponent,
  'datasheets.DatasheetPage': DatasheetPageComponent,
  'schematics.SchematicPage': SchematicPageComponent,
};
```

**When:** Used for the `/preview` route (renders draft fetched by token) and as a fallback resolver. Normal public routes can stay statically declared (`/lessons/:slug` → `LessonPageComponent`) for clarity.
**Trade-offs:** Adds one indirection. Worth it specifically for preview; not necessary for the main router.

### Pattern 4: StreamField → typed block discriminated union

**What:** Each StreamField block becomes a TypeScript discriminated union member. A single `<block-renderer [block]="b" />` switch component dispatches to the right primitive.

```typescript
type Block =
  | { type: 'paragraph'; value: { html: string } }
  | { type: 'heading'; value: { level: 2|3|4; text: string; id: string } }
  | { type: 'sidenote'; value: { html: string; anchor?: string } }
  | { type: 'code'; value: CodeBlock }
  | { type: 'diff'; value: DiffBlock }
  | { type: 'figure'; value: FigureBlock }
  | { type: 'pinout'; value: PinoutBlock };

interface CodeBlock {
  language: 'cpp' | 'arduino' | 'plaintext';
  code: string;
  startLine?: number;
  annotations: Array<{ line: number; html: string }>;  // line-level margin notes
  highlights?: number[];                                 // emphasis lines
}

interface DiffBlock {
  language: 'cpp' | 'arduino';
  before: string;
  after: string;
  annotations: Array<{ line: number; side: 'after'; html: string }>;
}
```

**When:** Always. This is the contract that mocks and Wagtail must both satisfy.
**Trade-offs:** None for editorial content. The discriminated union gives exhaustiveness checking in the renderer switch.

### Pattern 5: Annotated code in Wagtail StreamField (the hard one)

**What:** A `CodeBlock` StreamField block is a `StructBlock` with three children: `language` (ChoiceBlock), `code` (TextBlock), and `annotations` (ListBlock of StructBlock with `line: IntegerBlock` + `note: RichTextBlock`). Highlighting is done client-side at render time (Prism or Shiki). The CMS stores plain code and structured annotation metadata — never highlighted HTML.

**When to use:** This is the recommendation. Storing pre-highlighted HTML would couple content to the syntax highlighter version. Storing structure + annotations keeps content portable.
**Trade-offs:** Editor must enter line numbers manually (acceptable for a solo author). Alternative — annotating by code substring — was rejected because edits invalidate the anchor.

---

## Data Flow

### Read flow (public page request)

```
Reader → Caddy :443
       → Angular SSR (Node :4000)
            ↓ ContentApi.getLesson(slug)
            ↓ HttpClient GET /api/v2/pages/?type=lessons.LessonPage&slug=foo&fields=*
       → Wagtail DRF v2 (:8000)
            ↓ ORM query
       → PostgreSQL
       ← JSON {meta, title, intro, body: [...blocks]}
       ← SSR rendered HTML + serialized state for hydration
       ← Browser hydrates to zoneless client; subsequent navigations are CSR via ContentApi
```

### Editor preview flow

```
Editor in Wagtail admin → clicks "Preview"
   → wagtail-headless-preview generates signed token, redirects (Wagtail 7.1+ mode)
   → https://site/preview?content_type=lessons.LessonPage&token=...
   → Angular /preview route resolves: GET /api/v2/page_preview/?token=...
   → Wagtail returns DRAFT serialized as same shape as published JSON
   → Angular renders via PAGE_COMPONENTS dynamic map
   → Editor sees production-faithful render of unsaved draft
```

### Build/CI flow (mock-driven phases)

```
Phase 1-3: `ng build` with environment.useMockContent = true
   → MockContentApi reads /assets/mock-data/*.json at runtime
   → No backend required to develop, review, or demo

Phase 4+: same Angular build, environment.useMockContent = false
   → WagtailContentApi hits /api/v2/...
   → Mock JSON files retained as fixture seeds for E2E and Storybook
```

### State management (FE)

```
HttpClient Observable
   ↓ toSignal()
Component-local signal  ←→  template
   ↑
  computed() for derived values (e.g., table of contents from headings)

Cross-route shared state (lesson index for nav):
   LessonIndexStore { lessons: Signal<LessonSummary[]>, load(): void }
   provided in root, fetched once per session
```

---

## Single-VPS Deployment Topology

### Services on the box

| Service | Port | User | Purpose |
|---------|------|------|---------|
| Caddy | :80, :443 | caddy | TLS, reverse proxy, static media |
| Angular SSR (Node) | :4000 (loopback only) | www-data | Render Angular pages |
| Gunicorn (Wagtail) | :8000 (loopback only) | wagtail | Serve admin + API |
| PostgreSQL | UNIX socket | postgres | Data |

### Caddyfile sketch

```
arduino-hub.example.com {
    encode zstd gzip

    # Wagtail admin + API + auth
    handle /cms/* { reverse_proxy 127.0.0.1:8000 }
    handle /api/* { reverse_proxy 127.0.0.1:8000 }
    handle /django-admin/* { reverse_proxy 127.0.0.1:8000 }

    # Media (originals + Wagtail renditions) served directly off disk
    handle /media/*     { root * /srv/arduino-hub; file_server }
    handle /documents/* { reverse_proxy 127.0.0.1:8000 }  # auth-checked

    # Everything else → Angular SSR
    handle { reverse_proxy 127.0.0.1:4000 }
}
```

### Storage layout

```
/srv/arduino-hub/
├── media/             # Wagtail uploads (originals + renditions)
├── backups/           # nightly pg_dump + media tarball
└── releases/
    ├── frontend/      # Angular SSR build artifacts
    └── backend/       # Wagtail venv + source
```

### Backups

Nightly cron: `pg_dump | gzip > backups/db-$(date).sql.gz` and `tar czf backups/media-$(date).tgz /srv/arduino-hub/media`. Rotate to 14 days. Optional rclone push to off-site (B2/S3) — recommended but not blocking.

### What the topology deliberately is NOT

- No Docker (single VPS, single author, no orchestration win — systemd is enough)
- No Redis (no cache invalidation needed; DRF response is already fast; revisit only if proven slow)
- No CDN (small audience; Caddy gzip + browser caching of immutable assets covers it)
- No separate worker process (no async tasks in v1; if needed later, add `django-q2` or similar)

---

## Build Order — FE-first artifacts per phase

This is the section that drives the roadmap. Each phase produces concrete artifacts that unblock the next.

### Phase 1 — Design system foundation
**Artifacts produced:**
- `styles/tokens/*.scss` (typography, spacing, color, semantic, breakpoints) — **font-pairing change is one file from this point on**
- `styles/base/*.scss` (reset, prose base, Cyrillic font-face)
- `core-ui` library scaffolded with empty `public-api.ts`
- One reference page (e.g., a static "typography specimen") rendering the type scale on real Cyrillic copy

**Unblocks:** Phase 2 can build primitives against tokens.

### Phase 2 — Component primitives + page-model contract
**Artifacts produced:**
- `core-ui` primitives shipped: `Heading`, `Body`, `Aside`, `Sidenote`, `Figure`, `FigureWithCaption`, `CodeBlock`, `Diff`, `Pinout`, `PageShell`, `TwoColumn`
- **`content/models/*.ts` — the page-model contract is LOCKED here.** Lesson, Article, Datasheet, Schematic, and the discriminated `Block` union (Paragraph, Heading, Sidenote, CodeBlock, Diff, Figure, Pinout). This is the contract Wagtail will be required to produce.
- `ContentApi` interface defined; `MockContentApi` reading from `/assets/mock-data/`
- `mock-data/` populated with at least one rich example per page type

**Unblocks:** Phase 3 can build full page templates against the contract.

### Phase 3 — Page templates + routing + SSR
**Artifacts produced:**
- All routes wired: `/`, `/lessons`, `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug`
- `LessonPageComponent`, `ArticlePageComponent`, etc., each consuming `ContentApi`
- `BlockRenderer` switch dispatching the discriminated union
- Angular SSR enabled and verified against mock data
- Responsive verified across phone/laptop/FHD+
- `/preview` route stub with `PAGE_COMPONENTS` dynamic map (no token validation yet — placeholder)

**Unblocks:** Design freeze checkpoint. Solo author can now read mock content as if the site were live.

### Phase 4 — Wagtail backend skeleton
**Artifacts produced:**
- Wagtail 7.4 LTS project with apps: `lessons`, `articles`, `datasheets`, `schematics`, `content_blocks`
- Page models with fields matching `content/models/*.ts` (1:1 — this is enforced)
- StreamField blocks matching the FE `Block` union, including `CodeBlock` with `annotations` ListBlock
- DRF v2 API enabled at `/api/v2/`, custom serializers where needed to match FE shape exactly
- `WagtailContentApi` implementation; environment flag flips mock → real
- One lesson migrated from mock JSON to Wagtail to prove the contract holds

**Unblocks:** Phase 5 deployment.

### Phase 5 — Single-VPS deployment
**Artifacts produced:**
- Caddyfile, systemd units (`arduino-wagtail.service`, `arduino-ssr.service`)
- PostgreSQL configured (UNIX socket, daily backups)
- Media directory + permissions
- `wagtail-headless-preview` integrated; preview redirect mode (Wagtail 7.1+) configured
- Backup script + cron + tested restore
- HTTPS via Caddy auto-TLS

**Unblocks:** Author can publish real content.

### Phase 6 — Content migration + polish
**Artifacts produced:**
- All initial lessons/articles/datasheets in Wagtail
- Mock JSON retained as E2E fixtures only
- SEO meta + Open Graph
- Accessibility pass
- Performance budget verified (Lighthouse on real VPS)

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k MAU | Current topology is overkill; single VPS with 2-4 GB RAM is plenty |
| 1k-50k MAU | Add HTTP caching headers on `/api/v2/`, enable Caddy response caching for anonymous reads, bump VPS to 4-8 GB |
| 50k+ MAU | Put Cloudflare/Bunny in front (free tier handles it). Move media to object storage (S3/B2) via `wagtail-storages`. Still no need to split FE/BE servers. |
| 500k+ MAU | Re-evaluate. Probably still fine on one bigger box; otherwise split: media → CDN, BE → its own box, FE SSR → its own box. **Not a v1 concern.** |

### First bottleneck (realistic)

DRF v2 N+1 queries on richly-nested StreamField pages. Mitigation: `select_related`/`prefetch_related` in custom viewset, and per-page response cache (60s) once content is stable. Do not pre-optimize in Phase 4 — measure first.

---

## Anti-Patterns

### Anti-Pattern 1: Designing the page-model contract from Wagtail outward

**What people do:** Start in Wagtail, generate a serializer, type the FE off whatever DRF emits.
**Why it's wrong:** Inverts the build-order discipline. The CMS shape leaks into Angular components. Editorial decisions get made by `WagtailPageSerializer` defaults.
**Do this instead:** Lock `content/models/*.ts` in Phase 2 from the *reading* requirements. Wagtail's job in Phase 4 is to *match* that shape, not to define it. If a serializer mismatch appears, customize the serializer — don't change the FE type.

### Anti-Pattern 2: Putting component styles in `styles/`

**What people do:** Global SCSS partials per component because "it feels organized."
**Why it's wrong:** Styles get ordering-dependent, specificity wars start, and the design system stops being a system — it becomes a stylesheet.
**Do this instead:** Component styles in `*.component.scss` next to the component. Global SCSS is tokens + base + reset only.

### Anti-Pattern 3: Storing pre-highlighted code HTML in Wagtail

**What people do:** Run Pygments at save time, store the resulting HTML in a RichTextField.
**Why it's wrong:** Highlighter version becomes part of content. Re-themeing requires re-saving every page. Annotations have nowhere structured to live.
**Do this instead:** Store plain code + structured annotations. Highlight at render time client-side (Shiki recommended — themable, supports Arduino C++ via TextMate grammars, works in SSR).

### Anti-Pattern 4: NgRx (or any heavy store) for v1

**What people do:** Reach for `@ngrx/store` because "we'll need it later."
**Why it's wrong:** This is a read-mostly editorial site. `signal()` + `computed()` covers every state need in v1.
**Do this instead:** Vanilla signals + a couple of plain-class signal stores. Revisit only when concrete pain appears.

### Anti-Pattern 5: GraphQL (wagtail-grapple) for v1

**What people do:** Default to GraphQL because "it's modern."
**Why it's wrong:** Wagtail's DRF v2 is first-party, ships with the LTS, supports filtering/pagination, and matches our content shapes 1:1. Grapple adds a dependency, a schema layer, and an Apollo-shaped client to maintain — for a single-author read-only site.
**Do this instead:** Wagtail DRF v2. Re-evaluate only if a concrete query pattern proves painful in REST.

### Anti-Pattern 6: Annotating code by character offset or substring match

**What people do:** "Annotate the line containing `digitalWrite`."
**Why it's wrong:** Code edits silently invalidate anchors. Lessons get progressive code; substring annotations break on every revision.
**Do this instead:** Annotate by line number. Brittle on heavy edits, but the brittleness is *visible* in the editor, not silent at render time.

---

## Integration Points

### External Services (v1)

| Service | Integration | Notes |
|---------|-------------|-------|
| Let's Encrypt | Caddy auto-TLS | Zero config |
| (none beyond TLS) | — | Self-contained by design |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `core-ui` ↔ `features/` | Public API only (`public-api.ts`) | Enforce via lint rule; no deep imports |
| `features/` ↔ `ContentApi` | DI'd interface | Components never instantiate or know the impl |
| Angular ↔ Wagtail | HTTP REST (`/api/v2/`) + preview token | Single seam; both sides know the same JSON shape |
| Wagtail ↔ PostgreSQL | UNIX socket | Postgres not exposed on TCP at all |
| Caddy ↔ media FS | Direct file_server | Wagtail does not proxy static media |

---

## Confidence Notes

- **HIGH:** Angular 21 zoneless + signals + SSR patterns; FE folder layout; ContentApi seam; single-VPS topology with Caddy/systemd; Wagtail DRF v2 as the headless choice.
- **MEDIUM-HIGH:** Page-model contract structure — confidence is high in the *approach* (FE owns the shape, Wagtail conforms); medium on exact field names, which will refine in Phase 2.
- **MEDIUM:** Annotated CodeBlock StreamField design. There is no canonical Wagtail pattern for line-level annotations published in docs. The recommendation (StructBlock + ListBlock of {line, note}) is an opinionated synthesis. Worth a 30-minute spike at Phase 4 start to validate against Wagtail 7.4's actual block API.
- **MEDIUM:** SSR vs prerender vs CSR. Recommendation is SSR-with-hydration because (a) editorial site benefits from full SSR for SEO + first paint, (b) Angular 21's `@angular/ssr` is mature, (c) single VPS can run a Node process trivially. Prerender (build-time SSG) was considered but rejected for v1 because every content edit would require a redeploy — kills the autosave/preview value of Wagtail 7.4.

---

## Sources

- [Wagtail Headless Support — official docs](https://docs.wagtail.org/en/latest/advanced_topics/headless.html)
- [Wagtail API v2 usage guide](https://docs.wagtail.org/en/stable/advanced_topics/api/v2/usage.html)
- [wagtail-headless-preview (Torchbox)](https://github.com/torchbox/wagtail-headless-preview)
- [Angular 21 zoneless engineering notes](https://medium.com/@flaviusson/zoneless-signals-performance-engineering-in-angular-21-ca55a21b556d)
- [Angular 21 release breakdown](https://www.kellton.com/kellton-tech-blog/angular-21-release-features-benefits-migration-guide)
- [Angular folder structure 2026](https://medium.com/@bolik/angular-best-practice-file-structure-principles-2026-41f1d1383cda)
- Project context: `.planning/PROJECT.md`

---
*Architecture research for: headless editorial CMS site (Wagtail + Angular)*
*Researched: 2026-04-30*
