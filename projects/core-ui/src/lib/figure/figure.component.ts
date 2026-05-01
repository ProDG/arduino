import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-figure',
  standalone: true,
  imports: [],
  template: `
    <figure [class.figure--full-bleed]="fullBleed()">
      <ng-content />
    </figure>
  `,
  styleUrl: './figure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FigureComponent {
  number = input<number | undefined>(undefined);
  fullBleed = input<boolean>(false);
}
