import type { Block } from './block';

export interface Lesson {
  type: 'lesson';
  slug: string;
  title: string;
  deck: string;
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate';
  partsList: Extract<Block, { type: 'parts-list' }>;
  body: Block[];
  prevSlug?: string;
  nextSlug?: string;
  publishedAt: string;
  updatedAt: string;
}
