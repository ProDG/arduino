import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  HeadingComponent,
  LedeComponent,
  PageShellComponent,
  SidenoteComponent,
  TwoColumnComponent,
} from '@arduino/core-ui';
import { CONTENT_API } from '../../../content/api/content-api.token';
import type { Article } from '../../../content/models/article';
import type { Block } from '../../../content/models/block';
import { formatDateUk } from '../../../lib/intl';
import { BlockRendererComponent } from '../../blocks/block-renderer/block-renderer.component';
import { SiteFooterComponent } from '../../chrome/site-footer.component';
import { SiteHeaderComponent } from '../../chrome/site-header.component';

@Component({
  selector: 'app-article-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageShellComponent,
    TwoColumnComponent,
    SidenoteComponent,
    HeadingComponent,
    LedeComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
    BlockRendererComponent,
  ],
  templateUrl: './article.page.html',
  styleUrl: './article.page.scss',
})
export class ArticlePage implements OnInit {
  slug = input.required<string>();
  private readonly api = inject(CONTENT_API);
  private readonly titleService = inject(Title);

  article = signal<Article | null>(null);
  loadError = signal<boolean>(false);

  bodyBlocks = computed(() => {
    const a = this.article();
    if (!a) return [];
    return a.body.filter((b) => b.type !== 'sidenote' && b.type !== 'parts-list');
  });

  sidenotes = computed(() => {
    const a = this.article();
    if (!a) return [];
    return (a.body.filter((b) => b.type === 'sidenote') as Extract<Block, { type: 'sidenote' }>[])
      .slice()
      .sort((a, b) => a.anchorParagraphIndex - b.anchorParagraphIndex);
  });

  headingToc = computed(() => {
    const a = this.article();
    if (!a) return [];
    return (a.body.filter((b) => b.type === 'heading') as Extract<Block, { type: 'heading' }>[])
      .filter((h) => h.level === 2)
      .map((h) => ({ id: h.id ?? '', text: h.text }));
  });

  firstFigureIndex = computed(() => {
    const blocks = this.bodyBlocks();
    return blocks.findIndex((b) => b.type === 'figure');
  });

  metaLine = computed(() => {
    const a = this.article();
    if (!a) return '';
    return formatDateUk(new Date(a.publishedAt));
  });

  async ngOnInit(): Promise<void> {
    try {
      const article = await this.api.getArticle(this.slug());
      this.article.set(article);
      this.titleService.setTitle(`${article.title} — Arduino UA`);
    } catch {
      // Slug not found (e.g., fixture missing). Render inline "not found" state
      // instead of throwing — an unhandled rejection here kills `ng serve`.
      this.loadError.set(true);
      this.titleService.setTitle('Сторінку не знайдено — Arduino UA');
    }
  }
}
