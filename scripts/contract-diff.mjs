// Contract diff: assert Wagtail REST API v2 emits byte-equivalent JSON to the
// MockContentApi fixtures (modulo allowlisted volatile fields).
//
// References:
//   - D-CONTRACT-01..06 (.planning/phases/04-.../04-CONTEXT.md)
//   - WAGTAIL-04 (REQUIREMENTS.md)
//   - CONTRACT-02 spike sign-off (.planning/phases/03-.../wagtail-spike-report.md)
//
// Execution model: stack must be UP and Wagtail must be SEEDED. Run:
//   docker compose -f compose.yml -f compose.dev.yml up -d
//   docker compose exec wagtail python manage.py seed_fixtures
//   pnpm contract:diff
//
// Exit code 0 when all 7 fixtures match. Non-zero with colored unified diff per
// failing fixture. Not in CI for v1 (D-CONTRACT-06).

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const FIXTURE_ROOT = join(REPO_ROOT, 'src', 'assets', 'mock-data');
const API_BASE = process.env.WAGTAIL_API_BASE || 'http://arduino.localhost';

// ---------------------------------------------------------------------------
// D-CONTRACT-02 ALLOWLIST — fields stripped from BOTH sides before comparison.
// Each entry is a dotted path; `[*]` denotes "for every element of an array".
// Adding a field here is a deliberate, code-reviewed decision; document the
// rationale in the comment beside it.
// ---------------------------------------------------------------------------
const STRIP_PATHS = [
  // Page meta — Wagtail emits these; mocks omit them.
  'meta.detail_url',
  'meta.html_url',
  'meta.first_published_at',
  'meta.alias_of',
  'meta.parent',
  'meta.seo_title',
  'meta.search_description',
  'meta.show_in_menus',
  'meta.type',
  'meta.locale',

  // Top-level Wagtail PK; mocks omit.
  'id',

  // Top-level updatedAt — mocks omit; Wagtail emits via api_fields if present.
  'updatedAt',

  // Per-block UUID — Wagtail StreamField emits one per block; mocks have none.
  'body[*].id',
  'lede[*].id',
  'parts_list[*].id',
  'partsList[*].id',
  'pinout[*].id',
  'specifications[*].id',
  'peripheralNotes[*].id',
  'schematicImage[*].id',
  'explanation[*].id',

  // Per D-CONTRACT-04: Shiki tokens deferred; strip both sides.
  'body[*].code.tokens',
  'body[*].tokens',
  'peripheralNotes[*].code.tokens',
  'peripheralNotes[*].tokens',
  'explanation[*].code.tokens',
  'explanation[*].tokens',

  // Per D-MODEL-04: sidenote.anchorParagraphIndex is FE-computed post-fetch;
  // mocks bake it in, Wagtail does not emit it. Strip from mocks.
  'body[*].anchorParagraphIndex',
  'peripheralNotes[*].anchorParagraphIndex',
  'explanation[*].anchorParagraphIndex',
];

// ---------------------------------------------------------------------------
// Fixture mapping — one row per CONTRACT-03 slug.
// ---------------------------------------------------------------------------
const FIXTURES = [
  { kind: 'lesson',    slug: 'pershyi-blymayuchyi-svitlodiod',     wagtailType: 'lessons.LessonPage' },
  { kind: 'lesson',    slug: 'knopka-ta-pidtyahuvalnyi-rezystor',  wagtailType: 'lessons.LessonPage' },
  { kind: 'lesson',    slug: 'analogovyi-vhid-ta-potentsiometr',   wagtailType: 'lessons.LessonPage' },
  { kind: 'article',   slug: 'chomu-arduino',                       wagtailType: 'articles.ArticlePage' },
  { kind: 'datasheet', slug: 'atmega328p',                          wagtailType: 'datasheets.DatasheetPage' },
  { kind: 'datasheet', slug: 'arduino-uno-r3',                      wagtailType: 'datasheets.DatasheetPage' },
  { kind: 'schematic', slug: 'blymayuchyi-svitlodiod-shema',        wagtailType: 'schematics.SchematicPage' },
];

