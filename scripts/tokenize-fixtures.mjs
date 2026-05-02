#!/usr/bin/env node
// Build-time Shiki tokenization for mock-data fixtures.
// Walks src/assets/mock-data/**/*.json, finds code blocks, writes tokens HTML.
// Idempotent: re-running with no fixture changes produces no diff.
// IMPORTANT: Shiki MUST NOT be imported from src/**. This script is the only
// consumer. See PRIM-04 and .eslintrc / no-restricted-imports rule.
// See .planning/phases/03-page-templates-routing-static-build/03-CONTEXT.md D-SHIKI-01..05.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHighlighter } from 'shiki';
import { format, resolveConfig } from 'prettier';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const FIXTURE_ROOT = join(REPO_ROOT, 'src', 'assets', 'mock-data');
const THEME_PATH = join(REPO_ROOT, 'src', 'assets', 'shiki', 'arduino-paper.json');

const theme = JSON.parse(await readFile(THEME_PATH, 'utf8'));
const highlighter = await createHighlighter({
  themes: [theme],
  langs: ['cpp', 'plaintext', 'diff'],
});

function tokenize(code, language) {
  const lang = language === 'arduino' ? 'cpp' : (language || 'plaintext');
  const safeLang = highlighter.getLoadedLanguages().includes(lang) ? lang : 'plaintext';
  return highlighter.codeToHtml(code, { lang: safeLang, theme: 'arduino-paper' });
}

function visit(node, mutated) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => visit(n, mutated));
    return;
  }
  if (node.type === 'code' && typeof node.code === 'string' && typeof node.language === 'string') {
    const next = tokenize(node.code, node.language);
    if (node.tokens !== next) {
      node.tokens = next;
      mutated.flag = true;
    }
  }
  for (const v of Object.values(node)) visit(v, mutated);
}

const prettierConfig = await resolveConfig(REPO_ROOT);

async function tokenizeFile(filePath) {
  const original = await readFile(filePath, 'utf8');
  const json = JSON.parse(original);
  const mutated = { flag: false };
  visit(json, mutated);
  const next = await format(JSON.stringify(json), {
    ...prettierConfig,
    parser: 'json',
  });
  if (next !== original) {
    await writeFile(filePath, next);
    return true;
  }
  return false;
}

const KINDS = ['lessons', 'articles', 'datasheets', 'schematics'];
let changed = 0;
for (const kind of KINDS) {
  const dir = join(FIXTURE_ROOT, kind);
  let files;
  try {
    files = await readdir(dir);
  } catch {
    continue;
  }
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    if (await tokenizeFile(join(dir, f))) changed += 1;
  }
}
console.log(`tokenize-fixtures: ${changed} file(s) updated`);
process.exit(0);
