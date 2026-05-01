// Project-wide locale formatting facade. Every Intl.* call in the
// codebase MUST go through this module — bare `toLocaleDateString()`
// and `toLocaleString()` are banned by the no-restricted-syntax ESLint
// rule (UKR-06, D-28). Locale and time zone are baked in here so that
// callers can never accidentally leak the browser's locale.

const UK = 'uk-UA';
const TZ = 'Europe/Kyiv';

export function formatDateUk(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(UK, { dateStyle: 'long', timeZone: TZ, ...options }).format(date);
}

export function formatNumberUk(n: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(UK, options).format(n);
}

export function collatorUk(): Intl.Collator {
  return new Intl.Collator(UK);
}
