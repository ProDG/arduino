# Stack Research — Arduino Learning Hub (Ukrainian)

**Domain:** Editorial-quality content/learning website (Ukrainian-language); headless Wagtail + Angular 21 SSR/SSG; single VPS.
**Researched:** 2026-04-30
**Confidence:** HIGH overall (locked choices verified current; supporting stack widely-used 2026 defaults; one MEDIUM area: typography selection is opinionated)

> Locked choices (NOT re-litigated, only validated for version-pinning): Angular 21 (zoneless, Signal Forms, Vitest), SCSS only, Wagtail 7.4 LTS, single self-hosted VPS, Ukrainian only. This document recommends the supporting stack around them.

---

## 1. Cyrillic-Capable Typography Pipeline (CRITICAL)

This is the load-bearing technical decision for the project. Ukrainian requires four glyphs that many Cyrillic fonts treat as second-class: **і ї є ґ**. Russian-first Cyrillic fonts often render `ґ` as a tofu box or use a generic substitute. Every recommendation below has been verified to ship a properly designed `ґ`.

### Recommended pairings (pick ONE pairing — do not mix more than 3 families)

#### Pairing A (RECOMMENDED) — Editorial Reading Stack

| Role | Family | Foundry / License | Format | Ukrainian Glyph Quality |
|------|--------|-------------------|--------|------------------------|
| Body serif | **Source Serif 4** (variable, opsz + wght axes) | Adobe / SIL OFL | woff2 variable | Excellent — explicit ї stacked-diaeresis design + Bulgarian/Serbian Cyrillic alternates; ґ properly drawn; designed for long-form reading on screen |
| Display / UI sans | **Inter** 4.x (variable) | Rasmus Andersson / SIL OFL | woff2 variable | Excellent Cyrillic Plus subset; full Ukrainian support; calibrated for screen UI |
| Monospace (code) | **JetBrains Mono** 2.x (variable) | JetBrains / SIL OFL | woff2 variable | Full Cyrillic incl. Ukrainian; designed for code legibility, ligatures available; clear distinction of `1 l I 0 O` |

**Why this pairing:** Source Serif 4 is the strongest free serif for editorial Ukrainian on screen — its size-axis (`opsz`) lets you set 18-20px body in the Subhead optical size and large headings in the Display optical size from a single file. It is visually adjacent to the kind of Latin serif used in the official Arduino Starter Kit (warm, generous, slightly humanist). Inter handles UI/sidenote/caption duty. JetBrains Mono is the de-facto code typeface and matches Wagtail/Django dev aesthetic too.

#### Pairing B — Ukrainian-identity-forward (more distinctive)

| Role | Family | License | Notes |
|------|--------|---------|-------|
| Display sans | **e-Ukraine Head** (Fedoriv / Rastvortsev) | SIL OFL (free) | Government-of-Ukraine commissioned; strongly Ukrainian in identity. Use sparingly for headlines only. |
| Body | **e-Ukraine** (text variant) | SIL OFL | Designed alongside Head; good rhythm but sans-only — no serif option in the family |
| Monospace | **JetBrains Mono** | SIL OFL | Same as Pairing A |

