import type { Habit } from '../../db';
import type { HabitInput } from '../../data/habits';

/** A habit read back from IndexedDB, so its generated `id` is guaranteed. */
export type StoredHabit = Habit & { id: number };

/**
 * `Habit.id` is optional because it's absent before insertion. Anything the
 * list renders has already been stored, so narrow once at the boundary rather
 * than checking for an id in every handler.
 */
export function hasId(habit: Habit): habit is StoredHabit {
  return habit.id !== undefined;
}

export type FieldErrors = Partial<Record<keyof HabitInput, string>>;
