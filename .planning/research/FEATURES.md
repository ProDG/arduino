# Feature Research

**Domain:** Editorial-quality, Ukrainian-language Arduino learning website (read-only, lessons + articles + schematics + datasheets)
**Researched:** 2026-04-30
**Confidence:** HIGH for typography/reading-experience patterns (well-documented field; Tufte CSS, Gwern, Distill, Ciechanowski are canonical references). MEDIUM for Arduino-learning-specific UX (Adafruit/Sparkfun/arduino.cc are the de facto comparators; their patterns are observable but not formalized). MEDIUM for Ukrainian-specific typographic rules (sources from Ukrainian linguistic guides, Netflix style guide, Unbabel).

## Reading-experience reference set (what informs this research)

| Site | What it teaches us |
|------|--------------------|
| ciechanow.ski (Bartosz Ciechanowski) | Long-form technical posts with extreme reading discipline: serif body, generous measure, figures interleaved with prose, no chrome, no nav distractions. The "feels like a book" benchmark. |
| Tufte CSS / edwardtufte.github.io/tufte-css | Sidenotes/marginnotes pattern, ET Book serif, numbered+unnumbered margin notes, mobile collapse via checkbox-toggle (no JS). |
| Gwern.net | Most rigorous sidenote implementation on the web; popups for footnotes; collapsible sections; aggressive use of typographic features (smallcaps, hanging numbers). |
| Distill.pub | Layout grid with body/wide/full-bleed figure widths; reader-friendly typography; mobile adaptation. Now archived but pattern is canonical. |
| Smashing Magazine | Long-form article reading: drop caps, intelligent pull quotes, generous body. |
| Stripe Docs (docs.stripe.com) | Three-column layout (nav / content / live code); tabbed code blocks; copy buttons; in-text token highlighting. |
| arduino.cc/learn | Domain UX baseline: parts list, schematic image, code block, breadboard image. Functional, not editorial. |
| learn.adafruit.com | Multi-page lessons with explicit prev/next nav, sidebar TOC, parts/products list, "view all" single-page mode. |
| Sparkfun Learn | Difficulty markers, prerequisite chains, estimated read time, hookup-guide pattern. |
| Bartosz's blog + Cybernetics-style Substack | Quiet chrome, big editorial headings, calm color, body-first hierarchy. |

## Feature Landscape

### Group 1: Reading Experience (Site-wide typography & layout)

