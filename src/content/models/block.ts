export type Block =
  | { type: 'heading'; level: 2 | 3; text: string; id?: string }
  | { type: 'paragraph'; html: string }
  | { type: 'lede'; html: string }
  | { type: 'aside'; variant: 'note' | 'warning' | 'fact'; html: string }
  | { type: 'sidenote'; number: number; html: string; anchorParagraphIndex: number }
  | {
      type: 'figure';
      number?: number;
      src: string;
      alt: string;
      captionHtml?: string;
      fullBleed: boolean;
      width: number;
      height: number;
    }
  | {
      type: 'code';
      language: 'cpp' | 'arduino' | 'plaintext' | 'diff';
      code: string;
      filename?: string;
      showLineNumbers: boolean;
      highlightLines: number[];
      diffMode: boolean;
      annotations: { line: number; html: string }[];
      tokens?: string;
    }
  | { type: 'diff'; before: string; after: string }
  | {
      type: 'pinout';
      src: string;
      alt: string;
      pins: { x: number; y: number; label: string; role: string }[];
      width: number;
      height: number;
    }
  | {
      type: 'parts-list';
      items: { name: string; quantity: number; note?: string }[];
    };

export type BlockType = Block['type'];
