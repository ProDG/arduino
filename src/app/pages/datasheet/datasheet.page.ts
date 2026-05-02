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
  PageShellComponent,
  PinoutComponent,
  SidenoteComponent,
  TwoColumnComponent,
} from '@arduino/core-ui';
import { CONTENT_API } from '../../../content/api/content-api.token';
import type { Block } from '../../../content/models/block';
import type { Datasheet } from '../../../content/models/datasheet';
import { BlockRendererComponent } from '../../blocks/block-renderer/block-renderer.component';
import { SiteFooterComponent } from '../../chrome/site-footer.component';
import { SiteHeaderComponent } from '../../chrome/site-header.component';

@Component({
  selector: 'app-datasheet-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageShellComponent,
    TwoColumnComponent,
    SidenoteComponent,
    HeadingComponent,
    PinoutComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
    BlockRendererComponent,
  ],
  templateUrl: './datasheet.page.html',
  styleUrl: './datasheet.page.scss',
})
export class DatasheetPage implements OnInit {
  slug = input.required<string>();
  private readonly api = inject(CONTENT_API);
  private readonly titleService = inject(Title);

  datasheet = signal<Datasheet | null>(null);
  loadError = signal<boolean>(false);

  peripheralBlocks = computed(() => {
    const d = this.datasheet();
    if (!d) return [];
    return (d.peripheralNotes ?? []).filter(
      (b) => b.type !== 'sidenote' && b.type !== 'parts-list',
    );
  });

  peripheralSidenotes = computed(() => {
    const d = this.datasheet();
    if (!d) return [];
    return (
      d.peripheralNotes.filter((b) => b.type === 'sidenote') as Extract<
        Block,
        { type: 'sidenote' }
      >[]
    )
      .slice()
      .sort((a, b) => a.anchorParagraphIndex - b.anchorParagraphIndex);
  });

  async ngOnInit(): Promise<void> {
    try {
      const d = await this.api.getDatasheet(this.slug());
      this.datasheet.set(d);
      this.titleService.setTitle(`${d.title} — Arduino UA`);
    } catch {
      this.loadError.set(true);
      this.titleService.setTitle('Сторінку не знайдено — Arduino UA');
    }
  }
}
