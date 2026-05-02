import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { HeadingComponent, LedeComponent, PageShellComponent } from '@arduino/core-ui';
import { CONTENT_API } from '../../../content/api/content-api.token';
import type { Article } from '../../../content/models/article';
import type { Lesson } from '../../../content/models/lesson';
import { type DifficultyKey, DIFFICULTY_LABELS_UK } from '../../../lib/difficulty';
import { formatDateUk, formatNumberUk } from '../../../lib/intl';
import { SiteFooterComponent } from '../../chrome/site-footer.component';
import { SiteHeaderComponent } from '../../chrome/site-header.component';

type LessonRow = Pick<
  Lesson,
  'slug' | 'title' | 'deck' | 'difficulty' | 'estimatedMinutes' | 'publishedAt'
>;
type ArticleRow = Pick<Article, 'slug' | 'title' | 'deck' | 'publishedAt'>;

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageShellComponent,
    HeadingComponent,
    LedeComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly api = inject(CONTENT_API);
  private readonly titleService = inject(Title);

  recentLessons = signal<LessonRow[]>([]);
  recentArticles = signal<ArticleRow[]>([]);

  labelDifficulty = (d: DifficultyKey): string => DIFFICULTY_LABELS_UK[d];
  labelMinutes = (n: number): string => formatNumberUk(n);
  labelDate = (s: string): string => formatDateUk(new Date(s));

  async ngOnInit(): Promise<void> {
    this.titleService.setTitle('Arduino UA — українська онлайн-книга');
    const [lessons, articles] = await Promise.all([
      this.api.listLessons(),
      this.api.listArticles(),
    ]);
    const sortedLessons = [...lessons].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const sortedArticles = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    this.recentLessons.set(sortedLessons.slice(0, 3));
    this.recentArticles.set(sortedArticles.slice(0, 2));
  }
}
