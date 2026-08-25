import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';

describe('NUSTDatabase', () => {
  beforeEach(async () => {
    await Promise.all([db.courses.clear(), db.habits.clear()]);
  });

  it('stores and retrieves a course', async () => {
    const id = await db.courses.add({
      code: 'CS-101',
      name: 'Introduction to Programming',
      creditHours: 3,
      difficulty: 2,
      source: 'manual',
    });

    const stored = await db.courses.get(id);
    expect(stored).toMatchObject({ code: 'CS-101', creditHours: 3 });
  });

  it('updates and deletes a course', async () => {
    const id = await db.courses.add({
      code: 'EE-210',
      name: 'Circuit Analysis',
      creditHours: 4,
      difficulty: 4,
      source: 'manual',
    });

    await db.courses.update(id, { difficulty: 5 });
    expect((await db.courses.get(id))?.difficulty).toBe(5);

    await db.courses.delete(id);
    expect(await db.courses.get(id)).toBeUndefined();
  });

  it('keeps habit order values stable across reads', async () => {
    await db.habits.bulkAdd([
      { title: 'Morning revision', active: true, order: 0 },
      { title: 'Read 20 pages', active: true, order: 1 },
    ]);

    // No index on `order` yet (schema v1) — sort client-side until Day 3 bumps it.
    const habits = (await db.habits.toArray()).sort(
      (a, b) => a.order - b.order,
    );
    expect(habits.map((h) => h.title)).toEqual([
      'Morning revision',
      'Read 20 pages',
    ]);
  });

  it('allows duplicate course codes at the DB level (app must guard)', async () => {
    const baseCourse = {
      code: 'MG-101',
      name: 'Principles of Management',
      creditHours: 2,
      difficulty: 1,
      source: 'manual' as const,
    };

    // Fresh object per call: fake-indexeddb injects the generated id into the
    // input object, so reusing a reference would collide on its primary key.
    await db.courses.add({ ...baseCourse });
    await expect(db.courses.add({ ...baseCourse })).resolves.toBeDefined();
  });
});
