import type { ContentSource } from './content-source';
import { WagtailContentApi } from './wagtail-content-api';

export class WagtailContentSource implements ContentSource {
  private readonly api = new WagtailContentApi();

  async listLessonSlugs(): Promise<string[]> {
    return (await this.api.listLessons()).map((l) => l.slug);
  }

  loadLesson(slug: string) {
    return this.api.getLesson(slug);
  }

  async listArticleSlugs(): Promise<string[]> {
    return (await this.api.listArticles()).map((a) => a.slug);
  }

  loadArticle(slug: string) {
    return this.api.getArticle(slug);
  }

  async listDatasheetSlugs(): Promise<string[]> {
    return (await this.api.listDatasheets()).map((d) => d.slug);
  }

  loadDatasheet(slug: string) {
    return this.api.getDatasheet(slug);
  }

  async listSchematicSlugs(): Promise<string[]> {
    return (await this.api.listSchematics()).map((s) => s.slug);
  }

  loadSchematic(slug: string) {
    return this.api.getSchematic(slug);
  }
}
