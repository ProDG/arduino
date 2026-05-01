import type { Block } from './block';

export interface Schematic {
  type: 'schematic';
  slug: string;
  title: string;
  schematicImage: Extract<Block, { type: 'figure' }>;
  explanation: Block[];
  downloadUrl: string;
  publishedAt: string;
  updatedAt: string;
}
