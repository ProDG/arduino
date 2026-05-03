import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONTENT_API, provideContentApi } from './content-api.token';
import { MockContentApi } from './mock-content-api';
import { WagtailContentApi } from './wagtail-content-api';

class WagtailContentApiTestable extends WagtailContentApi {
  publicNormalizeBlock(env: { type: string; value: unknown; id?: string }) {
    return (this as unknown as { normalizeBlock: (e: unknown) => unknown }).normalizeBlock(env);
  }
  publicNormalizePage(raw: unknown, kind: 'lesson' | 'article' | 'datasheet' | 'schematic') {
    return (
      this as unknown as { normalizePage: (r: unknown, k: string) => unknown }
    ).normalizePage(raw, kind);
  }
}

describe('WagtailContentApi.normalizeBlock', () => {
  it('strips {type, value, id} envelope into a flat paragraph block', () => {
    const api = new WagtailContentApiTestable();
    const got = api.publicNormalizeBlock({
      type: 'paragraph',
      value: { html: '<p>x</p>' },
      id: 'abc',
    });
    expect(got).toEqual({ type: 'paragraph', html: '<p>x</p>' });
  });

  it('strips envelope on a code block, preserving annotations', () => {
    const api = new WagtailContentApiTestable();
    const got = api.publicNormalizeBlock({
      type: 'code',
      value: {
        language: 'cpp',
        code: 'x',
        annotations: [{ line: 1, html: '<p>n</p>' }],
        showLineNumbers: false,
        highlightLines: [],
        diffMode: false,
      },
      id: 'b',
    });
    expect(got).toEqual({
      type: 'code',
      language: 'cpp',
      code: 'x',
      annotations: [{ line: 1, html: '<p>n</p>' }],
      showLineNumbers: false,
      highlightLines: [],
      diffMode: false,
    });
  });
});

describe('WagtailContentApi.normalizePage', () => {
  it('computes anchorParagraphIndex for sidenotes interleaved with paragraphs', () => {
    const api = new WagtailContentApiTestable();
    const raw = {
      id: 1,
      meta: { type: 'articles.ArticlePage', slug: 'a', first_published_at: '2026-04-01T09:00:00+03:00' },
      title: 'A',
      deck: 'D',
      body: [
        { type: 'paragraph', value: { html: '<p>p1</p>' }, id: '1' },
        { type: 'sidenote', value: { number: 1, html: '<p>s1</p>' }, id: '2' },
        { type: 'paragraph', value: { html: '<p>p2</p>' }, id: '3' },
        { type: 'sidenote', value: { number: 2, html: '<p>s2</p>' }, id: '4' },
      ],
    };
    const got = api.publicNormalizePage(raw, 'article') as { body: { type: string; anchorParagraphIndex?: number }[] };
    const sidenotes = got.body.filter((b) => b.type === 'sidenote');
    expect(sidenotes[0].anchorParagraphIndex).toBe(0);
    expect(sidenotes[1].anchorParagraphIndex).toBe(1);
  });

  it('un-wraps single-block parts_list StreamField on a Lesson', () => {
    const api = new WagtailContentApiTestable();
    const raw = {
      id: 1,
      meta: { type: 'lessons.LessonPage', slug: 'l', first_published_at: '2026-04-01T09:00:00+03:00' },
      title: 'L',
      deck: 'D',
      difficulty: 'beginner',
      estimatedMinutes: 10,
      parts_list: [
        {
          type: 'parts-list',
          value: { items: [{ name: 'LED', quantity: 1 }] },
          id: 'pl1',
        },
      ],
      body: [],
    };
    const got = api.publicNormalizePage(raw, 'lesson') as {
      partsList: { type: string; items: { name: string; quantity: number }[] };
    };
    expect(got.partsList).toEqual({
      type: 'parts-list',
      items: [{ name: 'LED', quantity: 1 }],
    });
  });

  it('un-wraps single-block schematicImage on a Schematic and uses top-level downloadUrl', () => {
    const api = new WagtailContentApiTestable();
    const raw = {
      id: 1,
      meta: { type: 'schematics.SchematicPage', slug: 's', first_published_at: '2026-04-01T09:00:00+03:00' },
      title: 'S',
      schematicImage: [
        {
          type: 'figure',
          value: { src: '/x.svg', alt: 'a', fullBleed: true, width: 800, height: 600 },
          id: 'f1',
        },
      ],
      downloadUrl: '/d.svg',
      explanation: [],
    };
    const got = api.publicNormalizePage(raw, 'schematic') as {
      schematicImage: { type: string; src: string };
      downloadUrl: string;
    };
    expect(got.schematicImage.type).toBe('figure');
    expect(got.schematicImage.src).toBe('/x.svg');
    expect(got.downloadUrl).toBe('/d.svg');
  });
});

describe('provideContentApi factory', () => {
  afterEach(() => vi.resetModules());

  it('returns a CONTENT_API provider configured via useFactory', () => {
    const provider = provideContentApi() as unknown as {
      provide: unknown;
      useFactory: () => unknown;
    };
    expect(provider.provide).toBe(CONTENT_API);
    expect(typeof provider.useFactory).toBe('function');
  });

  it('factory returns MockContentApi when useWagtailContentApi flag is false', () => {
    const provider = provideContentApi() as unknown as { useFactory: () => unknown };
    const instance = provider.useFactory();
    expect(instance).toBeInstanceOf(MockContentApi);
  });

  it('factory returns WagtailContentApi when useWagtailContentApi flag is true', async () => {
    vi.resetModules();
    vi.doMock('../../environments/environment', () => ({
      environment: {
        production: false,
        useWagtailContentApi: true,
        wagtailBaseUrl: 'http://arduino.localhost',
      },
    }));
    const tokenMod = await import('./content-api.token');
    const wagMod = await import('./wagtail-content-api');
    const provider = tokenMod.provideContentApi() as unknown as { useFactory: () => unknown };
    const instance = provider.useFactory();
    expect(instance).toBeInstanceOf(wagMod.WagtailContentApi);
    vi.doUnmock('../../environments/environment');
  });
});
