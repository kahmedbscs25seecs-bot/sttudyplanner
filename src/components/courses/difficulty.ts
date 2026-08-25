/** Human names for the 1–5 difficulty scale the data layer accepts. */
export const DIFFICULTY_LABELS = [
  'Very easy',
  'Easy',
  'Moderate',
  'Hard',
  'Very hard',
] as const;

export const DIFFICULTY_STEPS = [1, 2, 3, 4, 5] as const;

/** `Moderate` for 3, and a safe fallback if a stored value ever drifts. */
export function difficultyLabel(value: number): string {
  return DIFFICULTY_LABELS[value - 1] ?? `Level ${String(value)}`;
}
