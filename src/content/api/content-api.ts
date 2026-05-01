import type { Article } from '../models/article';
import type { Datasheet } from '../models/datasheet';
import type { Lesson } from '../models/lesson';
import type { Schematic } from '../models/schematic';

export abstract class ContentApi {
  abstract getLesson(slug: string): Promise<Lesson>;
  abstract listLessons(): Promise<
    Pick<Lesson, 'slug' | 'title' | 'deck' | 'difficulty' | 'estimatedMinutes' | 'publishedAt'>[]
  >;

  abstract getArticle(slug: string): Promise<Article>;
  abstract listArticles(): Promise<Pick<Article, 'slug' | 'title' | 'deck' | 'publishedAt'>[]>;

  abstract getDatasheet(slug: string): Promise<Datasheet>;
  abstract listDatasheets(): Promise<Pick<Datasheet, 'slug' | 'title' | 'manufacturer'>[]>;

  abstract getSchematic(slug: string): Promise<Schematic>;
  abstract listSchematics(): Promise<Pick<Schematic, 'slug' | 'title'>[]>;
}
