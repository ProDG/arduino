---
phase: 01-foundation-typography-gate
plan: 04
status: complete
completed: 2026-05-01
---

# Plan 01-04 — Locale + intl facade — SUMMARY

## Locale wiring

| Where | Change |
| ----- | ------ |
| `src/main.ts` | `import { registerLocaleData } from '@angular/common';` + `import localeUk from '@angular/common/locales/uk';` + `registerLocaleData(localeUk);` at module top, before `bootstrapApplication`. |
| `src/app/app.config.ts` | `{ provide: LOCALE_ID, useValue: 'uk-UA' }` added to providers. PLAN 01 placeholder TODO removed. |

## Intl facade — public API

`src/lib/intl.ts` exports three functions, locale + time zone baked in:

```ts
formatDateUk(date: Date, options?: Intl.DateTimeFormatOptions): string
formatNumberUk(n: number, options?: Intl.NumberFormatOptions): string
collatorUk(): Intl.Collator
```

Hard-coded constants:

- `UK = 'uk-UA'`
- `TZ = 'Europe/Kyiv'` (defaulted into `formatDateUk`'s options; callers can
  override via the `options` parameter for legitimate non-Kyiv use cases)

`formatDateUk` defaults `dateStyle: 'long'` so consumers get
`30 квітня 2026 р.` style dates without supplying options.

### Vitest coverage

`src/lib/intl.spec.ts` — three tests, all passing:

| Test | Asserts |
| ---- | ------- |
| `formatDateUk` | output contains `квітня`, `2026`, `р.` |
| `formatNumberUk` | `1234567.89 → "1 234 567,89"` (NBSP separator + comma decimal) |
| `collatorUk` | `['ялинка','абрикос','ґніт','їжак','буряк']` sorts to `['абрикос','буряк','ґніт','їжак','ялинка']` |

## ESLint rule approach

**Chosen:** `no-restricted-syntax` in flat config (recommendation in plan).
No custom plugin needed; zero-cost; AST selectors are stable across
typescript-eslint versions.

The rule lives in `eslint.config.js` as a separate config block scoped to
`src/**/*.ts` with `src/lib/intl.ts` ignored (the facade is the legitimate
`Intl.*` wrapper). Three selectors:

```
CallExpression[callee.property.name='toLocaleDateString'] → blocked
CallExpression[callee.property.name='toLocaleString']     → blocked
CallExpression[callee.property.name='toLocaleTimeString'] → blocked
```

## Synthetic fixture — UKR-06 verification

Path: `src/__synthetic__/eslint-violation-fixture.ts` (committed, no
`eslint-disable`). Contains three violations:

```ts
new Date().toLocaleDateString();
new Date().toLocaleString();
(123).toLocaleString();
```

Excluded from default lint via the `ignores` list in `eslint.config.js` so
day-to-day `pnpm lint` stays clean. Re-included by an explicit
`--no-ignore` in `pnpm lint:verify-rule` (in `package.json`). Exit-code
inverted via an explicit `if` in bash: ESLint exiting non-zero (rule
fires) is the **PASS** case; ESLint exiting zero (rule did NOT fire)
is the **FAIL** case.

`pnpm lint:verify-rule` output:

```
3 problems (3 errors, 0 warnings)
PASS: rule fired on synthetic violation
```

## Smoke-test (direction 2 — rule still fires on production code)

Manually appended `const _LEAKY = new Date().toLocaleDateString();` to
`src/app/pages/home/home.component.ts`, ran `pnpm lint` → ESLint reported
the `no-restricted-syntax` violation, exit code 1. Reverted; clean again.
This is the runtime confirmation that the guardrail covers
production-source-tree files, not just the synthetic fixture.

## Notes / deviations

- **No custom `eslint-rules/no-bare-locale-formatters.js`** — the plan
  listed this in `files_modified` as a fallback if `no-restricted-syntax`
  proved brittle. The selector approach was clean, so no custom rule
  was needed. Future tightening (e.g., allowing `toLocaleDateString('uk-UA', …)`
  but blocking bare/wrong-locale calls — currently we block ALL calls
  outside intl.ts) can either extend the selectors or graduate to a
  custom rule then.
- **`.gitignore` not modified.** The synthetic fixture is committed (it
  is a permanent verification artefact); the plan's `files_modified`
  listed `.gitignore` but did not specify a change.
- **`vitest run --passWithNoTests`** kept; we now have spec files but
  the flag is harmless once tests exist.

## Open hand-offs

| To plan | Hand-off |
| --- | --- |
| **PLAN 05** | Section 3 (locale demo) imports `formatDateUk`, `formatNumberUk`, `collatorUk` from `src/lib/intl`. Audit instruction in the harness footer: "Load this page with browser locale set to `en-US`. The Ukrainian-formatted date above MUST stay in Ukrainian." |
| **PLAN 06** | Add `pnpm lint:verify-rule` to the GitHub Actions CI workflow (separate step from `pnpm lint`). The synthetic fixture is the UKR-06 evidence — it must run on every push. The force-en audit doc (`docs/force-en-audit.md`) writes up the runtime checklist. |

## Requirements progressed

- **UKR-01** — `<html lang="uk">` (PLAN 01) + `LOCALE_ID = 'uk-UA'`
  registered + `registerLocaleData(localeUk)` invoked.
- **UKR-04** — all locale formatting flows through `src/lib/intl.ts`
  with `uk-UA` + `Europe/Kyiv` baked in.
- **UKR-06** — synthetic violation fixture proves the locale-leak
  guardrail fires (the runtime side; the doc itself lands in PLAN 06).
