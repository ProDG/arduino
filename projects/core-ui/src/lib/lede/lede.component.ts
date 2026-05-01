import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-lede',
  standalone: true,
  imports: [],
  template: `<p class="lede"><ng-content /></p>`,
  styleUrl: './lede.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedeComponent {}
