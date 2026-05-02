import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  AsideComponent,
  HeadingComponent,
  LedeComponent,
  PageShellComponent,
} from '@arduino/core-ui';
import { SiteFooterComponent } from '../../chrome/site-footer.component';
import { SiteHeaderComponent } from '../../chrome/site-header.component';

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

  ngOnInit(): void {
    this.titleService.setTitle('Попередній перегляд — Arduino UA');
    this.meta.addTag({ name: 'robots', content: 'noindex' });
  }
}
