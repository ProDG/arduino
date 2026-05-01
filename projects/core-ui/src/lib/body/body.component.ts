import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-body',
  standalone: true,
  imports: [],
  template: `<p><ng-content /></p>`,
  styleUrl: './body.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BodyComponent {}
