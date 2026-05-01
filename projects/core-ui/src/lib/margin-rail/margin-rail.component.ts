import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-margin-rail',
  standalone: true,
  imports: [],
  template: `<div class="margin-rail__stack"><ng-content /></div>`,
  styleUrl: './margin-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarginRailComponent {}
