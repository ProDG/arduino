import { NgOptimizedImage } from '@angular/common';
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
import {
  HeadingComponent,
  PageShellComponent,
  SidenoteComponent,
  TwoColumnComponent,
} from '@arduino/core-ui';
import { CONTENT_API } from '../../../content/api/content-api.token';
import type { Block } from '../../../content/models/block';
import type { Schematic } from '../../../content/models/schematic';
import { BlockRendererComponent } from '../../blocks/block-renderer/block-renderer.component';
import { SiteFooterComponent } from '../../chrome/site-footer.component';
import { SiteHeaderComponent } from '../../chrome/site-header.component';

@Component({
  selector: 'app-schematic-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgOptimizedImage,
    PageShellComponent,
    TwoColumnComponent,
    SidenoteComponent,
    HeadingComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
    BlockRendererComponent,
  ],
  templateUrl: './schematic.page.html',
  styleUrl: './schematic.page.scss',
})
export class SchematicPage implements OnInit {
  slug = input.required<string>();
  private readonly api = inject(CONTENT_API);
  private readonly titleService = inject(Title);

  schematic = signal<Schematic | null>(null);

  explanationBlocks = computed(() => {
    const s = this.schematic();
    if (!s) return [];
    return s.explanation.filter((b) => b.type !== 'sidenote' && b.type !== 'parts-list');
  });

  explanationSidenotes = computed(() => {
    const s = this.schematic();
    if (!s) return [];
    return (
      s.explanation.filter((b) => b.type === 'sidenote') as Extract<Block, { type: 'sidenote' }>[]
    )
      .slice()
      .sort((a, b) => a.anchorParagraphIndex - b.anchorParagraphIndex);
  });

  async ngOnInit(): Promise<void> {
    const s = await this.api.getSchematic(this.slug());
    this.schematic.set(s);
    this.titleService.setTitle(`${s.title} — Arduino UA`);
  }
}
