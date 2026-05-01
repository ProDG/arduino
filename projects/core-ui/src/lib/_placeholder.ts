/**
 * Placeholder export so `ng build core-ui` succeeds while the library is empty.
 * Plan 02-03 deletes this file when real primitives land.
 *
 * Rationale: ng-packagr 21.2 fails with "failed to get symbol for entrypoint" if
 * `public-api.ts` exports nothing. The Plan 02-01 acceptance gate requires a
 * green smoke build, but the plan also forbids creating primitives in this plan.
 * A stable, deliberately-named placeholder reconciles both constraints.
 */
export const __CORE_UI_PLACEHOLDER__ = '@arduino/core-ui';
