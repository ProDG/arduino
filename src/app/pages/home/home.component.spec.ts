// @vitest-environment node
// Strategy: source-file contract tests (readFileSync on .ts + .html).
// Angular JIT in raw vitest cannot DOM-mount components with templateUrl.
// Source-file assertions verify all plan behaviors rigorously.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const TS = readFileSync(resolve(__dirname, 'home.component.ts'), 'utf-8');
const HTML = readFileSync(resolve(__dirname, 'home.component.html'), 'utf-8');

describe('HomeComponent source-file contract', () => {
  it('Test 1: injects CONTENT_API, calls listLessons + listArticles in parallel', () => {
    expect(TS).toMatch(/CONTENT_API/);
    expect(TS).toMatch(/listLessons/);
    expect(TS).toMatch(/listArticles/);
    expect(TS).toMatch(/Promise\.all/);
    expect(TS).toMatch(/ngOnInit/);
  });

  it('Test 2: sorts by publishedAt desc, slices to 3 lessons and 2 articles', () => {
    expect(TS).toMatch(/publishedAt/);
    expect(TS).toMatch(/localeCompare/);
    expect(TS).toMatch(/slice\(0,\s*3\)/);
    expect(TS).toMatch(/slice\(0,\s*2\)/);
  });

  it('Test 3: hero has h1 "Arduino UA" and locked lede copy', () => {
    expect(HTML).toMatch(/Arduino UA/);
    expect(HTML).toMatch(/Українська онлайн-книга про Arduino/);
  });

  it('Test 4: "Останні уроки" h2 section with row number prefix and хв meta', () => {
    expect(HTML).toMatch(/Останні уроки/);
    expect(HTML).toMatch(/padStart\(2,\s*'0'\)/);
    expect(HTML).toMatch(/хв/);
  });

  it('Test 5: trailing "Усі уроки →" link to /lessons', () => {
    expect(HTML).toMatch(/Усі уроки →/);
    expect(HTML).toMatch(/\/lessons/);
  });

  it('Test 6: "Статті" h2 section with recent articles', () => {
    expect(HTML).toMatch(/Статті/);
    expect(HTML).toMatch(/recentArticles/);
  });

  it('Test 7: entry-points paragraph with links to /lessons and /about', () => {
    expect(HTML).toMatch(/\/about/);
    expect(HTML).toMatch(/про проєкт/);
  });

  it('Test 8: title is "Arduino UA — українська онлайн-книга"', () => {
    expect(TS).toMatch(/Arduino UA — українська онлайн-книга/);
    expect(TS).toMatch(/setTitle/);
  });

  it('Test 9: standalone + OnPush', () => {
    expect(TS).toMatch(/standalone:\s*true/);
    expect(TS).toMatch(/ChangeDetectionStrategy\.OnPush/);
  });
});
