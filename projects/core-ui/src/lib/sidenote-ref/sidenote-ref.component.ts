import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-sidenote-ref',
  standalone: true,
  imports: [],
  template: `<sup class="sidenote-ref"
    ><a [href]="'#sn-' + number()">{{ number() }}</a></sup
  >`,
  styleUrl: './sidenote-ref.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenoteRefComponent {
  number = input.required<number>();
}
