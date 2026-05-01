import type { Article } from '../models/article';
import type { Datasheet } from '../models/datasheet';
import type { Lesson } from '../models/lesson';
import type { Schematic } from '../models/schematic';

export interface ContentSource {
  listLessonSlugs(): Promise<string[]>;
  loadLesson(slug: string): Promise<Lesson>;
  listArticleSlugs(): Promise<string[]>;
  loadArticle(slug: string): Promise<Article>;
  listDatasheetSlugs(): Promise<string[]>;
  loadDatasheet(slug: string): Promise<Datasheet>;
  listSchematicSlugs(): Promise<string[]>;
  loadSchematic(slug: string): Promise<Schematic>;
}
