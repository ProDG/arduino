import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-heading',
  standalone: true,
  imports: [],
  template: `
    @switch (level()) {
      @case (1) {
        <h1 [id]="id()"><ng-content /></h1>
      }
      @case (2) {
        <h2 [id]="id()"><ng-content /></h2>
      }
      @case (3) {
        <h3 [id]="id()"><ng-content /></h3>
      }
    }
  `,
  styleUrl: './heading.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadingComponent {
  level = input.required<1 | 2 | 3>();
  id = input<string | undefined>(undefined);
}
