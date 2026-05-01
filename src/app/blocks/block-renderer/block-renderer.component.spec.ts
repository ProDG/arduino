// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DIFFICULTY_LABELS_UK } from '../../../lib/difficulty';

const __dirname = dirname(fileURLToPath(import.meta.url));

const componentSrc = readFileSync(resolve(__dirname, './block-renderer.component.ts'), 'utf-8');

describe('BlockRendererComponent dispatch contract', () => {
  it('Test 1: has input.required<Block>() declared', () => {
    expect(componentSrc).toMatch(/input\.required<Block>\(\)/);
  });

  it('Test 2: has isFirstFigure optional input', () => {
    expect(componentSrc).toMatch(/isFirstFigure\s*=\s*input\(/);
  });

  it('Test 3: selector is app-block-renderer', () => {
    expect(componentSrc).toContain("selector: 'app-block-renderer'");
  });

  it('Test 4: @switch dispatches on block().type', () => {
    expect(componentSrc).toMatch(/@switch\s*\(block\(\)\.type\)/);
  });

  it('Test 5a: has heading @case arm', () => {
    expect(componentSrc).toContain("'heading'");
  });

  it('Test 5b: has paragraph @case arm', () => {
    expect(componentSrc).toContain("'paragraph'");
  });

  it('Test 5c: has lede @case arm', () => {
    expect(componentSrc).toContain("'lede'");
  });

  it('Test 5d: has aside @case arm', () => {
    expect(componentSrc).toContain("'aside'");
  });

  it('Test 5e: has figure @case arm', () => {
    expect(componentSrc).toContain("'figure'");
  });

  it('Test 5f: has code @case arm', () => {
    expect(componentSrc).toContain("'code'");
  });

  it('Test 5g: has diff @case arm', () => {
    expect(componentSrc).toContain("'diff'");
  });

  it('Test 5h: has pinout @case arm', () => {
    expect(componentSrc).toContain("'pinout'");
  });

  it('Test 5i: has sidenote @case arm (intentionally empty)', () => {
    expect(componentSrc).toContain("'sidenote'");
  });

  it('Test 5j: has parts-list @case arm (intentionally empty)', () => {
    expect(componentSrc).toContain("'parts-list'");
  });

  it('Test 6: figure case uses ngSrc binding', () => {
    expect(componentSrc).toContain('ngSrc');
  });

  it('Test 7: code case renders ui-code-block', () => {
    expect(componentSrc).toContain('ui-code-block');
  });

  it('Test 8: code case forwards tokens binding', () => {
    expect(componentSrc).toContain('[tokens]');
  });

  it('Test 9: sidenote arm contains no primitive element', () => {
    const sidenoteArm = componentSrc.split("'sidenote'")[1]?.split("'parts-list'")[0] ?? '';
    expect(sidenoteArm).not.toMatch(/<ui-/);
  });

  it('Test 9b: parts-list arm contains no primitive element', () => {
    const partsArm = componentSrc.split("'parts-list'")[1] ?? '';
    expect(partsArm.split('@case')[0]).not.toMatch(/<ui-/);
  });

  it('Test 10: DIFFICULTY_LABELS_UK contains correct Ukrainian labels', () => {
    expect(DIFFICULTY_LABELS_UK['beginner']).toBe('початківець');
    expect(DIFFICULTY_LABELS_UK['intermediate']).toBe('проміжний');
  });

  it('imports from @arduino/core-ui barrel only (no direct lib path)', () => {
    expect(componentSrc).toContain("from '@arduino/core-ui'");
    expect(componentSrc).not.toMatch(/from 'projects\/core-ui\/src\/lib\//);
  });
});
