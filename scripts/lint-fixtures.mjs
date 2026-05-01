// Editorial-smell + content-gate lint for mock-data JSON fixtures.
//
// Walks src/assets/mock-data/**/*.json. For each file:
//   - Editorial smells (per fixture):
//     1. Straight ASCII " inside a prose string (not in code.code, not as
//        an HTML attribute quote) -> flag (use «…»).
//     2. -- between word characters -> flag (use — em-dash).
//     3. ASCII ' between two Cyrillic letters -> flag (use ʼ U+02BC).
//     4. Regular space (U+0020) after a one-letter Ukrainian preposition
//        followed by a Cyrillic letter -> flag (use NBSP U+00A0).
//   - Per-fixture content gates (per UI-SPEC §"Mock-data prose
//     calibration rule"):
//     1. ≥1 "ґ" in any body string.
//     2. ≥1 «…» quote pair somewhere in the parsed object.
//     3. ≥1 em-dash "—" AND ≥1 en-dash range like "1–2" in the parsed
//        object.
//     4. ≥1 <code> HTML tag in any html-bearing field.
//     5. lessons/*.json: body[] contains ≥1 sidenote, ≥1 figure, ≥1 code
//        block.
//
// Exits 1 on any violation, 0 if clean. Wired into pnpm lint via
// package.json.
//
// References: D-PRE-03, D-MOCK-04 in
// .planning/phases/02-primitives-two-column-layout-page-model-contract/02-CONTEXT.md.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const FIXTURE_ROOT = join(REPO_ROOT, 'src', 'assets', 'mock-data');

const ONE_LETTER_PREPS = ['а', 'в', 'до', 'за', 'з', 'і', 'й', 'на', 'не', 'о', 'по', 'та', 'у'];
const PREP_GROUP = ONE_LETTER_PREPS.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

// Cyrillic letter character class (Cyrillic + Cyrillic Supplement +
// Extended-A + Extended-B, including ґ Ґ ї Ї і І є Є).
const CYR = '\\p{Script=Cyrillic}';

// Editorial-smell patterns. Each returns an array of {line, snippet}.
function findSmellsInString(value) {
  const findings = [];

  // 1. ASCII " between Cyrillic letters or surrounded by whitespace.
  const straightQuotes = [
    new RegExp(`(${CYR})"(${CYR})`, 'gu'),
    new RegExp(`(\\s)"(\\s|$)`, 'gu'),
  ];
  for (const re of straightQuotes) {
    if (re.test(value)) findings.push({ kind: 'straight-quote', snippet: clip(value) });
  }

  // 2. -- between word chars (Cyrillic or Latin).
  if (/(\w|\p{Script=Cyrillic})--(\w|\p{Script=Cyrillic})/u.test(value)) {
    findings.push({ kind: 'double-hyphen', snippet: clip(value) });
  }
  if (/\s--\s/.test(value)) {
    findings.push({ kind: 'double-hyphen', snippet: clip(value) });
  }

  // 3. ASCII ' between Cyrillic letters.
  if (new RegExp(`${CYR}'${CYR}`, 'u').test(value)) {
    findings.push({ kind: 'ascii-apostrophe', snippet: clip(value) });
  }

  // 4. Regular space after one-letter preposition + Cyrillic.
  // Match preposition that is preceded by start, whitespace, or sentence
  // punctuation; followed by a regular space (NOT NBSP) and a Cyrillic
  // letter. Case-sensitive: capital «В» (unit symbol for volts) is not a
  // preposition. Sentence-initial capitalized prepositions are rare and
  // can be styled at the discretion of the editor.
  const prepRe = new RegExp(
    `(?:^|[\\s.,;:«»()])(${PREP_GROUP}) (${CYR})`,
    'gu',
  );
  if (prepRe.test(value)) {
    findings.push({ kind: 'preposition-no-nbsp', snippet: clip(value) });
  }

  return findings;
}

function clip(s, max = 60) {
  const oneLine = s.replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? oneLine.slice(0, max) + '…' : oneLine;
}

// Recursive walk of parsed JSON. Visits every string. The `path` keeps
// track of the JSON pointer so we can skip code.code where transformation
// rules don't apply.
function walkStrings(value, path, visit) {
  if (typeof value === 'string') {
    visit(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkStrings(v, [...path, i], visit));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walkStrings(v, [...path, k], visit);
  }
}

function isCodeCodeField(path, parsed) {
  // path ends with [..., 'code']; ancestor at path[..-1] should be an
  // object with type === 'code'.
  if (path[path.length - 1] !== 'code') return false;
  let cur = parsed;
  for (let i = 0; i < path.length - 1; i++) cur = cur?.[path[i]];
  return cur && typeof cur === 'object' && cur.type === 'code';
}

