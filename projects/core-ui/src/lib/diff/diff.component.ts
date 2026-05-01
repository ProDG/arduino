import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-diff',
  standalone: true,
  imports: [],
  template: `
    <figure class="ui-diff">
      <p class="ui-diff__before" [innerHTML]="before()"></p>
      <hr class="ui-diff__rule" />
      <p class="ui-diff__after" [innerHTML]="after()"></p>
    </figure>
  `,
  styleUrl: './diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiffComponent {
  before = input.required<string>();
  after = input.required<string>();
}
