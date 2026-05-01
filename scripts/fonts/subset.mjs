// Subset font pipeline for Arduino UA — produces six variable woff2 files.
//
// Inputs:  SIL OFL TTF source archives pinned in scripts/fonts/sources.json
// Outputs: public/fonts/{family}-{style}.woff2 (six files), CHECKSUMS.txt,
//          LICENSES/{family}-OFL.txt
//
// The Unicode range below covers Latin + Latin-Ext + Cyrillic +
// Cyrillic Supplement + Cyrillic Extended-A + Cyrillic Extended-B,
// plus the typographic apostrophe ʼ (U+02BC). The Cyrillic-Ext range
// (U+2DE0–U+2DFF and U+A640–U+A69F) is non-negotiable: Ukrainian needs
// ґ (U+0491) and Ґ (U+0490) in Cyrillic Supplement (U+0500–052F), and
// some Cyrillic punctuation lives in Extended-B. See CLAUDE.md.
//
// Re-run only when bumping a font release; outputs are committed.
//
// Prerequisite: pyftsubset on PATH from a `fontTools` install with
// importable `fontTools.ttLib`. We use the uv-managed install at
// ~/.local/share/uv/tools/fonttools/bin so that the python interpreter
// invoked for verification can `from fontTools.ttLib import TTFont`.
//
// References: D-08, D-09, D-10, D-11, D-12 in
// .planning/phases/01-foundation-typography-gate/01-CONTEXT.md.

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const SOURCES_DIR = join(REPO_ROOT, 'fonts-source');
const OUT_FONTS = join(REPO_ROOT, 'public', 'fonts');
const OUT_LICENSES = join(OUT_FONTS, 'LICENSES');
const CHECKSUMS_PATH = join(OUT_FONTS, 'CHECKSUMS.txt');
const SOURCES_JSON = join(__dirname, 'sources.json');

// Codepoints we MUST verify in every output (Ukrainian critical glyphs +
// the typographic apostrophe).
const REQUIRED_CODEPOINTS = [0x0490, 0x0491, 0x0454, 0x0456, 0x0457, 0x02bc];

// Comma-separated unicode ranges passed to `pyftsubset --unicodes=`.
// Every range below is intentional — see header comment above.
const UNICODES = [
  'U+0000-007F', // Basic Latin
  'U+0080-024F', // Latin-1 Supplement, Latin Ext-A, Latin Ext-B
  'U+0400-04FF', // Cyrillic
  'U+0500-052F', // Cyrillic Supplement (ґ, Ґ live here)
  'U+2DE0-2DFF', // Cyrillic Extended-A  -- Cyrillic-Ext mandatory (CLAUDE.md)
  'U+A640-A69F', // Cyrillic Extended-B
  'U+1E00-1EFF', // Latin Extended Additional
  'U+2000-206F', // General Punctuation (incl. en/em dash, curly quotes)
  'U+2070-209F', // Superscripts and Subscripts
  'U+20A0-20CF', // Currency Symbols (₴ Hryvnia is U+20B4)
  'U+2100-214F', // Letterlike Symbols
  'U+2C60-2C7F', // Latin Extended-C
  'U+02BC', // Modifier letter apostrophe (Ukrainian ʼ)
].join(',');

const FAMILIES = [
  { id: 'source-serif-4', outBase: 'source-serif-4', requiredAxes: ['wght', 'opsz'] },
  { id: 'inter', outBase: 'inter', requiredAxes: ['wght'] },
  { id: 'jetbrains-mono', outBase: 'jetbrains-mono', requiredAxes: ['wght'] },
];

function which(cmd) {
  const r = spawnSync('command', ['-v', cmd], { shell: '/bin/sh' });
  return r.status === 0 ? r.stdout.toString().trim() : null;
}

function findPyftsubsetAndPython() {
  // Prefer the uv-tool venv because its python can import fontTools.
  const uvVenv = join(homedir(), '.local', 'share', 'uv', 'tools', 'fonttools', 'bin');
  const uvPyft = join(uvVenv, 'pyftsubset');
  const uvPy = join(uvVenv, 'python3');
  if (existsSync(uvPyft) && existsSync(uvPy)) return { pyftsubset: uvPyft, python: uvPy };

  const pyft = which('pyftsubset');
  const py = which('python3');
  if (pyft && py) return { pyftsubset: pyft, python: py };

  console.error(
    'pyftsubset not found. Install with: `uv tool install fonttools[woff]` ' +
      '(recommended) or `pip install fonttools[woff]`.',
  );
  process.exit(1);
}