function findLineForString(rawText, needle) {
  const idx = rawText.indexOf(JSON.stringify(needle).slice(1, -1));
  if (idx < 0) return 1;
  return rawText.slice(0, idx).split('\n').length;
}

function checkContentGates(parsed, kind, fileLabel) {
  const violations = [];
  const allStrings = [];
  walkStrings(parsed, [], (s) => allStrings.push(s));
  const allText = allStrings.join('\n');
  const htmlText = allStrings
    .filter((s) => /<[^>]+>/.test(s))
    .join('\n');

  if (!allText.includes('ґ')) {
    violations.push({ kind: 'gate-no-g-with-upturn', message: 'no «ґ» in any body string' });
  }
  const hasOpen = allText.includes('«');
  const hasClose = allText.includes('»');
  if (!(hasOpen && hasClose)) {
    violations.push({ kind: 'gate-no-guillemets', message: 'no «…» quote pair' });
  }
  if (!allText.includes('—')) {
    violations.push({ kind: 'gate-no-em-dash', message: 'no «—» em-dash' });
  }
  if (!/\d+–\d+/.test(allText)) {
    violations.push({ kind: 'gate-no-en-dash-range', message: 'no «N–M» en-dash numeric range' });
  }
  if (!/<code\b[^>]*>/.test(htmlText)) {
    violations.push({ kind: 'gate-no-inline-code', message: 'no <code> HTML tag in any html-bearing field' });
  }

  if (kind === 'lesson') {
    const body = Array.isArray(parsed?.body) ? parsed.body : [];
    const has = (t) => body.some((b) => b && b.type === t);
    if (!has('sidenote'))
      violations.push({ kind: 'gate-lesson-no-sidenote', message: 'lesson body[] missing a sidenote block' });
    if (!has('figure'))
      violations.push({ kind: 'gate-lesson-no-figure', message: 'lesson body[] missing a figure block' });
    if (!has('code'))
      violations.push({ kind: 'gate-lesson-no-code', message: 'lesson body[] missing a code block' });
  }

  return violations.map((v) => ({ ...v, file: fileLabel }));
}

function listFixtures() {
  const out = [];
  for (const kind of ['lessons', 'articles', 'datasheets', 'schematics']) {
    const dir = join(FIXTURE_ROOT, kind);
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of entries) {
      if (!name.endsWith('.json')) continue;
      const full = join(dir, name);
      if (statSync(full).isFile()) out.push({ path: full, kind: kind.replace(/s$/, '') });
    }
  }
  return out;
}

function lintOne(filePath, kind) {
  const rel = filePath.slice(REPO_ROOT.length + 1);
  const violations = [];
  const raw = readFileSync(filePath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    violations.push({ file: rel, line: 1, kind: 'invalid-json', message: err.message });
    return violations;
  }

  walkStrings(parsed, [], (str, path) => {
    if (isCodeCodeField(path, parsed)) return; // code.code ships verbatim
    const findings = findSmellsInString(str);
    for (const f of findings) {
      violations.push({
        file: rel,
        line: findLineForString(raw, str),
        kind: f.kind,
        snippet: f.snippet,
      });
    }
  });

  for (const g of checkContentGates(parsed, kind, rel)) {
    violations.push({ file: rel, line: 1, kind: g.kind, message: g.message });
  }

  return violations;
}

function printHelp() {
  process.stdout.write(`Usage: node scripts/lint-fixtures.mjs [--help]

Walks src/assets/mock-data/**/*.json and reports editorial smells +
per-fixture content gates. Exits 1 on any violation.

Editorial smells: straight ", -- between words, ASCII ' between Cyrillic
letters, regular space (not NBSP) after one-letter prepositions.

Content gates: ≥1 ґ, «…», em-dash, en-dash range, <code>; lessons must
contain ≥1 sidenote, figure, code block.
`);
}

function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return 0;
  }
  const fixtures = listFixtures();
  if (fixtures.length === 0) {
    process.stdout.write('lint-fixtures: no fixtures found under src/assets/mock-data/.\n');
    return 0;
  }
  const violations = fixtures.flatMap(({ path, kind }) => lintOne(path, kind));
  if (violations.length === 0) {
    process.stdout.write(`lint-fixtures: ${fixtures.length} fixtures clean.\n`);
    return 0;
  }
  for (const v of violations) {
    const tail = v.message ? `: ${v.message}` : v.snippet ? `: «${v.snippet}»` : '';
    process.stderr.write(`${v.file}:${v.line}: [${v.kind}]${tail}\n`);
  }
  process.stderr.write(`\nlint-fixtures: ${violations.length} violation(s) across ${fixtures.length} fixture(s).\n`);
  return 1;
}

process.exit(main(process.argv.slice(2)));
