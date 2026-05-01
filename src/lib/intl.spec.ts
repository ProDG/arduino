import { describe, expect, it } from 'vitest';
import { collatorUk, formatDateUk, formatNumberUk } from './intl';

describe('formatDateUk', () => {
  it('formats dates in Ukrainian long style with Europe/Kyiv tz', () => {
    const out = formatDateUk(new Date('2026-04-30T12:00:00Z'));
    expect(out).toMatch(/квітня/);
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/р\./);
  });
});

describe('formatNumberUk', () => {
  it('uses NBSP thousand separator and comma decimal', () => {
    // U+00A0 NBSP between groups; comma decimal — the Ukrainian convention.
    expect(formatNumberUk(1234567.89)).toBe('1 234 567,89');
  });
});

describe('collatorUk', () => {
  it('sorts Ukrainian words in alphabetical order', () => {
    const words = ['ялинка', 'абрикос', 'ґніт', 'їжак', 'буряк'];
    const sorted = [...words].sort(collatorUk().compare);
    expect(sorted).toEqual(['абрикос', 'буряк', 'ґніт', 'їжак', 'ялинка']);
  });
});
