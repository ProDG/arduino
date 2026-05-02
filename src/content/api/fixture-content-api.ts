import { Injectable } from '@angular/core';
import { ContentApi } from './content-api';
import { FixtureContentSource } from './fixture-content-source';

// Server-only ContentApi backed by FixtureContentSource (node:fs). Registered
// in app.config.server.ts as the CONTENT_API override during SSG prerender.
// MUST NOT be imported from the browser bundle — its transitive deps include
// node:fs/promises and node:path.
@Injectable({ providedIn: 'root' })
export class FixtureContentApi extends ContentApi {
  private readonly source = new FixtureContentSource();

  override getLesson(slug: string) {
    return this.source.loadLesson(slug);
  }

  override async listLessons() {
    const slugs = await this.source.listLessonSlugs();
    const lessons = await Promise.all(slugs.map((s) => this.source.loadLesson(s)));
    return lessons.map(({ slug, title, deck, difficulty, estimatedMinutes, publishedAt }) => ({
      slug,
      title,
      deck,
      difficulty,
      estimatedMinutes,
      publishedAt,
    }));
  }

  override getArticle(slug: string) {
    return this.source.loadArticle(slug);
  }

  override async listArticles() {
    const slugs = await this.source.listArticleSlugs();
    const articles = await Promise.all(slugs.map((s) => this.source.loadArticle(s)));
    return articles.map(({ slug, title, deck, publishedAt }) => ({
      slug,
      title,
      deck,
      publishedAt,
    }));
  }

  override getDatasheet(slug: string) {
    return this.source.loadDatasheet(slug);
  }

  override async listDatasheets() {
    const slugs = await this.source.listDatasheetSlugs();
    const sheets = await Promise.all(slugs.map((s) => this.source.loadDatasheet(s)));
    return sheets.map(({ slug, title, manufacturer }) => ({ slug, title, manufacturer }));
  }

  override getSchematic(slug: string) {
    return this.source.loadSchematic(slug);
  }

  override async listSchematics() {
    const slugs = await this.source.listSchematicSlugs();
    const schematics = await Promise.all(slugs.map((s) => this.source.loadSchematic(s)));
    return schematics.map(({ slug, title }) => ({ slug, title }));
  }
}
