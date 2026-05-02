// @vitest-environment node
// Strategy: source-file contract tests (readFileSync on .ts + .html + const).
// No data deps for AboutPage — static prose page.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const TS = readFileSync(resolve(__dirname, 'about.page.ts'), 'utf-8');
const HTML = readFileSync(resolve(__dirname, 'about.page.html'), 'utf-8');
const CONST = readFileSync(resolve(__dirname, 'about-prose.const.ts'), 'utf-8');

describe('AboutPage source-file contract', () => {
  it('Test 1: does NOT inject CONTENT_API', () => {
    expect(TS).not.toMatch(/CONTENT_API/);
  });

  it('Test 2: title is "Про проєкт — Arduino UA"', () => {
    expect(TS).toMatch(/Про проєкт — Arduino UA/);
    expect(TS).toMatch(/setTitle/);
  });

  it('Test 3: template has h1 "Про проєкт" and lede "Чому існує цей сайт"', () => {
    expect(HTML).toMatch(/Про проєкт/);
    expect(HTML).toMatch(/Чому існує цей сайт/);
  });

  it('Test 4: ABOUT_PROSE has 4-6 entries', () => {
    const matches = CONST.match(/html:/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(4);
    expect(matches!.length).toBeLessThanOrEqual(6);
  });

  it('Test 5: ABOUT_PROSE contains real Ukrainian prose (no Lorem)', () => {
    expect(CONST).not.toMatch(/Lorem/);
    expect(CONST).not.toMatch(/ipsum/);
    expect(CONST).toMatch(/Arduino/);
  });

  it('Test 6: ABOUT_PROSE includes <em>Arduino Starter Kit</em> reference', () => {
    expect(CONST).toMatch(/<em>Arduino Starter Kit<\/em>/);
  });

  it('Test 7: standalone + OnPush declared', () => {
    expect(TS).toMatch(/standalone:\s*true/);
    expect(TS).toMatch(/ChangeDetectionStrategy\.OnPush/);
  });
});
