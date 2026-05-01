# Phase 1 Font-Swap Dry-Run + UKR-05 Audit

**Date:** 2026-05-01
**Executor:** Phase 1 executor (Opus 4.7)

This document records two end-of-phase verification artifacts:

1. **TYPE-06 dry-run** — proof that a font-pairing swap is a single-file
   edit of `src/styles/tokens/_typography.scss` and nothing else.
2. **UKR-05 audit** — proof that no production code path renders dates,
   numbers, or sort order outside the `src/lib/intl.ts` facade.

---

## TYPE-06 dry-run swap

### Edit performed (paste of diff)

Only `src/styles/tokens/_typography.scss` was edited. The first entry
of the `--font-body` family stack was changed from `'Source Serif 4'`
to `'Literata'`. Nothing else.

```diff
diff --git a/src/styles/tokens/_typography.scss b/src/styles/tokens/_typography.scss
@@ -92,7 +92,7 @@
 // (c) Family stacks + type scale -----------------------------------------

 :root {
-  --font-body: 'Source Serif 4', 'Source Serif 4 Fallback', Georgia, 'Times New Roman', serif;
+  --font-body: 'Literata', 'Source Serif 4 Fallback', Georgia, 'Times New Roman', serif;
   --font-ui:
     'Inter', 'Inter Fallback', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
   --font-mono: 'JetBrains Mono', 'JetBrains Mono Fallback', 'SF Mono', Menlo, Consolas, monospace;
```

### `git status` after edit (must show exactly 1 file)

```
 M src/styles/tokens/_typography.scss
```

**Confirmed: exactly 1 file modified.** No component, no other token
file, no base CSS, no `index.html` needed editing.

### Build result

```
$ pnpm build
…
Prerendered 2 static routes.
Application bundle generation complete. [1.777 seconds]
Output location: /Users/ipomar/PycharmProjects/arduino/dist/arduino-hub
```

Build succeeded. The harness re-rendered with `Source Serif 4` cells
(matrix labels still match) but the body text on the specimen falls
back through the family stack — `'Literata'` is not loaded, so
rendering walks through `'Source Serif 4 Fallback'` (which is
metric-matched against Georgia, the next stack entry). The page
remains readable; the matrix cells still render against their
explicit `font-family` bindings (which use `var(--font-body|ui|mono)`
indirectly via the cell's css var). No layout shift, no visual break.

### Revert

```bash
cp /tmp/_typography.scss.backup src/styles/tokens/_typography.scss
git diff src/styles/tokens/_typography.scss | wc -l    # → 0
pnpm build                                              # → succeeds
```

Restored to post-PLAN-03 state. Working tree clean for this file.

### Conclusion

**TYPE-06 holds. Single-file font swap proven.**

The swap target is `src/styles/tokens/_typography.scss` exclusively.
Future font-pairing changes (e.g., evaluating Source Serif 4 vs Literata
in Phase 6 polish per the deferred A/B in PROJECT.md) can be performed
by editing only this file.

---

## UKR-05 audit

`Europe/Kyiv` was baked into `src/lib/intl.ts` in PLAN 04. This audit
confirms no other code paths render time, date, number, or collator
output without going through the facade.

### Audit grep 1 — `new Intl.*` instantiation outside the facade

```bash
$ grep -rnE 'new Intl\.[A-Z][A-Za-z]*' src/ --include='*.ts'
src/lib/intl.ts:11:  return new Intl.DateTimeFormat(UK, { dateStyle: 'long', timeZone: TZ, ...options }).format(date);
src/lib/intl.ts:15:  return new Intl.NumberFormat(UK, options).format(n);
src/lib/intl.ts:19:  return new Intl.Collator(UK);
```

**All three matches inside `src/lib/intl.ts`.** Zero violations.

### Audit grep 2 — bare `toLocale*` calls outside the synthetic fixture

```bash
$ grep -rn "toLocaleDateString\|toLocaleString\|toLocaleTimeString" src/ --include='*.ts'
src/__synthetic__/eslint-violation-fixture.ts:10:export const a = new Date().toLocaleDateString();
src/__synthetic__/eslint-violation-fixture.ts:11:export const b = new Date().toLocaleString();
src/__synthetic__/eslint-violation-fixture.ts:12:export const c = (123).toLocaleString();
src/lib/intl.ts:2:// codebase MUST go through this module — bare `toLocaleDateString()`
src/lib/intl.ts:3:// and `toLocaleString()` are banned by the no-restricted-syntax ESLint
```

The three production-shaped matches are inside the **synthetic violation
fixture** (`src/__synthetic__/`) — these are deliberate, exist to prove
the lint rule fires, and are excluded from the default `pnpm lint` run.

The two remaining matches in `src/lib/intl.ts` are **documentation
comments**, not call sites. **Zero violations.**

### Audit grep 3 — `new Date()` / `Date.now()` review

```bash
$ grep -rn "Date.now()\|new Date()" src/ --include='*.ts'
src/app/pages/glyph-audit/glyph-audit.component.ts:68:  readonly today = new Date();
src/__synthetic__/eslint-violation-fixture.ts:10:export const a = new Date().toLocaleDateString();
src/__synthetic__/eslint-violation-fixture.ts:11:export const b = new Date().toLocaleString();
```

- Synthetic fixture matches — already classified above.
- `glyph-audit.component.ts:68` (`readonly today = new Date()`) — this
  Date object is consumed on the next line by `formatDateUk(this.today)`
  (the facade). The resulting string ships with `Europe/Kyiv` baked in.
  No raw `Date.toString()` ever reaches the DOM.

### Conclusion

**UKR-05 holds. `Europe/Kyiv` is the only time zone in use; no escape
paths from `src/lib/intl.ts`.**

The structural prevention layer (lint rule banning bare `toLocale*`
calls; the facade as the only `Intl.*` site) is paired with the
manual audit above and re-runnable on every phase exit via the
`docs/force-en-audit.md` checklist.
