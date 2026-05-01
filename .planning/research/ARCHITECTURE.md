# Architecture Research

**Domain:** Headless editorial site (Wagtail 7.4 LTS BE + Angular 21 zoneless FE, Dockerized single VPS)
**Researched:** 2026-04-30 — last updated 2026-05-01 to reflect locked architecture changes (Docker for BE, MinIO for media, SSG-only / no SSR).
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
│                Traefik (container) — :80 → :443                      │
│  Label-driven routing, Let's Encrypt auto-TLS, HTTP/2 + HTTP/3       │
└──────┬───────────────────┬───────────────────┬───────────────────────┘
       │                   │                   │
       │ /api/*,           │ /media/*          │ everything else
       │ /admin/*,         │                   │ (prerendered Angular)
       │ /preview/*,       │                   │
       │ /django-static/*  │                   │
       ▼                   ▼                   ▼
┌────────────────┐  ┌──────────────────┐ ┌──────────────────────────┐
│ wagtail        │  │ minio :9000      │ │ fe-static (caddy:alpine) │
│ (gunicorn 23,  │  │ (S3-compatible)  │ │ :80 — serves prerendered │
│  in container) │  │  bucket:         │ │  Angular bundle          │
│  :8000         │  │  arduino-media   │ │  (rsynced to host volume │
│  DRF v2 +      │  │                  │ │   /srv/arduino/fe-bundle)│
│  admin +       │  │ stores: original │ │                          │
│  wagtail-      │  │ uploads, image   │ │ /preview/* lives in this │
│  headless-     │  │ renditions, docs │ │ same bundle (CSR-only)   │
│  preview       │  │                  │ │                          │
└───────┬────────┘  └──────────────────┘ └──────────────────────────┘
        │
        │  Docker internal network (no host ports)
        ▼
┌────────────────┐
│ postgres :5432 │
│  (no host port)│
│  data:         │
│  /srv/arduino/ │
│  postgres-data │
└────────────────┘

NO Node SSR. NO host-level web server. NO local-filesystem media.
ContentApi service (Angular) talks to Wagtail at build time (prerender)
AND at runtime (CSR for /preview/* and any client-side fetches).
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Traefik (container)** | TLS termination via Let's Encrypt, label-driven routing across the compose stack, HTTP→HTTPS redirect, HTTP/2 + HTTP/3 | Traefik 3.x; configured via Docker labels on each service |
| **fe-static (container)** | Serves the prerendered Angular bundle on port 80 (Traefik provides TLS upstream); SPA fallback to `index.html`; long-cache headers for `/assets/*` and `/fonts/*` | `caddy:alpine` with a 10-line Caddyfile; mounts `/srv/arduino/fe-bundle` read-only |
| **Angular (build-time prerender + runtime CSR)** | All public routes prerendered at build (`outputMode: "static"`); `/preview/*` runs CSR-only inside the same static bundle | `@angular/ssr` configured for SSG; **no Node SSR runtime** |
| **ContentApi service (Angular)** | Single typed seam between FE and content source; swappable mock ↔ Wagtail | Interface + two implementations (`MockContentApi`, `WagtailContentApi`) |
| **Wagtail 7.4 LTS (container)** | Page models, StreamField content, admin UX, image renditions stored in MinIO, autosave, preview | Django + Wagtail in `python:3.13-slim` image; gunicorn 23 as PID 1; DRF v2 for read API |
| **wagtail-headless-preview** | Bridge editor preview → Angular `/preview/*` route renders draft via signed token | Official Torchbox package, redirect-mode (Wagtail 7.1+) |
| **PostgreSQL 17 (container)** | Pages, revisions, users, search index | Internal Docker network only; data on host-bound named volume `/srv/arduino/postgres-data` |
| **MinIO (container)** | S3-compatible object storage for media originals + Wagtail renditions + collected static admin assets | `minio/minio:latest`; data on host-bound named volume `/srv/arduino/minio-data`; reachable internally as `http://minio:9000`; via Traefik externally as `/media/*` |
| **django-storages[s3] + boto3** | Wagtail's `DEFAULT_FILE_STORAGE` configured against MinIO endpoint; uploads, renditions, and `collectstatic` all go to MinIO | Configured via env vars (`AWS_S3_ENDPOINT_URL`, `AWS_STORAGE_BUCKET_NAME`, credentials) |
| **Docker Compose (host)** | Process supervision, restart policies, network isolation, named volumes, healthchecks | `compose.yml` + `compose.dev.yml` / `compose.prod.yml` overlays; brought up by single host systemd unit `docker-compose@arduino.service` |

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

### Read flow (public page request — production)

```
Reader → Traefik :443
       → fe-static container :80
            ↓ serves prerendered HTML for /lessons/<slug>/index.html
       ← Browser receives fully-rendered editorial HTML
       ← Browser hydrates Angular client-side
       ← For navigations: ContentApi (WagtailContentApi) hits /api/v2/pages/...
                          → Traefik routes to wagtail :8000 → Postgres
                          ← JSON, Angular renders client-side
       ← For images: <picture> srcset URLs point at /media/...
                     → Traefik routes to minio :9000 → object served
```

**Build-time flow (prerender):**
```
ng build (locally or CI) →
  uses ContentApi.listAllSlugs() against Wagtail (or mock fixtures) →
  emits dist/browser/lessons/<slug>/index.html for every slug →
  rsynced to /srv/arduino/fe-bundle on the VPS
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

## Single-VPS Deployment Topology (Docker Compose)

### Services on the box

| Service | Container | Exposed port | Purpose |
|---------|-----------|--------------|---------|
| Traefik | `traefik:3` | :80, :443 (host) | TLS termination, label-driven routing, Let's Encrypt |
| FE-static | `caddy:alpine` | :80 (internal only) | Serves prerendered Angular bundle from host volume |
| Wagtail | custom image (Python 3.13 + uv + gunicorn) | :8000 (internal only) | DRF v2 + admin + headless preview |
| PostgreSQL | `postgres:17` | :5432 (internal only) | Data |
| MinIO | `minio/minio:latest` | :9000, :9001 (internal only; :9000 exposed via Traefik as `/media/*`) | S3-compatible object storage for media |

**Only Traefik publishes ports to the host.** Postgres, MinIO, Wagtail, FE-static are reachable only on the internal Docker network.

### Compose layout (skeletal — see STACK.md §4 for full version)

```yaml
services:
  traefik: { image: traefik:3, ports: ["80:80","443:443"], ... }
  postgres: { image: postgres:17, volumes: ["/srv/arduino/postgres-data:/var/lib/postgresql/data"] }
  minio:    { image: minio/minio, volumes: ["/srv/arduino/minio-data:/data"], labels: [traefik /media/*] }
  wagtail:  { build: ./backend, depends_on: [postgres, minio], labels: [traefik /api,/admin,/preview,/django-static] }
  fe-static:{ image: caddy:alpine, volumes: ["/srv/arduino/fe-bundle:/srv/site:ro"], labels: [traefik catch-all] }
```

### Storage layout (host)

```
/srv/arduino/
├── postgres-data/        # bound into postgres container
├── minio-data/           # bound into minio container (originals + renditions + collectstatic)
├── fe-bundle/            # rsync target for Angular static build (mounted RO into fe-static)
├── backups/
│   ├── pg/               # pg_dump output, restic-managed
│   └── minio-mirror.log  # mc mirror exit codes
└── traefik-letsencrypt/  # Traefik ACME state (named volume)
```

### Backups

| Path | Tool | Off-site target |
|------|------|-----------------|
| `postgres-data` (via `pg_dump`) | `restic` | Backblaze B2 (encrypted) |
| MinIO bucket `arduino-media` | `mc mirror` | Backblaze B2 (separate bucket) |
| Compose files + Traefik dynamic config + secrets sample | private git repo | Github private |

Restore drill (executed BEFORE first content publish): provision a fresh VPS, `docker compose up -d`, `pg_restore` from a `restic snapshot`, `mc mirror b2/arduino-media minio/arduino-media`, verify Wagtail admin shows existing pages and image renditions resolve through the new MinIO instance.

### What the topology deliberately is NOT

- No Node SSR runtime — ever (SSG-only is locked).
- No bare-metal Wagtail/gunicorn/Postgres on the host (all services are containers).
- No host-level Caddy or nginx (Traefik handles edge TLS; an internal `caddy:alpine` only serves the FE bundle).
- No local-filesystem media (MinIO with `django-storages[s3]` is the only path).
- No Kubernetes / k3s / Swarm (Compose is enough for one box).
- No Redis (no cache invalidation needed yet; revisit only if proven slow).
- No CDN (small audience; immutable-asset caching covers it).
- No separate worker process (no async tasks in v1).

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

### Phase 3 — Page templates + routing + static build
**Artifacts produced:**
- All routes wired: `/`, `/lessons`, `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug`, `/schematics/:slug`
- `LessonPageComponent`, `ArticlePageComponent`, etc., each consuming `ContentApi`
- `BlockRenderer` switch dispatching the discriminated union
- Angular configured for `outputMode: "static"` — pure SSG; `ng build` produces `dist/browser/*` with prerendered HTML for every public route. NO Node SSR runtime.
- Responsive verified across phone/laptop/FHD+
- `/preview/<contentType>/<token>` route lives in the same static bundle and runs CSR-only (Angular client fetches preview JSON from Wagtail at runtime)

**Unblocks:** Design freeze checkpoint. Solo author can now read mock content as if the site were live.

### Phase 4 — Wagtail backend skeleton (Dockerized)
**Artifacts produced:**
- Wagtail 7.4 LTS project with apps: `lessons`, `articles`, `datasheets`, `schematics`, `content_blocks`
- `compose.yml` + `compose.dev.yml` defining `wagtail`, `postgres`, `minio` services with healthchecks; FE remains on the host (`pnpm start`)
- Page models with fields matching `content/models/*.ts` (1:1 — this is enforced)
- StreamField blocks matching the FE `Block` union, including `CodeBlock` with `annotations` ListBlock
- DRF v2 API enabled at `/api/v2/`, custom serializers where needed to match FE shape exactly
- `django-storages[s3]` + `boto3` configured against MinIO; `DEFAULT_FILE_STORAGE` = S3 backend; `collectstatic` writes to MinIO
- `WagtailContentApi` implementation; environment flag flips mock → real
- One lesson migrated from mock JSON to Wagtail to prove the contract holds (uploaded image renditions verified to land in MinIO bucket via `mc ls`)

**Unblocks:** Phase 5 deployment.

### Phase 5 — Single-VPS deployment (Docker Compose)
**Artifacts produced:**
- `compose.prod.yml` overlay adding Traefik (Let's Encrypt resolver) and the `fe-static` (`caddy:alpine`) container that serves the prerendered Angular bundle
- Single host systemd unit `docker-compose@arduino.service` brings the stack up on boot — NO `arduino-ssr.service`, NO host-level Wagtail/gunicorn/Caddy/Postgres
- Postgres + MinIO data on host-bound named volumes (`/srv/arduino/postgres-data`, `/srv/arduino/minio-data`); separate volumes prevent media disk-fill from starving Postgres
- `wagtail-headless-preview` integrated; preview redirect mode routes editors to the Angular `/preview/*` CSR route
- Daily backups via two paths: `pg_dump → restic` to B2 for Postgres; `mc mirror` to a separate B2 bucket for MinIO; restore drill executed end-to-end before content publish
- HTTPS via Traefik auto-TLS; Healthchecks.io pings on cert renewal + each backup path
- `deploy/deploy.sh` reproducible from any laptop with SSH access

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
| Wagtail ↔ PostgreSQL | TCP via internal Docker network (`postgres:5432`) | Postgres is NOT published on the host; reachable only by containers on the `arduino` network |
| Wagtail ↔ MinIO | HTTP via internal Docker network (`http://minio:9000`) using `boto3` + `django-storages[s3]` | Originals + renditions + collected static admin assets stored in single bucket |
| Browser ↔ MinIO `/media/*` | Routed by Traefik to `minio:9000` | Renditions prefix bucket-policy public-read; originals require Wagtail-signed URL |

---

## Confidence Notes

- **HIGH:** Angular 21 zoneless + signals + SSR patterns; FE folder layout; ContentApi seam; single-VPS topology with Caddy/systemd; Wagtail DRF v2 as the headless choice.
- **MEDIUM-HIGH:** Page-model contract structure — confidence is high in the *approach* (FE owns the shape, Wagtail conforms); medium on exact field names, which will refine in Phase 2.
- **MEDIUM:** Annotated CodeBlock StreamField design. There is no canonical Wagtail pattern for line-level annotations published in docs. The recommendation (StructBlock + ListBlock of {line, note}) is an opinionated synthesis. Worth a 30-minute spike at Phase 4 start to validate against Wagtail 7.4's actual block API.
- **LOCKED (2026-05-01):** SSG-only — no Node SSR, ever. Angular ships as `outputMode: "static"`; Wagtail REST API v2 → Angular consumes (build-time prerender for public routes, runtime CSR for `/preview/*` and any client-side fetches). The earlier note recommending SSR is superseded by an explicit user decision: SSR is not on the roadmap. Editor preview ergonomics are addressed via CSR + autosave polling against the preview-token endpoint, not by introducing a Node runtime. Trigger to revisit: never within v1 scope; would require a new architectural ADR.

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
*Researched: 2026-04-30 — updated 2026-05-01: switched to Docker (Traefik + Wagtail + Postgres + MinIO); MinIO for media; locked SSG-only / no SSR.*
