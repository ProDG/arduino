import { describe, expectTypeOf, it } from 'vitest';
import type { Block, BlockType } from './block';

describe('Block discriminated union', () => {
  it('exposes exactly 10 variants in BlockType', () => {
    expectTypeOf<BlockType>().toEqualTypeOf<
      | 'heading'
      | 'paragraph'
      | 'lede'
      | 'aside'
      | 'sidenote'
      | 'figure'
      | 'code'
      | 'diff'
      | 'pinout'
      | 'parts-list'
    >();
  });

  it('narrows `heading` to its field set', () => {
    const b = {} as Block;
    if (b.type === 'heading') {
      expectTypeOf(b).toEqualTypeOf<{
        type: 'heading';
        level: 2 | 3;
        text: string;
        id?: string;
      }>();
    }
  });

  it('narrows `paragraph` to its field set', () => {
    const b = {} as Block;
    if (b.type === 'paragraph') {
      expectTypeOf(b).toEqualTypeOf<{ type: 'paragraph'; html: string }>();
    }
  });

  it('narrows `lede` to its field set', () => {
    const b = {} as Block;
    if (b.type === 'lede') {
      expectTypeOf(b).toEqualTypeOf<{ type: 'lede'; html: string }>();
    }
  });

  it('narrows `aside` to its field set', () => {
    const b = {} as Block;
    if (b.type === 'aside') {
      expectTypeOf(b).toEqualTypeOf<{
        type: 'aside';
        variant: 'note' | 'warning' | 'fact';
        html: string;
      }>();
    }
  });

  it('narrows `sidenote` to its field set', () => {
    const b = {} as Block;
    if (b.type === 'sidenote') {
      expectTypeOf(b).toEqualTypeOf<{
        type: 'sidenote';
        number: number;
        html: string;
        anchorParagraphIndex: number;
      }>();
    }
  });

  it('narrows `figure` to its field set', () => {
    const b = {} as Block;
    if (b.type === 'figure') {
      expectTypeOf(b).toEqualTypeOf<{
        type: 'figure';
        number?: number;
        src: string;
        alt: string;
        captionHtml?: string;
        fullBleed: boolean;
      }>();
    }
  });

  it('narrows `code` to its full field set including annotations shape', () => {
    const b = {} as Block;
    if (b.type === 'code') {
      expectTypeOf(b).toEqualTypeOf<{
        type: 'code';
        language: 'cpp' | 'arduino' | 'plaintext' | 'diff';
        code: string;
        filename?: string;
        showLineNumbers: boolean;
        highlightLines: number[];
        diffMode: boolean;
        annotations: { line: number; html: string }[];
      }>();
    }
  });

  it('narrows `diff` to its field set', () => {
    const b = {} as Block;
    if (b.type === 'diff') {
      expectTypeOf(b).toEqualTypeOf<{
        type: 'diff';
        before: string;
        after: string;
      }>();
    }
  });

  it('narrows `pinout` to its field set', () => {
    const b = {} as Block;
    if (b.type === 'pinout') {
      expectTypeOf(b).toEqualTypeOf<{
        type: 'pinout';
        src: string;
        alt: string;
        pins: { x: number; y: number; label: string; role: string }[];
      }>();
    }
  });

  it('narrows `parts-list` to its field set', () => {
    const b = {} as Block;
    if (b.type === 'parts-list') {
      expectTypeOf(b).toEqualTypeOf<{
        type: 'parts-list';
        items: { name: string; quantity: number; note?: string }[];
      }>();
    }
  });
});
