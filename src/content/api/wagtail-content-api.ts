import { Injectable } from '@angular/core';
import type { Article } from '../models/article';
import type { Block } from '../models/block';
import type { Datasheet } from '../models/datasheet';
import type { Lesson } from '../models/lesson';
import type { Schematic } from '../models/schematic';
import { environment } from '../../environments/environment';
import { ContentApi } from './content-api';

type WagtailEnvelope = { type: string; value: Record<string, unknown>; id?: string };

interface WagtailPageMeta {
  type: string;
  slug: string;
  first_published_at: string;
  [k: string]: unknown;
}

type WagtailPageResponse = {
  id: number;
  meta: WagtailPageMeta;
  title: string;
} & Record<string, unknown>;

interface WagtailListResponse<T> {
  meta: { total_count: number };
  items: T[];
}

@Injectable({ providedIn: 'root' })
export class WagtailContentApi extends ContentApi {
  private readonly base = environment.wagtailBaseUrl;

  override async getLesson(slug: string): Promise<Lesson> {
    const raw = await this.fetchFirst('lessons.LessonPage', slug);
    return this.normalizePage(raw, 'lesson') as Lesson;
  }

  override async listLessons() {
    const list = await this.fetchList('lessons.LessonPage');
    return list.items.map((it) => ({
      slug: it.meta.slug,
      title: it.title,
      deck: (it['deck'] as string) ?? '',
      difficulty: (it['difficulty'] as Lesson['difficulty']) ?? 'beginner',
      estimatedMinutes: (it['estimatedMinutes'] as number) ?? 0,
      publishedAt: (it['publishedAt'] as string) ?? it.meta.first_published_at,
    }));
  }

  override async getArticle(slug: string): Promise<Article> {
    const raw = await this.fetchFirst('articles.ArticlePage', slug);
    return this.normalizePage(raw, 'article') as Article;
  }

  override async listArticles() {
    const list = await this.fetchList('articles.ArticlePage');
    return list.items.map((it) => ({
      slug: it.meta.slug,
      title: it.title,
      deck: (it['deck'] as string) ?? '',
      publishedAt: (it['publishedAt'] as string) ?? it.meta.first_published_at,
    }));
  }

  override async getDatasheet(slug: string): Promise<Datasheet> {
    const raw = await this.fetchFirst('datasheets.DatasheetPage', slug);
    return this.normalizePage(raw, 'datasheet') as Datasheet;
  }

  override async listDatasheets() {
    const list = await this.fetchList('datasheets.DatasheetPage');
    return list.items.map((it) => ({
      slug: it.meta.slug,
      title: it.title,
      manufacturer: (it['manufacturer'] as string) ?? '',
    }));
  }

  override async getSchematic(slug: string): Promise<Schematic> {
    const raw = await this.fetchFirst('schematics.SchematicPage', slug);
    return this.normalizePage(raw, 'schematic') as Schematic;
  }

  override async listSchematics() {
    const list = await this.fetchList('schematics.SchematicPage');
    return list.items.map((it) => ({ slug: it.meta.slug, title: it.title }));
  }

  async getLessonPreview(contentType: string, token: string): Promise<Lesson> {
    const raw = await this.fetchPreview(contentType, token);
    return this.normalizePage(raw, 'lesson') as Lesson;
  }

  async getArticlePreview(contentType: string, token: string): Promise<Article> {
    const raw = await this.fetchPreview(contentType, token);
    return this.normalizePage(raw, 'article') as Article;
  }

  async getDatasheetPreview(contentType: string, token: string): Promise<Datasheet> {
    const raw = await this.fetchPreview(contentType, token);
    return this.normalizePage(raw, 'datasheet') as Datasheet;
  }

  async getSchematicPreview(contentType: string, token: string): Promise<Schematic> {
    const raw = await this.fetchPreview(contentType, token);
    return this.normalizePage(raw, 'schematic') as Schematic;
  }

