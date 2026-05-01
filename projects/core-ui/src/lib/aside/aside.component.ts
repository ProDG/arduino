import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-aside',
  standalone: true,
  imports: [],
  template: `<aside [attr.data-variant]="variant()"><ng-content /></aside>`,
  styleUrl: './aside.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideComponent {
  variant = input<'note' | 'warning' | 'fact'>('note');
}
