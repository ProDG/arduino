// @vitest-environment node
// Strategy: source-file contract tests on app.routes.ts + app.routes.server.ts.
// Verifies all P3 routes are registered with lazy loadComponent, correct render modes,
// and getPrerenderParams() wired to fixture-loader for every dynamic :slug route.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROUTES = readFileSync(resolve(__dirname, 'app.routes.ts'), 'utf-8');
const SERVER_ROUTES = readFileSync(resolve(__dirname, 'app.routes.server.ts'), 'utf-8');

describe('app.routes.ts contract', () => {
  it('Test 1: has 11+ lazy loadComponent entries for all P3 routes', () => {
    const matches = ROUTES.match(/loadComponent: \(\) => import/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(11);
  });

  it('Test 1b: required route paths are present', () => {
    expect(ROUTES).toMatch(/path: ''/);
    expect(ROUTES).toMatch(/path: 'lessons'/);
    expect(ROUTES).toMatch(/path: 'lessons\/:slug'/);
    expect(ROUTES).toMatch(/path: 'articles\/:slug'/);
    expect(ROUTES).toMatch(/path: 'datasheets\/:slug'/);
    expect(ROUTES).toMatch(/path: 'schematics\/:slug'/);
    expect(ROUTES).toMatch(/path: 'about'/);
    expect(ROUTES).toMatch(/path: 'preview\/:contentType\/:token'/);
    expect(ROUTES).toMatch(/path: '\*\*'/);
  });

  it('Test 2: static routes have Ukrainian title fields', () => {
    expect(ROUTES).toMatch(/Уроки — Arduino UA/);
    expect(ROUTES).toMatch(/Про проєкт — Arduino UA/);
    expect(ROUTES).toMatch(/Сторінку не знайдено — Arduino UA/);
  });

  it('Test 2b: root title is the site name', () => {
    expect(ROUTES).toMatch(/Arduino UA/);
  });
});

describe('app.routes.server.ts contract', () => {
  it('Test 3: RenderMode.Client for preview and dev/primitives', () => {
    const clientMatches = SERVER_ROUTES.match(/RenderMode\.Client/g);
    expect(clientMatches).not.toBeNull();
    expect(clientMatches!.length).toBeGreaterThanOrEqual(2);
    expect(SERVER_ROUTES).toMatch(/preview\/:contentType\/:token/);
    expect(SERVER_ROUTES).toMatch(/dev\/primitives/);
  });

  it('Test 4: getPrerenderParams wired for all 4 dynamic slug routes', () => {
    const matches = SERVER_ROUTES.match(/getPrerenderParams/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(4);
  });

  it('Test 4b: getPrerenderParams calls fixture-loader functions', () => {
    expect(SERVER_ROUTES).toMatch(/listLessonSlugs/);
    expect(SERVER_ROUTES).toMatch(/listArticleSlugs/);
    expect(SERVER_ROUTES).toMatch(/listDatasheetSlugs/);
    expect(SERVER_ROUTES).toMatch(/listSchematicSlugs/);
  });

  it('Test 4c: no inject() calls in server routes (Pitfall A guard)', () => {
    expect(SERVER_ROUTES).not.toMatch(/inject\(/);
  });

  it('Test 4d: imports from fixture-loader', () => {
    expect(SERVER_ROUTES).toMatch(/from.*fixture-loader/);
  });
});
