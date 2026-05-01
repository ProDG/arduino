import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { collatorUk, formatDateUk, formatNumberUk } from '../../../lib/intl';
import {
  SPECIMEN_AFTER_H2,
  SPECIMEN_AFTER_H3,
  SPECIMEN_ASIDE,
  SPECIMEN_BODY_PARAS,
  SPECIMEN_CODE,
  SPECIMEN_FIGURE_CAPTION,
  SPECIMEN_H1,
  SPECIMEN_H2,
  SPECIMEN_H3,
  SPECIMEN_LEDE,
} from './specimen-prose.const';
import { CRITICAL_GLYPHS, VERIFICATION_STRING } from './verification-string.const';

interface FontFamilyEntry {
  name: string;
  cssVar: string;
}

interface StyleEntry {
  label: string;
  style: 'normal' | 'italic';
  weight: number;
}

@Component({
  selector: 'app-glyph-audit',
  standalone: true,
  templateUrl: './glyph-audit.component.html',
  styleUrl: './glyph-audit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlyphAuditComponent implements OnInit {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  readonly families: FontFamilyEntry[] = [
    { name: 'Source Serif 4', cssVar: 'var(--font-body)' },
    { name: 'Inter', cssVar: 'var(--font-ui)' },
    { name: 'JetBrains Mono', cssVar: 'var(--font-mono)' },
  ];

  readonly styles: StyleEntry[] = [
    { label: 'regular', style: 'normal', weight: 400 },
    { label: 'italic', style: 'italic', weight: 400 },
    { label: 'bold', style: 'normal', weight: 600 },
    { label: 'bold-italic', style: 'italic', weight: 600 },
  ];

  readonly verificationString = VERIFICATION_STRING;
  readonly criticalGlyphs = CRITICAL_GLYPHS;

  readonly specimenH1 = SPECIMEN_H1;
  readonly specimenLede = SPECIMEN_LEDE;
  readonly specimenBodyParas = SPECIMEN_BODY_PARAS;
  readonly specimenH2 = SPECIMEN_H2;
  readonly specimenAfterH2 = SPECIMEN_AFTER_H2;
  readonly specimenCode = SPECIMEN_CODE;
  readonly specimenFigureCaption = SPECIMEN_FIGURE_CAPTION;
  readonly specimenH3 = SPECIMEN_H3;
  readonly specimenAfterH3 = SPECIMEN_AFTER_H3;
  readonly specimenAside = SPECIMEN_ASIDE;

  // Live "today" — qualitative check (Ukrainian month + р.).
  readonly today = new Date();
  readonly formattedDate = formatDateUk(this.today);
  // Deterministic year-round verification anchor — must always render
  // exactly `30 квітня 2026 р.` regardless of when the test runs.
  readonly fixedDate = new Date('2026-04-30T12:00:00Z');
  readonly formattedFixedDate = formatDateUk(this.fixedDate);
  readonly formattedNumber = formatNumberUk(1234567.89);
  readonly sortedWords = ['ялинка', 'абрикос', 'ґніт', 'їжак', 'буряк'].sort(collatorUk().compare);

  ngOnInit(): void {
    this.title.setTitle('Гліф-аудит — Arduino UA');
    this.meta.addTag({ name: 'robots', content: 'noindex' });
  }
}
