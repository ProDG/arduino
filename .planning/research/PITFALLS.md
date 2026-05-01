# Pitfalls Research

**Domain:** Editorial-quality Ukrainian Arduino learning site (Angular 21 + Wagtail 7.4 LTS, Dockerized single VPS, solo dev)
**Researched:** 2026-04-30 — updated 2026-05-01 for Docker/Traefik/MinIO architecture and SSG-only lock.
**Confidence:** HIGH for typography/Cyrillic, Angular 21 zoneless, Wagtail headless; MEDIUM for VPS ops specifics

> Reading discipline: this project's stated core value is editorial typography. Most pitfalls below are ranked
> with that lens — anything that silently degrades type quality or locks the design into the wrong shape is
> Critical, even if technically benign.

---

## Critical Pitfalls

### Pitfall 1: Choosing a font without verifying full Ukrainian Cyrillic support across all weights AND italics

**What goes wrong:**
A font looks gorgeous in the specimen, ships to staging, and only then does someone notice that:
- ґ (ghe with upturn, U+0490/U+0491) is missing or visibly different from the other glyphs (substituted from a fallback)
- italic Cyrillic is missing entirely (browser synthesizes a slanted version — it looks ugly and unprofessional, especially in body text)
- small-caps Cyrillic is unsupported (a serif font's `font-variant: small-caps` falls back to faux small caps)
- the regular weight has Cyrillic but the bold or italic doesn't, so emphasis breaks mid-paragraph
- letterforms specific to Ukrainian (і, ї, є, ґ) are present but visibly designed as Russian-style afterthoughts

**Why it happens:**
- Most Cyrillic fonts target the basic Cyrillic block U+0400–U+045F, which **does** contain і/ї/є but **does not** contain ґ. ґ lives at U+0490/U+0491 and is in the "cyrillic-ext" subset on Google Fonts. Designers sample the font in Latin or even Russian Cyrillic and never test ґ. (See [Ge (Cyrillic) — Wikipedia](https://en.wikipedia.org/wiki/Ge_(Cyrillic)), [TypeDrawers: Ukrainian Ґ](https://typedrawers.com/discussion/4354/ukrainian-%D2%90))
- Foundries frequently ship Latin-only as the base license and charge extra (or release later) for Cyrillic, sometimes only in Regular and Bold but not Italic. ([fontfabric language support](https://www.fontfabric.com/language-support/ukrainian-fonts/))
- "Cyrillic supported" on a font listing often means Russian-coverage only.

**How to avoid:**
1. Build a one-page Ukrainian glyph audit harness early: paragraph + heading samples that exercise і ї є ґ Ї Є Ґ and apostrophe (ʼ U+02BC), in regular / italic / bold / bold-italic, plus small-caps and tabular figures.
2. Require: when subsetting from Google Fonts, request **both `cyrillic` and `cyrillic-ext` subsets**. The default `cyrillic` subset alone will silently miss ґ. ([google/fonts issue #1029](https://github.com/google/fonts/issues/1029))
3. For each font candidate, screenshot the audit page in all four styles and review side-by-side. Reject anything with synthesized italic or fallback ґ.
4. For paid foundries, explicitly verify the license SKU includes Cyrillic + Cyrillic Extended for **every weight you plan to use**, italics included. Get this in writing before paying.
5. Self-host fonts (don't rely on Google Fonts CDN at runtime) so you control the subset declaration and unicode-range.

**Warning signs:**
- Font review meeting where the only sample text is in English
- "We'll just use Google Fonts default subset" (default does not include cyrillic-ext)
- Italic body text looks "tilted" rather than designed
- ґ visually thicker, taller, or differently constructed than the surrounding letters

**Severity:** Critical
**Phase to address:** Design system / typography phase (before any page templates are built)

---

### Pitfall 2: Picking a quotation-mark convention late, then having to rewrite all the prose

**What goes wrong:**
Ukrainian uses **«…»** as primary quotes and **„…"** as nested quotes (note the German-style low-9 opening). The site ships using straight quotes `"…"` from the editor's keyboard or, worse, mixed conventions across articles. Once content exists, fixing it means a CMS-wide search-and-replace that must respect nesting and inline code blocks.

**Why it happens:**
- Editors paste from Word/Docs/Telegram with smart quotes that don't match Ukrainian convention.
- Wagtail's RichText doesn't auto-correct to Ukrainian conventions out of the box.
- The chevron «» is on no standard QWERTY layout — author types `"` and intends to "fix later".

**How to avoid:**
1. Pick the convention upfront and document it: primary «…» , nested „…", apostrophe ʼ (U+02BC), em dash — (U+2014) with thin spaces around it for direct speech. ([Ukrainian Quotation Marks](https://www.whatiscalled.com/punctuation-marks/quotation_marks_in_Ukrainian/), [Netflix UA Style Guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/115002229068-Ukrainian-Timed-Text-Style-Guide))
2. Write a Wagtail RichText whitelist + a save-side normalizer that rewrites `"…"` to «…» on save (idempotent). Bonus: handle the nested case heuristically and flag unresolved cases for editor review.
3. Add a CSS smart-quote stylesheet rule using `lang="uk"` and `quotes: "«" "»" "„" """;` so even straight `<q>` falls back correctly.
4. CI lint job: scan published content for ASCII straight quotes and warn.

**Warning signs:**
- Random straight quotes appearing in published prose
- Nested quotes rendering as `«…«…»…»` (chevron-in-chevron)

**Severity:** Critical for the editorial promise; moderate for the engineering effort
**Phase to address:** Typography / content modeling phase (before content is written)

---

### Pitfall 3: Designing in a vacuum with Lorem Ipsum (Latin) instead of real Ukrainian prose

**What goes wrong:**
The whole design system gets calibrated to Latin word lengths, x-heights, and ascender/descender ratios. When real Ukrainian content lands:
- Body line-length looks too short (Ukrainian words average longer than English; comfortable measure shifts from 65–75ch to ~55–65ch)
- Headings wrap unexpectedly (compound Ukrainian words don't break the same way)
- Justified text develops "rivers" because Ukrainian's longer words plus disabled hyphenation force ugly word-spacing
- Drop caps look fine on `L` but disastrous on `Ї` (extra dot above) or `Ґ` (upturn)
- Sidenote alignment drifts because the body's vertical rhythm assumed Latin x-height

**Why it happens:**
- Lorem Ipsum is the default in every design tool; no Ukrainian filler is built in.
- Designing visually first, content second, is the standard agency workflow.

**How to avoid:**
1. From day one, paste **real Ukrainian Arduino prose** into the design comp. Borrow paragraphs from translated electronics articles, your own future lessons, or the Ukrainian Wikipedia entry on Arduino. Maintain a `samples/` folder of long, medium, short Ukrainian prose blocks.
2. Build the type-tester page with: one block of long uninterrupted prose (450+ words), one block with code interspersed, one block with a sidenote, one with a figure. All in Ukrainian.
3. Test all heading levels with realistic Ukrainian titles (e.g. «Перший проєкт: блимання світлодіодом» — long, compound, with apostrophe-substitute).
4. Specifically test `Ї`, `Ґ`, and apostrophe at headline/display sizes.

**Warning signs:**
- Design Figma uses "Lorem ipsum dolor sit amet…"
- Designer says "we'll plug in real text later"
- Body measure feels right at 70ch in the comp but cramped on staging

**Severity:** Critical (this is the core-value pitfall — failing here means the design fails)
**Phase to address:** Design system phase, continuously through every page template phase

---

### Pitfall 4: Justified body text without Ukrainian hyphenation = rivers of whitespace

**What goes wrong:**
Editorial designs love justified text. Ukrainian words are long. CSS `text-align: justify` without working hyphenation produces visually broken paragraphs full of "rivers" — vertical channels of whitespace running through the column. Looks unprofessional and contradicts the editorial claim.

**Why it happens:**
- `hyphens: auto` requires a browser-bundled hyphenation dictionary for the declared `lang`.
- Ukrainian dictionary support is recent (Chrome/Edge **only since v112**, Firefox 9+, Safari 9.1+). ([caniuse: hyphens for Ukrainian](https://caniuse.com/mdn-css_properties_hyphens_language_ukrainian)) — coverage is now ~93% globally but **not 100%**, and you need `lang="uk"` set correctly.
- Many libraries (Markdown renderers, sanitizers) strip the `lang` attribute or default it to `en`.

**How to avoid:**
1. Set `<html lang="uk">` at the document root and confirm it survives SSR/hydration (Angular Universal sometimes overrides).
2. Use `hyphens: auto;` only on body prose (`p`, list items inside articles), never on headings or code.
3. Provide a soft-hyphen authoring shortcut for editors on tricky words (`&shy;` / U+00AD) and a CMS toolbar button.
4. Consider client-side fallback library `hyphenopoly.js` with the Ukrainian pattern file for older browsers — but only if analytics show non-trivial old-Chrome usage.
5. Be conservative with `text-align: justify`. Strongly consider `text-align: start` (left-ragged) for body — it's typographically respectable and dodges the whole hyphenation-rivers issue. The Arduino Starter Kit book itself uses left-ragged in many spreads.
6. If you do justify, test on Firefox, Chromium, and Safari with real long paragraphs. Visually scan for rivers.

**Warning signs:**
- Designer wants justified text "for the book feel" without checking hyphenation
- Paragraphs look fine in Chrome but ugly in Safari (different dictionaries)
- Long compound words (e.g. «мікроконтролер») break to next line entirely, leaving a huge gap

**Severity:** Critical (directly attacks the editorial claim)
**Phase to address:** Design system / typography phase

---

### Pitfall 5: Mock data shape diverges from real Wagtail StreamField shape

**What goes wrong:**
FE-first build creates a mock JSON that looks "what a lesson should be." Six weeks later, the real Wagtail API returns:
- StreamField as an array of typed blocks `[{type, value, id}, …]` not a flat HTML string
- RichText blocks containing internal markup like `<a linktype="page" id="3">…</a>` and `<embed embedtype="image" id="7" alt="…">` that needs `expand_db_html` to render
- Image fields as IDs, not URLs
- Differences between live and draft endpoints
([Headless Wagtail pain points](https://dev.to/tommasoamici/headless-wagtail-what-are-the-pain-points-ji4), [LearnWagtail: Serializing RichText Blocks](https://learnwagtail.com/tutorials/headless-cms-serializing-richtext-blocks/))

The FE has been built around the mock shape. Now every component, every signal store, every selector breaks. "Just adapt the mock" turns into a multi-week rework.

**Why it happens:**
- Designers/FE devs invent a clean shape that matches their components.
- Wagtail's API shape is "leaky" — it exposes internal representations that need transformation.
- No contract is written down.

**How to avoid:**
1. Before any FE coding, **write the StreamField block schema first** as a plain TypeScript types file. Model it on actual Wagtail API output examples, not on intuition. Even without a backend, you know shapes will be: `{ type: 'rich_text', value: string, id: string }`, `{ type: 'code_block', value: { language: string, code: string, line_highlights: number[] }, id: string }`, etc.
2. Generate fixture JSON that matches that exact shape and feed it through your real API client (mocked at the network layer using MSW or similar), not as an in-memory object. This forces the FE to handle list-of-blocks dispatch, async loading states, error cases.
3. Decide upfront: server-renders rich text to HTML (use `wagtail-grapple` or a custom serializer that calls `expand_db_html`) vs. ships internal markup and FE expands it. Recommendation: **server-side expansion**. Keeps FE dumb, keeps internal representation in BE. Document this decision now.
4. Stand up a thin Wagtail "skeleton" before you finish the FE — even one page model with one StreamField block — to verify the contract end-to-end.

**Warning signs:**
- Mock JSON contains a `lessonHtml: "<p>…</p>"` string field
- FE component takes "the lesson" as a single object instead of dispatching block-by-block
- No TypeScript type imported from a shared schema location

**Severity:** Critical
**Phase to address:** End of design phase / start of FE phase — a contract phase between them

---

### Pitfall 6: Two-column body+sidenote layout collapses badly at tablet breakpoints

**What goes wrong:**
The headline editorial gesture (body + margin sidenote column) works beautifully at >= 1280px. At iPad-portrait widths, sidenotes get squeezed, then "wrap below" awkwardly, then on phone the sidenote is duplicated inline as an aside that breaks reading flow. Designers prototype only at desktop and laptop sizes.

**Why it happens:**
- The two-column rhythm is the design's signature; nobody wants to think about how it degrades.
- "Mobile-last" is the default for editorial sites.

**How to avoke:**
1. Define the sidenote behavior at three breakpoints up-front:
   - **Wide (≥1200px):** true margin column, sidenote aligned to its anchor line
   - **Medium (768–1199px):** sidenote inlines under the paragraph it anchors to, visually distinct (smaller, indented, rule-marked)
   - **Narrow (<768px):** sidenote becomes a `<details>` disclosure under the anchor paragraph, OR inline-italic-aside with a left rule
2. Test all three from day one of the lesson template.
3. Make sidenotes a first-class StreamField block (not inline shortcode), so the BE knows their semantic position and the FE can render them three different ways.

**Warning signs:**
- Sidenote demo only shown at 1440×900
- Sidenote implemented as `position: absolute` keyed to a specific viewport width
- Designer says "we'll figure out mobile later"

**Severity:** Critical (it's the second most distinctive design element after typography)
**Phase to address:** Design system phase, with mandatory three-breakpoint review

---

### Pitfall 7: Dark mode added late, breaking the carefully-tuned color tokens

**What goes wrong:**
The light-mode palette is tuned to feel paper-like (warm off-white, ~#FAF7F2; ink ~#1B1B1B; teal accent at a specific saturation). Six weeks later "we should add dark mode." Suddenly the teal looks neon, the off-white inverts to pure black (eye-strain), every contrast ratio needs revisiting, and the codeblock theme that was hand-tuned against paper looks washed out.

**Why it happens:**
- Designers think dark mode is a token swap; it's not — it's a parallel design language.
- Tokens were named by hue (`--teal-500`) instead of role (`--accent`, `--surface-page`, `--surface-card`).

**How to avoid:**
1. Decide upfront whether v1 ships light-only, dark-only, or both. **Recommendation for this project: light-only at v1**. The Starter Kit book is paper; the editorial promise is paper-like; dark mode dilutes that. Add dark mode in v2 if reader feedback demands it.
2. If both: define semantic tokens from day one (`--ink`, `--ink-muted`, `--paper`, `--paper-elevated`, `--accent`, `--accent-on-paper`). Never reference `--teal-500` from a component.
3. Build the dark-mode palette **at the same time** as the light palette, not after.
4. Test the codeblock theme in both modes simultaneously — Arduino keyword colors must remain readable in both.
5. Verify Arduino-teal accent stays distinguishable from "link blue" in both modes.

**Warning signs:**
- Components reference hex colors directly
- Tokens named by hue
- Dark-mode toggle appears in mockups before the dark palette is designed

**Severity:** Critical if both modes are needed; sidesteppable by committing to light-only v1
**Phase to address:** Design system phase — the color decision is a foundational one

---

### Pitfall 8: Headless preview never gets wired up, editor flies blind

**What goes wrong:**
The author types content in Wagtail admin, hits Preview, gets either nothing, the raw API response, or Wagtail's default HTML template (which doesn't exist because we're headless). The author starts publishing without preview, typos and layout mistakes ship to readers, the author resents the CMS.

**Why it happens:**
- Wagtail's native preview assumes server-rendered HTML templates. Headless setups need extra wiring. ([Wagtail Headless docs](https://docs.wagtail.org/en/latest/advanced_topics/headless.html))
- Solution exists ([torchbox/wagtail-headless-preview](https://github.com/torchbox/wagtail-headless-preview)) but requires: installing the package, adding `HeadlessPreviewMixin` to every page model, configuring `WAGTAIL_HEADLESS_PREVIEW.CLIENT_URLS`, building a `/preview/` route in Angular that accepts `content_type` + `token` and fetches preview data, and (Wagtail 7.1+) using redirect rather than nested iframe.
- It's "BE work" but "for editors" so it falls between roles in a solo project too.

**How to avoid:**
1. Treat preview as a P0 deliverable for the BE phase, not a nice-to-have. Define done = "I can edit a draft, click Preview, see exactly the live FE render."
2. Use `wagtail-headless-preview` (mature, recommended by Wagtail itself); add `HeadlessPreviewMixin` to every page model from the start.
3. Build the Angular `/preview/<contentType>/<token>` route as part of the page-template scaffold for each template.
4. Test preview for every page type and every StreamField block. If a block renders differently in preview vs. live, fix it.
5. Bonus: live-update preview on autosave (Wagtail 7.4 LTS adds autosave — leverage it).

**Warning signs:**
- "We'll add preview at the end"
- Preview button in Wagtail admin opens a 404 or raw JSON
- Author is editing live and refreshing the public site

**Severity:** Critical for solo author UX
**Phase to address:** BE phase (must be done before content authoring begins)

---

### Pitfall 9: Solo-VPS operations decay (no backups, expired certs, secrets in git, Docker-specific failure modes)

**What goes wrong:**
Single VPS feels like home; ops feels like an afterthought. Then, in some combination:
- A `DROP TABLE` in a manual psql session destroys content; no backup exists
- Let's Encrypt cert silently fails to renew (a hook breaks); browser shows scary cert error to all readers; emergency Saturday
- `.env` containing the Wagtail SECRET_KEY and DB password gets committed to a public repo
- Disk fills up because Wagtail rendition cache has been generating new files for two years uncleaned ([Wagtail rendition cleanup](https://github.com/wagtail/wagtail/issues/8107))
- The deployment process exists only as muscle memory in the dev's terminal history; a new laptop = a frozen project
- Postgres on the same disk as user-uploaded media; one runs out of space, the other dies with it

**Why it happens:**
Solo project, no peer review, "I'll do it later," ops chores have no user-facing payoff.

**How to avoid:**
1. **Backups before content.** Set up `pg_dump` to a daily file + offsite copy (B2/S3/Hetzner Storage Box) before publishing the first lesson. Test the restore once. ([backup strategy reference](https://djangocentral.com/deploy-django-with-nginx-gunicorn-postgresql-and-lets-encrypt-ssl-on-ubuntu/))
2. **Cert renewal monitored.** Use `certbot renew` via systemd timer; add a Healthchecks.io ping after success. If it doesn't ping, you get an email. Without monitoring, silent failures are the rule.
3. **Secrets discipline.** `.env` in `.gitignore` from commit zero. Use `git-secrets` or `gitleaks` as a pre-commit hook. Rotate any secret that touches a developer machine.
4. **Reproducible deploy.** Even for one VPS: a one-command script (Docker Compose, Ansible, or a shell script in the repo) so a new laptop can deploy. Document the bare-metal bootstrap.
5. **Disk separation.** Mount media/uploads on a separate volume, OR set Wagtail to store images on object storage from day one. Saves the "Postgres died because images filled the disk" disaster.
6. **Rendition hygiene.** Add `wagtail_update_image_renditions --purge-only` as a quarterly cron, or use a CDN that handles this for you.
7. **Monitoring "later" never happens.** Add Uptime Kuma (self-host, 1 container) at the same time as the Caddy/nginx config. Log to file with rotation. Email alerts for 5xx spikes.

**Warning signs:**
- "I'll back up after launch"
- No reply to "where do certs renew from?"
- `.env` files appear in `git status`
- `df -h` over 80%

**Severity:** Critical (any one of these can cost the entire site)
**Phase to address:** Deployment / ops phase, BUT some items (gitignore, secrets) belong on day zero of the BE phase

**Docker-specific additions (locked architecture, 2026-05-01):**
1. **Backups must be container-aware.** `pg_dump` runs via `docker compose exec postgres` (or a sidecar container) — NOT against a host-installed `psql`. MinIO is backed up via `mc mirror` to a separate B2 bucket. Two paths because relational and blob data have different shapes; one tool for each.
2. **Restart policies.** Every service in `compose.yml` declares `restart: unless-stopped`. The host-level `docker-compose@arduino.service` systemd unit ensures Docker itself comes up on boot; container restart policy handles individual crashes.
3. **Image pinning.** Use exact tags (`postgres:17.5`, not `postgres:17`) and pin `wagtail` image SHA after build. Floating tags = silent breaking changes on `docker compose pull`.
4. **Secrets via Docker secrets or `.env` (gitignored).** Never bake secrets into images. `docker compose config` + `gitleaks` pre-commit catches accidental leaks.
5. **Volume backups, not container backups.** Backups target the host-bound volumes (`/srv/arduino/postgres-data`, `/srv/arduino/minio-data`) and DB dump output — never image layers.
6. **Healthchecks on every service.** Postgres: `pg_isready`; MinIO: `mc ready local`; Wagtail: HTTP `/api/v2/pages/?limit=1`; Traefik: built-in. Compose `depends_on: condition: service_healthy` prevents Wagtail from starting before Postgres is accepting connections.
7. **Don't publish ports unnecessarily.** Only Traefik publishes 80/443. Postgres and MinIO must be on the internal network only — publishing them to the host = trivial scan target.
8. **Disk usage of Docker itself.** `docker system prune -af --filter "until=720h"` quarterly to reclaim layer/image disk.

---

## High-Severity Pitfalls

### Pitfall 10: Zoneless Angular 21 + Zone.js-assuming third-party library

**What goes wrong:**
You install a library (rich-text editor, charting library, modal, drag-and-drop, animation lib). It worked in Angular 17 demos. In your zoneless Angular 21 app, async events from the library don't trigger change detection, the UI freezes mid-interaction, or change detection fires too eagerly when the lib monkey-patches around it.

**Why it happens:**
- Zoneless is the default in Angular 21 ([Angular Zoneless guide](https://angular.dev/guide/zoneless)).
- Libraries that called `NgZone.run()`, listened to `onMicrotaskEmpty`/`onStable`, or relied on Zone.js patching `setTimeout`/`Promise` need updates. Older Material/CDK versions are not zoneless-compatible. ([Zoneless in Production: What Breaks](https://medium.com/@flaviusson/zoneless-angular-in-production-what-actually-breaks-and-how-to-fix-it-71873cc6255a))

**How to avoid:**
1. Before adopting any library, check its changelog/docs for "zoneless" or "Angular 18+" support. If unclear, scan the source for `NgZone` and `zone.js` references.
2. Prefer signal-native libraries over RxJS-only ones for new code.
3. For unavoidable Zone.js-dependent libs, you **can** opt them into a hybrid: keep `zone.js` polyfill loaded but use `provideZonelessChangeDetection()` only where safe. Cost: bundle size.
4. Test interactivity (clicks, async results, modal dismiss) on every integrated library before locking it in.

**Warning signs:**
- UI updates only after you click somewhere unrelated
- `console.warn('Application is in zoneless mode but…')`
- Library's last release was pre-Angular 18

**Severity:** High
**Phase to address:** FE phase — every library adoption decision

---

### Pitfall 11: SSR hydration mismatches from CMS rich-text `[innerHTML]` — N/A (SSG-only is locked)

> **Status as of 2026-05-01: not applicable.** Architecture is locked to `outputMode: "static"` — there is no Node SSR runtime, ever. Hydration mismatches between SSR and CSR DOM cannot occur because there is no SSR DOM. The pitfall below is preserved for historical context only.

**What goes wrong:**
Lesson body comes from Wagtail as HTML. FE binds it via `[innerHTML]`. SSR renders it server-side; client hydrates and Angular complains "DOM node mismatch" (NG0500). Console errors flood; in some cases interactive elements inside the rich text (copy-to-clipboard buttons, expandable figures) don't bind. ([NG0500 docs](https://angular.dev/errors/NG0500))

**Why it happens:**
- Angular hydration expects the SSR DOM to match what the client renders. `[innerHTML]` can introduce normalization differences (whitespace, attribute ordering, self-closing tag handling).
- Sanitization between server and client may differ.

**How to avoid:**
1. Render rich-text-heavy regions through a structured pipeline: parse the HTML once on BE (or in a deterministic pre-processor), output a canonical AST, then render via Angular components (one per block type). This gives Angular full ownership of the DOM.
2. Where you must use `[innerHTML]`, isolate it inside a component and apply `ngSkipHydration` as a last resort — but treat it as tech debt, not a solution.
3. Sanitize once, on the server, in a way that produces stable output (sorted attributes, normalized whitespace).
4. Test SSR + hydration with realistic CMS content (not "Hello World") before locking the architecture.

**Warning signs:**
- NG0500 errors in console only on production-like SSR builds
- Interactive elements inside lessons don't respond on first load, only after user navigates away and back

**Severity:** High
**Phase to address:** FE phase / FE↔BE integration phase

---

### Pitfall 12: NgOptimizedImage misconfig destroys LCP and CLS

**What goes wrong:**
Hero image of a lesson is huge, has no `priority`, lazy-loads, and shifts layout when it arrives. Or `width`/`height` are missing, CLS spikes. Or images are 4000px wide served to a 700px column. Editorial site that promises beauty has blurry-on-arrival hero images and janky scroll. ([Angular Image Optimization](https://angular.dev/guide/image-optimization))

**Why it happens:**
NgOptimizedImage requires explicit `width`/`height` for CLS, `priority` for LCP-candidate images, `sizes` for responsive serving, and fixed-vs-fill mode awareness. Easy to use it wrong.

**How to avoid:**
1. Wrap NgOptimizedImage in your own `<app-figure>` component that enforces: required width/height, computed `sizes` from the column the image lives in, automatic `priority` for above-fold lesson hero images.
2. Use Wagtail rendition tooling to generate properly-sized renditions; pass them via a `srcset` builder.
3. Keep an eye on the dev-mode console: NgOptimizedImage logs warnings for oversized, unsized, and lazy-LCP cases. Treat warnings as errors in CI.
4. Run Lighthouse on every page template before phase exit.

**Warning signs:**
- Lighthouse CLS > 0.1
- Hero images popping in
- Console warnings about "oversized image"

**Severity:** High
**Phase to address:** FE phase, page template phase, with Lighthouse gate

---

### Pitfall 13: Wagtail image renditions multiply forever on disk

**What goes wrong:**
Every unique filter spec (`fill-800x600`, `width-1200`, `format-webp-fill-1600x900`) generates a new rendition file, stored alongside originals. As content grows and you tweak design tokens (e.g. switching to a slightly different hero ratio), old renditions remain. After a year, `media/images/` is many GBs. ([Wagtail issue #8107](https://github.com/wagtail/wagtail/issues/8107))

**Why it happens:**
Renditions are cached forever by default. Wagtail provides cleanup but doesn't run it automatically.

**How to avoid:**
1. Schedule `./manage.py wagtail_update_image_renditions --purge-only` quarterly (cron or systemd timer). Renditions regenerate lazily on next request.
2. Constrain rendition specs to a small fixed set defined in code; don't let templates introduce ad-hoc filters.
3. If using object storage (S3-compatible), a lifecycle rule on rendition prefix can age out old files.
4. Monitor disk usage; alert at 70%.

**Warning signs:**
- `du -sh media/images/` doubling year-over-year
- Disk full alerts

**Severity:** High (not immediate; severe at year-2 mark)
**Phase to address:** Deployment / ops phase

---

### Pitfall 14: Building FE before deciding on draft-vs-live API endpoint strategy

**What goes wrong:**
FE consumes `/api/v2/pages/<id>/`, which returns live content only. Author wants to preview drafts. Suddenly need a separate authenticated endpoint for drafts, with token-based access, content_type lookup, and bypass of cache. FE has cached selectors keyed by ID and now must distinguish "live page 5" from "preview page 5 token=…".

**Why it happens:**
The draft/live distinction is an architectural concern that Wagtail's public API doesn't expose by default ([Wagtail headless docs](https://docs.wagtail.org/en/latest/advanced_topics/headless.html)). It only matters once preview is wired up — see Pitfall 8.

**How to avoid:**
1. Plan two API surfaces from day one: `/api/v2/pages/` (public, live) and `/api/preview/` (token-authenticated, draft).
2. FE data layer accepts both shapes; routes call into one or the other based on URL (`/preview/...` vs `/lessons/...`).
3. Cache invalidation: ensure preview responses are explicitly `Cache-Control: no-store`. Live responses can be cached aggressively at the edge.

**Severity:** High
**Phase to address:** FE↔BE contract phase

---

## Medium-Severity Pitfalls

### Pitfall 15: i18n leakage even though "Ukrainian only" is the rule

**What goes wrong:**
Site is Ukrainian-only by design (no Angular i18n routing, no `wagtail-localize`). But:
- `new Date().toLocaleDateString()` returns en-US format ("4/30/2026" not "30.04.2026" or "30 квітня 2026 р.")
- `Number.toLocaleString()` uses `1,234.56` not `1 234,56` (Ukrainian uses non-breaking space as thousands separator and comma as decimal)
- Sort order treats `і` and `и` as separate alphabet positions when Ukrainian collation has specific rules
- Day/month names from libraries (date-fns, dayjs) default to English unless explicitly imported with the `uk` locale
- HTTP `Accept-Language` not set on FE→BE requests → Wagtail/Django returns en strings for any system messages
- Form validation messages from Angular Signal Forms / browser default come out in English

These are tiny everywhere but degrade the editorial promise — Ukrainian readers immediately notice English month names.

**Why it happens:**
JavaScript runtimes default to the browser's locale, which the user might have set to en. Libraries default to en. "We don't need i18n" is misread as "we don't need to think about locale."

**How to avoid:**
Explicitly set `uk-UA` everywhere, even in a single-locale app:
1. **Angular:** in `main.ts` register Ukrainian locale data (`registerLocaleData(localeUk)`) and provide `{ provide: LOCALE_ID, useValue: 'uk-UA' }` at the root.
2. **Templates:** use Angular's `| date`, `| number`, `| currency` pipes — they pick up `LOCALE_ID`. Avoid `Date.prototype.toLocaleString()` calls without an explicit locale arg.
3. **Date library (if used):** `import { uk } from 'date-fns/locale'` and pass it to every format call. Or set a global default.
4. **Document root:** `<html lang="uk">` (also drives hyphenation — see Pitfall 4).
5. **HTTP client:** intercept requests, add `Accept-Language: uk-UA, uk;q=0.9`. On the Django side, `LANGUAGE_CODE = 'uk'`, `USE_I18N = True`, `USE_L10N = True`, `TIME_ZONE = 'Europe/Kyiv'`, install `django-modeltranslation` is **not** needed (single language) but Django's own translations are.
6. **Wagtail admin:** `WAGTAILADMIN_PERMITTED_LANGUAGES = [('uk', 'Українська')]`, `LANGUAGE_CODE = 'uk'`.
7. **Number formatting:** prefer `Intl.NumberFormat('uk-UA').format(n)` for any non-template formatting. ([MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat))
8. **Sorting/collation:** for any list ordering use `Intl.Collator('uk-UA').compare`.
9. **Audit gate:** before each phase exit, view the page with browser locale forced to en-US and confirm nothing leaks to English.

**Warning signs:**
- "April 30, 2026" appearing anywhere
- Month names switching when you change browser language
- Numbers with comma decimals in some places, period decimals in others

**Severity:** Medium (degrades polish, doesn't break)
**Phase to address:** Day-zero scaffolding (FE + BE both); audited at every phase exit

---

### Pitfall 16: Signal Forms experimental status used for production

**What goes wrong:**
Signal Forms in Angular 21 is **experimental** ([InfoQ: Angular 21 release](https://www.infoq.com/news/2025/11/angular-21-released/)). API may change in 22/23. If you build the contact form / lesson-feedback form / future content-submission form on Signal Forms, you may need to rewrite when it becomes stable.

**Why it happens:**
"Use the new shiny" bias. The PROJECT.md explicitly mentions Signal Forms.

**How to avoid:**
1. v1 of this site has minimal forms (auth-less, no comments, no progress tracking). The exposure is small. Decide upfront: which forms *do* exist?
   - Newsletter signup? Contact form? Wagtail admin (uses Reactive Forms, not Signal Forms — irrelevant)?
2. For each form, evaluate: is it small enough that rewriting on a breaking change is cheap? If yes, use Signal Forms. If no (heavy validation, complex state), use Reactive Forms which are stable.
3. Wrap form library access behind a thin abstraction so a future migration is local.
4. Watch the Signal Forms changelog at every Angular minor release.

**Severity:** Medium
**Phase to address:** FE phase, on each form decision

---

### Pitfall 17: "Arduino teal everywhere" overuse

**What goes wrong:**
Brand says "Arduino teal as accent." Designer falls in love and uses it for: links, buttons, code-block highlights, focus rings, sidenote rules, alert states, info boxes, headers. Result: visually loud, undermines the calm editorial tone.

**Why it happens:**
Single-accent palettes invite over-application; the Starter Kit book is *exactly* this disciplined and it's why it works.

**How to avoid:**
1. Define accent usage rules upfront: teal ONLY for (a) the wordmark, (b) primary navigation active state, (c) figure callout numbers, (d) inline link underline. Forbidden for body text emphasis, focus rings (use ink-700 instead), info/warn states (use a separate utility palette).
2. Keep an "accent budget" — max N teal pixels per page.
3. Dimensional discipline: accent saturation slightly reduced for the editorial feel.

**Severity:** Medium (but high impact on perceived quality)
**Phase to address:** Design system phase

---

### Pitfall 18: Wagtail-grapple lagging on Wagtail 7.4

**What goes wrong:**
You commit to GraphQL via wagtail-grapple. Wagtail 7.4 LTS releases 2026-05-04. Grapple maintainer is volunteer-paced and the 7.4-compatible release lands months later. You're stuck on Wagtail 7.3 or running an unreleased grapple commit.

**Why it happens:**
Grapple is third-party; Wagtail core releases on its own schedule. Historically grapple has lagged.

**How to avoid:**
1. Default recommendation: **use Wagtail's built-in REST API v2 (`wagtail.api.v2`), not grapple**. The site's data needs are simple (page reads, listing); REST suffices, and you avoid the lag risk and a dependency on a single maintainer.
2. If you need grapple's headless preview hooks, isolate them so swapping to native Wagtail preview later is local.
3. Pin grapple to a specific commit, not a version range; upgrade deliberately.

**Severity:** Medium (only if you choose grapple)
**Phase to address:** BE phase — API technology decision

---

### Pitfall 19: Code-block component complexity (line numbers + diff + margin annotations) skipped at v1

**What goes wrong:**
The Starter-Kit-style code experience (line numbers, diff-style "add these lines," margin annotations on specific lines, copy-to-clipboard, syntax highlighting) is THE differentiator for an Arduino learning site. It's tempting to ship "just syntax highlighting" at v1 and add the rest later. Reader sees `<pre>` blocks and the editorial promise crumbles.

**Why it happens:**
This component is genuinely complex. Highlighting libraries (Shiki, Prism, Highlight.js) don't natively do diff + line annotations. Margin annotations need to align across responsive breakpoints. Easy to defer.

**How to avoid:**
1. Treat the code block as a **first-class page template**, not a sub-component. Allocate dedicated phase budget.
2. Recommend: **Shiki** for highlighting (best Arduino-compatible C++ tokenization), wrapped in a custom Angular component that owns line numbering, diff classes, and annotation positioning.
3. Annotations are Wagtail StreamField sub-blocks `{ line: number, text: string }` so editors can author them.
4. Test at all breakpoints; on narrow screens annotations become disclosure widgets below the code.

**Severity:** Medium-High (it's a differentiator, not a table stake; but skipping it hits the editorial promise)
**Phase to address:** Page template phase, dedicated sub-phase

---

### Pitfall 20: MinIO + django-storages mismatched URL/endpoint config

**What goes wrong:**
Wagtail uploads succeed, but image renditions render as broken images in the FE. Or admin shows the right URL but readers' browsers get 403/redirect loops. Common causes:
- `AWS_S3_ENDPOINT_URL` (used by `boto3` from inside the wagtail container, e.g. `http://minio:9000`) differs from the public URL the browser must hit (`https://example.ua/media/...`). If `django-storages` returns the internal URL to the FE, browsers can't resolve `minio` (Docker DNS).
- Bucket policy rejects anonymous reads on the renditions prefix; admin works (signed) but public renders fail.
- `AWS_S3_CUSTOM_DOMAIN` not set, so URL generation defaults to `<endpoint>/<bucket>/<key>` with the internal hostname.
- MinIO `MINIO_BROWSER_REDIRECT_URL` not configured, causing admin console redirect loops when accessed via Traefik.

**How to avoid:**
1. Configure two URL paths in `settings.py`:
   - `AWS_S3_ENDPOINT_URL = "http://minio:9000"` (internal — used for upload/PUT calls from Wagtail)
   - `AWS_S3_CUSTOM_DOMAIN = "example.ua/media"` and `AWS_S3_URL_PROTOCOL = "https:"` (public — used for URLs returned to the browser)
2. Set MinIO bucket policy: `arduino-media/renditions/*` → `s3:GetObject` for `*` (public-read); originals require signed URL.
3. Verify in dev with `curl https://localhost/media/renditions/<file>` (anonymous) AND `mc ls` from the host.
4. Test the FE renders renditions on a fresh-bucket dev environment before declaring Phase 4 done.

**Warning signs:**
- Wagtail admin shows the image, public site shows broken image
- Browser dev-tools shows `http://minio:9000/...` URLs (internal hostname leaked)
- 403s on `/media/renditions/...` for anonymous browsers

**Severity:** High
**Phase to address:** Phase 4 (BE) and Phase 5 (deploy verification)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `[innerHTML]` for entire lesson body | Trivial wiring | Hydration mismatches, no interactive sub-elements, sanitization headaches | Never for body content; OK for tightly-scoped trusted snippets |
| Hex colors in components | Fast prototyping | Dark-mode rewrite, brand drift | Never beyond the design-system tokens file |
| Mock data as in-memory objects | No network, fast iteration | Mock shape diverges from real API | Only for the very first design comp; switch to MSW-mocked HTTP within days |
| Skipping hyphenation | Less to think about | Justified body shows rivers; ragged-right looks fine but precludes the "book" aesthetic | OK if you commit to ragged-right body permanently |
| `ngSkipHydration` | Silences NG0500 | Hides a real bug; SSR benefit lost on that subtree | Only as a deliberate, time-boxed escape hatch with a TODO |
| Single-accent overuse | Faster styling | Visual fatigue, undermines editorial tone | Never |
| `pip install` without lockfile | Fast setup | Reproducibility lost; "works on my machine" | Never for this project |
| Postgres backups "next sprint" | Nothing | Catastrophic on first incident | Never beyond the first day of having content |
| Defer dark-mode token design | Move faster on light mode | Doubles the eventual rework | Acceptable IF you commit to light-only v1 in writing |
| Use grapple for GraphQL | Headless feels modern | Lag on Wagtail releases, single-maintainer risk | Only if you hit a REST limitation |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Fonts | Default subset selection (cyrillic only, no cyrillic-ext) | Explicitly request `cyrillic` AND `cyrillic-ext`; or self-host with verified glyph coverage |
| Wagtail RichText → FE | Pass internal markup like `<a linktype="page" id="3">` to FE | Run `expand_db_html` server-side OR use grapple's pre-rendered HTML field |
| Wagtail StreamField → FE | Treat as opaque HTML | Treat as typed array of blocks; render block-by-block via dispatcher component |
| Wagtail Images → FE | Pass image URLs directly from `/media/` | Use rendition endpoint; pass renditions for needed sizes; consider object storage |
| Let's Encrypt + nginx/Caddy | Cert renewal failure goes silent | Healthchecks.io ping in renewal post-hook |
| Postgres on VPS | Same disk as media uploads | Separate volume OR object storage for media |
| Browser locale | Trust browser default | Explicit `LOCALE_ID = 'uk-UA'`, `lang="uk"`, `Accept-Language` |
| Angular SSR + CMS HTML | `[innerHTML]` directly | Pre-process to AST, render via Angular components |
| NgOptimizedImage | Forget `priority` on hero | Wrap in `<app-figure>` enforcing the contract |
| Wagtail preview | Assume native preview "just works" | Install `wagtail-headless-preview`, build `/preview/` route |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded image renditions | Disk gradually fills | Quarterly `--purge-only` cron; constrained spec list | Year 1–2 |
| Unbounded font loading | Slow first paint, FOUT | `font-display: swap`, subsetted fonts, `preload` for the body weight | First load on slow networks |
| Large hero images without priority | Bad LCP | NgOptimizedImage with `priority` + correct `sizes` | Every page |
| Code highlighting on client at runtime | Hydration delay, jank | Pre-highlight server-side (Shiki) and ship HTML | When code blocks are heavy / many per page |
| No HTTP caching on Wagtail API | Every page navigation hits Postgres | `Cache-Control: public, max-age=…` on live API; vary on draft preview | At ~50 concurrent readers |
| SSR rendering everything fresh per request | High BE CPU | Edge caching of rendered HTML, fragment caching | At ~10 RPS sustained |
| Postgres on tiny VPS instance | Slow queries during publish | Modest instance sizing; `shared_buffers` tuned; index audits | Modest content (low risk) but check on each phase |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `.env` in repo | Wagtail SECRET_KEY leak → session forgery | `.gitignore` from day zero; `gitleaks` pre-commit; rotate any exposed secret |
| Wagtail admin on public path with no IP allowlist | Brute-force on `/admin/` | Move admin to non-default path, add fail2ban or Cloudflare turnstile, allowlist if solo |
| `DEBUG=True` in production | Stack traces with secrets to public | Hard-coded `DEBUG=False` for prod settings; CI check |
| `ALLOWED_HOSTS = ['*']` | Host header attacks | Explicit hostnames only |
| Missing CSP | XSS via CMS rich text | Strict CSP, sanitize editor input (Wagtail does this but verify), nonce for inline scripts |
| Preview tokens long-lived | Draft content exposed | wagtail-headless-preview tokens expire; verify token TTL is short |
| Open Wagtail API for unpublished pages | Drafts leak via REST | API endpoint serves only `live=True`; preview goes through authenticated `/preview/` route only |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| English month names on date stamps | Editorial promise breaks instantly for UA reader | Force `uk-UA` everywhere; audit on every phase |
| Code block requires horizontal scroll on mobile | Reader can't read the lesson | Long lines wrap with continuation marker; or two-finger horizontal scroll affordance |
| Sidenote disappears on tablet | Reader misses the marginalia | Sidenote inlines at narrow widths, never disappears |
| Hero image lazy-loads with layout shift | Reader's eye is interrupted | NgOptimizedImage + priority + width/height |
| Reader can't tell draft from live | Confusing if preview leaks | Watermark or banner on preview view |
| No visible reading-progress affordance | Long lessons feel endless | Subtle scroll progress indicator (top edge), respects editorial restraint |
| Copy-code button in awkward spot | Friction | Top-right of code block, subtle, accessible label in Ukrainian |

## "Looks Done But Isn't" Checklist

- [ ] **Typography:** italic body weight in Cyrillic — verify it's a designed italic, not browser-synthesized slant
- [ ] **Typography:** ґ visible in display, body, and italic at all weights you ship
- [ ] **Typography:** small-caps Cyrillic — verify glyph quality (often missing)
- [ ] **Quotes:** Ukrainian convention `«…»` / `„…"` applied site-wide; CSS `lang`-aware fallback in place
- [ ] **Hyphenation:** `<html lang="uk">` set; `hyphens: auto` only on prose; tested in Chrome+Firefox+Safari
- [ ] **Two-column:** sidenote behavior verified at <768px, 768–1199px, ≥1200px breakpoints
- [ ] **Dark mode:** decided (light-only v1 OR both designed simultaneously)
- [ ] **Localization:** `LOCALE_ID = 'uk-UA'`, dates in Ukrainian, numbers `1 234,56`, sort via `Intl.Collator('uk-UA')`
- [ ] **Mock contract:** TypeScript types match real Wagtail StreamField shape with realistic block array
- [ ] **Preview:** `wagtail-headless-preview` installed, `/preview/` route works for every page type
- [ ] **NgOptimizedImage:** every image has width/height, hero images have `priority`, no console warnings
- [ ] **Hydration:** zero NG0500 errors on all page templates with realistic CMS content
- [ ] **Code block:** line numbers + diff highlighting + margin annotations + copy button — all four working on at least one lesson
- [ ] **Backups:** automated; restore tested at least once; offsite copy
- [ ] **Cert renewal:** `certbot renew` cron + Healthchecks.io ping
- [ ] **Secrets:** `.env` gitignored; `gitleaks` pre-commit hook; no secret in git history
- [ ] **Deployment:** one-command reproducible from a fresh laptop; documented in repo
- [ ] **Rendition cleanup:** quarterly cron in place
- [ ] **Monitoring:** Uptime Kuma or equivalent; 5xx alerts to email
- [ ] **Disk separation:** Postgres data and media on separate volumes (or media on object storage)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong font / missing italic Cyrillic | MEDIUM | Replace font; re-tune scale, line-height, measure; sanity-test all templates |
| Quote convention drift in published content | LOW–MEDIUM | Run normalizer migration over RichText fields; spot-check |
| Mock shape ≠ real API | HIGH | Refactor data layer to real shape; adapter components if too costly |
| Dark mode added late, tokens hex-coded | HIGH | Token-rename refactor; visual regression review of all pages |
| Postgres lost without backup | CATASTROPHIC | Recover from object-storage media if you have it; rebuild content from drafts in Git/local; treat as restart |
| Cert expired | LOW (10 minutes) | `certbot renew --force-renewal` and reload nginx; investigate why monitoring missed it |
| Secrets in git history | MEDIUM | Rotate every leaked secret; rewrite history with `git filter-repo`; force-push (only if solo) |
| Hydration mismatches in production | MEDIUM | Refactor `[innerHTML]` regions to component-rendered AST; in interim, `ngSkipHydration` + ticket |
| Wagtail-grapple stuck on old Wagtail | MEDIUM | Migrate hot paths to Wagtail REST v2; pin grapple to last-known-good |
| Sidenote breaks at tablet | LOW–MEDIUM | Implement the three-breakpoint behavior properly; visual review |

## Pitfall-to-Phase Mapping

> Phase names below are suggestions for the roadmap; map to actual phases when defined.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Font Cyrillic gaps | Design system (typography) | Glyph audit page screenshots in all weights/styles |
| 2. Quote conventions | Design system + content modeling | CI lint for ASCII quotes; visual review |
| 3. Latin lorem ipsum design | Design system | Comp screenshots use real Ukrainian; required at phase exit |
| 4. Justification rivers | Design system (typography) | Multi-browser visual regression; or commit to ragged-right |
| 5. Mock shape divergence | FE↔BE contract phase (between design and FE phases) | Shared TypeScript types; MSW fixture matches real Wagtail response |
| 6. Two-column collapse | Design system + page template phases | Three-breakpoint review at every template phase exit |
| 7. Dark mode late | Design system (color tokens) | Either light-only commitment OR both palettes designed |
| 8. Headless preview | BE phase | Editor flow demo: edit → preview → see live render |
| 9. Solo-VPS ops decay | Deployment phase + day-zero scaffolding | Backup restore drill; cert monitoring ping; gitleaks in pre-commit |
| 10. Zoneless library breakage | FE phase, per-library | Smoke test on each library integration |
| 11. Hydration mismatches | FE phase / integration phase | NG0500-free dev console with real CMS content |
| 12. NgOptimizedImage misconfig | Page template phases | Lighthouse gate before phase exit (LCP < 2.5s, CLS < 0.1) |
| 13. Rendition disk bloat | Deployment phase | Quarterly cron registered; disk-usage alert |
| 14. Draft-vs-live API confusion | FE↔BE contract phase | Two endpoints documented; FE routes call correct one |
| 15. i18n leakage to en | Day-zero FE+BE scaffolding; audited every phase | Force-en browser locale review at phase exit |
| 16. Signal Forms experimental risk | FE phase, per-form | Form abstraction in place; small forms only on Signal Forms |
| 17. Teal overuse | Design system | Accent usage rules documented; design review |
| 18. Grapple lag | BE phase (API choice) | Default to REST v2; only use grapple if specific need |
| 19. Code-block complexity deferred | Dedicated code-block sub-phase | Demo: line numbers + diff + margin annotation + copy on a real lesson |
| 20. MinIO + django-storages URL/endpoint mismatch | Phase 4 (BE) + Phase 5 (deploy) | FE renders renditions anonymously on fresh dev bucket; `AWS_S3_CUSTOM_DOMAIN` set explicitly |

## Sources

**Typography & Cyrillic:**
- [Ge (Cyrillic) — Wikipedia](https://en.wikipedia.org/wiki/Ge_(Cyrillic)) — ґ Unicode location, history of font support gaps
- [TypeDrawers: Ukrainian Ґ](https://typedrawers.com/discussion/4354/ukrainian-%D2%90) — type designer discussion of ґ challenges
- [Fontfabric — Ukrainian Fonts](https://www.fontfabric.com/language-support/ukrainian-fonts/) — foundry coverage
- [Ukrainian alphabet — Wikipedia](https://en.wikipedia.org/wiki/Ukrainian_alphabet)
- [google/fonts issue #1029 — cyrillic-ext subset](https://github.com/google/fonts/issues/1029)
- [Ukrainian Quotation Marks](https://www.whatiscalled.com/punctuation-marks/quotation_marks_in_Ukrainian/)
- [Netflix Ukrainian Style Guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/115002229068-Ukrainian-Timed-Text-Style-Guide)
- [caniuse — hyphens for Ukrainian](https://caniuse.com/mdn-css_properties_hyphens_language_ukrainian)
- [MDN: hyphens](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens)

**Angular 21 / zoneless / SSR:**
- [Angular Zoneless guide](https://angular.dev/guide/zoneless)
- [InfoQ: Angular 21 release](https://www.infoq.com/news/2025/11/angular-21-released/)
- [Zoneless Angular in Production: What Breaks](https://medium.com/@flaviusson/zoneless-angular-in-production-what-actually-breaks-and-how-to-fix-it-71873cc6255a)
- [Angular Hydration guide](https://angular.dev/guide/hydration)
- [NG0500: Hydration Node Mismatch](https://angular.dev/errors/NG0500)
- [Optimizing images with NgOptimizedImage](https://angular.dev/guide/image-optimization)
- [Angular Image Optimization: Master NgOptimizedImage](https://sweawreed.medium.com/your-angular-apps-lcp-is-still-too-slow-here-s-how-to-master-ngoptimizedimage-333f8e6da1b7)

**Wagtail / headless:**
- [Wagtail 7.4a Headless support docs](https://docs.wagtail.org/en/latest/advanced_topics/headless.html)
- [Headless Wagtail pain points (DEV)](https://dev.to/tommasoamici/headless-wagtail-what-are-the-pain-points-ji4)
- [torchbox/wagtail-headless-preview](https://github.com/torchbox/wagtail-headless-preview)
- [LearnWagtail: Serializing RichText Blocks](https://learnwagtail.com/tutorials/headless-cms-serializing-richtext-blocks/)
- [Wagtail issue #8107 — rendition cleanup](https://github.com/wagtail/wagtail/issues/8107)
- [Wagtail Wrapped 2025](https://wagtail.org/blog/wagtail-wrapped-2025/)

**VPS / ops:**
- [DjangoCentral: Deploy Django + Nginx + Postgres + Let's Encrypt](https://djangocentral.com/deploy-django-with-nginx-gunicorn-postgresql-and-lets-encrypt-ssl-on-ubuntu/)
- [Let's Encrypt: Backup/Restore Certificates](https://community.letsencrypt.org/t/backup-restore-lets-encrypt-ssl-certificate-from-to-a-vps/85196)

**i18n / locale:**
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

**Design / mock-data discipline:**
- [Building with Mock Data: Smart or Future Headache?](https://medium.com/lotuss-it/building-with-mock-data-smart-front-end-strategy-or-future-headache-548cafe95c7b)
- [Red Hat: Contract-first development with mock APIs](https://developers.redhat.com/blog/2020/04/28/contract-first-development-create-a-mock-back-end-for-realistic-data-interactions-with-react)

---
*Pitfalls research for: Editorial-quality Ukrainian Arduino learning site*
*Researched: 2026-04-30 — updated 2026-05-01 for Docker/Traefik/MinIO topology and SSG-only lock; Pitfall 11 marked N/A (no SSR), Pitfall 9 expanded with Docker-specific guidance, new Pitfall 20 (MinIO/django-storages URL/endpoint mismatch).*
