// @ts-check
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import boundariesPlugin from 'eslint-plugin-boundaries';
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
  // PRIM-01 / D-LIB-01 — public-API boundary for @arduino/core-ui.
  // Element types describe architectural roles; `boundaries/element-types`
  // enforces who may import whom. Reach-through imports such as
  // `@arduino/core-ui/lib/...` are blocked structurally, not by patterns.
  {
    files: ['**/*.ts'],
    plugins: { boundaries: boundariesPlugin },
    settings: {
      'boundaries/elements': [
        { type: 'core-ui-public', pattern: 'projects/core-ui/src/public-api.ts' },
        { type: 'core-ui-internal', pattern: 'projects/core-ui/src/lib/**' },
        { type: 'app', pattern: 'src/app/**' },
        { type: 'content-models', pattern: 'src/content/**' },
        { type: 'app-lib', pattern: 'src/lib/**' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'app', allow: ['core-ui-public', 'content-models', 'app-lib'] },
            { from: 'core-ui-internal', allow: ['core-ui-internal'] },
            { from: 'core-ui-public', allow: ['core-ui-internal'] },
            { from: 'content-models', allow: [] },
            { from: 'app-lib', allow: [] },
          ],
        },
      ],
    },
  },
  // Component selector prefix override: `ui-` inside the core-ui library only.
  {
    files: ['projects/core-ui/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'ui', style: 'kebab-case' },
      ],
    },
  },
  {
    // Default lint ignores. The synthetic violation fixtures are excluded
    // here so day-to-day `pnpm lint` stays clean; `pnpm lint:verify-rule`
    // targets them explicitly with --no-ignore to assert the rules fire.
    ignores: [
      'dist/',
      'node_modules/',
      '.angular/',
      'coverage/',
      'public/',
      'src/__synthetic__/**',
      'projects/core-ui/src/lib/__violation__.ts.example',
    ],
  },
);
