/**
 * Due-date bucketing and display for tasks.
 *
 * All arithmetic is local-calendar (decompose ISO → shift via Date(y, m, d+n)
 * → re-format): DST days are 23 or 25 hours, so millisecond offsets drift.
 * ISO strings compare correctly as plain strings.
 */
import { localDateISO, parseISO } from './streaks';

export type DueBucket = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'none';

/** The local calendar day `days` from `iso` (negative days step backwards). */
export function addDaysISO(iso: string, days: number): string {
  const parts = parseISO(iso);
  if (!parts) return iso;
  const shifted = new Date(parts.year, parts.month - 1, parts.day + days);
  return localDateISO(shifted);
}

/**
 * Which section a due date belongs to, relative to today.
 * `week` is a rolling 7-day window (≤ today+7), deliberately not a Mon–Sun
 * calendar week — locale first-day-of-week rules buy nothing here.
 */
export function bucketFor(dueDate: string | undefined, today: string): DueBucket {
  if (!dueDate) return 'none';
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  if (dueDate === addDaysISO(today, 1)) return 'tomorrow';
  if (dueDate <= addDaysISO(today, 7)) return 'week';
  return 'later';
}

// Fixed English abbreviations — NOT toLocaleString: output must not depend
// on the runner's locale, or tests (and UI copy) become nondeterministic.
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/**
 * Human label for a due date: 'Aug 22' in the current year,
 * 'Aug 22, 2025' otherwise. Built from LOCAL parts — parsing the ISO string
 * via new Date(string) would interpret it as UTC and shift the day.
 */
export function formatDueDate(iso: string, today: string): string {
  const parts = parseISO(iso);
  if (!parts) return iso;
  const month = MONTHS[parts.month - 1] ?? String(parts.month);
  const base = `${month} ${parts.day}`;
  return parts.year === Number(today.slice(0, 4)) ? base : `${base}, ${parts.year}`;
}
