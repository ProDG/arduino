# Arduino Learning Hub (Ukrainian)

## What This Is

A Ukrainian-language learning website dedicated to Arduino — lessons, courses, standalone articles, schematics, and component datasheets. The defining ambition is editorial-grade typography and layout inspired by the official *Arduino Starter Kit* book: reading the site itself should be a pleasurable, focused experience that aids comprehension. Aimed at beginners progressing toward intermediate makers.

## Core Value

**Reading and learning here feels as good as reading a beautifully typeset book** — design, typography, and visual structure are the primary product, not decoration. If the typography hierarchy, whitespace, and editorial discipline don't deliver, nothing else matters.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Editorial design system: typography scale, color palette (with Arduino-teal accent on a distinct identity), spacing, and component primitives — all with Cyrillic-first font choices
- [ ] Two-column layout (body + sidenote/margin column) on large screens, gracefully collapsing on small screens
- [ ] Lesson page template with rich content: prose, images, schematic figures, annotated code blocks (line numbers + diff view), and margin sidenotes
- [ ] Standalone article page template
- [ ] Datasheet/component reference page template (pinouts, specs, peripheral notes)
- [ ] Schematic/diagram pages (static images, no simulation)
- [ ] Lesson library / index page listing all lessons
- [ ] Site navigation, header, footer, and home page in keeping with the editorial aesthetic
- [ ] Responsive behavior: usable on phones, polished on laptops, gorgeous on FHD+ displays
- [ ] Frontend built with Angular 21 (zoneless, Signal Forms, Vitest) and SCSS — no Tailwind
- [ ] Mock data layer driving the FE so design can be locked before BE work begins
- [ ] Wagtail CMS backend (7.4 LTS, releasing 2026-05-04) with page models matching the FE templates: lessons, articles, datasheets, schematics
- [ ] Editor experience suitable for a single author/admin to publish and update content
- [ ] Self-hosted deployment on a single VPS (FE + Wagtail + DB)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- **Circuit simulator (Wokwi-style)** — out of scope for v1; schematics are static images. Reason: scope explosion; design quality is the priority.
- **In-browser code execution / Arduino emulation** — out of scope. Code blocks display only. Reason: same as above; not worth the complexity for v1.
- **Reader accounts, progress tracking, comments** — out of scope for v1. Reason: pure read-only learning site is enough to validate the design thesis. *Note: design data model and routes so reader-side accounts could be added later without rewrite.*
- **Site search** — out of scope for v1. Reason: small content set at launch; navigation + lesson index suffice.
- **Internationalization / multiple languages** — out of scope permanently. Site is Ukrainian-only by design. No translation infrastructure (no wagtail-localize, no Angular i18n routing). Reason: explicit user decision — not a future need.
- **Tailwind / utility-first CSS** — explicitly excluded. SCSS only. Reason: editorial design benefits from a hand-crafted, semantic stylesheet.

## Context

- **Design north star:** the official *Arduino Starter Kit* book. Aspects to replicate: confident typography hierarchy (large editorial headings, calm body, clear annotations), generous whitespace, two-column layout with a margin/sidenote column, restrained palette with Arduino-teal as accent on an otherwise distinct identity.
- **Language:** all UI and content in Ukrainian. **Hard typographic constraint:** every chosen font (display, body, code) must include high-quality extended Cyrillic glyphs. This narrows serif options significantly and must be verified during font selection — Latin-only families are disqualified regardless of aesthetic fit.
- **Brand stance:** distinct identity inspired by Arduino's visual language, not Arduino-branded. Uses Arduino teal as one accent in a broader palette.
- **Build order discipline:** design + frontend (with mocked data) is locked first; backend integration follows only after the design system and key page templates feel right. This avoids designing for the CMS instead of for the reader.
- **Code presentation:** Arduino code blocks need line numbers, syntax highlighting, copy-to-clipboard, *and* diff-style highlighting for progressive lessons ("add these lines"), plus margin annotations on specific lines (mirrors the book's annotated-code style).
- **Audience:** Ukrainian-speaking beginners through intermediate makers — people running their own small projects, not advanced PCB designers.
- **Author:** solo developer/author, building both the platform and the content.

## Constraints

- **Tech stack — Frontend:** Angular 21 (currently 21.2.10 as of 2026-04-30). Use zoneless change detection (default in v21), Signal Forms, Vitest as test runner, and Angular Aria where accessibility primitives help. No Tailwind. SCSS only. Follow Angular AI guidance from https://angular.dev/ai/develop-with-ai for codegen prompts and conventions.
- **Tech stack — Backend:** Wagtail CMS 7.4 LTS (release date 2026-05-04). BE phase is scheduled to start *after* the FE design phase, so 7.4 LTS will be available; benefits include autosave and LTS support window.
- **Tech stack — Styling:** SCSS, hand-authored. Editorial typography requires bespoke styles, not utility classes.
- **Typography:** fonts must support full extended Cyrillic. Display, body, and monospace selections all subject to this constraint.
- **Deployment:** self-hosted on a single VPS. Lower cost, full control; ops complexity accepted as a tradeoff.
- **Audience scale:** small to moderate. No need for CDN-scale architecture, autoscaling, or multi-region deployment.
- **Author bandwidth:** solo project. Roadmap should reflect realistic single-developer pacing; prefer fewer, larger phases over many small ones.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build FE first with mocked data, BE second | Lock design quality without CMS data model leaking into UI decisions | — Pending |
| Angular 21 (zoneless, Signal Forms) + SCSS, no Tailwind | User preference; editorial design wants bespoke CSS, not utilities | — Pending |
| Wagtail 7.4 LTS for BE | Latest LTS lands within 5 days; BE phase is later anyway; gets autosave + extended support | — Pending |
| Ukrainian only, no i18n architecture | Explicit scope decision; avoids translation infrastructure entirely | — Pending |
| Distinct identity inspired by Arduino book, not Arduino-branded | Own colors and wordmark; uses Arduino teal as one accent | — Pending |
| Single VPS hosting | Cost and control; small audience scale fits single-server topology | — Pending |
| Code blocks: line numbers + diff view + margin annotations | Matches Starter Kit book's progressive, annotated-code style | — Pending |
| No reader accounts / progress / comments in v1 | Validate the design thesis first; revisit only if readers ask for it | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-30 after initialization*
