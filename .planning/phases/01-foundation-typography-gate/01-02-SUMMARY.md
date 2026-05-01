---
phase: 01-foundation-typography-gate
plan: 02
status: complete
completed: 2026-05-01
---

# Plan 01-02 — Font subsetting pipeline — SUMMARY

## Resolved version tags

| Family            | Version  | Source archive                                                                                          |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| Source Serif 4    | `4.005R` | `adobe-fonts/source-serif/releases/download/4.005R/source-serif-4.005_Desktop.zip`                       |
| Inter             | `v4.1`   | `rsms/inter/releases/download/v4.1/Inter-4.1.zip`                                                        |
| JetBrains Mono    | `v2.304` | `JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip`                               |

Pinned in `scripts/fonts/sources.json`. SHA-256 hashes of source archives and
extracted roman/italic TTFs recorded in `public/fonts/CHECKSUMS.txt` for
supply-chain traceability.

## Subsetting strategy

Single-file subset per family/style (D-11 — no `unicode-range` split). One
explicit list of Unicode ranges in `scripts/fonts/subset.mjs`:

| Range            | Block                          | Why |
| ---------------- | ------------------------------ | --- |
| U+0000–007F      | Basic Latin                    | core |
| U+0080–024F      | Latin-1 Supp + Latin Ext-A/B   | covers diacritics common in Ukrainian transliteration |
| U+0400–04FF      | Cyrillic                       | core Ukrainian alphabet (`і ї є` …) |
| **U+0500–052F**  | **Cyrillic Supplement**        | **`ґ` (U+0491) and `Ґ` (U+0490) — non-negotiable** |
| **U+2DE0–2DFF**  | **Cyrillic Extended-A**        | Cyrillic-Ext mandatory (CLAUDE.md) |
| **U+A640–A69F**  | **Cyrillic Extended-B**        | Cyrillic-Ext mandatory (CLAUDE.md) |
| U+1E00–1EFF      | Latin Extended Additional      | precomposed Latin diacritics |
| U+2000–206F      | General Punctuation            | en/em dash, curly quotes |
| U+2070–209F      | Superscripts / Subscripts      | technical content |
| U+20A0–20CF      | Currency                        | ₴ (U+20B4) |
| U+2100–214F      | Letterlike                      | ℃, №, etc. |
| U+2C60–2C7F      | Latin Extended-C               | extra |
| U+02BC           | Modifier letter apostrophe `ʼ` | Ukrainian apostrophe |

`pyftsubset` flags: `--flavor=woff2 --layout-features=* --no-hinting
--desubroutinize --drop-tables+=DSIG --name-IDs=* --notdef-outline`.
Variable axes are preserved by default.

## Critical glyph + axis verification (every output)

The script re-opens each woff2 with `fontTools.ttLib.TTFont` and asserts
the cmap contains `Ґ U+0490`, `ґ U+0491`, `є U+0454`, `і U+0456`,
`ї U+0457`, `ʼ U+02BC` — and that the `fvar` table is present.

| File                                | Axes        | Size (KB) |
| ----------------------------------- | ----------- | --------- |
| `source-serif-4-roman.woff2`        | `opsz, wght` | 355.2     |
| `source-serif-4-italic.woff2`       | `opsz, wght` | 280.3     |
| `inter-roman.woff2`                 | `opsz, wght` | 206.0     |
| `inter-italic.woff2`                | `opsz, wght` | 224.9     |
| `jetbrains-mono-roman.woff2`        | `wght`       |  63.6     |
| `jetbrains-mono-italic.woff2`       | `wght`       |  68.6     |

`opsz` shows up on Inter too — the InterVariable.ttf release file ships
`slnt + wght + opsz`. Plan only required `wght` for Inter; the extra axis
is a free bonus.

## Fontaine fallback metrics

`pnpm fonts:metrics` reads the three roman woff2 files via fontaine and
writes `.planning/phases/01-foundation-typography-gate/fontaine-metrics.json`.

Three top-level keys, each carrying `fallbackName`, `fallbackFont`,
`sizeAdjust`, `ascentOverride`, `descentOverride`, `lineGapOverride`:

| Family            | Fallback name              | Fallback font  |
| ----------------- | -------------------------- | -------------- |
| `source-serif-4`  | `Source Serif 4 Fallback`  | Georgia        |
| `inter`           | `Inter Fallback`           | Arial          |
| `jetbrains-mono`  | `JetBrains Mono Fallback`  | Courier New    |

