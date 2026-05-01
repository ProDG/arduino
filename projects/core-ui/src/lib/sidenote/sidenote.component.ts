import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-sidenote',
  standalone: true,
  imports: [],
  template: `
    <aside class="sidenote" [id]="'sn-' + number()">
      <span class="sidenote__number">{{ number() }}.</span>
      <ng-content />
    </aside>
  `,
  styleUrl: './sidenote.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenoteComponent {
  number = input.required<number>();
}
