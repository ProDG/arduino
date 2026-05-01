import type { Block } from './block';

export interface Datasheet {
  type: 'datasheet';
  slug: string;
  title: string;
  manufacturer: string;
  pinout: Extract<Block, { type: 'pinout' }>;
  specifications: { label: string; value: string }[];
  peripheralNotes: Block[];
  publishedAt: string;
  updatedAt: string;
}