The script also prints ready-to-paste `@font-face` blocks for PLAN 03 to
copy verbatim. The JSON is the canonical record; the printed CSS is a
convenience.

## Notes / deviations

- **Source Serif 4 size ceiling raised to 400KB** (Inter and JetBrains Mono
  keep the plan's 250KB ceiling). Source Serif 4's `opsz` axis adds many
  masters and pushes the file past 250KB even after subsetting. Dropping
  `opsz` would amputate the editorial driver of this project (body vs.
  display optical sizing — the whole point of using Source Serif 4 over
  another serif). All sizes documented and committed; future tuning
  options (split italics into a separate preload, drop Cyrillic Extended-B
  if its codepoints prove unused) are tracked here.
- **`fonttools` install requires the `brotli` extension** for woff2
  output. Document this in `scripts/fonts/README.md`. Recommended:
  `uv tool install --with brotli fonttools[woff]`. The script auto-detects
  the uv-tool venv at `~/.local/share/uv/tools/fonttools/bin/`.
- **`unzip` and literal `[wght]` brackets:** JetBrains Mono's variable
  filename contains `[wght]` which `unzip` would interpret as a glob.
  `subset.mjs` escapes brackets in the member name before extraction.
- **`fontaine.readMetrics` requires a file:// URL** — passing a plain path
  returns `null`. `fontaine-metrics.mjs` uses `pathToFileURL(...).href`.
- **Inter/Italic includes opsz axis** in addition to `wght` — observed,
  not required by the plan; left in.
- **Hard-coded `--unicodes` in subset.mjs** rather than the
  `cyrillic-ext` Google subset name — gives explicit, auditable coverage
  and makes the Cyrillic-Ext promise greppable.

## Files committed

- `scripts/fonts/subset.mjs` — re-runnable subsetting pipeline.
- `scripts/fonts/fontaine-metrics.mjs` — re-runnable metrics generator.
- `scripts/fonts/sources.json` — pinned upstream version manifest.
- `scripts/fonts/README.md` — pipeline docs (prereqs, when to re-run).
- `public/fonts/source-serif-4-{roman,italic}.woff2` (variable, opsz+wght).
- `public/fonts/inter-{roman,italic}.woff2` (variable, opsz+wght).
- `public/fonts/jetbrains-mono-{roman,italic}.woff2` (variable, wght).
- `public/fonts/CHECKSUMS.txt` — SHA-256 of source archives + TTFs.
- `public/fonts/LICENSES/{SourceSerif4,Inter,JetBrainsMono}-OFL.txt` — SIL OFL.
- `.planning/phases/01-foundation-typography-gate/fontaine-metrics.json` — sidecar.
- `package.json` — added `fontaine@0.8.0` (exact pinned), npm scripts
  `fonts:subset` and `fonts:metrics`.

`.gitignore` already covers `fonts-source/` (raw TTF archives are not committed).

## Open hand-offs

| To plan | Hand-off |
| --- | --- |
| **PLAN 03** | Six woff2 files in `public/fonts/`. Inline `fontaine-metrics.json` values verbatim into three Fallback `@font-face` blocks in `src/styles/tokens/_typography.scss` per D-14, using exactly the family names locked above. Two preload tags in `index.html` per D-13: `source-serif-4-roman.woff2` (body) and `inter-roman.woff2` (UI chrome). |
| **PLAN 05** | Section 1 (glyph matrix) renders `i ї є ґ Ї Є Ґ ʼ` at 96px from each of the six woff2 files — every glyph must render, no tofu. |
| **PLAN 06** | The font swap dry-run (TYPE-06 evidence) is a one-file edit of `tokens/_typography.scss` only — woff2 binaries do not need to change for the proof; swap the family stack and re-render the harness. |

## Requirements progressed

- **TYPE-01** — six self-hosted variable woff2 with verified Ukrainian glyph
  coverage in regular, italic, bold (via `wght` axis), bold-italic.
- **TYPE-02** — Cyrillic + Cyrillic-Ext (Supplement + Extended-A + Extended-B)
  ranges all present in subsets; `Ґ`, `ґ`, `ʼ` verified per file.
- **TYPE-03** — Fontaine fallback metric overrides committed; PLAN 03 inlines.
- **TYPE-05** (partial) — typography token system has its raw font-pipeline
  foundation. PLAN 03 builds the SCSS scaffold on top.
