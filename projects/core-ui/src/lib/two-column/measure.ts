// Stack-down collision geometry for the desktop two-column layout per
// 02-UI-SPEC §"Sidenote anchoring mechanism". Each sidenote prefers its
// anchor's top; if a later sidenote would overlap an earlier one (within
// `stackGap`), it slides down. The visual link to its anchor is broken by
// design — overlap is the larger error. Inputs MUST be ordered by
// `anchorTop` ascending; output preserves input order.

export interface SidenoteInput {
  anchorTop: number;
  height: number;
}

export interface SidenotePlacement {
  top: number;
}

export function computeSidenoteStack(
  inputs: readonly SidenoteInput[],
  stackGap: number,
): SidenotePlacement[] {
  const placements: SidenotePlacement[] = [];
  let lastBottom = -Infinity;
  for (const input of inputs) {
    const top = Math.max(input.anchorTop, lastBottom + stackGap);
    placements.push({ top });
    lastBottom = top + input.height;
  }
  return placements;
}
