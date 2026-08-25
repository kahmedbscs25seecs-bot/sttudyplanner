import { describe, expect, it } from 'vitest';
import { addDaysISO, bucketFor, formatDueDate } from './dueDates';

describe('addDaysISO', () => {
  it('steps within a month', () => {
    expect(addDaysISO('2026-01-05', 3)).toBe('2026-01-08');
  });

  it('rolls over month and year boundaries', () => {
    expect(addDaysISO('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysISO('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('handles leap years', () => {
    expect(addDaysISO('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDaysISO('2026-02-28', 1)).toBe('2026-03-01'); // 2026 is not leap
  });

  it('is DST-safe (calendar arithmetic, no millisecond math)', () => {
    // 2026-03-08 is a US spring-forward day: 23 hours long. Stepping across
    // it must stay exact regardless of the runner's timezone.
    expect(addDaysISO('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDaysISO('2026-03-08', 1)).toBe('2026-03-09');
  });

  it('steps backwards with negative days', () => {
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('returns malformed input unchanged', () => {
    expect(addDaysISO('nope', 2)).toBe('nope');
  });
});

describe('bucketFor', () => {
  const TODAY = '2026-08-25';
  const TOMORROW = '2026-08-26';

  it('buckets an absent date as none', () => {
    expect(bucketFor(undefined, TODAY)).toBe('none');
  });

  it('buckets anything before today as overdue', () => {
    expect(bucketFor('2026-08-24', TODAY)).toBe('overdue');
    expect(bucketFor('2025-01-01', TODAY)).toBe('overdue');
  });

  it('matches today and tomorrow exactly', () => {
    expect(bucketFor(TODAY, TODAY)).toBe('today');
    expect(bucketFor(TOMORROW, TODAY)).toBe('tomorrow');
  });

  it('uses a rolling 7-day window (inclusive) for week', () => {
    expect(bucketFor('2026-09-01', TODAY)).toBe('week'); // today+7
    expect(bucketFor('2026-09-02', TODAY)).toBe('later'); // today+8
  });

  it('buckets far-future dates as later', () => {
    expect(bucketFor('2027-05-01', TODAY)).toBe('later');
  });
});

describe('formatDueDate', () => {
  const TODAY = '2026-08-25';

  it('shows day and month in the current year', () => {
    expect(formatDueDate('2026-08-22', TODAY)).toBe('Aug 22');
  });

  it('appends the year when it differs from today\u2019s', () => {
    expect(formatDueDate('2025-01-05', TODAY)).toBe('Jan 5, 2025');
  });

  it('renders single-digit days without padding', () => {
    expect(formatDueDate('2026-08-05', TODAY)).toBe('Aug 5');
  });

  it('returns malformed input unchanged', () => {
    expect(formatDueDate('garbage', TODAY)).toBe('garbage');
  });
});
