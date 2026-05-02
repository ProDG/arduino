import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  AsideComponent,
  HeadingComponent,
  LedeComponent,
  PageShellComponent,
} from '@arduino/core-ui';
import { CONTENT_API } from '../../../content/api/content-api.token';
import type { Lesson } from '../../../content/models/lesson';
import { type DifficultyKey, DIFFICULTY_LABELS_UK } from '../../../lib/difficulty';
import { formatNumberUk } from '../../../lib/intl';
import { SiteFooterComponent } from '../../chrome/site-footer.component';
import { SiteHeaderComponent } from '../../chrome/site-header.component';

type LessonRow = Pick<
  Lesson,
  'slug' | 'title' | 'deck' | 'difficulty' | 'estimatedMinutes' | 'publishedAt'
>;

@Component({
  selector: 'app-lesson-library-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageShellComponent,
    HeadingComponent,
    LedeComponent,
    AsideComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
  ],
  templateUrl: './lesson-library.page.html',
  styleUrl: './lesson-library.page.scss',
})
export class LessonLibraryPage implements OnInit {
  private readonly api = inject(CONTENT_API);
  private readonly titleService = inject(Title);

  lessons = signal<LessonRow[]>([]);

  sortedLessons = computed(() =>
    [...this.lessons()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  );

  labelDifficulty = (d: DifficultyKey): string => DIFFICULTY_LABELS_UK[d];
  labelMinutes = (n: number): string => formatNumberUk(n);

  async ngOnInit(): Promise<void> {
    const ls = await this.api.listLessons();
    this.lessons.set(ls);
    this.titleService.setTitle('Уроки — Arduino UA');
  }
}
