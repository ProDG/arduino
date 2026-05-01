# Font pipeline

This directory builds the six self-hosted variable woff2 files under
`public/fonts/` and the Fontaine fallback metrics sidecar consumed by
`_typography.scss` (PLAN 03).

The pipeline is a **one-shot** — outputs are committed binaries. Re-run
only when bumping a font release or changing the subset coverage.

## Why subset

- **Cyrillic-Ext is mandatory.** `ґ` (U+0491) and `Ґ` (U+0490) live in
  Cyrillic Supplement (U+0500–U+052F). The default Google Fonts `cyrillic`
  subset omits Cyrillic Supplement / Extended-A / Extended-B. We include
  all of them. See `CLAUDE.md` and CONTEXT.md D-10.
- **Single subset per file** (D-11). Ukrainian-only site — every page has
  Cyrillic, so splitting Latin into a separate file just adds a request
  that always fires. No `unicode-range` split.
- **Real italics** (D-09). Each family ships a separately mastered italic
  woff2, not a `font-style: oblique` synthesis.
- **Variable axes preserved** (D-09). `wght` for all three; `opsz` for
  Source Serif 4 (the editorial driver — body vs display optical sizing).

## Prerequisites

- Node 22+ and pnpm 10 (corepack-managed).
- `pyftsubset` from a `fontTools` install **with the `brotli` extension**
  for woff2 output:

  ```bash
  uv tool install --with brotli fonttools[woff]
  ```

  The script auto-detects `~/.local/share/uv/tools/fonttools/bin/pyftsubset`
  and the matching `python3` (which can `import fontTools.ttLib` for the
  glyph + axis verification step).

  If you prefer pip:

  ```bash
  pip install "fonttools[woff]" brotli
  ```

## How to run

```bash
pnpm fonts:subset    # downloads SIL OFL TTF archives into fonts-source/
                     # (gitignored), subsets each, writes six woff2 files
                     # into public/fonts/, records SHA-256 in CHECKSUMS.txt,
                     # copies OFL.txt for each family into LICENSES/

pnpm fonts:metrics   # reads three roman woff2 files and writes
                     # .planning/phases/01-foundation-typography-gate/
                     #   fontaine-metrics.json
```

`pnpm fonts:subset` is idempotent — TTF archives are cached in
`fonts-source/`. Delete that folder to force a re-fetch.

## When to re-run

| Change | Re-run |
|--------|--------|
| Bumping a font release | `pnpm fonts:subset` then `pnpm fonts:metrics`; commit the new binaries + sidecar; copy fresh values into `_typography.scss` |
| Adjusting subset coverage (Unicode ranges) | edit the `UNICODES` array in `subset.mjs`; re-run `pnpm fonts:subset` |
| Fontaine version bump | `pnpm add -D -E fontaine@<v>`; re-run `pnpm fonts:metrics`; if numbers shift, copy fresh values into `_typography.scss` |

## Fallback metrics

`pnpm fonts:metrics` produces
`.planning/phases/01-foundation-typography-gate/fontaine-metrics.json`.
That sidecar is the **single source of truth** for the four per-family
overrides PLAN 03 inlines into the three `Fallback` `@font-face` blocks
in `src/styles/tokens/_typography.scss` (D-14).

Each entry contains:

- `fallbackName` — exactly the family name PLAN 03 must use
  (`"Source Serif 4 Fallback"`, `"Inter Fallback"`,
  `"JetBrains Mono Fallback"`).
- `fallbackFont` — the system family Fontaine pulled metrics from
  (Georgia / Arial / Courier New).
- `sizeAdjust`, `ascentOverride`, `descentOverride`, `lineGapOverride` —
  the four percentage values that make the fallback render at the same
  metrics as the real face. CLS-free swap, FOUT not FOIT.

The script also prints the equivalent ready-to-paste `@font-face`
blocks to stdout for convenience; PLAN 03 should still consult the JSON
as the canonical record.

## References

- `CLAUDE.md` — Cyrillic-Ext required, ragged-right body, no Tailwind.
- `.planning/phases/01-foundation-typography-gate/01-CONTEXT.md` — D-08,
  D-09, D-10, D-11, D-12, D-14.
- `.planning/research/STACK.md` §1 — typography pipeline, Fontaine
  fallback metric pattern, FOUT not FOIT.
- Fontaine — <https://github.com/unjs/fontaine>
- fonttools / pyftsubset — <https://fonttools.readthedocs.io/>