  private async fetchFirst(typeName: string, slug: string): Promise<WagtailPageResponse> {
    const url = `${this.base}/api/v2/pages/?type=${typeName}&slug=${encodeURIComponent(slug)}&fields=*`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetchFirst ${typeName}/${slug}: ${res.status}`);
    const data = (await res.json()) as WagtailListResponse<WagtailPageResponse>;
    const first = data.items[0];
    if (!first) throw new Error(`fetchFirst ${typeName}/${slug}: not found`);
    return first;
  }

  private async fetchList(typeName: string): Promise<WagtailListResponse<WagtailPageResponse>> {
    const url = `${this.base}/api/v2/pages/?type=${typeName}&fields=*`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetchList ${typeName}: ${res.status}`);
    return (await res.json()) as WagtailListResponse<WagtailPageResponse>;
  }

  private async fetchPreview(contentType: string, token: string): Promise<WagtailPageResponse> {
    const url = `${this.base}/api/v2/page_preview/?content_type=${encodeURIComponent(contentType)}&token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`fetchPreview ${contentType}: ${res.status}`);
    return (await res.json()) as WagtailPageResponse;
  }

  private normalizeBlock(env: WagtailEnvelope): Block {
    return { type: env.type, ...env.value } as unknown as Block;
  }

  private computeSidenoteAnchors(body: Block[]): Block[] {
    let lastParaIdx = -1;
    return body.map((b) => {
      if (b.type === 'paragraph') lastParaIdx += 1;
      if (b.type === 'sidenote') {
        return { ...b, anchorParagraphIndex: Math.max(0, lastParaIdx) } as Block;
      }
      return b;
    });
  }

  private normalizePage(
    raw: WagtailPageResponse,
    kind: 'lesson' | 'article' | 'datasheet' | 'schematic',
  ): Lesson | Article | Datasheet | Schematic {
    const rawBody = raw['body'];
    const body: Block[] = Array.isArray(rawBody)
      ? this.computeSidenoteAnchors(
          (rawBody as WagtailEnvelope[]).map((b) => this.normalizeBlock(b)),
        )
      : [];

    const slug = (raw['slug'] as string | undefined) ?? raw.meta.slug;
    const publishedAt =
      (raw['publishedAt'] as string | undefined) ?? raw.meta.first_published_at;
    const updatedAt = (raw['updatedAt'] as string | undefined) ?? publishedAt;

    if (kind === 'lesson') {
      const partsListRaw = raw['parts_list'];
      const partsList =
        Array.isArray(partsListRaw) && partsListRaw.length > 0
          ? this.normalizeBlock(partsListRaw[0] as WagtailEnvelope)
          : ({ type: 'parts-list', items: [] } as unknown as Block);
      return {
        type: 'lesson',
        slug,
        title: raw.title,
        deck: (raw['deck'] as string) ?? '',
        difficulty: (raw['difficulty'] as Lesson['difficulty']) ?? 'beginner',
        estimatedMinutes: (raw['estimatedMinutes'] as number) ?? 0,
        partsList,
        body,
        publishedAt,
        updatedAt,
      } as unknown as Lesson;
    }

    if (kind === 'article') {
      return {
        type: 'article',
        slug,
        title: raw.title,
        deck: (raw['deck'] as string) ?? '',
        body,
        publishedAt,
        updatedAt,
      } as unknown as Article;
    }

    if (kind === 'datasheet') {
      const pinoutRaw = raw['pinout'];
      const pinout =
        Array.isArray(pinoutRaw) && pinoutRaw.length > 0
          ? this.normalizeBlock(pinoutRaw[0] as WagtailEnvelope)
          : null;
      const specsRaw = raw['specifications'];
      const specifications = Array.isArray(specsRaw)
        ? (specsRaw as WagtailEnvelope[])
            .map((s) => this.normalizeBlock(s) as unknown as { label: string; value: string })
            .map((s) => ({ label: s.label, value: s.value }))
        : [];
      const peripheralRaw = raw['peripheralNotes'];
      const peripheralNotes = Array.isArray(peripheralRaw)
        ? this.computeSidenoteAnchors(
            (peripheralRaw as WagtailEnvelope[]).map((b) => this.normalizeBlock(b)),
          )
        : [];
      return {
        type: 'datasheet',
        slug,
        title: raw.title,
        manufacturer: (raw['manufacturer'] as string) ?? '',
        pinout,
        specifications,
        peripheralNotes,
        publishedAt,
        updatedAt,
      } as unknown as Datasheet;
    }

    const schematicImageRaw = raw['schematicImage'];
    const schematicImage =
      Array.isArray(schematicImageRaw) && schematicImageRaw.length > 0
        ? this.normalizeBlock(schematicImageRaw[0] as WagtailEnvelope)
        : null;
    const explanationRaw = raw['explanation'];
    const explanation = Array.isArray(explanationRaw)
      ? this.computeSidenoteAnchors(
          (explanationRaw as WagtailEnvelope[]).map((b) => this.normalizeBlock(b)),
        )
      : [];
    return {
      type: 'schematic',
      slug,
      title: raw.title,
      schematicImage,
      downloadUrl: (raw['downloadUrl'] as string) ?? '',
      explanation,
      publishedAt,
      updatedAt,
    } as unknown as Schematic;
  }
}
