import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Article } from '../models/article';
import type { Datasheet } from '../models/datasheet';
import type { Lesson } from '../models/lesson';
import type { Schematic } from '../models/schematic';

const MOCK_ROOT = join(process.cwd(), 'src', 'assets', 'mock-data');

async function listSlugs(kind: string): Promise<string[]> {
  const dir = join(MOCK_ROOT, kind);
  const entries = await readdir(dir);
  return entries.filter((e: string) => e.endsWith('.json')).map((e: string) => e.slice(0, -5));
}

async function loadJson<T>(kind: string, slug: string): Promise<T> {
  const raw = await readFile(join(MOCK_ROOT, kind, `${slug}.json`), 'utf8');
  return JSON.parse(raw) as T;
}

export function listLessonSlugs(): Promise<string[]> {
  return listSlugs('lessons');
}

export function loadLesson(slug: string): Promise<Lesson> {
  return loadJson<Lesson>('lessons', slug);
}

export function listArticleSlugs(): Promise<string[]> {
  return listSlugs('articles');
}

export function loadArticle(slug: string): Promise<Article> {
  return loadJson<Article>('articles', slug);
}

export function listDatasheetSlugs(): Promise<string[]> {
  return listSlugs('datasheets');
}

export function loadDatasheet(slug: string): Promise<Datasheet> {
  return loadJson<Datasheet>('datasheets', slug);
}

export function listSchematicSlugs(): Promise<string[]> {
  return listSlugs('schematics');
}

export function loadSchematic(slug: string): Promise<Schematic> {
  return loadJson<Schematic>('schematics', slug);
}
