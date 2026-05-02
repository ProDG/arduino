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
  LedeComponent,
  PageShellComponent,
  SidenoteComponent,
  TwoColumnComponent,
} from '@arduino/core-ui';
import { CONTENT_API } from '../../../content/api/content-api.token';
import type { Block } from '../../../content/models/block';
import type { Lesson } from '../../../content/models/lesson';
import { DIFFICULTY_LABELS_UK } from '../../../lib/difficulty';
import { formatDateUk, formatNumberUk } from '../../../lib/intl';
import { BlockRendererComponent } from '../../blocks/block-renderer/block-renderer.component';
import { SiteFooterComponent } from '../../chrome/site-footer.component';
import { SiteHeaderComponent } from '../../chrome/site-header.component';

@Component({
  selector: 'app-lesson-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageShellComponent,
    TwoColumnComponent,
    SidenoteComponent,
    LedeComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
    BlockRendererComponent,
  ],
  templateUrl: './lesson.page.html',
  styleUrl: './lesson.page.scss',
})
export class LessonPage implements OnInit {
  slug = input.required<string>();
  private readonly api = inject(CONTENT_API);
  private readonly titleService = inject(Title);

  lesson = signal<Lesson | null>(null);
  lessonIndex = signal<{ slug: string; title: string }[]>([]);

  bodyBlocks = computed(() => {
    const l = this.lesson();
    if (!l) return [];
    return l.body.filter((b) => b.type !== 'sidenote' && b.type !== 'parts-list');
  });

  sidenotes = computed(() => {
    const l = this.lesson();
    if (!l) return [];
    return (l.body.filter((b) => b.type === 'sidenote') as Extract<Block, { type: 'sidenote' }>[])
      .slice()
      .sort((a, b) => a.anchorParagraphIndex - b.anchorParagraphIndex);
  });

  headingToc = computed(() => {
    const l = this.lesson();
    if (!l) return [];
    return (l.body.filter((b) => b.type === 'heading') as Extract<Block, { type: 'heading' }>[])
      .filter((h) => h.level === 2)
      .map((h) => ({ id: h.id ?? '', text: h.text }));
  });

  partsList = computed(
    () => (this.lesson()?.partsList as Extract<Block, { type: 'parts-list' }> | undefined) ?? null,
  );

  metaLine = computed(() => {
    const l = this.lesson();
    if (!l) return '';
    const diff = DIFFICULTY_LABELS_UK[l.difficulty];
    const time = formatNumberUk(l.estimatedMinutes);
    const date = formatDateUk(new Date(l.publishedAt));
    return `${diff}\u00a0\u00b7\u00a0\u2248\u00a0${time}\u00a0хв\u00a0\u00b7\u00a0${date}`;
  });

  prevLessonTitle = computed(() => {
    const l = this.lesson();
    if (!l?.prevSlug) return '';
    return this.lessonIndex().find((x) => x.slug === l.prevSlug)?.title ?? '';
  });

  nextLessonTitle = computed(() => {
    const l = this.lesson();
    if (!l?.nextSlug) return '';
    return this.lessonIndex().find((x) => x.slug === l.nextSlug)?.title ?? '';
  });

  firstFigureIndex = computed(() => {
    const blocks = this.bodyBlocks();
    const idx = blocks.findIndex((b) => b.type === 'figure');
    return idx;
  });

  async ngOnInit(): Promise<void> {
    const [lesson, index] = await Promise.all([
      this.api.getLesson(this.slug()),
      this.api.listLessons(),
    ]);
    this.lesson.set(lesson);
    this.lessonIndex.set(index.map((l) => ({ slug: l.slug, title: l.title })));
    this.titleService.setTitle(`${lesson.title} — Arduino UA`);
  }
}
