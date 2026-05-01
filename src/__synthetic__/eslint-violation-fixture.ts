// SYNTHETIC fixture for verifying the no-bare-locale-formatters lint rule
// (UKR-06, D-28). This file deliberately violates the rule. It is excluded
// from the default `pnpm lint` run and only re-included when invoked via
// `pnpm lint:verify-rule`, which inverts the exit-code interpretation: a
// non-zero exit (rule fires) is the PASS case.
//
// DO NOT add `eslint-disable` directives here — they would mask the rule
// and silently break the verification.

export const a = new Date().toLocaleDateString();
export const b = new Date().toLocaleString();
export const c = (123).toLocaleString();
