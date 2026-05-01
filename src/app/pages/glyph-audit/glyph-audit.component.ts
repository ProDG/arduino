import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-glyph-audit',
  standalone: true,
  templateUrl: './glyph-audit.component.html',
  styleUrl: './glyph-audit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlyphAuditComponent implements OnInit {
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.meta.addTag({ name: 'robots', content: 'noindex' });
  }
}
