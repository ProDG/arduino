// @vitest-environment node
// Strategy: source-file contract tests (readFileSync on .ts + .html + .scss).
// PreviewStubPage is CSR-only: reads contentType + token from route inputs and
// fetches preview data via WagtailContentApi (Plan 04-07, WAGTAIL-05). No SSR.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const TS = readFileSync(resolve(__dirname, 'preview-stub.page.ts'), 'utf-8');
const HTML = readFileSync(resolve(__dirname, 'preview-stub.page.html'), 'utf-8');
const CONFIG_TS = readFileSync(resolve(__dirname, '../../app.config.ts'), 'utf-8');

describe('PreviewStubPage source-file contract', () => {
  it('Test 1: has contentType and token as input.required<string>()', () => {
    const matches = TS.match(/input\.required<string>\(\)/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
    expect(TS).toMatch(/contentType/);
    expect(TS).toMatch(/token/);
  });

  it('Test 2: ngOnInit sets noindex robots meta and preview title', () => {
    expect(TS).toMatch(/Попередній перегляд — Arduino UA/);
    expect(TS).toMatch(/setTitle/);
    expect(TS).toMatch(/robots.*noindex|noindex.*robots/);
  });

  it('Test 3: injects CONTENT_API and uses WagtailContentApi preview methods', () => {
    expect(TS).toMatch(/inject\(CONTENT_API\)/);
    expect(TS).toMatch(/WagtailContentApi/);
    expect(TS).toMatch(/getLessonPreview/);
    expect(TS).toMatch(/getArticlePreview/);
    expect(TS).toMatch(/getDatasheetPreview/);
    expect(TS).toMatch(/getSchematicPreview/);
  });

  it('Test 4: app.config.ts includes withComponentInputBinding()', () => {
    expect(CONFIG_TS).toMatch(/withComponentInputBinding\(\)/);
  });

  it('Test 5: maps short content-type segments to Wagtail content_type strings', () => {
    expect(TS).toMatch(/lessons\.LessonPage/);
    expect(TS).toMatch(/articles\.ArticlePage/);
    expect(TS).toMatch(/datasheets\.DatasheetPage/);
    expect(TS).toMatch(/schematics\.SchematicPage/);
  });

  it('Test 6: HTML echoes contentType and token in <pre>', () => {
    expect(HTML).toMatch(/contentType\(\)/);
    expect(HTML).toMatch(/token\(\)/);
    expect(HTML).toMatch(/<pre/);
  });

  it('Test 7: HTML renders fetched content title and an error fallback', () => {
    expect(HTML).toMatch(/c\.title/);
    expect(HTML).toMatch(/error\(\)/);
    expect(HTML).toMatch(/content\(\)/);
  });
});
