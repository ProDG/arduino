// Authoring helper. Inserts NBSP (U+00A0) between Ukrainian one-letter
// prepositions and the following Cyrillic word. Run once per fixture
// after typing prose; the resulting file ships verbatim (D-PRE-02 still
// holds — this is an authoring-time tool, not a runtime transform).
//
// Usage: node scripts/normalize-fixture-nbsp.mjs <path-or-glob>
//        node scripts/normalize-fixture-nbsp.mjs src/assets/mock-data/lessons/foo.json
//
// References: D-PRE-03, D-MOCK-04 in
// .planning/phases/02-primitives-two-column-layout-page-model-contract/02-CONTEXT.md.

import { readFileSync, writeFileSync } from 'node:fs';

const PREPS = ['а', 'в', 'до', 'за', 'з', 'і', 'й', 'на', 'не', 'о', 'по', 'та', 'у'];
const PREP_GROUP = PREPS.join('|');
const NBSP = ' ';
// Lowercase only — capital «В» is a unit symbol (volts), not a preposition.
const RE = new RegExp(
  `(^|[\\s.,;:«»()])(${PREP_GROUP}) (\\p{Script=Cyrillic})`,
  'gu',
);

const args = process.argv.slice(2);
if (args.length === 0) {
  process.stderr.write('Usage: node scripts/normalize-fixture-nbsp.mjs <file> [file...]\n');
  process.exit(2);
}

let totalChanges = 0;
for (const path of args) {
  const orig = readFileSync(path, 'utf8');
  let txt = orig;
  let prev;
  do {
    prev = txt;
    txt = txt.replace(RE, (_m, lead, prep, cyr) => lead + prep + NBSP + cyr);
  } while (txt !== prev);
  if (txt !== orig) {
    writeFileSync(path, txt);
    const delta = (txt.match(/ /g) ?? []).length - (orig.match(/ /g) ?? []).length;
    process.stdout.write(`${path}: +${delta} NBSP\n`);
    totalChanges += delta;
  } else {
    process.stdout.write(`${path}: clean\n`);
  }
}

process.exit(0);
