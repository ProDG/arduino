import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-figure-caption',
  standalone: true,
  imports: [],
  template: `
    <figcaption>
      @if (number() !== undefined) {
        <span class="figure-num">Рис. {{ number() }}</span> —
      }
      <ng-content />
    </figcaption>
  `,
  styleUrl: './figure-caption.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FigureCaptionComponent {
  number = input<number | undefined>(undefined);
}