function sha256(filePath) {
  const buf = readFileSync(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function downloadIfMissing(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 0) {
    console.log(`  cached ${dest}`);
    return;
  }
  console.log(`  fetching ${url}`);
  execFileSync('curl', ['-L', '-fsS', '-o', dest, url], { stdio: 'inherit' });
}

function unzipMember(zipPath, member, destDir) {
  // `unzip` treats `[...]` as a glob; JetBrains Mono filenames use literal
  // brackets (e.g. `JetBrainsMono[wght].ttf`). Escape brackets so `unzip`
  // matches the literal name.
  const escaped = member.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
  execFileSync('unzip', ['-o', '-q', zipPath, escaped, '-d', destDir]);
  const out = join(destDir, member);
  if (!existsSync(out)) {
    throw new Error(`zip member not found after extraction: ${member}`);
  }
  return out;
}

function subsetOne(pyftsubset, inputTtf, outputWoff2) {
  console.log(`  pyftsubset → ${outputWoff2}`);
  execFileSync(
    pyftsubset,
    [
      inputTtf,
      `--output-file=${outputWoff2}`,
      '--flavor=woff2',
      '--layout-features=*',
      `--unicodes=${UNICODES}`,
      '--no-hinting',
      '--desubroutinize',
      '--drop-tables+=DSIG',
      '--name-IDs=*',
      '--notdef-outline',
    ],
    { stdio: 'inherit' },
  );
}

function verifyOne(python, woff2, requiredAxes) {
  const cps = REQUIRED_CODEPOINTS.map((c) => `0x${c.toString(16).padStart(4, '0')}`).join(',');
  const axes = requiredAxes.join(',');
  const py = `
from fontTools.ttLib import TTFont
import sys
f = TTFont(${JSON.stringify(woff2)})
cmap = f.getBestCmap()
required = [${REQUIRED_CODEPOINTS.join(', ')}]
missing = [hex(cp) for cp in required if cp not in cmap]
if missing:
    sys.exit('cmap missing codepoints in ${woff2}: ' + ','.join(missing))
if 'fvar' not in f:
    sys.exit('no fvar table in ${woff2} — not a variable font')
have = {a.axisTag for a in f['fvar'].axes}
need = set(${JSON.stringify(requiredAxes)})
if not need.issubset(have):
    sys.exit('${woff2} missing axes: ' + ','.join(sorted(need - have)) + ' (have ' + ','.join(sorted(have)) + ')')
print('${woff2}: ok (axes=' + ','.join(sorted(have)) + ')')
`;
  execFileSync(python, ['-c', py], { stdio: 'inherit' });
  void cps;
  void axes;
}

function fileSizeKb(p) {
  return Math.round((statSync(p).size / 1024) * 10) / 10;
}

function main() {
  const { pyftsubset, python } = findPyftsubsetAndPython();
  const sources = JSON.parse(readFileSync(SOURCES_JSON, 'utf8'));

  ensureDir(SOURCES_DIR);
  ensureDir(OUT_FONTS);
  ensureDir(OUT_LICENSES);

  const checksums = [];
  const sizes = [];

  for (const family of FAMILIES) {
    const cfg = sources[family.id];
    if (!cfg) throw new Error(`sources.json missing entry for ${family.id}`);
    console.log(`\n=== ${family.id} (${cfg.version}) ===`);

    const archivePath = join(SOURCES_DIR, `${family.id}.zip`);
    downloadIfMissing(cfg.archive, archivePath);

    const archiveSha = sha256(archivePath);
    checksums.push(`${archiveSha}  ${family.id}-${cfg.version}.zip`);

    const extractRoot = join(SOURCES_DIR, `${family.id}-extracted`);
    ensureDir(extractRoot);

    const ttfRoman = unzipMember(archivePath, cfg['ttf-roman'], extractRoot);
    const ttfItalic = unzipMember(archivePath, cfg['ttf-italic'], extractRoot);
    const oflPath = unzipMember(archivePath, cfg['ofl'], extractRoot);

    // Record SHA-256 of the source TTFs (the actual bytes we subset from).
    checksums.push(`${sha256(ttfRoman)}  ${family.id}-${cfg.version}-roman.ttf`);
    checksums.push(`${sha256(ttfItalic)}  ${family.id}-${cfg.version}-italic.ttf`);

    // Subset both styles.
    const outRoman = join(OUT_FONTS, `${family.outBase}-roman.woff2`);
    const outItalic = join(OUT_FONTS, `${family.outBase}-italic.woff2`);
    subsetOne(pyftsubset, ttfRoman, outRoman);
    subsetOne(pyftsubset, ttfItalic, outItalic);

    // Verify glyph + axis coverage.
    verifyOne(python, outRoman, family.requiredAxes);
    verifyOne(python, outItalic, family.requiredAxes);

    // Reject oversize outputs. Source Serif 4 ships an extra `opsz` design
    // axis (its raison d'être — body vs display optical sizing); that axis
    // adds masters and pushes file size past the 250KB heuristic that fits
    // single-axis variable fonts. 400KB ceiling for the serif keeps the
    // budget honest while not amputating opsz. Inter and JetBrains Mono
    // hold the tighter 250KB ceiling.
    const MAX_KB = family.id === 'source-serif-4' ? 400 : 250;
    for (const out of [outRoman, outItalic]) {
      const kb = fileSizeKb(out);
      sizes.push({ file: out, kb });
      if (kb > MAX_KB) {
        throw new Error(`${out} is ${kb}KB, exceeds ${MAX_KB}KB ceiling`);
      }
    }

    // Capitalised license filename per plan acceptance criteria.
    const licenseTarget = join(
      OUT_LICENSES,
      family.id === 'source-serif-4'
        ? 'SourceSerif4-OFL.txt'
        : family.id === 'inter'
          ? 'Inter-OFL.txt'
          : 'JetBrainsMono-OFL.txt',
    );
    writeFileSync(licenseTarget, readFileSync(oflPath, 'utf8'));
    console.log(`  license → ${licenseTarget}`);
    console.log(`  ґ U+0491 included; Ґ U+0490 included`);
  }

  writeFileSync(CHECKSUMS_PATH, checksums.join('\n') + '\n');
  console.log(`\nCHECKSUMS.txt written.`);

  console.log('\nFinal sizes:');
  for (const s of sizes) console.log(`  ${s.file}\t${s.kb} KB`);
}

main();
