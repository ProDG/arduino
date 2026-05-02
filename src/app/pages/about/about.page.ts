import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { HeadingComponent, LedeComponent, PageShellComponent } from '@arduino/core-ui';
import { SiteFooterComponent } from '../../chrome/site-footer.component';
import { SiteHeaderComponent } from '../../chrome/site-header.component';
import { ABOUT_PROSE } from './about-prose.const';

@Component({
  selector: 'app-about-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageShellComponent,
    HeadingComponent,
    LedeComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
  ],
  templateUrl: './about.page.html',
  styleUrl: './about.page.scss',
})
export class AboutPage implements OnInit {
  readonly prose = ABOUT_PROSE;
  private readonly titleService = inject(Title);

  ngOnInit(): void {
    this.titleService.setTitle('Про проєкт — Arduino UA');
  }
}
