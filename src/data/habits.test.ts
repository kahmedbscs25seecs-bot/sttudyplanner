import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { ValidationError } from './errors';
import {
  addHabit,
  deleteHabit,
  HABIT_TITLE_MAX,
  reorderHabits,
  setCompleted,
  updateHabit,
  useCompletionsByHabit,
  useHabits,
} from './habits';

const TODAY = '2026-01-07';
const YESTERDAY = '2026-01-06';

beforeEach(async () => {
  await Promise.all([db.habits.clear(), db.completions.clear()]);
});

describe('addHabit', () => {
  it('assigns sequential order and data-layer defaults', async () => {
    const first = await addHabit({ title: 'Morning revision' });
    const second = await addHabit({ title: 'Read 20 pages' });

    const rows = await db.habits.bulkGet([first, second]);
    expect(rows[0]).toMatchObject({ title: 'Morning revision', active: true, order: 0 });
    expect(rows[1]).toMatchObject({ title: 'Read 20 pages', active: true, order: 1 });
  });

  it('trims the title before storage', async () => {
    const id = await addHabit({ title: '  Morning revision  ' });
    expect((await db.habits.get(id))?.title).toBe('Morning revision');
  });

  it.each([
    ['blank', '   '],
    [`over ${HABIT_TITLE_MAX}`, 'x'.repeat(HABIT_TITLE_MAX + 1)],
  ])('rejects a %s title', async (_label, title) => {
    const err = await addHabit({ title }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('title');
  });

  it('accepts a title of exactly the max length', async () => {
    await expect(addHabit({ title: 'x'.repeat(HABIT_TITLE_MAX) })).resolves.toBeDefined();
  });

  it('orders new habits after the largest existing order value', async () => {
    const seeded = await addHabit({ title: 'Seeded' });
    // Simulate a legacy/manual row far ahead of the pack.
    await db.habits.update(seeded, { order: 9 });
    const added = await addHabit({ title: 'Appended' });
    expect((await db.habits.get(added))?.order).toBe(10);
  });
});

describe('updateHabit', () => {
  it('applies a partial patch', async () => {
    const id = await addHabit({ title: 'Morning revision' });
    await updateHabit(id, { title: 'Evening revision' });
    expect((await db.habits.get(id))?.title).toBe('Evening revision');
  });

  it('resolves silently for an unknown id', async () => {
    await expect(updateHabit(9999, { title: 'Ghost' })).resolves.toBeUndefined();
  });

  it('validates patched titles with the same rules as creation', async () => {
    const id = await addHabit({ title: 'Morning revision' });
    const err = await updateHabit(id, { title: '   ' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).field).toBe('title');
  });
});

describe('reorderHabits', () => {
  it('persists the exact sequence given', async () => {
    const a = await addHabit({ title: 'A' });
    const b = await addHabit({ title: 'B' });
    const c = await addHabit({ title: 'C' });

    await reorderHabits([c, a, b]);

    const rows = await db.habits.orderBy('order').toArray();
    expect(rows.map((r) => r.title)).toEqual(['C', 'A', 'B']);
  });

  it('leaves unlisted habits untouched (lenient by design)', async () => {
    const a = await addHabit({ title: 'A' });
    const b = await addHabit({ title: 'B' });

    await reorderHabits([b]); // only B is re-ranked to 0

    expect((await db.habits.get(b))?.order).toBe(0);
    expect((await db.habits.get(a))?.order).toBe(0); // unchanged
  });
});

describe('setCompleted', () => {
  it('stores one row per (habit, day)', async () => {
    const id = await addHabit({ title: 'Morning revision' });
    await setCompleted(id, TODAY, true);
    await setCompleted(id, TODAY, true); // double check-off is a no-op overwrite
    expect(await db.completions.count()).toBe(1);
  });

  it('removes the pair when done=false, even if absent', async () => {
    const id = await addHabit({ title: 'Morning revision' });
    await setCompleted(id, TODAY, true);
    await setCompleted(id, TODAY, false);
    await setCompleted(id, TODAY, false); // un-checking twice stays quiet
    expect(await db.completions.count()).toBe(0);
  });

  it('keeps habits independent of each other', async () => {
    const a = await addHabit({ title: 'A' });
    const b = await addHabit({ title: 'B' });
    await setCompleted(a, TODAY, true);
    await setCompleted(b, YESTERDAY, true);
    expect(await db.completions.count()).toBe(2);
  });
});

describe('deleteHabit cascade', () => {
  it('removes the habit and all of its completions — and nothing else', async () => {
    const doomed = await addHabit({ title: 'Doomed' });
    const survivor = await addHabit({ title: 'Survivor' });
    await setCompleted(doomed, TODAY, true);
    await setCompleted(doomed, YESTERDAY, true);
    await setCompleted(survivor, TODAY, true);

    await deleteHabit(doomed);

    expect(await db.habits.get(doomed)).toBeUndefined();
    const remaining = await db.completions.toArray();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toMatchObject({ habitId: survivor, date: TODAY });
  });

  it('resolves silently for an unknown id', async () => {
    await expect(deleteHabit(9999)).resolves.toBeUndefined();
  });
});

describe('live hooks', () => {
  it('useHabits orders by `order` with an id tiebreak', async () => {
    const a = await addHabit({ title: 'A' });
    const b = await addHabit({ title: 'B' });
    await reorderHabits([b, a]);

    const { result } = renderHook(() => useHabits());
    await waitFor(() => {
      expect(result.current?.map((h) => h.title)).toEqual(['B', 'A']);
    });
  });

  it('useCompletionsByHabit groups ascending dates per habit', async () => {
    const id = await addHabit({ title: 'Morning revision' });
    await setCompleted(id, TODAY, true);
    await setCompleted(id, YESTERDAY, true);

    const { result } = renderHook(() => useCompletionsByHabit());
    await waitFor(() => {
      expect(result.current?.get(id)).toEqual([YESTERDAY, TODAY]);
    });
  });
});
