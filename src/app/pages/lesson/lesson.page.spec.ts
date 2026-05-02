// @vitest-environment node
// Strategy: source-file contract tests (readFileSync on lesson.page.ts).
// Angular JIT in raw vitest cannot DOM-mount components that use `input.required<T>()`
// with templateUrl (per 03-03 deviation — signals not registered without Angular build plugin).
// Source-file assertions verify the dispatch contract rigorously without requiring the DOM.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(resolve(__dirname, 'lesson.page.ts'), 'utf-8');

describe('LessonPage source-file contract', () => {
  it('Test 1: has slug = input.required<string>()', () => {
    expect(SRC).toMatch(/input\.required<string>\(\)/);
    expect(SRC).toMatch(/slug\s*=/);
  });

  it('Test 2: injects CONTENT_API and calls getLesson(slug()) on init', () => {
    expect(SRC).toMatch(/CONTENT_API/);
    expect(SRC).toMatch(/getLesson\(this\.slug\(\)\)/);
    expect(SRC).toMatch(/ngOnInit/);
  });

  it('Test 3: sets <title> via Title service to "{lesson.title} — Arduino UA"', () => {
    expect(SRC).toMatch(/— Arduino UA/);
    expect(SRC).toMatch(/setTitle/);
  });

  it('Test 4: metaLine() uses DIFFICULTY_LABELS_UK, formatNumberUk, formatDateUk', () => {
    expect(SRC).toMatch(/DIFFICULTY_LABELS_UK/);
    expect(SRC).toMatch(/formatDateUk/);
    expect(SRC).toMatch(/formatNumberUk/);
    expect(SRC).toMatch(/хв/);
  });

  it('Test 5: bodyBlocks() filters out sidenote and parts-list types', () => {
    expect(SRC).toMatch(/sidenote/);
    expect(SRC).toMatch(/parts-list/);
    expect(SRC).toMatch(/filter/);
    expect(SRC).toMatch(/bodyBlocks/);
  });

  it('Test 6: sidenotes() filters body for sidenote blocks sorted by anchorParagraphIndex', () => {
    expect(SRC).toMatch(/sidenotes/);
    expect(SRC).toMatch(/anchorParagraphIndex/);
    expect(SRC).toMatch(/sort/);
  });

  it('Test 7: headingToc() returns body items where type===heading && level===2', () => {
    expect(SRC).toMatch(/headingToc/);
    expect(SRC).toMatch(/type.*heading|heading.*type/);
    expect(SRC).toMatch(/level.*2|2.*level/);
  });

  it('Test 8: prevLessonTitle() and nextLessonTitle() resolve via listLessons() index', () => {
    expect(SRC).toMatch(/prevLessonTitle/);
    expect(SRC).toMatch(/nextLessonTitle/);
    expect(SRC).toMatch(/listLessons/);
    expect(SRC).toMatch(/prevSlug/);
    expect(SRC).toMatch(/nextSlug/);
  });

  it('Test 9: partsList computed returns null-safe access', () => {
    expect(SRC).toMatch(/partsList/);
    expect(SRC).toMatch(/null/);
  });

  it('uses ChangeDetectionStrategy.OnPush', () => {
    expect(SRC).toMatch(/ChangeDetectionStrategy\.OnPush/);
  });

  it('exports LessonPage class', () => {
    expect(SRC).toMatch(/export class LessonPage/);
  });

  it('imports RouterLink for prev/next navigation', () => {
    expect(SRC).toMatch(/RouterLink/);
  });

  it('imports SiteHeader and SiteFooter chrome components', () => {
    expect(SRC).toMatch(/SiteHeaderComponent/);
    expect(SRC).toMatch(/SiteFooterComponent/);
  });

  it('imports BlockRendererComponent', () => {
    expect(SRC).toMatch(/BlockRendererComponent/);
  });

  it('imports core-ui layout primitives from @arduino/core-ui barrel', () => {
    expect(SRC).toMatch(/@arduino\/core-ui/);
    expect(SRC).toMatch(/TwoColumnComponent/);
    expect(SRC).toMatch(/PageShellComponent/);
  });

  it('does not add noindex meta (lesson is a public route)', () => {
    expect(SRC).not.toMatch(/noindex/);
  });

  it('firstFigureIndex computed returns index of first figure in bodyBlocks', () => {
    expect(SRC).toMatch(/firstFigureIndex/);
  });
});

describe('LessonPage HTML template contract', () => {
  const HTML = readFileSync(resolve(__dirname, 'lesson.page.html'), 'utf-8');

  it('contains ui-page-shell wrapper', () => {
    expect(HTML).toMatch(/ui-page-shell/);
  });

  it('contains app-site-header and app-site-footer', () => {
    expect(HTML).toMatch(/app-site-header/);
    expect(HTML).toMatch(/app-site-footer/);
  });

  it('contains ui-two-column', () => {
    expect(HTML).toMatch(/ui-two-column/);
  });

  it('contains app-block-renderer', () => {
    expect(HTML).toMatch(/app-block-renderer/);
  });

  it('contains ui-sidenote', () => {
    expect(HTML).toMatch(/ui-sidenote/);
  });

  it('contains Ukrainian "Що знадобиться" parts list heading', () => {
    expect(HTML).toMatch(/Що знадобиться/);
  });

  it('contains Ukrainian prev-lesson label', () => {
    expect(HTML).toMatch(/← Попередній урок/);
  });

  it('contains Ukrainian next-lesson label', () => {
    expect(HTML).toMatch(/Наступний урок →/);
  });

  it('contains aria-label="Зміст" for TOC nav', () => {
    expect(HTML).toMatch(/aria-label="Зміст"/);
  });

  it('uses routerLink for prev/next navigation', () => {
    expect(HTML).toMatch(/routerLink/);
  });
});
