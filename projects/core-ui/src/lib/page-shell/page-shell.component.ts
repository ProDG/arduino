import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-page-shell',
  standalone: true,
  imports: [],
  template: `
    <header></header>
    <main class="page-shell__main"><ng-content /></main>
    <footer></footer>
  `,
  styleUrl: './page-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageShellComponent {}