**Tradeoff:** Heavy on Ukrainian visual identity (good if that's the brand stance), but loses the *book-like* serif quality the project explicitly aspires to. Probably too on-the-nose for an Arduino book aesthetic. Recommended only if you decide editorial = pure-sans.

#### Pairing C — Long-form reading purist

| Role | Family | License | Notes |
|------|--------|---------|-------|
| Body serif | **Literata 3** (variable) | Google / SIL OFL | Originally Google Play Books; explicitly engineered for long-form digital reading; supports Cyrillic incl. Ukrainian. Slightly more "bookish" / less neutral than Source Serif 4. |
| Sans (UI/captions) | **Inter** 4.x | SIL OFL | As Pairing A |
| Monospace | **JetBrains Mono** | SIL OFL | As Pairing A |

**Tradeoff:** Literata's bookish tone is closer to the Starter Kit aspiration than Source Serif 4. Slightly less neutral — its personality is stronger, which may or may not be wanted.

#### Pairing D — Ukrainian-designed serif + neutral sans

| Role | Family | License |
|------|--------|---------|
| Display serif | **Nyght Serif** (Maksym Kobuzan, Ukrainian designer) | SIL OFL |
| Body | **Source Serif 4** or **Literata** | SIL OFL |
| Sans | **Inter** | SIL OFL |
| Monospace | **JetBrains Mono** | SIL OFL |

**Tradeoff:** Adds a second serif (display) for headline character. Risk of font-stack bloat — only justify if a single serif can't carry both display and body roles. Honestly, Source Serif 4 with `opsz` axis can do both and this is overkill for v1. Park as a v1.5 idea.

### CONFIDENCE: HIGH on Pairing A. MEDIUM on the choice between A vs C — that's a taste call you should A/B in a real layout sample.

### Self-host vs Google Fonts CDN

**Decision: SELF-HOST woff2.** No exceptions.

Reasons:
1. **Privacy + EU**: Google Fonts CDN has been ruled GDPR-non-compliant in German court. Ukrainian readers + EU readers warrant cleanliness here.
2. **Performance on a single VPS**: `Cache-Control: public, max-age=31536000, immutable` + HTTP/2 (Caddy default) = first-paint advantage over a third-party DNS lookup.
3. **Subsetting control**: you only need Latin + Cyrillic + Cyrillic-Ext (skip CJK/Vietnamese/Greek). Saves 60-70% per file.
4. **Variable fonts**: one `.woff2` covers all weights → fewer requests than weight-by-weight static files.

### Subsetting strategy

- Use [`fonttools`](https://fonttools.readthedocs.io/) `pyftsubset` (pip-installable) to produce two woff2 per family:
  - `*-latin.woff2` — `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`
  - `*-cyrillic.woff2` — `U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116` (incl. Ukrainian-specific і ї є ґ at U+0456, U+0457, U+0454, U+0491)
- `unicode-range` descriptor in `@font-face` so the browser only downloads the Cyrillic file when Ukrainian text is actually rendered. (For this site it always will be — but it's still good hygiene and saves Latin-only crawlers/bots.)

### FOUT vs FOIT

**Decision: FOUT (`font-display: swap`) for body, optional `font-display: optional` for display headings.**

Editorial typography priority means readers see *something* instantly. A 100-200ms reflow when web fonts arrive is acceptable; a flash of invisible text on a content site is not. Use a tightly-tuned fallback metric override:

```scss
@font-face {
  font-family: "Source Serif 4 Fallback";
  src: local("Georgia"), local("Times New Roman");
  size-adjust: 102%;       // measured via Capsize/Fontaine
  ascent-override: 95%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

Generate exact values with [Fontaine](https://github.com/unjs/fontaine) or [Capsize](https://seek-oss.github.io/capsize/) — eliminates CLS during font swap.

### Preload critical fonts

```html
<link rel="preload" href="/fonts/source-serif-4-cyrillic.woff2"
      as="font" type="font/woff2" crossorigin>
```

Preload *only* the Cyrillic body weight — that's the dominant glyph traffic.

### What NOT to do

| Don't | Why |
|-------|-----|
| Use Google Fonts `<link>` CDN | GDPR risk; extra DNS; can't control subsetting |
| Use static per-weight TTFs | 6× the bytes vs single variable woff2 |
| Use Pacifico/Lobster/decorative Cyrillic display fonts | Most have weak or absent Ukrainian glyphs (ґ especially) |
| Use Fira Code | Cyrillic exists but mono metrics in Cyrillic are uneven; JetBrains Mono is better |
| Use PT Serif as primary body | Decent but dated; Source Serif 4 / Literata are objectively better engineered for screen reading in 2026 |
| Pick a font without verifying ґ in a real sample | Tofu boxes ship to production this way |

### Verification protocol (DO THIS)

Before committing to any font, paste this into a layout mock:

> **Перевірочний рядок:** Ґаздиня їсть її їжу — є ґедзь, ґніт, ґанок, біґ-мак. Цей рядок має бути ідеально набраним у будь-якому шрифті, що ми обираємо. ATmega328P, GPIO, INPUT_PULLUP.

Inspect each Ukrainian-specific glyph at body size and at 64px display size. Reject the font if `ґ` looks pasted-on or `ї` has a flat/asymmetric diaeresis.

**Sources (typography):**
- [Source Serif Pro / 4 — Ukrainian and stacked-diaeresis support](https://localfonts.eu/freefonts/traditional-cyrillic-free-fonts/source-serif-pro/) — MEDIUM (vendor-adjacent doc; verified against Adobe Fonts repo)
- [JetBrains Mono — multilingual Cyrillic](https://www.jetbrains.com/lp/mono/) — HIGH (official)
- [Inter — Cyrillic Plus subset](https://fontsource.org/fonts/inter) — HIGH
- [Literata 3 — long-form digital reading](https://github.com/googlefonts/literata) — HIGH (Google Fonts repo)
- [e-Ukraine — Fedoriv / Dmytro Rastvortsev](https://en.wikipedia.org/wiki/E-Ukraine) — HIGH
- [Nyght Serif — Maksym Kobuzan, Ukrainian designer](https://ux.pub/vd/a-collection-of-free-ukrainian-fonts-by-ukrainian-designers-1o68) — MEDIUM
- [Fontaine — fallback metric override generation](https://github.com/unjs/fontaine) — HIGH

---

## 2. Angular 21 Specifics for Editorial Sites

### Rendering strategy: Hybrid SSR with prerendering for content pages

Angular 21 supports per-route `RenderMode.Server | Client | Prerender` configuration. For a content site:

| Route type | Mode | Why |
|------------|------|-----|
| `/` (home), `/lessons`, `/articles`, `/datasheets` (static index pages once content is fetched) | `Prerender` (SSG at build) | Content changes only on republish; pre-rendered HTML is fastest possible |
| `/lessons/:slug`, `/articles/:slug`, `/datasheets/:slug` | `Prerender` with `getPrerenderParams()` pulling slugs from Wagtail at build time | Static, cacheable, perfect for editorial reading |
| `/preview/...` (Wagtail preview routes) | `Server` (live SSR) | Content changes per request; can't be prerendered |
| Anything truly interactive (sidenote toggles, code-copy) | `Client` hydration | Just ship JS for the interactive island |

**This means: until you have a Wagtail to call, the entire FE phase can be a pure prerendered/static build.** The mock data layer (Phase 1) literally just runs as a build-time JSON fetch. You may not need a Node SSR runtime at all in v1 — `outputMode: "static"` produces a folder of HTML you can serve directly via Caddy. **Strongly consider this** — it removes a whole moving part (Node process, PM2/systemd unit) from the VPS.

**Recommendation:** Start with `outputMode: "static"` (pure SSG). Only graduate to full Angular SSR if you discover a route that genuinely cannot be prerendered (you won't for v1).

### Angular hydration

Use **incremental hydration** (Angular 20+, default-on in 21) via `provideClientHydration(withIncrementalHydration())`. Defer non-critical components (nav drawer, code-copy buttons, embedded media) with `@defer` blocks. CONFIDENCE: HIGH.

### Image handling

`NgOptimizedImage` is the only correct choice. It auto-generates `srcset`, lazy-loads below-the-fold, and enforces dimensions to prevent CLS. Pair it with Wagtail renditions (see §3) — Wagtail outputs WebP/AVIF; Angular's directive consumes them via a custom `ImageLoader` that maps `width` → `?width=…` Wagtail URL. CONFIDENCE: HIGH.

### Markdown / rich content from Wagtail StreamFields

Wagtail will return StreamField as a JSON array of typed blocks. **Do not** pipe this through a generic markdown renderer — render it as Angular components keyed by block type:

```ts
type Block =
  | { type: 'paragraph'; value: string /* HTML */ }
  | { type: 'code'; value: { language: 'cpp'|'arduino'; code: string; diff?: DiffMarker[]; annotations?: Annotation[] } }
  | { type: 'figure'; value: { renditions: Rendition[]; caption?: string; alt: string } }
  | { type: 'sidenote'; value: { html: string; anchor: string } }
  | { type: 'datasheet_pinout'; value: PinoutData }
  | ...;
```

A `<lesson-block [block]="b">` switch component dispatches to a per-type component. This keeps the editorial typography under your CSS control — no `[innerHTML]` of a giant blob.

For the `paragraph` block (Wagtail rich text → safe HTML), use `DomSanitizer` + a small allowlist; do not use `marked`/`markdown-it` because Wagtail already produces HTML.

### Code highlighting: Shiki (build-time) + custom Arduino grammar

**Decision: Shiki 3.x.**

| Library | Verdict | Why |
|---------|---------|-----|
| **Shiki** | **PICK** | TextMate grammars (so VS Code's Arduino grammar works); renders to plain HTML at build time → zero client JS for highlighting; `@shikijs/transformers` provides `[!code ++]`/`[!code --]`/`[!code highlight]` annotations — exactly the diff + line-highlight feature the project requires; matches editorial aesthetic (uses real VS Code themes). |
| Prism | reject | Older client-side runtime; Arduino grammar is a community fork of uncertain quality; diff plugin works but visually rough. |
| highlight.js | reject | Auto-detection is convenient, but quality of C++/Arduino tokens noticeably lower than TextMate grammars. |

**Arduino specifically:** Shiki accepts the official VS Code C++ TextMate grammar as `cpp` (works fine for Arduino sketches; the `setup`/`loop` and Arduino types just look like normal C++ identifiers — acceptable). For richer Arduino-specific tokenization, ship the Arduino IDE's TextMate grammar from the `arduino/vscode-arduino` repo as a custom Shiki language. Margin annotations are implemented via Shiki transformer `meta` parsing (e.g., ` ```cpp {3-5} note="Pin 13 is the LED"`).

**Where to run Shiki:** at build time during prerender (use the prerender hook to highlight all code blocks once and inline the result). Zero runtime JS for highlighting → fits the editorial purity goal.

### Mock data layer pattern (Phase 1, before Wagtail exists)

Idiomatic Angular 21 pattern with signals:

```ts
@Injectable({ providedIn: 'root' })
export class LessonRepository {
  private http = inject(HttpClient);
  private cache = new Map<string, Signal<Lesson | undefined>>();

  // In dev, HttpClient is intercepted by an HttpInterceptorFn that maps
  // /api/lessons/* to /assets/mock/lessons/*.json. In prod it goes to Wagtail.
  getLesson(slug: string): Signal<Lesson | undefined> {
    return this.cache.get(slug) ?? this.cache.set(slug,
      toSignal(this.http.get<Lesson>(`/api/lessons/${slug}`))
    ).get(slug)!;
  }
}
```

Keep all components consuming **Signals** of the domain shape, not raw HTTP. The repository layer hides whether data comes from `assets/mock/*.json` or Wagtail. When Wagtail comes online in Phase 3+, only the interceptor / base URL changes. CONFIDENCE: HIGH.

### Versions (verified 2026-04-30)

| Package | Version |
|---------|---------|
| `@angular/core` | 21.2.x (currently 21.2.10) |
| `@angular/ssr` | 21.2.x (matched) |
| `@angular/cdk` (a11y / overlays) | 21.x |
| `@angular/aria` | 21.x (new in 21) |
| `vitest` | 3.x (default Angular 21 test runner) |
| `shiki` | 3.x |
| `@shikijs/transformers` | 3.x |

**Sources:**
- [Angular SSR & rendering strategies](https://angular.dev/guide/ssr) — HIGH
- [Angular build-time prerendering](https://angular.dev/guide/prerendering) — HIGH
- [Angular rendering strategies (per-route)](https://angular.dev/guide/routing/rendering-strategies) — HIGH
- [NgOptimizedImage](https://angular.dev/api/common/NgOptimizedImage) — HIGH
- [Shiki (shikijs/shiki)](https://github.com/shikijs/shiki) — HIGH
- [Shiki vs Prism vs highlight.js 2026](https://www.pkgpulse.com/blog/shiki-vs-prismjs-vs-highlightjs-syntax-highlighting-2026) — MEDIUM (third-party, but matches consensus)

---

## 3. Wagtail 7.4 LTS Specifics

### Versions (verified)

| Component | Pin | Why |
|-----------|-----|-----|
| **Wagtail** | `7.4.x` (LTS, releases 2026-05-04) | User-locked. 12-month security updates minimum. |
| **Django** | `5.2.x` LTS | Wagtail 7.4 requires Django 5.2 or 6.0. **5.2 is LTS (security updates ≥3 years from Apr 2025).** Django 6.0 is current but not LTS — pick 5.2 for stability alignment with Wagtail LTS. |
| **Python** | `3.13.x` | Wagtail 7.4 supports 3.10 → 3.14. 3.13 is the sweet spot — production-stable, JIT-ready, broad ecosystem support. **Avoid 3.14** (released Oct 2025; some C-extension wheels may lag) for a solo deployment. |
| **PostgreSQL** | `17.x` (or `16.x`) | Django 5.2 requires PostgreSQL 14+. PG17 is current stable as of late 2025; PG16 also fine. **Avoid PG13/14** (PG13 EOL Nov 2025, PG14 EOL Nov 2026). PostgreSQL also unlocks Wagtail's fuzzy search (new in 7.4 via Modelsearch 1.3). |

### Headless setup — recommendation

**Use Wagtail's built-in REST API (DRF-based) — NOT GraphQL via wagtail-grapple.**

Reasoning:
1. Built-in, zero extra dependencies, maintained as part of core.
2. Solo developer = optimize for fewer moving parts.
3. The site has ~5 page types and a small content set; GraphQL's "request only what you need" benefits don't pay back the schema-maintenance cost.
4. Angular at the build-time prerender step calls a handful of endpoints (`/api/v2/pages/?type=lessons.LessonPage&fields=...`) — REST is fine.
5. wagtail-grapple's HTML pre-rendering of rich text is *also* available via REST with `?fields=*,body` and the right block serializers.

**The "Universal Listings API"** mentioned in the question: I could not verify a feature by that exact name in Wagtail 7.4 release notes (search returned nothing definitive; it may be a planned/internal name for an upcoming admin API or a misnomer for `/api/v2/pages/`). **Treat it as not-available unless 7.4 final release notes on 2026-05-04 confirm otherwise.** CONFIDENCE: LOW on the existence of a feature called "Universal Listings API"; HIGH that the standard `/api/v2/pages/` endpoints will cover all needs.

### StreamField patterns for the four page types

**Strong recommendation: define small, composable, semantically-named blocks. Avoid one giant StructBlock per page type.**

```python
# blocks.py
class LessonProseBlock(blocks.RichTextBlock):
    features = ['bold', 'italic', 'link', 'ol', 'ul', 'hr']

class CodeBlock(blocks.StructBlock):
    language = blocks.ChoiceBlock(choices=[('cpp','C++/Arduino')], default='cpp')
    code = blocks.TextBlock()
    diff = blocks.CharBlock(required=False, help_text="e.g. '3+,5-,7-9+'")
    annotations = blocks.ListBlock(AnnotationBlock())  # line-no + sidenote text

class FigureBlock(blocks.StructBlock):
    image = ImageChooserBlock()
    caption = blocks.RichTextBlock(features=['italic','link'], required=False)
    alt = blocks.CharBlock(required=True)
    layout = blocks.ChoiceBlock(choices=[('inline','Inline'),('margin','Margin'),('full','Full bleed')])

class SidenoteBlock(blocks.RichTextBlock):
    features = ['italic','link','sup']

class PinoutBlock(blocks.StructBlock):  # for datasheets
    component = blocks.CharBlock()
    pins = blocks.ListBlock(PinBlock())
```

Then on each page type, `body = StreamField([...])` with the appropriate subset. **Per-page-type subsets** rather than one universal block list — keeps editor UX tight. This aligns with Wagtail 7.4's improved StreamField validation (deferred validation lets editors save partial blocks).

### Media handling — renditions, WebP, AVIF

Wagtail supports AVIF generation in renditions natively (Wagtail ≥6.4). Pattern:

```python
# settings.py
WAGTAILIMAGES_FORMAT_CONVERSIONS = {
    'avif': 'avif',
    'webp': 'webp',
}
WAGTAILIMAGES_AVIF_QUALITY = 60  # AVIF tolerates lower q for same perceived quality
WAGTAILIMAGES_WEBP_QUALITY = 80
```

For the API, expose multiple renditions per image:

```python
class LessonPageSerializer(...):
    image_renditions = serializers.SerializerMethodField()
    def get_image_renditions(self, obj):
        rend = obj.image
        return {
            'avif_800': rend.get_rendition('format-avif|width-800').url,
            'webp_800': rend.get_rendition('format-webp|width-800').url,
            'jpeg_800': rend.get_rendition('format-jpeg|width-800').url,
            # ...plus 400, 1200, 1600
        }
```

Angular's `NgOptimizedImage` `ImageLoader` then picks the right size; the `<picture>` source order delivers AVIF → WebP → JPEG. Install Pillow with AVIF support: `pillow-avif-plugin` (currently the standard route until Pillow gains native AVIF — verify on install date).

### Preview from Angular

Use [`wagtail-headless-preview`](https://github.com/torchbox/wagtail-headless-preview) (maintained by Torchbox / Wagtail core members).

- In Wagtail: `WAGTAIL_HEADLESS_PREVIEW = {"CLIENT_URLS": {"default": "http://localhost:4200/preview/"}}`
- In Angular: a `/preview/:contentType/:token` route that calls Wagtail's preview API endpoint with the token, fetches the *unpublished* serialized page, and renders it through the same components used for published pages.
- **In production**, the `CLIENT_URLS` points to your real domain; the preview iframe in Wagtail admin loads `https://yourdomain/preview/...`.

This works with REST (no GraphQL needed). CONFIDENCE: HIGH.

### Wagtail packages to install

```
wagtail==7.4.*
django==5.2.*
psycopg[binary]==3.2.*       # not psycopg2; psycopg 3 is the modern driver
pillow                       # core image handling
pillow-avif-plugin           # AVIF support
wagtail-headless-preview==0.8.*  # verify latest at install time
djangorestframework          # transitively via Wagtail; pin minor
django-cors-headers==4.*     # for Angular dev server CORS
gunicorn==23.*               # WSGI server for prod
whitenoise==6.*              # static-file serving (Wagtail admin assets)
```

**Sources:**
- [Wagtail 7.4 LTS release notes](https://docs.wagtail.org/en/latest/releases/7.4.html) — HIGH (in-development docs; release 2026-05-04)
- [Wagtail headless support](https://docs.wagtail.org/en/latest/advanced_topics/headless.html) — HIGH
- [Django 5.2 release notes](https://docs.djangoproject.com/en/6.0/releases/5.2/) — HIGH
- [Wagtail WebP/AVIF blog](https://wagtail.org/blog/greener-images-with-webp/) — HIGH
- [wagtail-headless-preview](https://github.com/torchbox/wagtail-headless-preview) — HIGH

---

## 4. Single-VPS Deployment Stack

### Topology

```
                     Internet
                        │
                  ┌─────▼─────┐
                  │   Caddy   │  :443 (auto-TLS via Let's Encrypt)
                  │  reverse  │  :80  (auto-redirect)
                  │   proxy   │
                  └─┬───┬───┬─┘
        static FE   │   │   │   /api/* /admin/* /preview/* /media/*
        (Angular    │   │   │
         prerender) │   │   │
            ┌───────▼─┐ │ ┌─▼──────────────┐
            │ /var/www│ │ │ Gunicorn       │
            │ /arduino│ │ │ Wagtail/Django │
            │ /dist   │ │ │ (systemd unit) │
            └─────────┘ │ │ 127.0.0.1:8000 │
                        │ └────────┬───────┘
                        │          │
                  /static/*       PostgreSQL 17
                  served by       127.0.0.1:5432
                  Caddy from      (systemd)
                  collectstatic
                  output dir
```

**Key choice: serve Angular as static files.** Per §2 use `outputMode: "static"` — no Node SSR process needed in v1. This eliminates an entire failure surface.

### Component picks

| Component | Pick | Version | Why |
|-----------|------|---------|-----|
| **Reverse proxy + TLS** | **Caddy** | 2.8.x+ | One-line auto-HTTPS via Let's Encrypt; readable Caddyfile; HTTP/2 + HTTP/3 (QUIC) by default; no certbot wiring. For solo dev on single VPS, this saves real hours over nginx + certbot setup. |
| **Python WSGI** | **gunicorn** | 23.x | Industry default for Django prod. ASGI not required — Wagtail is sync-friendly. |
| **Process management** | **systemd** | (OS-provided) | Use systemd units for `wagtail.service` (gunicorn) and `postgresql.service`. Do not use PM2 for Django. Do not use supervisord (older convention; systemd is the answer in 2026). |
| **Database** | **PostgreSQL 17** | 17.x | See §3. Run as a systemd-managed local instance; bind 127.0.0.1 only. |
| **Static FE** | Caddy filesystem handler | — | `root * /var/www/arduino/dist/browser` + `file_server` — no Node, no PM2. |
| **Wagtail static (admin)** | Caddy filesystem handler against `collectstatic` output | — | `whitenoise` is fine as a fallback; Caddy serving directly is faster. |
| **Media (uploads)** | Local disk + Caddy `file_server` | — | At this scale (small audience, ~hundreds of MB of images): no S3 needed. Plan a backup story (below). |
| **TLS certs** | Let's Encrypt via Caddy | — | Auto-issued, auto-renewed, zero config. |
| **Firewall** | `ufw` | OS | Allow 22, 80, 443. Block all else. Postgres bound to localhost. |
| **OS** | Ubuntu 24.04 LTS or Debian 12 | — | Ubuntu 24.04: support to 2029. Debian 12: support to 2028. Either fine; Ubuntu has slightly fresher Python/Postgres in apt. |

### Caddyfile (skeletal)

```caddyfile
arduino.example.ua {
    encode zstd gzip

    # Wagtail admin + API + media + preview
    @backend path /admin* /api/* /preview/* /media/* /django-static/*
    handle @backend {
        reverse_proxy 127.0.0.1:8000
    }

    # Wagtail collectstatic output (only if not using whitenoise)
    handle_path /django-static/* {
        root * /srv/wagtail/static
        file_server
    }

    # Angular static FE (everything else → SPA fallback)
    handle {
        root * /var/www/arduino/dist/browser
        try_files {path} /index.html
        file_server
        header /assets/* Cache-Control "public, max-age=31536000, immutable"
        header /fonts/* Cache-Control "public, max-age=31536000, immutable"
    }
}
```

### Backup story (realistic for solo dev)

| What | How | Cadence |
|------|-----|---------|
| Postgres | `pg_dump` to `/var/backups/pg/$(date).sql.gz`; nightly cron | Daily |
| `/srv/wagtail/media/` (uploads) | `restic` to a cheap S3-compatible bucket (Backblaze B2, Hetzner Storage Box) | Daily incremental |
| Caddyfile, systemd units, `.env` | Committed to a private git repo (NOT alongside code; secrets repo) | On change |
| Off-site copy | `restic` already off-site; verify monthly with `restic check` | Monthly |

That's the whole backup story. Do not invest in HA/replication for v1.

### What NOT to do

| Don't | Why |
|-------|-----|
| Docker Compose with 5 services | Solo VPS = systemd is simpler and lower overhead |
| Kubernetes / k3s | Massive overkill |
| nginx (in 2026, for a new project) | Caddy is faster to set up, equivalent perf at this scale, has auto-TLS |
| Node SSR runtime in v1 | Use static prerender; revisit only if needed |
| S3 for media | Adds infra; local disk + restic backups is sufficient |
| Cloudflare in front | Optional v1.5; do not need it for the audience scale |

**Sources:**
- [Caddy vs Nginx 2026](https://privatedevops.com/articles/nginx-vs-caddy-2026-reverse-proxy-comparison) — MEDIUM (third-party 2026 review)
- [Caddy with Django](https://rtl.chrisadams.me.uk/2023/01/til-using-caddy-with-django-apps-instead-of-nginx/) — MEDIUM
- [Django production guide 2026](https://medium.com/@sizanmahmud08/production-ready-django-with-docker-in-2026-complete-guide-with-nginx-postgresql-and-best-1fb248e65983) — LOW (single-author blog; cross-checked with official Django docs)

---

## 5. Tooling

### Frontend tooling

| Tool | Pick | Notes |
|------|------|-------|
| **Package manager** | **pnpm 10.x** | Strict by default (catches phantom dependencies — important when Angular schematics generate `package.json` entries); 70% disk savings via content-addressable store; widely used with Angular; first-class Nx support if you ever go monorepo. **Avoid Bun for Angular**: Angular's build tooling has known edge cases under Bun's Node compat layer; not worth the speed gain for a solo project. |
| **Test runner** | **Vitest 3.x** | Default in Angular 21. Don't fight it — embrace it. |
| **Formatter** | **Prettier 3.x** | With `prettier-plugin-organize-imports`. |
| **Linter** | **ESLint 9.x** (flat config) + `angular-eslint` 21.x | Match Angular major version. |
| **SCSS linter** | **Stylelint 16.x** + `stylelint-config-standard-scss` | Enforces consistent SCSS for editorial CSS quality. |
| **Type checking** | TypeScript 5.6+ (whatever Angular 21 ships with) | Don't pin separately. |

### Backend tooling

| Tool | Pick | Notes |
|------|------|-------|
| **Package manager** | **uv** (≥0.5) | 10-100× faster than pip. `uv pip` is drop-in; `uv lock` produces a lockfile. Production-ready in 2026, used by major Python shops. Replaces pip + virtualenv + pip-tools in one binary. |
| **Formatter + linter** | **Ruff** (≥0.7) | Replaces black + isort + flake8 + pyupgrade. ~100× faster. The 2026 default. |
| **Type checker** | **mypy** or **pyright** | Optional v1; useful for the API serializer layer. Pyright is faster; mypy has better Django support via `django-stubs`. Pick **mypy + django-stubs** for Django integration. |
| **Pre-commit** | **pre-commit** (≥4.x) | Run ruff, mypy, prettier, stylelint, eslint on staged files. |

### CI minimum (GitHub Actions or self-hosted)

```yaml
# .github/workflows/ci.yml — outline
jobs:
  fe:
    steps:
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test --run        # Vitest
      - run: pnpm build              # angular build (prerender)
  be:
    steps:
      - uses: astral-sh/setup-uv@v4
      - run: uv sync --frozen
      - run: uv run ruff check .
      - run: uv run ruff format --check .
      - run: uv run pytest
      - run: uv run python manage.py makemigrations --check --dry-run
```

That's the floor. No need for elaborate matrices for a solo project.

### Deploy: simplest possible script

```bash
# deploy.sh on the VPS
set -euo pipefail
cd /srv/arduino-fe && git pull && pnpm install --frozen-lockfile && pnpm build
rsync -a --delete dist/browser/ /var/www/arduino/dist/browser/

cd /srv/wagtail && git pull && uv sync --frozen
uv run python manage.py migrate --noinput
uv run python manage.py collectstatic --noinput
sudo systemctl reload wagtail.service
```

Trigger via GitHub Actions SSH job or run by hand. v2 candidate for a switch to Ansible if it grows.

**Sources:**
- [uv vs pip 2026](https://www.pyblog.in/programming/uv-python-package-manager/) — MEDIUM (cross-checked with Astral's official docs)
- [pnpm vs npm vs Bun 2026](https://www.pkgpulse.com/blog/pnpm-vs-bun-vs-npm-2026) — MEDIUM
- [Ruff (Astral)](https://docs.astral.sh/ruff/) — HIGH (official)
- [Python dependency management 2026](https://cuttlesoft.com/blog/2026/01/27/python-dependency-management-in-2026/) — MEDIUM

---

## Master Installation Cheatsheet

### Frontend (after `ng new`)

```bash
pnpm add @angular/ssr@21 @angular/cdk@21 @angular/aria@21
pnpm add shiki @shikijs/transformers
pnpm add -D vitest@3 prettier@3 prettier-plugin-organize-imports
pnpm add -D stylelint@16 stylelint-config-standard-scss
pnpm add -D fontaine                                # fallback metric override
pnpm add -D fonttools-bin                           # subsetting via Python; or run pyftsubset directly
```

### Backend

```bash
uv init wagtail-arduino && cd wagtail-arduino
uv add 'wagtail==7.4.*' 'django==5.2.*' 'psycopg[binary]==3.2.*' \
       pillow pillow-avif-plugin gunicorn==23.* whitenoise==6.* \
       'django-cors-headers==4.*' 'wagtail-headless-preview==0.8.*'
uv add --dev ruff mypy django-stubs pytest pytest-django pre-commit
```

### VPS (Ubuntu 24.04)

```bash
# As root
apt update && apt install -y postgresql-17 caddy ufw python3.13 python3.13-venv
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw enable
# install uv as the deploy user
curl -LsSf https://astral.sh/uv/install.sh | sh
# install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
# install Node 22 (for the Angular build step only; not for runtime)
# use nvm or fnm
```

---

## Stack Patterns by Variant

**If site grows beyond ~10 lessons/articles per week of edits and prerender becomes slow:**
- Switch from `outputMode: "static"` to `outputMode: "server"` for dynamic per-route SSR
- Add a small Node systemd unit (or run via `@angular/ssr` CLI under gunicorn-like setup with `pm2-runtime`)

**If reader audience grows beyond a single VPS:**
- Add Cloudflare in front (free tier) — caches the prerendered HTML aggressively
- Move media to S3 / Backblaze B2 with `django-storages`
- This is a v2 problem; do not pre-optimize.

**If you decide editorial = serif-display + sans-body instead of all-serif:**
- Swap to Pairing B (e-Ukraine) or Pairing D (Nyght Serif display + Inter body)

---

## What NOT to Use (Consolidated)

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Tailwind | Locked out by user choice; editorial design wants bespoke CSS | SCSS modules + design tokens |
| Google Fonts CDN `<link>` | GDPR risk, no subsetting control | Self-host woff2 + variable fonts |
| Russian-first Cyrillic fonts (e.g., Roboto-only Cyrillic, decorative families) | Often weak/missing Ukrainian ґ, ї design | Source Serif 4, Inter, JetBrains Mono, Literata, e-Ukraine |
| Prism / highlight.js | Inferior C++ tokenization; client-side perf cost | Shiki at build-time |
| `marked` / `markdown-it` for Wagtail content | Wagtail emits HTML; markdown is the wrong layer | Typed StreamField block components |
| `psycopg2-binary` | Legacy driver; psycopg 3 is the modern path | `psycopg[binary]==3.2` |
| pip + virtualenv + pip-tools | Slow, three tools instead of one | uv |
| black + isort + flake8 | Three tools, slow | ruff |
| nginx + certbot | More config, manual cert renewal wiring | Caddy (auto-TLS) |
| Docker Compose for a 3-service single-VPS app | Adds Docker daemon, image rebuilds, log indirection | systemd units |
| Node SSR runtime in v1 | Adds a process to manage; not needed for static editorial content | Angular `outputMode: "static"` (prerender) |
| wagtail-grapple (GraphQL) | Extra dependency, schema maintenance, marginal benefit | Wagtail REST API (`/api/v2/pages/`) |
| `@angular/material` for editorial UI | Material design language fights editorial aesthetic | Hand-authored SCSS components + Angular CDK / Aria primitives |

---

## Version Compatibility Matrix

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Wagtail 7.4 | Django 5.2 LTS, Django 6.0 | Pick 5.2 LTS for alignment |
| Django 5.2 | Python 3.10–3.14, PostgreSQL 14+ | 3.13 + PG17 recommended |
| Wagtail 7.4 | Python 3.10–3.14 | 3.13 recommended |
| Angular 21 | Node 20.19+ / 22.12+ | Use 22 LTS |
| `psycopg[binary]` 3.2 | Django 5.2 | Replaces psycopg2 |
| Shiki 3 | Node 20+ | Build-time only |
| pnpm 10 | Node 18+ | Use Node 22 |
| Caddy 2.8+ | Any Linux | systemd integration native |

---

## Final Confidence Assessment

| Section | Confidence | Notes |
|---------|------------|-------|
| Typography pipeline & font picks | HIGH on technical (woff2, subsetting, fallback metrics); MEDIUM on the specific A/C aesthetic call (taste-dependent) |
| Angular 21 strategy (SSG, NgOptimizedImage, Shiki, mock layer) | HIGH |
| Wagtail 7.4 setup, REST vs GraphQL, StreamField patterns, preview | HIGH (REST recommendation is well-supported); LOW on the specific naming of "Universal Listings API" (couldn't verify; recommend defaulting to standard `/api/v2/pages/`) |
| VPS deployment (Caddy + gunicorn + systemd + PG17) | HIGH |
| Tooling (uv, pnpm, Ruff, Vitest, Stylelint) | HIGH |

---

## Open Questions for Phase-Specific Research Later

1. **"Universal Listings API" in Wagtail 7.4:** verify against final release notes on 2026-05-04. If it ships, evaluate whether it simplifies the Angular index-page queries. (Phase: BE integration.)
2. **Final font A/B test:** Source Serif 4 vs Literata in a real two-column lesson layout with Ukrainian content. Decision belongs in the design-locking phase, not now.
3. **Arduino TextMate grammar source:** confirm a maintained grammar exists in `arduino/vscode-arduino` or pick `cpp` and accept slightly less Arduino-specific tokenization. (Phase: code-block component.)
4. **Caddy → fronting CDN:** revisit Cloudflare or Bunny CDN if traffic grows beyond ~1k uniques/day. (Post-launch.)
5. **`pillow-avif-plugin` longevity:** check whether Pillow has adopted native AVIF by the time of BE phase; switch if so. (Phase: media handling.)

---

*Stack research for: editorial-quality Ukrainian Arduino learning website*
*Researched: 2026-04-30*