const KIND_DIR = { lesson: 'lessons', article: 'articles', datasheet: 'datasheets', schematic: 'schematics' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';

function loadMock(kind, slug) {
  const path = join(FIXTURE_ROOT, KIND_DIR[kind], `${slug}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function fetchWagtail(wagtailType, slug) {
  const url = `${API_BASE}/api/v2/pages/?type=${wagtailType}&slug=${encodeURIComponent(slug)}&fields=*`;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(
      `contract-diff: cannot reach ${url}\n` +
      `  Is the dev stack up? Run:\n` +
      `    docker compose -f compose.yml -f compose.dev.yml up -d\n` +
      `    docker compose exec wagtail python manage.py seed_fixtures\n` +
      `  underlying error: ${err.message}`
    );
  }
  if (!res.ok) throw new Error(`contract-diff: ${url} -> HTTP ${res.status}`);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) throw new Error(`contract-diff: no Wagtail page found for ${wagtailType}/${slug}`);
  return item;
}

/** Strip allowlisted paths in-place. Mutates `obj`. */
function stripPaths(obj, paths) {
  for (const path of paths) {
    stripPath(obj, path.split('.'));
  }
  return obj;
}

function stripPath(node, segments) {
  if (node === null || node === undefined || segments.length === 0) return;
  const [head, ...rest] = segments;
  if (head.endsWith('[*]')) {
    const key = head.slice(0, -3);
    const arr = node[key];
    if (Array.isArray(arr)) {
      for (const elem of arr) {
        if (rest.length === 0) continue;
        stripPath(elem, rest);
      }
    }
    return;
  }
  if (rest.length === 0) {
    if (node && typeof node === 'object') delete node[head];
    return;
  }
  if (node[head] !== undefined) stripPath(node[head], rest);
}

/** Recursive sorted-key JSON canonicalization. */
function canonicalize(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const out = {};
  for (const k of Object.keys(value).sort()) out[k] = canonicalize(value[k]);
  return out;
}

/** Tiny line-level unified diff. Sufficient for human reading; no external dep. */
function unifiedDiff(aStr, bStr, aLabel = 'mock', bLabel = 'wagtail') {
  const a = aStr.split('\n');
  const b = bStr.split('\n');
  const max = Math.max(a.length, b.length);
  const lines = [`${DIM}--- ${aLabel}${RESET}`, `${DIM}+++ ${bLabel}${RESET}`];
  for (let i = 0; i < max; i++) {
    const x = a[i] ?? '';
    const y = b[i] ?? '';
    if (x === y) {
      lines.push(`  ${x}`);
    } else {
      if (x !== undefined) lines.push(`${RED}- ${x}${RESET}`);
      if (y !== undefined) lines.push(`${GREEN}+ ${y}${RESET}`);
    }
  }
  return lines.join('\n');
}

function printHelp() {
  process.stdout.write(
    'contract-diff.mjs — verify Wagtail JSON ≡ MockContentApi fixtures (D-CONTRACT-01..06)\n' +
    '\nUsage: pnpm contract:diff [--fixture <slug>]\n' +
    '\nEnv: WAGTAIL_API_BASE (default http://arduino.localhost)\n'
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) { printHelp(); return 0; }

  const onlyArg = argv.indexOf('--fixture');
  const onlySlug = onlyArg >= 0 ? argv[onlyArg + 1] : null;
  const fixtures = onlySlug ? FIXTURES.filter((f) => f.slug === onlySlug) : FIXTURES;
  if (fixtures.length === 0) {
    process.stderr.write(`contract-diff: unknown fixture slug: ${onlySlug}\n`);
    return 2;
  }

  let pass = 0;
  let fail = 0;
  for (const f of fixtures) {
    let mock, wagtail;
    try {
      mock = loadMock(f.kind, f.slug);
      wagtail = await fetchWagtail(f.wagtailType, f.slug);
    } catch (err) {
      process.stderr.write(`${RED}FAIL${RESET} ${f.slug}: ${err.message}\n`);
      fail += 1;
      continue;
    }
    const mockClean = canonicalize(stripPaths(mock, STRIP_PATHS));
    const wagClean = canonicalize(stripPaths(wagtail, STRIP_PATHS));
    const mockStr = JSON.stringify(mockClean, null, 2);
    const wagStr = JSON.stringify(wagClean, null, 2);
    if (mockStr === wagStr) {
      process.stdout.write(`${GREEN}PASS${RESET} ${f.kind}/${f.slug}\n`);
      pass += 1;
    } else {
      process.stdout.write(`${RED}FAIL${RESET} ${f.kind}/${f.slug}\n`);
      process.stdout.write(unifiedDiff(mockStr, wagStr, `mock:${f.slug}`, `wagtail:${f.slug}`));
      process.stdout.write('\n');
      fail += 1;
    }
  }

  const total = pass + fail;
  const summary = `${pass}/${total} PASS`;
  process.stdout.write(fail === 0
    ? `${GREEN}${summary}${RESET}\n`
    : `${RED}${summary}${RESET}\n`);
  return fail === 0 ? 0 : 1;
}

process.exit(await main(process.argv.slice(2)));
