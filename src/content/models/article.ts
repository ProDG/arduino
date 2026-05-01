import type { Block } from './block';

export interface Article {
  type: 'article';
  slug: string;
  title: string;
  deck: string;
  body: Block[];
  publishedAt: string;
  updatedAt: string;
}
