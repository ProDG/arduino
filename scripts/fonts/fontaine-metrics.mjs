// Generate Fontaine fallback metric overrides for the three font families.
//
// Output: .planning/phases/01-foundation-typography-gate/fontaine-metrics.json
// PLAN 03 reads this JSON and inlines the four overrides per family into
// three "Fallback" @font-face blocks in src/styles/tokens/_typography.scss
// (D-14). Re-run only when bumping a font release that changes metrics.
//
// Fallback system family per UI-SPEC font stacks:
//   - Source Serif 4 → Georgia        (closest cross-platform serif metrics)
//   - Inter          → Arial          (closest cross-platform sans metrics)
//   - JetBrains Mono → Courier New    (cross-platform mono fallback)

import { generateFontFace, getMetricsForFamily, readMetrics } from 'fontaine';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const OUT_JSON = resolve(
  REPO_ROOT,
  '.planning/phases/01-foundation-typography-gate/fontaine-metrics.json',
);

const FAMILIES = [
  {
    id: 'source-serif-4',
    woff2: 'public/fonts/source-serif-4-roman.woff2',
    fallbackName: 'Source Serif 4 Fallback',
    fallbackFont: 'Georgia',
  },
  {
    id: 'inter',
    woff2: 'public/fonts/inter-roman.woff2',
    fallbackName: 'Inter Fallback',
    fallbackFont: 'Arial',
  },
  {
    id: 'jetbrains-mono',
    woff2: 'public/fonts/jetbrains-mono-roman.woff2',
    fallbackName: 'JetBrains Mono Fallback',
    fallbackFont: 'Courier New',
  },
];

// generateFontFace emits a CSS string; pull the four override values back
// out so we have a structured JSON sidecar PLAN 03 can read without parsing.
function extract(prop, css) {
  const m = css.match(new RegExp(`${prop}:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
}

async function main() {
  const out = {};
  const blocks = [];

  for (const fam of FAMILIES) {
    const url = pathToFileURL(resolve(REPO_ROOT, fam.woff2)).href;
    const metrics = await readMetrics(url);
    if (!metrics) throw new Error(`readMetrics returned null for ${fam.woff2}`);
    const fallbackMetrics = await getMetricsForFamily(fam.fallbackFont);
    if (!fallbackMetrics) {
      throw new Error(`fontaine has no metrics for system family ${fam.fallbackFont}`);
    }

    const css = generateFontFace(metrics, {
      name: fam.fallbackName,
      font: fam.fallbackFont,
      metrics: fallbackMetrics,
    });
    blocks.push(css);

    const sizeAdjust = extract('size-adjust', css) ?? '100%';
    const ascentOverride = extract('ascent-override', css);
    const descentOverride = extract('descent-override', css);
    const lineGapOverride = extract('line-gap-override', css) ?? '0%';

    if (!ascentOverride || !descentOverride) {
      throw new Error(`generateFontFace did not produce ascent/descent overrides for ${fam.id}`);
    }

    out[fam.id] = {
      fallbackName: fam.fallbackName,
      fallbackFont: fam.fallbackFont,
      sizeAdjust,
      ascentOverride,
      descentOverride,
      lineGapOverride,
    };
  }

  writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote ${OUT_JSON}\n`);
  console.log('--- @font-face blocks (copy verbatim into _typography.scss in PLAN 03) ---');
  for (const b of blocks) console.log(b);
}

await main();
