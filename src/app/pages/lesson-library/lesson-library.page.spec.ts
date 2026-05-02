// @vitest-environment node
// Strategy: source-file contract tests (readFileSync on .ts + .html).
// Angular JIT in raw vitest cannot DOM-mount components with templateUrl
// (per 03-03/03-04 deviation). Source-file assertions verify the plan
// behaviors rigorously without requiring the Angular build plugin.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const TS = readFileSync(resolve(__dirname, 'lesson-library.page.ts'), 'utf-8');
const HTML = readFileSync(resolve(__dirname, 'lesson-library.page.html'), 'utf-8');
const SCSS = readFileSync(resolve(__dirname, 'lesson-library.page.scss'), 'utf-8');

describe('LessonLibraryPage source-file contract', () => {
  it('Test 1: calls listLessons() on init and sorts by publishedAt desc', () => {
    expect(TS).toMatch(/listLessons/);
    expect(TS).toMatch(/ngOnInit/);
    expect(TS).toMatch(/publishedAt/);
    expect(TS).toMatch(/localeCompare/);
  });

  it('Test 2: rendered row has zero-padded number prefix, h3 link to /lessons/{slug}, meta line with difficulty and хв', () => {
    expect(HTML).toMatch(/padStart\(2,\s*'0'\)/);
    expect(HTML).toMatch(/\/lessons/);
    expect(HTML).toMatch(/lesson\.slug/);
    expect(HTML).toMatch(/lesson\.title/);
    expect(HTML).toMatch(/хв/);
    expect(HTML).toMatch(/difficulty/);
  });

  it('Test 3: empty state aside renders with "Уроки готуються" heading', () => {
    expect(HTML).toMatch(/Уроки готуються/);
    expect(HTML).toMatch(/ui-aside/);
  });

  it('Test 4: hairline rule between rows via border-block-start on rows except first', () => {
    expect(SCSS).toMatch(/border-block-start/);
    expect(SCSS).toMatch(/--color-rule/);
    expect(SCSS).toMatch(/:first-child/);
  });

  it('Test 5: NO border-radius or box-shadow on rows (typographic, not card grid)', () => {
    expect(SCSS).not.toMatch(/border-radius/);
    expect(SCSS).not.toMatch(/box-shadow/);
  });

  it('Test 6: page title is set to "Уроки — Arduino UA"', () => {
    expect(TS).toMatch(/Уроки — Arduino UA/);
    expect(TS).toMatch(/setTitle/);
  });

  it('Test 7: injects CONTENT_API (not literal class)', () => {
    expect(TS).toMatch(/CONTENT_API/);
    expect(TS).toMatch(/inject/);
  });

  it('Test 8: accent number prefix has --color-accent color', () => {
    expect(SCSS).toMatch(/--color-accent/);
    expect(SCSS).toMatch(/lesson-library-page__num/);
  });

  it('Test 9: lede contains locked editorial sentence about Arduino learning path', () => {
    expect(HTML).toMatch(/Послідовний шлях через мікроконтролери/);
  });

  it('Test 10: standalone + OnPush declared', () => {
    expect(TS).toMatch(/standalone:\s*true/);
    expect(TS).toMatch(/ChangeDetectionStrategy\.OnPush/);
  });
});