#### Table Stakes — Reading

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cyrillic-first font stack (display, body, mono) | Site is 100% Ukrainian; Latin-only fonts visibly fail on Cyrillic glyphs | M | Hard constraint per PROJECT.md. Candidates with full extended Cyrillic: PT Serif, Source Serif 4, Literata, Roboto Serif, Lora; for body sans: Inter, IBM Plex Sans; for mono: JetBrains Mono, IBM Plex Mono, Fira Code (verify Cyrillic). |
| Comfortable measure (line length 60–75ch on body) | Below this and prose feels cramped; above and the eye loses the line | S | CSS `max-width: 65ch` on body container. |
| Vertical rhythm / consistent line-height | Inconsistent leading destroys the "book feel" instantly | S | Use a single modular scale (1.5–1.7 line-height for serif body). |
| Generous whitespace between sections | Editorial = breathing room. Cramped = blog. | S | Margins driven by type scale, not arbitrary px. |
| Smart quotes — Ukrainian primary («…»), secondary („…") | Wrong quotes ("...") instantly mark the site as amateur | S | Auto-substitute at build/render time. Primary: «…» (chevrons, no spaces). Secondary inside primary: „…". Never use straight " or ‚'. |
| Em-dash with proper spacing | Ukrainian uses — surrounded by spaces (or for subject–predicate); en-dash for ranges (1–2) | S | Replace `--` and `---` typographically; never use hyphen-minus where dash is intended. |
| Non-breaking spaces after one-letter prepositions/conjunctions | Ukrainian typographic rule: prevent orphan letters (в, з, у, і, й, та, не) at line end | M | Run text through pre-processor that inserts `&nbsp;` after these tokens. Same rule as Russian/Polish typography. |
| Proper hyphenation (or no hyphenation) | Justified text without proper hyphenation looks worse than ragged-right; Ukrainian hyphenation rules differ from English/Russian | M | Recommendation: use ragged-right (`text-align: left`). If justified is wanted, must use Hyphenopoly.js or `hyphens: auto` with `lang="uk"` — and verify the browser actually has Ukrainian hyphenation patterns (Safari/Firefox better than Chrome historically). |
| Heading hierarchy (h1 → h4) with distinct visual weight | Required for both readability and accessibility | S | Use clear scale; h1 should feel "title page" big. |
| Figure with caption | Captions are the editorial signal; uncaptioned images feel dumped-in | S | `<figure><img><figcaption>` semantic markup. |
| Pull quotes / blockquotes | Books pull-quote; readers expect distinct treatment | S | Larger size, italic or different family, indent/marginal. |
| Footnotes (or sidenotes) for asides | Long-form expects this; bare parenthetical is not enough | M | See sidenotes below — recommend sidenotes-on-desktop, footnote-collapse-on-mobile. |
| Print stylesheet | Books print well; respect the medium | S | `@media print` with sensible page breaks, hidden nav. |
| Anchor-link-on-heading (clickable hash) | Standard for long-form web content | S | Hover-revealed pilcrow/anchor icon. |

#### Differentiators — Reading

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Sidenotes / margin notes (true Tufte-style)** | THE signature feature of this site. Margin column collapses to inline toggle on mobile. Distinguishes us from every Arduino site on the web. | M | Pure CSS implementation possible (Tufte CSS checkbox-toggle), no JS needed. Two flavors: numbered sidenote (footnote-style) and unnumbered margin note (a.k.a. "marginalia"). Requires two-column body layout. |
| Drop caps on chapter/lesson openers | Strong book signal; sets tone immediately | S | CSS `::first-letter` with carefully tuned font-size, line-height, float. Verify drop cap glyph quality in chosen Cyrillic font (some Cyrillic letters — Ж, Щ, Ю — are wider; don't blow out grid). |
| OpenType ligatures + contextual alternates on body | Subtle "this was set, not rendered" texture | S | `font-feature-settings: "liga", "calt"`. |
| Old-style (text) figures in body, lining figures in tables/code | Books use text figures (1234 with ascenders/descenders); web defaults to lining | S | `font-variant-numeric: oldstyle-nums` on body; `tabular-nums` in tables. Verify font has both. |
| Hanging punctuation (quotes, hyphens hang into margin) | High-end book detail; eye reads cleaner edge | S | `hanging-punctuation: first last` (Safari only as of 2026; progressive enhancement). |
| Optical sizing on display fonts | Display fonts at body size look heavy; small fonts at display size look thin | S | If using a variable font with `opsz` axis (Source Serif 4, Literata). |
| Numbered figure references ("Fig. 3" linkable from prose) | Book convention; helps readers follow along | M | Auto-numbering via CSS counters or build-time. |
| Reading rhythm: paragraph indent OR space-between (not both) | Small detail; mixing them is amateur | S | Prefer space-between for web. |
| Reader-mode-grade contrast and color discipline | Pure black on pure white is harsh; pure off-white background and near-black text reads better | S | E.g., `#fbfaf7` background, `#1a1a1a` text. Arduino-teal as accent only. |

#### Anti-features — Reading

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Dark mode (v1)** | "Everyone has dark mode" | Editorial design is calibrated to a single paper-like background. Dark-mode'ing a book layout doubles design work and degrades the typographic identity. The Arduino book itself is not "dark mode." | Defer to post-v1. If implemented later, treat as a separate, independently-designed theme — not a CSS-variable swap. |
| Justified body text without hyphenation | "Looks like a book" | Without proper hyphenation it produces ugly rivers of whitespace; worse than ragged-right | Ragged-right, OR justified WITH `hyphens: auto` + verified `lang="uk"` patterns. |
| Custom scrollbars | "Branded" | Fights OS conventions; accessibility risk; never improves reading | Use OS default. |
| Reading-progress bar at top of page | "Modern blog" | Visual noise; competes with the editorial chrome; doesn't help reading | Skip. If progress UI is wanted, put it in margin column. |
| Estimated reading time stamp at top of every page | "Medium-style" | Cliché; for a learning site read time is misleading (you're meant to build, not skim) | Use on lesson library index instead, where it helps planning. |
| Floating share buttons | "Engagement" | Visual interruption; for a Ukrainian niche audience, social share value is low | Skip. Quiet share links in footer if any. |
| Animated scroll-triggered effects | "Polish" | Antithesis of book reading; jitters the eye | Static, calm layout. Animation reserved for explicitly-interactive figures only. |
| Web fonts loaded synchronously without `font-display: swap` | "Just works" | FOIT (flash of invisible text) destroys first impression on slow networks | `font-display: swap` + preload critical faces; subset to Cyrillic + Latin Ext. |

---

### Group 2: Lesson Page

#### Table Stakes — Lesson

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Lesson title + subtitle/standfirst (deck) | Books open chapters this way; readers orient instantly | S | Distinct typographic treatment. |
| Lesson metadata block (difficulty, estimated time, last updated) | Learners need to scope effort before starting | S | Restrained; in masthead area. |
| Parts list / "what you'll need" sidebar | Direct match to Starter Kit book's "ingredients" page; standard on Adafruit/Sparkfun | M | On wide screens, can live in margin column near top; on mobile, expands above content. Each part links to its datasheet page. |
| In-page table of contents (lesson sections) | Long lessons need wayfinding | S | Sticky TOC in margin column on desktop; collapsed-by-default on mobile. |
| Previous / next lesson navigation | Sequenced courses require this | S | At foot of lesson and optionally in masthead. |
| Schematic / breadboard figure with caption | Core domain content; cannot ship without | M | See Schematic group below. |
| Code block (line numbers, syntax highlighting, copy) | See Code group below | M | |
| Section anchors (jump to exact subheading) | Standard long-form web | S | Already covered under Reading. |
| Print-friendly version | Makers print lessons to follow at the bench | S | `@media print`. |

#### Differentiators — Lesson

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Margin annotations on specific code lines** | The defining "book-as-website" feature for this domain. Mirrors the Arduino Starter Kit book exactly. | L | Requires: (a) two-column layout; (b) per-line anchors in code blocks; (c) margin-positioned annotation that aligns vertically to the referenced line; (d) mobile fallback (annotation appears below code, with line-number reference). Coupled to Code group features. |
| Expandable "Aside: how transistors work" boxes | Lets the lesson stay linear while offering depth on demand | M | `<details>` element styled editorially; or a custom component. Should be visually distinct (tinted background, marginalia treatment). |
| Glossary / definition tooltips on technical terms | Beginners constantly hit unfamiliar terms (PWM, флеш-пам'ять, шина I²C) | M | Inline `<dfn>` with hover/tap popover. Glossary is shared across site. Ukrainian-specific concern: many Arduino terms are calques or transliterations; consistent glossary defends against drift. |
| Numbered figures and inline references ("див. рис. 3") | Book-style cross-referencing; rare on web | M | Auto-numbering + click-to-scroll. |
| Pin/peripheral reference highlighting in prose | Mention `pin 13` in prose → tooltip showing the pin's role | M | Pattern-matched build-time wrap, or explicit `<pin>` markup. Same data feeds datasheets. |
| Lesson "running parts list" — checkable box at top | Maker is at the bench; physical-world interaction | S | Could be cookie/localStorage backed despite no-account stance — purely client-side. Out of scope per PROJECT.md ("no progress tracking") — flag for v1 deferral. |
| Distinct page templates for "lesson," "article," "datasheet," "schematic" | Each content type has different layout demands; one-template-fits-all is the blog trap | M | Already in PROJECT.md Active. Important to preserve as different *visual* treatments, not just different data. |
| "End of lesson" page-end ornament | Book signal: small fleuron/swash marks chapter end | S | Tiny visual treat; very high signal-to-effort. |

#### Anti-features — Lesson

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Comments / Disqus | "Community engagement" | Out of scope per PROJECT.md; spam, moderation burden, degrades editorial tone | Skip. Solo author + email if needed. |
| Star ratings on lessons | "Social proof" | Implies a social platform we're not building; degrades typographic chrome | Skip. |
| "X% completed" progress bar requiring an account | "Learning platform feel" | Out of scope per PROJECT.md; introduces auth/state | Skip. |
| Auto-advance to next lesson | "Course feel" | Disrespects reading pace; never appropriate for editorial content | Explicit prev/next link. |
| Embedded video tutorials | "Multimedia" | Out of scope; video undermines the typographic core of the product | Static figures + clear prose. |

---

### Group 3: Code Blocks (Arduino C++ specific)

#### Table Stakes — Code

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Syntax highlighting tuned for Arduino C++ | Required floor; default C++ misses Arduino types/keywords (`pinMode`, `digitalWrite`, `HIGH`, `LOW`, `Serial`, `loop`, `setup`, etc.) | M | Use Shiki or Prism with extended Arduino keywords token list. Shiki preferred for fidelity (TextMate grammar). |
| Line numbers | PROJECT.md explicit requirement; book mirror | S | CSS-based numbering; non-selectable so copy-button copies clean code. |
| Copy-to-clipboard button | PROJECT.md explicit requirement; ubiquitous user expectation | S | Must copy WITHOUT line numbers and WITHOUT diff markers. |
| Monospace font with full Cyrillic support | Comments will be in Ukrainian; Latin-only mono fonts render Cyrillic in fallback (visual disaster) | M | JetBrains Mono, IBM Plex Mono, Source Code Pro all have Cyrillic. Verify glyph coverage. |
| Horizontal scroll on overflow (no soft-wrap by default) | Code semantics depend on line breaks | S | Long lines scroll; offer optional toggle for soft-wrap. |
| Distinct visual treatment for code (no body-text overlap) | Code must be unambiguously code | S | Tinted background, monospace, slightly tighter line-height. |
| Code block language label | Reader needs to know "this is .ino" vs "this is bash" | S | Small label in upper corner. |

#### Differentiators — Code

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Diff highlighting ("add these lines")** | PROJECT.md explicit requirement. Arduino lessons are progressive: "to last lesson's code, add these three lines." Diff highlighting is the cleanest representation. | M | Use Shiki diff transformer or custom — render `+` lines tinted green, `-` lines tinted red, but the markers themselves dimmed/hidden so the code reads naturally. Copy must produce the final, post-diff code (no `+`/`-` chars). |
| **Margin annotations linked to specific line numbers** | PROJECT.md explicit requirement. Mirrors the Arduino book's annotated code style exactly. | L | Each code line has an anchor; annotations live in the margin column and CSS-position aligned to their target line. Mobile: annotations collapse below the code with "(line 7)" backreference. Most distinctive code-block feature on the site. |
| Highlighted line ranges (`{3,5-7}` syntax) | Drawing reader's eye to the lines under discussion | S | Standard Shiki/Prism feature; minor styling work. |
| Pin/peripheral references inside code (hover `pin 13` in code → tooltip) | Connects code to physical hardware; Arduino-specific | M | Build-time pattern match within highlighted tokens; reuses glossary infrastructure. |
| Literate-programming interleaving (prose ↔ code segments) | Lets the lesson read like a book chapter, not a code dump followed by an explanation | M | More authoring discipline than tech; CMS template should support arbitrary alternation of prose/code blocks. |
| File-name header on multi-file projects (`blink.ino`) | Helps when a lesson spans multiple files | S | Minor styling. |
| Distinct treatment for "complete" code vs "snippet" vs "diff" | Reader knows whether to type all of it or apply changes | S | Three visual states or a small label. |

#### Anti-features — Code

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-browser code execution / Wokwi-style simulator | "Interactive learning" | Out of scope per PROJECT.md; massive scope | Static code + photographs of working circuits. |
| Live editable code blocks | "Try it yourself" | No execution backend; would be theater | Skip. |
| Auto-expanding theme switcher per code block | "Personalization" | Visual noise; the editorial design owns the color story | Single, tuned syntax theme. |
| Soft-wrap by default | "Mobile readability" | Breaks code semantics; reader can't tell where lines end | Horizontal scroll; offer wrap toggle. |
| Run/Build buttons | "Looks legit" | Fake button = worse than no button | Skip. |

---

### Group 4: Schematic / Datasheet Pages

#### Table Stakes — Schematic

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| High-resolution schematic images with captions | Core domain content | S | SVG preferred for scalability; PNG @2x as fallback. |
| Click/tap-to-zoom (lightbox) | Schematics need to be inspected up close | M | Lightweight lightbox component; Angular CDK or hand-rolled. |
| Downloadable PDF link for datasheet pages | Makers print/store datasheets; standard on every component supplier site | S | Link to file; respect browser download. |
| Pinout image with labeled pins | Datasheet-page essential | M | Authored as labeled SVG. |
| Component metadata block (voltage, current, package, alternates) | Datasheet defining feature | S | Structured table. |

#### Differentiators — Schematic

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Image-with-callouts (numbered pins on chip pinout link to text below) | Books do this; web rarely | M | SVG with `<a>` regions or a callout overlay component. |
| Hover hotspots on chip pinout (pin → role tooltip) | Pinouts become learnable, not just lookup-able | M | SVG hotspots + tooltip. |
| Zoom/pan inside the schematic frame (not full lightbox) | Lets reader explore without losing page context | M | Pan/zoom library or custom; SVG-friendly. |
| Side-by-side schematic + breadboard view | Maker translates schematic ↔ physical wiring; book does this | M | Two figures in the same row at wide screens, stacked at narrow. |
| Linked from-prose ("see схема резистора-подільника напруги") | Discoverable cross-references | S | Plain anchor link with figure number. |
| "What it looks like in real life" photograph alongside schematic | Bridges abstract → physical | S | Pure content/authoring discipline. |

#### Anti-features — Schematic

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Live circuit simulator | "Interactive" | Out of scope per PROJECT.md | Static schematic. |
| 3D component renders | "Wow factor" | Distracts from the schematic, which is the actual learning artifact | Photograph + schematic. |
| Auto-generated SPICE plots | "Engineering credibility" | Audience is beginners; unnecessary | Hand-drawn waveforms where needed. |

---

### Group 5: Lesson Library / Index Page

#### Table Stakes — Library

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| All lessons listed in canonical course order | Sequence is the product | S | Author-curated order, not auto-sorted by date. |
| Lesson title + brief description per entry | Reader needs to scope what each lesson covers | S | One-sentence standfirst. |
| Difficulty marker (початковий / середній) | Standard on Sparkfun/Adafruit; readers self-select | S | Two or three levels max. Ukrainian labels. |
| Estimated time | Helps planning | S | "~20 хв" format. |
| Visual hierarchy distinguishing courses from standalone articles | Two content shapes; mixing them is confusing | M | Two distinct sections or visual treatments on the index. |
| Responsive grid that respects type at every breakpoint | Index is a reading surface, not a card grid | M | This is the make-or-break for "bookshelf vs YouTube grid" — see differentiators. |

#### Differentiators — Library

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Bookshelf-feel layout (typographic, not card-based)** | Distinguishes from every Maker-content site | M | Recommend a "table of contents" treatment: lesson number, title, brief, dot leaders to time/difficulty — NOT card grid. Mirrors a book's TOC page. |
| Course progression graphic (linear or branching) | Lessons depend on prior lessons; visualize it | M | Hand-drawn-feel SVG, not a flowchart. |
| Prerequisite chain shown per lesson ("requires Lesson 3") | Sets expectations; protects beginners from getting lost | S | Small inline reference. |
| Section dividers with editorial preamble ("Розділ I — Основи") | Books group chapters into parts | S | Pure content/typography. |
| Cover-art-style hero per course | Books have covers; courses can too | M | One illustration per course (not per lesson). Restrained, on-brand. |

#### Anti-features — Library

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Card grid with thumbnail per lesson | "Modern" | Levels every lesson visually; loses the book hierarchy; YouTube-grid trap | Typographic TOC layout. |
| Search bar | "Discoverability" | Out of scope per PROJECT.md (small content set); a curated index outperforms search at this scale | Curated index + clear navigation. |
| Filter pills (by tag, by component, by difficulty) | "Power user UX" | Adds chrome without value at v1 content scale | Defer until library is large enough to need it. |
| Sort-by-date / sort-by-popularity | "Blog convention" | Lessons are sequenced; sortability undermines the curriculum | Single canonical order. |
| Infinite scroll | "Engagement" | Defeats the bookshelf metaphor; degrades navigation | Static page, ideally fits a screen or a near-screen. |

---

### Group 6: Site-wide

#### Table Stakes — Site-wide

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Header with site identity, primary nav (Lessons / Articles / Datasheets / About) | Standard wayfinding | S | Quiet, typographic header. No mega-menu. |
| Footer with author/credits, license, contact | Standard | S | Restrained. |
| Home page setting tone (editorial, not landing-page-y) | First impression IS the design thesis | M | Hero typography moment, brief positioning statement, latest/featured lesson, link to library. |
| About page | Solo-author site needs a face/voice | S | One-pager; tells the project's why. |
| Responsive: phone usable, laptop polished, FHD+ gorgeous | PROJECT.md requirement | L | Three deliberate breakpoints, not infinite responsive. |
| Accessible color contrast (WCAG AA on body text) | Legal/ethical floor | S | Verify the off-white + near-black combo. |
| Keyboard navigation works | Accessibility floor | S | Skip-link, focus rings, logical tab order. |
| Sensible 404 page | Quality signal | S | Editorial 404, not default. |
| RSS feed | Long-form audience expectation; Ukrainian tech blog readership uses RSS more than Western average | S | One feed for articles, one for lessons. |
| Sitemap.xml + meta tags / OpenGraph | Discoverability basics | S | Standard. |

#### Differentiators — Site-wide

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Editorial home page (not a landing page) | Sets the design thesis on first paint | M | Big typography, no hero illustration cliché, immediate sample of body type. |
| Custom wordmark in Cyrillic | Unique identity; off-the-shelf logo would betray the design ethos | M | Hand-set or custom-designed wordmark. |
| Quiet, calm chrome (no fixed nav, no chat widget, no banners) | Negative space IS the differentiator | S | Constraint, not work. |
| Author voice / colophon page (typeset details, font credits) | Books have colophons; signals craft to readers who notice | S | One-pager near footer. |
| Pre-rendered / static-first delivery | Body-text-first sites should load instantly | M | Angular SSR / SSG; serve HTML first. |

#### Anti-features — Site-wide

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Newsletter signup popup | "Audience growth" | Hostile UX; antithesis of editorial calm | Quiet RSS link in footer; optional inline signup at lesson end. |
| Cookie consent banner beyond legal minimum | "GDPR" | Most cookie banners are theater; if you set no tracking cookies, you need no banner | Use no analytics cookies or use a privacy-respecting analytics (Plausible/Umami) that needs no consent. |
| Live chat widget | "Support" | Solo author; widget = visual noise + false promise | Email link in footer. |
| Autoplay video / motion | "Engagement" | Editorial design doesn't move | Static. |
| Sticky social share floats | "Virality" | Visual interruption | Skip or footer-only. |
| Cookie-based reader analytics (Google Analytics) | "Default" | Heavy, third-party, requires consent banner | Plausible / Umami / self-hosted; cookieless. |
| Multi-theme switcher | "Personalization" | Doubles design surface; v1 owns one theme | Single, defended theme. |
| AI chatbot on docs | "2026 trend" | Hallucinates Arduino code; harmful for beginners | Skip. |

---

## Feature Dependencies

```
Two-column layout (body + margin column)
    ├──enables──> Sidenotes / margin notes
    ├──enables──> Margin annotations on code lines
    ├──enables──> Sticky in-page TOC in margin
    └──enables──> Parts list in margin

Per-line anchors in code blocks
    └──required-by──> Margin annotations on code lines
                          └──required-by──> Diff-highlighted progressive lessons (full effect)

Glossary data model
    ├──required-by──> Definition tooltips on terms
    └──required-by──> Pin/peripheral reference tooltips

Cyrillic-complete font selection (display, body, mono)
    └──required-by──> EVERYTHING. This is the gate.

Ukrainian text pre-processor (smart quotes, non-breaking spaces, dashes)
    ├──required-by──> Editorial typographic quality
    └──conflicts-with──> Naive Markdown rendering (must run between MD and HTML)

Distinct page templates (lesson / article / datasheet / schematic)
    └──required-by──> Library page differentiation (courses vs articles)

Numbered figures
    └──required-by──> "Див. рис. 3" cross-references

Mobile collapse pattern (Tufte checkbox-toggle OR JS)
    └──required-by──> Sidenotes, margin annotations, parts-list-in-margin (any margin content)

Static / SSR delivery
    └──enhances──> First-paint typographic impression (huge for editorial sites)
```

### Dependency Notes

- **Two-column layout is the spine of the design.** Without it, sidenotes / code annotations / margin parts-list / margin TOC all collapse into ordinary blog patterns. Build it first; everything else hangs off it.
- **Margin annotations on code lines is the single most expensive differentiator.** It depends on (a) two-column layout, (b) per-line anchors, (c) careful CSS to align margin notes vertically to lines, and (d) a graceful mobile fallback. Budget accordingly — this is where the book-feeling lives.
- **Cyrillic-complete fonts are a gate.** Verify candidates have full extended Cyrillic for body, display, and mono BEFORE design begins. Discovering a glyph gap mid-design is a re-do.
- **The Ukrainian text pre-processor is a small infrastructure piece with outsized payoff.** Auto-substitute `«…»`, `—`, en-dash for ranges, and non-breaking spaces after one-letter prepositions. Without it, the typography fails in detail even if the macro layout is right.
- **Mobile fallback for margin content must be designed simultaneously with the desktop margin layout.** Designing desktop-only and patching mobile later produces the worst-of-both-worlds outcome.

---

## MVP Definition

### Launch With (v1, per PROJECT.md success bar: design system locked + lesson template + library index + a few mocked lessons)

- [ ] Cyrillic-complete font stack chosen and licensed (display, body, mono)
- [ ] Editorial design system: type scale, color palette (Arduino-teal accent), spacing primitives — SCSS only
- [ ] Two-column layout (body + margin) with mobile collapse
- [ ] Smart-quotes / em-dash / non-breaking-space text pre-processor for Ukrainian
- [ ] Lesson page template with: title, deck, parts-list-in-margin, in-page TOC, prose, figures with captions, code blocks, prev/next nav
- [ ] Code blocks with: Arduino C++ syntax highlighting, line numbers, copy button, **diff highlighting**, **margin annotations on specific lines**
- [ ] Sidenotes / margin notes (Tufte-style) with mobile toggle
- [ ] Schematic figure component (with caption, click-to-zoom)
- [ ] Lesson library / index page in typographic-TOC style (not card grid)
- [ ] Standalone article page template (variant of lesson)
- [ ] Datasheet page template (pinout image + metadata + downloadable PDF link)
- [ ] Site header/footer/home-page in editorial aesthetic
- [ ] Three deliberate breakpoints: phone / laptop / FHD+
- [ ] WCAG AA contrast verified
- [ ] Ukrainian hyphenation strategy decided (recommendation: ragged-right, no hyphenation)
- [ ] A few mocked lessons demonstrating the full template

### Add After Validation (v1.x)

- [ ] Glossary + definition tooltips on technical terms
- [ ] Pin/peripheral references in prose and code (tooltips)
- [ ] Numbered figures + cross-reference syntax ("див. рис. 3")
- [ ] Hover hotspots on pinout images
- [ ] Course progression graphic on library index
- [ ] Drop caps on lesson openers
- [ ] Hanging punctuation / OpenType refinements
- [ ] Print stylesheet
- [ ] RSS feed
- [ ] Side-by-side schematic + breadboard view component
- [ ] Cover-art-style course heroes

### Future Consideration (v2+)

- [ ] Reader accounts / progress (PROJECT.md says routes should support this without rewrite)
- [ ] Site search (when content scale demands it)
- [ ] Dark mode (only if pursued as a separately-designed theme, not a CSS-variable swap)
- [ ] Comments / community (likely never; stay anti-feature)
- [ ] Filter/sort on library index (only when library is large enough)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Cyrillic-complete font stack | HIGH | LOW | P1 |
| Two-column layout with mobile collapse | HIGH | MEDIUM | P1 |
| Sidenotes / margin notes (Tufte-style) | HIGH | MEDIUM | P1 |
| Code blocks: line nums + syntax + copy | HIGH | MEDIUM | P1 |
| Code blocks: diff highlighting | HIGH | MEDIUM | P1 |
| Code blocks: margin annotations on lines | HIGH | HIGH | P1 |
| Ukrainian text pre-processor (quotes, dashes, NBSP) | HIGH | LOW | P1 |
| Lesson page template | HIGH | MEDIUM | P1 |
| Library index in typographic-TOC style | HIGH | MEDIUM | P1 |
| Schematic figure with click-to-zoom | HIGH | MEDIUM | P1 |
| Datasheet page template | HIGH | MEDIUM | P1 |
| Parts list in margin column | HIGH | LOW | P1 |
| Difficulty + estimated time markers | MEDIUM | LOW | P1 |
| Prev/next lesson navigation | HIGH | LOW | P1 |
| Drop caps | MEDIUM | LOW | P2 |
| Glossary tooltips | HIGH | MEDIUM | P2 |
| Numbered figure cross-references | MEDIUM | MEDIUM | P2 |
| Hover hotspots on pinouts | MEDIUM | MEDIUM | P2 |
| Pin reference tooltips in code | MEDIUM | MEDIUM | P2 |
| Course progression graphic | MEDIUM | MEDIUM | P2 |
| Print stylesheet | MEDIUM | LOW | P2 |
| RSS feed | MEDIUM | LOW | P2 |
| Hanging punctuation / OT refinements | LOW | LOW | P2 |
| Cover-art course heroes | LOW | MEDIUM | P3 |
| Reader accounts / progress | MEDIUM | HIGH | P3 |
| Site search | MEDIUM | MEDIUM | P3 |
| Dark mode | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v1 (locks the design thesis)
- P2: Should have post-v1, additive without rework
- P3: Defer; reconsider after content + readership grows

---

## Competitor Feature Analysis

| Feature | learn.adafruit.com | arduino.cc/learn | sparkfun learn | ciechanow.ski | Tufte CSS / Gwern | Our Approach |
|---------|--------------------|--------------------|------|----------------|--------------------|---------------|
| Two-column / margin notes | No | No | No | Partial (figures float) | Yes (canonical) | **Yes — core** |
| Code line annotations in margin | No | No | No | N/A (no code) | Yes (sidenotes near code) | **Yes — signature feature** |
| Diff-highlighted progressive code | Limited | No | No | N/A | N/A | **Yes — required** |
| Parts list | Yes (sidebar) | Yes | Yes | N/A | N/A | Yes (in margin) |
| Difficulty marker | Yes | No | Yes | N/A | N/A | Yes |
| Estimated time | Yes | No | Yes | N/A | N/A | Yes |
| Prev/next lesson | Yes | Limited | Yes | N/A | N/A | Yes |
| Editorial typography | No | No | No | Yes | Yes | **Yes — core** |
| Sidenotes / footnotes | No | No | No | Footnotes only | Sidenotes (Tufte) | **Sidenotes (Tufte)** |
| Schematic + breadboard pair | Yes | Yes | Yes | N/A | N/A | Yes |
| Search | Yes | Yes | Yes | No | No | No (v1) |
| Comments | Limited | No | Yes | No | No | No |
| Dark mode | Yes | Yes | Yes | No | No | No (v1) |
| Card-grid library | Yes | Yes | Yes | N/A | N/A | **No — typographic TOC** |
| Cyrillic-first | No | Limited (i18n) | No | No | No | **Yes — gate** |
| Ukrainian typographic conventions | No | No | No | No | No | **Yes — differentiator at scale of 1** |

The competitive position is: **the Arduino-learning sites are functionally complete but typographically utilitarian; the editorial-typography sites are typographically elite but not domain-specific. This site occupies the empty intersection — and uniquely, in Ukrainian.**

---

## Ukrainian-Specific Concerns (cross-cutting)

These are not separate features but constraints that touch many features:

1. **Quotation marks:** primary `«…»` (chevrons, no inner spaces), secondary `„…"` (low-9 + high-6). Never `"…"`. Pre-processor required.
2. **Em-dash with spaces:** ` — ` (space + em-dash + space) for pauses; en-dash `–` for numeric ranges with no spaces (`1–2 дні`). Hyphen `-` only for compound words (`бізнес-план`, `1-й`).
3. **Non-breaking spaces** after one-letter prepositions/conjunctions: `в`, `з`, `у`, `і`, `й`, `та`, `не`, `на`, `до`, `за`, `по` — to prevent orphan letters at line end. This is standard Ukrainian typography.
4. **Hyphenation** rules differ from Russian and English. CSS `hyphens: auto` + `lang="uk"` is unreliable across browsers as of 2026 — verify Chrome/Safari/Firefox behavior. **Recommendation: ragged-right, no auto-hyphenation.** If justified is wanted, ship with Hyphenopoly + Ukrainian patterns (uk-hyph) and accept the JS cost.
5. **Glyph coverage:** Ukrainian uses Cyrillic letters that Russian doesn't (`ї`, `і`, `є`, `ґ`). "Cyrillic" font support is not enough — verify "Extended Cyrillic" or "Cyrillic Extended-A/B" Unicode blocks. PT Serif, Source Serif 4, Literata, IBM Plex, Inter, JetBrains Mono confirmed.
6. **Cyrillic in monospace:** Cyrillic glyphs in mono fonts can vary in stroke weight from Latin; verify visual harmony when comments are in Ukrainian.
7. **Drop cap care:** Cyrillic letters Ж, Щ, Ю, М are wider than typical Latin; drop-cap CSS that works for Latin can break grid for these.
8. **Text expansion:** Ukrainian translations of Latin technical terms tend to be longer; design must accommodate without breaking the editorial rhythm.
9. **Domain vocabulary discipline:** Arduino terminology in Ukrainian is unsettled (e.g., is it `плата`, `модуль`, `мікроконтролер` for "board"?). A glossary defends the site's voice.

---

## Book-vs-Web Tradeoffs (where book habits hurt on the web)

| Book habit | Why it hurts on web | Web-aware alternative |
|------------|---------------------|------------------------|
| Justified body text | Without proper hyphenation = rivers; with `hyphens: auto` = inconsistent across browsers/languages | Ragged-right (`text-align: left`). |
| Fixed-page footnotes | No "page" on web; reader has to scroll to bottom | Sidenotes (Tufte) on desktop; collapsible inline on mobile. |
| Page numbers / "see p. 47" | No pages | "див. рис. 3" with hyperlink. |
| Two-column body text | On screen, eye must track-back-up across the column gap awkwardly | One-column body + margin column for notes/figures, NOT true two-column body. |
| Tiny annotation type | OK in print at high DPI; harder on screen | Margin-note text only one step smaller than body, not three. |
| Heavy bleed / full-page images | Web has no "page"; full-bleed competes with chrome | Wide-figure (extends beyond text column) instead of full-bleed. |
| Index at the back | Can't navigate to it without infinite scroll | In-page TOC + library page. |
| Decorative chapter ornaments at scale | Cute in print, twee on web if overdone | One small fleuron at lesson end is enough. |
| Manuscript-style first-line indents | Don't combine with paragraph-spacing; must pick one | Pick paragraph-spacing for web. |

---

## Sources

- [Tufte CSS](https://edwardtufte.github.io/tufte-css/) — sidenote pattern, margin notes, mobile toggle via checkbox
- [Gwern.net — Sidenotes In Web Design](https://gwern.net/sidenote) — most rigorous treatment of web sidenotes
- [Bartosz Ciechanowski's blog](https://ciechanow.ski/) — gold-standard editorial long-form
- [CSS-Tricks on Ciechanowski's interactive posts](https://css-tricks.com/bartosz-ciechanowskis-interactive-blog-posts/)
- [Distill.pub guide](https://distill.pub/guide/) — figure layout grid, technical-writing typography
- [Stripe Documentation](https://docs.stripe.com/) — three-column nav/content/code, copy buttons, in-text token highlighting
- [How Stripe creates the best documentation in the industry](https://www.mintlify.com/blog/stripe-docs)
- [Adafruit Learning System guide creation docs](https://cdn-learn.adafruit.com/downloads/pdf/creating-great-guides-for-the-adafruit-learning-system.pdf) — lesson-page conventions
- [Ukrainian Punctuation rules](https://www.ukrainianlessons.com/ukrainian-punctuation/) — quotes, dashes
- [Ukrainian Timed Text Style Guide (Netflix)](https://partnerhelp.netflixstudios.com/hc/en-us/articles/115002229068-Ukrainian-Timed-Text-Style-Guide) — official quote/dash guidance
- [Unbabel — Language Guidelines, Ukrainian](https://help.unbabel.com/hc/en-us/articles/8918563117463-Language-Guidelines-Ukrainian) — chevron quotes, en-dash for ranges
- [Pimp my Type — Russian Typography](https://pimpmytype.com/russian-typography/) — Cyrillic typographic conventions overlap
- [Wikipedia — Quotation mark (non-English usage)](https://en.wikipedia.org/wiki/Quotation_mark)
- [Prism Diff Highlight plugin](https://prismjs.com/plugins/diff-highlight/) — diff-as-syntax-highlight pattern
- [Steven Hicks — Syntax Highlighting Diffs In Code](https://www.stevenhicks.me/blog/2021/05/syntax-highlighting-diffs/)
- [Material for MkDocs — Code blocks](https://squidfunk.github.io/mkdocs-material/reference/code-blocks/) — line annotations, hl_lines pattern
- [Quarto Page Layout (Tufte)](https://quarto-dev.github.io/quarto-gallery/page-layout/tufte.html) — sidenote/margin layout in practice

---
*Feature research for: Ukrainian-language editorial Arduino learning website*
*Researched: 2026-04-30*
