// @ts-check
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

const NO_BARE_LOCALE_FORMATTERS = [
  {
    selector: "CallExpression[callee.property.name='toLocaleDateString']",
    message:
      'Use formatDateUk from src/lib/intl.ts — bare toLocaleDateString leaks the browser locale.',
  },
  {
    selector: "CallExpression[callee.property.name='toLocaleString']",
    message:
      'Use formatNumberUk or formatDateUk from src/lib/intl.ts — bare toLocaleString leaks the browser locale.',
  },
  {
    selector: "CallExpression[callee.property.name='toLocaleTimeString']",
    message:
      'Use formatDateUk from src/lib/intl.ts — bare toLocaleTimeString leaks the browser locale.',
  },
];

export default tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  // UKR-06 / D-28 — ban bare locale formatters across project source.
  // src/lib/intl.ts is exempt (it is the legitimate Intl.* wrapper).
  {
    files: ['src/**/*.ts'],
    ignores: ['src/lib/intl.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...NO_BARE_LOCALE_FORMATTERS],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
  {
    // Default lint ignores. The synthetic violation fixture is excluded
    // here so day-to-day `pnpm lint` stays clean; `pnpm lint:verify-rule`
    // targets it explicitly with --no-ignore to assert the rule fires.
    ignores: [
      'dist/',
      'node_modules/',
      '.angular/',
      'coverage/',
      'public/',
      'src/__synthetic__/**',
    ],
  },
);
