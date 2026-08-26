import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { addCourse, deleteCourse } from './courses';
import { ValidationError } from './errors';
import {
  addTask,
  deleteTask,
  setTaskStatus,
  TASK_NOTES_MAX,
  TASK_TITLE_MAX,
  updateTask,
  useTaskCountsByCourse,
  useTasks,
} from './tasks';
import { localDateISO } from '../lib/streaks';

// Derived, never hardcoded: a frozen literal goes stale at midnight
// (learned the hard way — completedAt stamps the REAL local day).
const TODAY = localDateISO();

beforeEach(async () => {
  await Promise.all([db.courses.clear(), db.tasks.clear()]);
});

describe('addTask', () => {
  it('stores a task with todo status and no optional keys when absent', async () => {
    const id = await addTask({ title: 'Submit hostel form' });
    const stored = await db.tasks.get(id);
    expect(stored).toMatchObject({ title: 'Submit hostel form', status: 'todo' });
    // Absent ≠ present-but-undefined: the keys must not exist at all.
    expect(stored).not.toHaveProperty('courseId');
    expect(stored).not.toHaveProperty('dueDate');
    expect(stored).not.toHaveProperty('notes');
    expect(stored).not.toHaveProperty('completedAt');
  });

  it('trims the title before storage', async () => {
    const id = await addTask({ title: '  Submit hostel form  ' });
    expect((await db.tasks.get(id))?.title).toBe('Submit hostel form');
  });

  it.each([
    ['blank', '   '],
    [`over ${TASK_TITLE_MAX}`, 'x'.repeat(TASK_TITLE_MAX + 1)],
  ])('rejects a %s title', async (_label, title) => {
    const err = await addTask({ title }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('title');
  });

  it.each([
    ['malformed', 'not-a-date'],
    ['calendar-impossible', '2026-02-30'],
  ])('rejects a %s dueDate', async (_label, dueDate) => {
    const err = await addTask({ title: 'X', dueDate }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('dueDate');
  });

  it(`rejects notes over ${TASK_NOTES_MAX}`, async () => {
    const err = await addTask({ title: 'X', notes: 'n'.repeat(TASK_NOTES_MAX + 1) }).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('notes');
  });

  it('rejects a nonexistent courseId inside the transaction', async () => {
    const err = await addTask({ title: 'X', courseId: 9999 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('courseId');
    // The aborted transaction must not have left a partial write behind.
    expect(await db.tasks.count()).toBe(0);
  });

  it('accepts an existing courseId', async () => {
    const courseId = await addCourse({
      code: 'CS-101',
      name: 'Intro to Programming',
      creditHours: 3,
      difficulty: 2,
    });
    const id = await addTask({ title: 'Assignment 1', courseId, dueDate: TODAY });
    const stored = await db.tasks.get(id);
    expect(stored).toMatchObject({ courseId, dueDate: TODAY });
  });
});

describe('updateTask patch semantics', () => {
  const base = { title: 'Assignment 1' };

  beforeEach(async () => {
    await db.courses.clear();
  });

  it('leaves untouched fields alone (absent ≠ clear)', async () => {
    const courseId = await addCourse({
      code: 'CS-101',
      name: 'Intro',
      creditHours: 3,
      difficulty: 2,
    });
    const id = await addTask({ ...base, courseId, dueDate: TODAY });
    await updateTask(id, { title: 'Renamed' });

    const stored = await db.tasks.get(id);
    expect(stored?.title).toBe('Renamed');
    expect(stored?.courseId).toBe(courseId);
    expect(stored?.dueDate).toBe(TODAY);
  });

  it('clears a due date via the null sentinel (key removed)', async () => {
    const id = await addTask({ ...base, dueDate: TODAY });
    await updateTask(id, { dueDate: null });
    const stored = await db.tasks.get(id);
    expect(stored).not.toHaveProperty('dueDate');
  });

  it('clears a course assignment via the null sentinel', async () => {
    const courseId = await addCourse({
      code: 'EE-210',
      name: 'Circuits',
      creditHours: 4,
      difficulty: 4,
    });
    const id = await addTask({ ...base, courseId });
    await updateTask(id, { courseId: null });
    const stored = await db.tasks.get(id);
    expect(stored).not.toHaveProperty('courseId');
  });

  it('clears notes via the null sentinel', async () => {
    const id = await addTask({ ...base, notes: 'chapter 3-5' });
    await updateTask(id, { notes: null });
    expect(await db.tasks.get(id)).not.toHaveProperty('notes');
  });

  it('validates patched values with the same rules as creation', async () => {
    const id = await addTask(base);
    const err = await updateTask(id, { dueDate: '2026-13-01' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('dueDate');
  });

  it('resolves silently for an unknown id', async () => {
    await expect(updateTask(9999, { title: 'Ghost' })).resolves.toBeUndefined();
  });
});

describe('setTaskStatus', () => {
  it('stamps completedAt with today on done; idempotent re-call keeps one stamp', async () => {
    const id = await addTask({ title: 'Assignment 1' });
    await setTaskStatus(id, 'done');
    await setTaskStatus(id, 'done'); // double-click protection
    const stored = await db.tasks.get(id);
    expect(stored?.status).toBe('done');
    expect(stored?.completedAt).toBe(TODAY);
    expect(await db.tasks.count()).toBe(1);
  });

  it('removes completedAt when returning to todo', async () => {
    const id = await addTask({ title: 'Assignment 1' });
    await setTaskStatus(id, 'done');
    await setTaskStatus(id, 'todo');
    const stored = await db.tasks.get(id);
    expect(stored?.status).toBe('todo');
    expect(stored).not.toHaveProperty('completedAt');
  });

  it('resolves silently for an unknown id', async () => {
    await expect(setTaskStatus(9999, 'done')).resolves.toBeUndefined();
  });
});

describe('deleteTask', () => {
  it('deletes an existing task', async () => {
    const id = await addTask({ title: 'Assignment 1' });
    await deleteTask(id);
    expect(await db.tasks.get(id)).toBeUndefined();
  });

  it('resolves silently for an unknown id', async () => {
    await expect(deleteTask(9999)).resolves.toBeUndefined();
  });
});

describe('useTasks — THE optional-field trap', () => {
  it('lists undated AND unassigned tasks (toArray, never orderBy)', async () => {
    await addCourse({
      code: 'CS-101',
      name: 'Intro',
      creditHours: 3,
      difficulty: 2,
    });
    // Deliberately insert a task lacking BOTH optional indexed fields.
    await db.tasks.bulkAdd([
      { title: 'Bare task', status: 'todo' },
      { title: 'Dated', status: 'todo', dueDate: '2026-09-01' },
    ]);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current).toBeDefined());

    const titles = result.current?.map((t) => t.title);
    // If this ever fails, someone replaced toArray() with orderBy — undated
    // rows are invisible to the dueDate index by IndexedDB design.
    expect(titles).toContain('Bare task');

    // Sort contract: dated first ascending, undated last.
    expect(titles).toEqual(['Dated', 'Bare task']);
  });
});

describe('useTaskCountsByCourse', () => {
  it('counts ALL statuses per course, skipping unassigned tasks', async () => {
    const courseId = await addCourse({
      code: 'CS-101',
      name: 'Intro',
      creditHours: 3,
      difficulty: 2,
    });
    await addTask({ title: 'A1', courseId });
    await addTask({ title: 'A2', courseId });
    await addTask({ title: 'Loose' }); // unassigned — must not appear

    const { result } = renderHook(() => useTaskCountsByCourse());
    await waitFor(() => {
      expect(result.current?.get(courseId)).toBe(2);
      expect(result.current?.size).toBe(1);
    });
  });
});

describe('deleteCourse unassigns its tasks (never destroys them)', () => {
  it('keeps assigned tasks with courseId removed; leaves others untouched', async () => {
    const courseId = await addCourse({
      code: 'CS-101',
      name: 'Intro',
      creditHours: 3,
      difficulty: 2,
    });
    const assigned = await addTask({ title: 'Assignment 1', courseId, dueDate: TODAY });
    const loose = await addTask({ title: 'Loose' });

    await deleteCourse(courseId);

    expect(await db.courses.get(courseId)).toBeUndefined();

    const survivor = await db.tasks.get(assigned);
    expect(survivor?.title).toBe('Assignment 1');
    expect(survivor?.dueDate).toBe(TODAY); // only the link is severed
    expect(survivor).not.toHaveProperty('courseId');

    expect(await db.tasks.get(loose)).toBeDefined();
    expect(await db.tasks.count()).toBe(2);
  });
});
