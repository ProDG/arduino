import { describe, expect, it } from 'vitest';
import { computeSidenoteStack, type SidenoteInput } from './measure';

describe('computeSidenoteStack', () => {
  it('returns an empty array for empty input', () => {
    expect(computeSidenoteStack([], 24)).toEqual([]);
  });

  it('returns the anchor top for a single sidenote', () => {
    expect(computeSidenoteStack([{ anchorTop: 100, height: 80 }], 24)).toEqual([{ top: 100 }]);
  });

  it('keeps two non-overlapping sidenotes at their preferred tops', () => {
    const out = computeSidenoteStack(
      [
        { anchorTop: 100, height: 50 },
        { anchorTop: 300, height: 50 },
      ],
      24,
    );
    expect(out).toEqual([{ top: 100 }, { top: 300 }]);
  });

  it('slides the second sidenote down when it would overlap the first', () => {
    const out = computeSidenoteStack(
      [
        { anchorTop: 100, height: 80 },
        { anchorTop: 150, height: 60 },
      ],
      24,
    );
    expect(out).toEqual([{ top: 100 }, { top: 204 }]);
  });

  it('cascades collisions: a third sidenote stacks beneath a slid second', () => {
    const out = computeSidenoteStack(
      [
        { anchorTop: 100, height: 80 },
        { anchorTop: 150, height: 60 },
        { anchorTop: 200, height: 40 },
      ],
      24,
    );
    expect(out).toEqual([{ top: 100 }, { top: 204 }, { top: 288 }]);
  });

  it('does not mutate the input array', () => {
    const input: SidenoteInput[] = [
      { anchorTop: 100, height: 80 },
      { anchorTop: 150, height: 60 },
    ];
    const snapshot = JSON.parse(JSON.stringify(input));
    computeSidenoteStack(input, 24);
    expect(input).toEqual(snapshot);
  });
});
