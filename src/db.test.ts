import Dexie from 'dexie';
import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import { db, NUSTDatabase } from './db';

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

    // `order` is indexed as of schema v2, so the DB itself returns sorted rows.
    const habits = await db.habits.orderBy('order').toArray();
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

    await db.courses.add({ ...baseCourse });
    // Fresh object per call: fake-indexeddb injects the generated id into the
    // input object, so reusing a reference would collide on its primary key.
    await expect(db.courses.add({ ...baseCourse })).resolves.toBeDefined();
  });
});

/**
 * Replicates the shipped v1 schema under a scratch name, stores legacy rows
 * (some missing `order`), then opens them with the real v2 class to prove the
 * declarative migration + backfill run against data that predates them.
 */
describe('schema v1 → v2 upgrade', () => {
  const opened: Dexie[] = [];

  function track<T extends Dexie>(instance: T): T {
    opened.push(instance);
    return instance;
  }

  afterAll(async () => {
    await Promise.all(opened.map((instance) => instance.delete()));
  });

  it('backfills order for legacy rows and keeps existing values', async () => {
    const SCRATCH = 'test-upgrade-v1-to-v2';

    // ── Act like a Day-1 install: v1 only, no `order` index.
    const legacy = new Dexie(SCRATCH);
    track(legacy);
    legacy.version(1).stores({
      courses: '++id, code, name, source',
      habits: '++id, title, active',
    });
    await legacy.open();
    await legacy.table('habits').bulkAdd([
      { title: 'Alpha', active: true }, // no order — needs backfill
      { title: 'Beta', active: true, order: 5 }, // manual value — must survive
      { title: 'Gamma', active: true }, // no order
    ]);
    legacy.close();

    // ── Open with the current schema; Dexie runs the v2 upgrade.
    const upgraded = track(new NUSTDatabase(SCRATCH));
    await upgraded.open();

    const rows = await upgraded.habits.orderBy('order').toArray();
    expect(rows.map((r) => r.title)).toEqual(['Alpha', 'Gamma', 'Beta']);
    expect(rows.map((r) => r.order)).toEqual([0, 1, 5]);

    // The v2-only table exists and accepts composite-key rows.
    const firstId = rows[0]?.id;
    expect(firstId).toBeDefined();
    await upgraded.completions.put({ habitId: firstId!, date: '2026-01-07' });
    expect(await upgraded.completions.count()).toBe(1);
  });

  it('creates fresh databases directly at v3 (tasks table present)', async () => {
    const fresh = track(new NUSTDatabase('test-fresh-v3'));
    await fresh.open();
    const id = await fresh.tasks.add({ title: 'First task', status: 'todo' });
    expect(id).toBeGreaterThan(0);
    const stored = await fresh.tasks.get(id);
    // Optional indexed fields absent on purpose — the array-scan list path
    // must still surface this row.
    expect(stored).not.toHaveProperty('dueDate');
  });

  it('creates fresh databases directly at v2', async () => {
    const fresh = track(new NUSTDatabase('test-fresh-v2'));
    await fresh.open();
    const id = await fresh.habits.add({ title: 'New install', active: true, order: 0 });
    expect(id).toBeGreaterThan(0);
    // Boolean stores fine as a VALUE; it's only invalid as an INDEX key.
    expect((await fresh.habits.get(id))?.active).toBe(true);
  });
});
