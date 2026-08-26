import { describe, expect, it } from 'vitest';
import { groupByBucket } from './buckets';
import type { StoredTask } from './types';

const TODAY = '2026-08-25';

function task(overrides: Partial<StoredTask> & { id: number; title: string }): StoredTask {
  return { status: 'todo', ...overrides };
}

const undated = task({ id: 4, title: 'Bare' });

describe('groupByBucket', () => {
  it('orders buckets in fixed display order', () => {
    const buckets = groupByBucket(
      [
        task({ id: 1, title: 'Far out', dueDate: '2027-01-01' }),
        task({ id: 2, title: 'Overdue', dueDate: '2026-08-20' }),
        task({ id: 3, title: 'Today', dueDate: TODAY }),
        task({ id: 5, title: 'Tomorrow', dueDate: '2026-08-26' }),
        task({ id: 6, title: 'This week', dueDate: '2026-09-01' }),
        undated,
      ],
      TODAY,
    );
    expect(buckets.map((b) => b.bucket)).toEqual([
      'overdue',
      'today',
      'tomorrow',
      'week',
      'later',
      'none',
    ]);
  });

  it('omits empty buckets entirely', () => {
    const buckets = groupByBucket([task({ id: 1, title: 'Only today', dueDate: TODAY })], TODAY);
    expect(buckets).toHaveLength(1);
    expect(buckets[0]?.bucket).toBe('today');
  });

  it('excludes done tasks — they belong to the Done section', () => {
    const done = task({ id: 9, title: 'Finished', status: 'done', dueDate: TODAY });
    const buckets = groupByBucket([done], TODAY);
    expect(buckets).toHaveLength(0);
  });

  it('sends an undated task to the none bucket', () => {
    const buckets = groupByBucket([undated], TODAY);
    expect(buckets[0]?.bucket).toBe('none');
    expect(buckets[0]?.tasks).toHaveLength(1);
  });

  it('preserves incoming order within a bucket', () => {
    const buckets = groupByBucket(
      [
        task({ id: 2, title: 'Second overdue', dueDate: '2026-08-21' }),
        task({ id: 1, title: 'First overdue', dueDate: '2026-08-20' }),
      ],
      TODAY,
    );
    expect(buckets[0]?.tasks.map((t) => t.id)).toEqual([2, 1]);
  });
});
