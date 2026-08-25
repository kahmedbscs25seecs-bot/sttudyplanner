import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Habit } from '../db';
import { ValidationError } from './errors';

/** What callers may set. `id`, `active` and `order` are owned by the data layer. */
export interface HabitInput {
  title: string;
}

/** Longest allowed habit title (post-trim). Exported so forms can set maxLength. */
export const HABIT_TITLE_MAX = 60;

function validatedTitle(raw: string): string {
  const title = raw.trim();
  if (!title) throw new ValidationError('title', 'Title is required');
  if (title.length > HABIT_TITLE_MAX) {
    throw new ValidationError(
      'title',
      `Keep the title to ${HABIT_TITLE_MAX} characters or fewer`,
    );
  }
  return title;
}

/**
 * Live habit list in manual order. `undefined` while loading, `[]` when the
 * user has no habits — callers render those differently.
 */
export function useHabits(): Habit[] | undefined {
  return useLiveQuery(async () => {
    const rows = await db.habits.orderBy('order').toArray();
    // Stable tiebreak: equal `order` values keep creation order.
    return [...rows].sort((a, b) => (a.order - b.order) || ((a.id ?? 0) - (b.id ?? 0)));
  }, []);
}

export async function addHabit(raw: HabitInput): Promise<number> {
  const title = validatedTitle(raw.title);

  return db.transaction('rw', db.habits, async (): Promise<number> => {
    const last = await db.habits.orderBy('order').last();
    const order = (last?.order ?? -1) + 1;
    return db.habits.add({ title, active: true, order });
  });
}

export async function updateHabit(id: number, rawPatch: Partial<HabitInput>): Promise<void> {
  const patch: Partial<HabitInput> = {};
  if (rawPatch.title !== undefined) patch.title = validatedTitle(rawPatch.title);

  await db.transaction('rw', db.habits, async () => {
    const existing = await db.habits.get(id);
    if (!existing) return; // unknown id resolves silently (local single-user app)
    await db.habits.put({ ...existing, ...patch });
  });
}

/**
 * Deletes a habit AND its completion history — cascade is intentional
 * (confirmed by the UI before this runs); orphaned completions would be
 * unreachable rows forever. Same transaction so it's all-or-nothing.
 */
export async function deleteHabit(id: number): Promise<void> {
  await db.transaction('rw', db.habits, db.completions, async () => {
    await db.completions.where('habitId').equals(id).delete();
    await db.habits.delete(id);
  });
}

/**
 * Persists a new manual ordering. `orderedIds` is the complete list in its
 * display order; each listed id gets `order` = array index inside one
 * transaction. Unlisted ids keep their stored order (lenient by design).
 */
export async function reorderHabits(orderedIds: readonly number[]): Promise<void> {
  await db.transaction('rw', db.habits, async () => {
    for (const [index, id] of orderedIds.entries()) {
      await db.habits.update(id, { order: index });
    }
  });
}

/**
 * Live map of habitId → completion dates ('YYYY-MM-DD', ascending).
 * One query for the whole page; streak math consumes it directly.
 */
export function useCompletionsByHabit(): ReadonlyMap<number, readonly string[]> | undefined {
  return useLiveQuery(async () => {
    const all = await db.completions.toArray();
    const grouped = new Map<number, string[]>();
    for (const row of all) {
      const dates = grouped.get(row.habitId);
      if (dates) dates.push(row.date);
      else grouped.set(row.habitId, [row.date]);
    }
    for (const dates of grouped.values()) dates.sort();
    return grouped;
  }, []);
}

/**
 * Marks a habit completed (or not) for one local day. Idempotent both ways:
 * the composite primary key [habitId+date] makes double-put a no-op overwrite,
 * and deleting an absent pair resolves quietly.
 */
export async function setCompleted(habitId: number, date: string, done: boolean): Promise<void> {
  if (done) await db.completions.put({ habitId, date });
  else await db.completions.delete([habitId, date]);
}
