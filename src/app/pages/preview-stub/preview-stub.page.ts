import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  AsideComponent,
  HeadingComponent,
  LedeComponent,
  PageShellComponent,
} from '@arduino/core-ui';
import { CONTENT_API } from '../../../content/api/content-api.token';
import { WagtailContentApi } from '../../../content/api/wagtail-content-api';
import type { Article } from '../../../content/models/article';
import type { Datasheet } from '../../../content/models/datasheet';
import type { Lesson } from '../../../content/models/lesson';
import type { Schematic } from '../../../content/models/schematic';
import { SiteFooterComponent } from '../../chrome/site-footer.component';
import { SiteHeaderComponent } from '../../chrome/site-header.component';

type PreviewContent = Lesson | Article | Datasheet | Schematic;

const CONTENT_TYPE_MAP: Record<
  string,
  { wagtailType: string; method: keyof WagtailContentApi }
> = {
  lesson: { wagtailType: 'lessons.LessonPage', method: 'getLessonPreview' },
  article: { wagtailType: 'articles.ArticlePage', method: 'getArticlePreview' },
  datasheet: { wagtailType: 'datasheets.DatasheetPage', method: 'getDatasheetPreview' },
  schematic: { wagtailType: 'schematics.SchematicPage', method: 'getSchematicPreview' },
};

@Component({
  selector: 'app-preview-stub-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageShellComponent,
    HeadingComponent,
    LedeComponent,
    AsideComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
  ],
  templateUrl: './preview-stub.page.html',
  styleUrl: './preview-stub.page.scss',
})
export class PreviewStubPage implements OnInit {
  contentType = input.required<string>();
  token = input.required<string>();

  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly api = inject(CONTENT_API);

  readonly content = signal<PreviewContent | null>(null);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.titleService.setTitle('Попередній перегляд — Arduino UA');
    this.meta.addTag({ name: 'robots', content: 'noindex' });

    if (!(this.api instanceof WagtailContentApi)) {
      this.error.set(
        'Попередній перегляд потребує WagtailContentApi (увімкніть environment.useWagtailContentApi).',
      );
      return;
    }

    const wagtail = this.api;
    const ct = this.contentType();
    const tok = this.token();
    const entry = CONTENT_TYPE_MAP[ct];
    if (!entry) {
      this.error.set(`Невідомий тип попереднього перегляду: ${ct}`);
      return;
    }

    try {
      const fn = (wagtail[entry.method] as (
        contentType: string,
        token: string,
      ) => Promise<PreviewContent>).bind(wagtail);
      const data = await fn(entry.wagtailType, tok);
      this.content.set(data);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : String(err));
    }
  }
}
