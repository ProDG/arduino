import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Article } from '../models/article';
import type { Datasheet } from '../models/datasheet';
import type { Lesson } from '../models/lesson';
import type { Schematic } from '../models/schematic';
import { MockContentApi } from './mock-content-api';

const fixtureLesson: Lesson = {
  type: 'lesson',
  slug: 'pershyi-blymayuchyi-svitlodiod',
  title: 'Перший блимаючий світлодіод',
  deck: 'Найпростіша схема — світлодіод і пара рядків коду.',
  estimatedMinutes: 12,
  difficulty: 'beginner',
  partsList: { type: 'parts-list', items: [{ name: 'Світлодіод', quantity: 1 }] },
  body: [{ type: 'paragraph', html: 'Текст із «лапками» — і апострофом ʼ.' }],
  publishedAt: '2026-04-15T09:00:00+03:00',
  updatedAt: '2026-04-22T11:30:00+03:00',
};

const fixtureArticle: Article = {
  type: 'article',
  slug: 'chomu-arduino',
  title: 'Чому Arduino?',
  deck: 'Коротка історія платформи.',
  body: [{ type: 'paragraph', html: 'Текст «у лапках».' }],
  publishedAt: '2026-04-01T09:00:00+03:00',
  updatedAt: '2026-04-01T09:00:00+03:00',
};

const fixtureDatasheet: Datasheet = {
  type: 'datasheet',
  slug: 'atmega328p',
  title: 'ATmega328P',
  manufacturer: 'Microchip',
  pinout: { type: 'pinout', src: '/x.svg', alt: 'pinout', pins: [] },
  specifications: [{ label: 'Flash', value: '32 КБ' }],
  peripheralNotes: [],
  publishedAt: '2026-04-01T09:00:00+03:00',
  updatedAt: '2026-04-01T09:00:00+03:00',
};

const fixtureSchematic: Schematic = {
  type: 'schematic',
  slug: 'blymayuchyi-svitlodiod-shema',
  title: 'Схема: блимаючий світлодіод',
  schematicImage: {
    type: 'figure',
    src: '/x.svg',
    alt: 'Схема',
    fullBleed: true,
  },
  explanation: [],
  downloadUrl: '/assets/mock-data/figures/blymayuchyi-svitlodiod-shema.svg',
  publishedAt: '2026-04-01T09:00:00+03:00',
  updatedAt: '2026-04-01T09:00:00+03:00',
};

function jsonResponse<T>(payload: T) {
  return {
    ok: true,
    json: async () => payload,
  } as unknown as Response;
}

describe('MockContentApi', () => {
  afterEach(() => vi.restoreAllMocks());

  it('getLesson returns the parsed JSON verbatim (no transformation)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(fixtureLesson));
    const api = new MockContentApi();
    const got = await api.getLesson('pershyi-blymayuchyi-svitlodiod');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/assets/mock-data/lessons/pershyi-blymayuchyi-svitlodiod.json',
    );
    expect(got).toEqual(fixtureLesson);
    expect(got.body[0]).toEqual(fixtureLesson.body[0]);
    if (got.body[0].type === 'paragraph') {
      expect(got.body[0].html).toBe('Текст із «лапками» — і апострофом ʼ.');
    }
  });

  it('getArticle returns the parsed JSON verbatim', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(fixtureArticle));
    const api = new MockContentApi();
    const got = await api.getArticle('chomu-arduino');
    expect(got).toEqual(fixtureArticle);
  });

  it('getDatasheet returns the parsed JSON verbatim', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(fixtureDatasheet));
    const api = new MockContentApi();
    const got = await api.getDatasheet('atmega328p');
    expect(got).toEqual(fixtureDatasheet);
  });

  it('getSchematic returns the parsed JSON verbatim', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(fixtureSchematic));
    const api = new MockContentApi();
    const got = await api.getSchematic('blymayuchyi-svitlodiod-shema');
    expect(got).toEqual(fixtureSchematic);
  });

  it('throws when the fixture is not found', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false } as Response);
    const api = new MockContentApi();
    await expect(api.getLesson('missing')).rejects.toThrow(/Mock fixture not found/);
  });
});
