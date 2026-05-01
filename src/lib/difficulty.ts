export const DIFFICULTY_LABELS_UK = {
  beginner: 'початківець',
  intermediate: 'проміжний',
} as const satisfies Record<string, string>;

export type DifficultyKey = keyof typeof DIFFICULTY_LABELS_UK;
