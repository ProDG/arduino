/*
 * Public API surface of @arduino/core-ui.
 * Primitives are appended here in Plans 02-03..02-05.
 */

// Plan 02-01 deviation: ng-packagr requires at least one export to succeed.
// Plan 02-03 removes both this re-export and `_placeholder.ts` when real
// primitives land. See `src/lib/_placeholder.ts` for rationale.
export { __CORE_UI_PLACEHOLDER__ } from './lib/_placeholder';
