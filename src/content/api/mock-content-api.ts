import { Injectable } from '@angular/core';
import type { Article } from '../models/article';
import type { Datasheet } from '../models/datasheet';
import type { Lesson } from '../models/lesson';
import type { Schematic } from '../models/schematic';
import { ContentApi } from './content-api';

@Injectable({ providedIn: 'root' })
export class MockContentApi extends ContentApi {
  private async readJson<T>(path: string): Promise<T> {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Mock fixture not found: ${path}`);
    return (await res.json()) as T;
  }

  override getLesson(slug: string): Promise<Lesson> {
    return this.readJson<Lesson>(`/assets/mock-data/lessons/${slug}.json`);
  }

  override async listLessons() {
    const slugs = [
      'pershyi-blymayuchyi-svitlodiod',
      'knopka-ta-pidtyahuvalnyi-rezystor',
      'analogovyi-vhid-ta-potentsiometr',
    ];
    const lessons = await Promise.all(slugs.map((s) => this.getLesson(s)));
    return lessons.map(({ slug, title, deck, difficulty, estimatedMinutes, publishedAt }) => ({
      slug,
      title,
      deck,
      difficulty,
      estimatedMinutes,
      publishedAt,
    }));
  }

  override getArticle(slug: string): Promise<Article> {
    return this.readJson<Article>(`/assets/mock-data/articles/${slug}.json`);
  }

  override async listArticles() {
    const a = await this.getArticle('chomu-arduino');
    return [{ slug: a.slug, title: a.title, deck: a.deck, publishedAt: a.publishedAt }];
  }

  override getDatasheet(slug: string): Promise<Datasheet> {
    return this.readJson<Datasheet>(`/assets/mock-data/datasheets/${slug}.json`);
  }

  override async listDatasheets() {
    const slugs = ['atmega328p', 'arduino-uno-r3'];
    const sheets = await Promise.all(slugs.map((s) => this.getDatasheet(s)));
    return sheets.map(({ slug, title, manufacturer }) => ({ slug, title, manufacturer }));
  }

  override getSchematic(slug: string): Promise<Schematic> {
    return this.readJson<Schematic>(`/assets/mock-data/schematics/${slug}.json`);
  }

  override async listSchematics() {
    const s = await this.getSchematic('blymayuchyi-svitlodiod-shema');
    return [{ slug: s.slug, title: s.title }];
  }
}
