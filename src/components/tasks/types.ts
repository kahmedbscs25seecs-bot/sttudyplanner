import type { Task } from '../../db';
import type { TaskInput } from '../../data/tasks';

/** A task read back from IndexedDB, so its generated `id` is guaranteed. */
export type StoredTask = Task & { id: number };

/**
 * `Task.id` is optional because it's absent before insertion. Anything a list
 * renders has already been stored, so narrow once at the boundary.
 */
export function hasId(task: Task): task is StoredTask {
  return task.id !== undefined;
}

export type FieldErrors = Partial<Record<keyof TaskInput, string>>;
