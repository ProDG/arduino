import type { ContentSource } from './content-source';
import * as loader from './fixture-loader';

export class FixtureContentSource implements ContentSource {
  listLessonSlugs(): Promise<string[]> {
    return loader.listLessonSlugs();
  }

  loadLesson(slug: string) {
    return loader.loadLesson(slug);
  }

  listArticleSlugs(): Promise<string[]> {
    return loader.listArticleSlugs();
  }

  loadArticle(slug: string) {
    return loader.loadArticle(slug);
  }

  listDatasheetSlugs(): Promise<string[]> {
    return loader.listDatasheetSlugs();
  }

  loadDatasheet(slug: string) {
    return loader.loadDatasheet(slug);
  }

  listSchematicSlugs(): Promise<string[]> {
    return loader.listSchematicSlugs();
  }

  loadSchematic(slug: string) {
    return loader.loadSchematic(slug);
  }
}
