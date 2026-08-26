/**
 * Grouping for the Tasks page — a pure module (no components) so it stays
 * unit-testable and clear of `react-refresh/only-export-components`.
 */
import { bucketFor, type DueBucket } from '../../lib/dueDates';
import type { StoredTask } from './types';

/** Fixed display order; 'none' renders last as its own "No date" section. */
const BUCKET_ORDER: readonly DueBucket[] = [
  'overdue',
  'today',
  'tomorrow',
  'week',
  'later',
  'none',
];

export interface TaskBucket {
  bucket: DueBucket;
  tasks: StoredTask[];
}

/**
 * Group open tasks into due-date buckets.
 *
 * - Fixed display order, empty buckets omitted.
 * - Done tasks are EXCLUDED here: they render in the page's Done section,
 *   ordered by completion time instead of deadline.
 * - Within-bucket order is preserved from useTasks()'s sort
 *   (dated asc, undated last, title tiebreak).
 */
export function groupByBucket(tasks: StoredTask[], today: string): TaskBucket[] {
  const grouped = new Map<DueBucket, StoredTask[]>();
  for (const task of tasks) {
    if (task.status === 'done') continue;
    const bucket = bucketFor(task.dueDate, today);
    const list = grouped.get(bucket);
    if (list) list.push(task);
    else grouped.set(bucket, [task]);
  }
  return BUCKET_ORDER.filter((bucket) => grouped.has(bucket)).map((bucket) => ({
    bucket,
    tasks: grouped.get(bucket) ?? [],
  }));
}
