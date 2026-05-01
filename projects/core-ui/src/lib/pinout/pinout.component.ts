import { ChangeDetectionStrategy, Component, input } from '@angular/core';

interface Pin {
  x: number;
  y: number;
  label: string;
  role: string;
}

@Component({
  selector: 'ui-pinout',
  standalone: true,
  imports: [],
  template: `
    <figure class="ui-pinout">
      <img [src]="src()" [alt]="alt()" />
      <ul class="ui-pinout__legend">
        @for (pin of pins(); track pin.label; let i = $index) {
          <li>
            <span class="pin-num">{{ i + 1 }}</span>
            <span class="pin-label">{{ pin.label }}</span>
            <span class="pin-role">{{ pin.role }}</span>
          </li>
        }
      </ul>
    </figure>
  `,
  styleUrl: './pinout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinoutComponent {
  src = input.required<string>();
  alt = input.required<string>();
  pins = input<Pin[]>([]);
}
