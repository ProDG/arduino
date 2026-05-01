export * from './article';
export * from './block';
export * from './datasheet';
export * from './lesson';
export * from './schematic';

import type { Article } from './article';
import type { Datasheet } from './datasheet';
import type { Lesson } from './lesson';
import type { Schematic } from './schematic';

export type AnyPage = Lesson | Article | Datasheet | Schematic;
