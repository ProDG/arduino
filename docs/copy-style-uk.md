# Ukrainian Copy & Typography — Style Guide

Authors and editors deliver typeset Ukrainian prose. Phase 2 ships **no
transformation function** — see `.planning/phases/02-primitives-two-column-layout-page-model-contract/02-CONTEXT.md`
D-PRE-01..05.

The site renders fixture JSON and (later) Wagtail content **verbatim**.
Anything you type ends up on the page exactly as written. Type carefully.

## Required typography forms

| Form | Glyph | Codepoint | When to use | Example |
|------|-------|-----------|-------------|---------|
| Outer quotes | `«…»` | U+00AB / U+00BB | Around quoted speech, names, terms | `«Arduino — це відкрита платформа»` |
| Nested quotes | `„…"` | U+201E / U+201C | Quote inside a quote | `«Він сказав: „привіт"»` |
| Em-dash | `—` | U+2014 | Sentence-level pause; before a definition | `Світлодіод — це напівпровідник.` |
| Em-dash spacing | NBSP before, regular space after | — | Always | `Світлодіод — це…` (NBSP between «од» and «—») |
| En-dash | `–` | U+2013 | Numeric ranges only | `5–7 секунд`, `220–330 Ом` |
| Apostrophe | `ʼ` | U+02BC | Inside Ukrainian words; never ASCII `'` between Cyrillic letters | `підʼєднати`, `пʼять`, `обʼєкт` |
| Non-breaking space | NBSP | U+00A0 | After one-letter prepositions: `а в до за з і й на не о по та у` | `на<NBSP>платі`, `у<NBSP>цьому уроці` |
| Hyphen | `-` | U+002D | Word-internal compound, never a dash | `відкрито-доступне` |

## What never to type

- Straight ASCII `"` between Cyrillic letters or in prose — use `«…»`.
- `--` between words — use the em-dash `—`.
- ASCII `'` between Cyrillic letters — use `ʼ` (U+02BC). Watch for muscle
  memory: most keyboards type `'` by default.
- Regular space after a one-letter preposition — use NBSP. The page will
  still render, but a single-letter «у» can wrap to the next line without
  its noun, which looks careless in book typography.

## Code, comments, identifiers

Source code (the `code` field in `Block`) ships **verbatim, no
transformation**. Comments inside code may be Ukrainian (`// блимаємо
світлодіодом`). Keep typography clean here too — but standard programming
quotes and apostrophes are required by the language.

## Enforcement

`scripts/lint-fixtures.mjs` walks `src/assets/mock-data/**/*.json` and
**warns** on the editorial smells listed above. It also enforces six
content gates per fixture (at least one `ґ`, one «…» pair, one em-dash,
one en-dash range, one inline `<code>`; lessons additionally need at
least one sidenote, one figure, one code block).

The lint runs on every `pnpm lint` — the same pre-commit + CI step the
codebase already trusts.

## Read-aloud gate

For mock-data fixtures (Phase 2) and Wagtail content (Phase 4 onward),
**every fixture passes a read-aloud check before commit** (per D-MOCK-01).
The author or editor reads the prose aloud and rewrites anything that
sounds machine-translated, flat, or non-native. The commit message body
records this attestation per fixture:

```
read-aloud: PASS — pershyi-blymayuchyi-svitlodiod
```

This is the human gate that the lint script cannot replace. Skipping it
risks calibrating the type scale against synthetic-feeling prose, which
silently degrades the editorial product.

## See also

- `.planning/phases/02-primitives-two-column-layout-page-model-contract/02-UI-SPEC.md` §"Copywriting Contract"
- `src/app/pages/glyph-audit/specimen-prose.const.ts` — calibration target voice
