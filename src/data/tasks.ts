import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task, type TaskStatus } from '../db';
import { ValidationError } from './errors';
import { localDateISO, parseISO } from '../lib/streaks';

/** What callers may set. `id`, `status` and `completedAt` are owned by the layer. */
export interface TaskInput {
  title: string;
  courseId?: number;
  dueDate?: string;
  notes?: string;
}

/**
 * Patch shape for updateTask. Sentinel contract: `null` REMOVES an optional
 * field from the stored record; a value sets it; absent/undefined leaves it
 * untouched. (Assigning `undefined` would write a present-but-undefined key,
 * which is not the same as omitting it — hence the explicit null sentinel.)
 */
export type TaskPatch = Partial<Pick<TaskInput, 'title'>> & {
  courseId?: number | null;
  dueDate?: string | null;
  notes?: string | null;
};

/** Longest task title (post-trim). Exported so forms can set maxLength. */
export const TASK_TITLE_MAX = 80;
/** Longest task notes body (post-trim). */
export const TASK_NOTES_MAX = 500;

function validatedTitle(raw: string): string {
  const title = raw.trim();
  if (!title) throw new ValidationError('title', 'Title is required');
  if (title.length > TASK_TITLE_MAX) {
    throw new ValidationError(
      'title',
      `Keep the title to ${TASK_TITLE_MAX} characters or fewer`,
    );
  }
  return title;
}

function validatedNotes(raw: string): string {
  const notes = raw.trim();
  if (!notes) throw new ValidationError('notes', 'Notes cannot be empty — clear the field instead');
  if (notes.length > TASK_NOTES_MAX) {
    throw new ValidationError(
      'notes',
      `Keep notes to ${TASK_NOTES_MAX} characters or fewer`,
    );
  }
  return notes;
}

function validatedDueDate(raw: string): string {
  const dueDate = raw.trim();
  const parts = parseISO(dueDate);
  if (!parts) {
    throw new ValidationError('dueDate', 'Use a date in YYYY-MM-DD format');
  }
  // Calendar-real check: Date(y, m, d) normalizes overflow (Feb 30 → Mar 2),
  // so re-formatting must reproduce the input exactly.
  const asDate = new Date(parts.year, parts.month - 1, parts.day);
  if (localDateISO(asDate) !== dueDate) {
    throw new ValidationError('dueDate', 'That date does not exist');
  }
  return dueDate;
}

/**
 * Live task list. Reads toArray() and sorts in JS — NEVER orderBy('dueDate'):
 * both optional indexed fields are ABSENT on some rows, and IndexedDB omits
 * records lacking an indexed property from that index entirely, so an index
 * scan would silently drop undated/unassigned tasks.
 *
 * Sort: dated first by ascending dueDate, undated last; ties broken by title.
 * `undefined` while loading, `[]` when there are no tasks.
 */
export function useTasks(): Task[] | undefined {
  return useLiveQuery(async () => {
    const rows = await db.tasks.toArray();
    return rows.sort((a, b) => {
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
        return a.dueDate < b.dueDate ? -1 : 1;
      }
      if (a.dueDate !== b.dueDate) return a.dueDate ? -1 : 1;
      if (a.title !== b.title) return a.title < b.title ? -1 : 1;
      return (a.id ?? 0) - (b.id ?? 0);
    });
  }, []);
}

export async function addTask(raw: TaskInput): Promise<number> {
  // Build without undefined-valued keys: absent ≠ present-but-undefined.
  const candidate: Task = { title: validatedTitle(raw.title), status: 'todo' };
  if (raw.courseId !== undefined) candidate.courseId = raw.courseId;
  if (raw.dueDate !== undefined) candidate.dueDate = validatedDueDate(raw.dueDate);
  if (raw.notes !== undefined) candidate.notes = validatedNotes(raw.notes);

  // courseId existence is checked INSIDE the transaction: referential
  // integrity at app level, race-free against concurrent course deletion.
  return db.transaction('rw', db.tasks, db.courses, async (): Promise<number> => {
    if (candidate.courseId !== undefined) {
      const course = await db.courses.get(candidate.courseId);
      if (!course) {
        throw new ValidationError('courseId', 'That course no longer exists');
      }
    }
    return db.tasks.add(candidate);
  });
}

export async function updateTask(id: number, patch: TaskPatch): Promise<void> {
  await db.transaction('rw', db.tasks, db.courses, async () => {
    const existing = await db.tasks.get(id);
    if (!existing) return; // unknown id resolves silently (local single-user app)

    const next: Task = { ...existing };
    if (patch.title !== undefined) next.title = validatedTitle(patch.title);

    // Narrowed locals: `in` alone doesn't exclude undefined from the union.
    const courseId = patch.courseId;
    if (courseId === null) delete next.courseId;
    else if (courseId !== undefined) {
      const course = await db.courses.get(courseId);
      if (!course) throw new ValidationError('courseId', 'That course no longer exists');
      next.courseId = courseId;
    }

    const dueDate = patch.dueDate;
    if (dueDate === null) delete next.dueDate;
    else if (dueDate !== undefined) next.dueDate = validatedDueDate(dueDate);

    const notes = patch.notes;
    if (notes === null) delete next.notes;
    else if (notes !== undefined) next.notes = validatedNotes(notes);

    await db.tasks.put(next);
  });
}

export async function deleteTask(id: number): Promise<void> {
  await db.tasks.delete(id); // unknown id already a silent no-op
}

/**
 * ABSOLUTE status setter (not a toggle): two rapid clicks send the same value,
 * making the second an idempotent no-op instead of an accidental un-complete.
 * Marking done stamps `completedAt` with today; going back to todo clears it.
 * Re-completing keeps the FIRST stamp only if still present — after an
 * un-complete/re-complete cycle the latest date wins, which matches reality.
 */
export async function setTaskStatus(id: number, status: TaskStatus): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    const existing = await db.tasks.get(id);
    if (!existing) return;

    const next: Task = { ...existing, status };
    if (status === 'done') next.completedAt = existing.completedAt ?? localDateISO();
    else delete next.completedAt;

    await db.tasks.put(next);
  });
}

/**
 * Live map of courseId → total task count (todo + done). One query feeds the
 * Courses page's delete confirm ("Its 3 tasks will be kept") at render time.
 */
export function useTaskCountsByCourse(): ReadonlyMap<number, number> | undefined {
  return useLiveQuery(async () => {
    const all = await db.tasks.toArray();
    const counts = new Map<number, number>();
    for (const task of all) {
      if (task.courseId === undefined) continue;
      counts.set(task.courseId, (counts.get(task.courseId) ?? 0) + 1);
    }
    return counts;
  }, []);
}
