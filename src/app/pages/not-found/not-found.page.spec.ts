// @vitest-environment node
// Strategy: source-file contract tests (readFileSync on .ts + .html + .scss).
// NotFoundPage is a static page with no data deps.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const TS = readFileSync(resolve(__dirname, 'not-found.page.ts'), 'utf-8');
const HTML = readFileSync(resolve(__dirname, 'not-found.page.html'), 'utf-8');
const SCSS = readFileSync(resolve(__dirname, 'not-found.page.scss'), 'utf-8');

describe('NotFoundPage source-file contract', () => {
  it('Test 1: does NOT inject CONTENT_API', () => {
    expect(TS).not.toMatch(/CONTENT_API/);
  });

  it('Test 2: title is "Сторінку не знайдено — Arduino UA"', () => {
    expect(TS).toMatch(/Сторінку не знайдено — Arduino UA/);
    expect(TS).toMatch(/setTitle/);
  });

  it('Test 3: renders 404 numeral', () => {
    expect(HTML).toMatch(/404/);
  });

  it('Test 4: renders "Цієї сторінки немає" lede', () => {
    expect(HTML).toMatch(/Цієї сторінки немає/);
  });

  it('Test 5: has link to /lessons', () => {
    expect(HTML).toMatch(/\/lessons/);
    expect(HTML).toMatch(/routerLink/);
  });

  it('Test 6: accent hairline rule — 2px solid --color-accent', () => {
    expect(SCSS).toMatch(/border-block-start:\s*2px\s+solid\s+var\(--color-accent\)/);
  });

  it('Test 7: vertically centered with grid + place-content', () => {
    expect(SCSS).toMatch(/place-content:\s*center/);
    expect(SCSS).toMatch(/display:\s*grid/);
  });

  it('Test 8: standalone + OnPush declared', () => {
    expect(TS).toMatch(/standalone:\s*true/);
    expect(TS).toMatch(/ChangeDetectionStrategy\.OnPush/);
  });
});
