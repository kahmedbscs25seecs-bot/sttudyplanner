import { describe, expect, it } from 'vitest';
import { currentStreak, localDateISO, previousDayISO } from './streaks';

describe('localDateISO', () => {
  it('formats a local date zero-padded', () => {
    // Month/day components, not UTC — constructed in local time on purpose.
    expect(localDateISO(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(localDateISO(new Date(2026, 10, 23))).toBe('2026-11-23');
  });
});

describe('previousDayISO', () => {
  it('steps back within a month with zero padding', () => {
    expect(previousDayISO('2026-01-05')).toBe('2026-01-04');
  });

  it('steps into the prior month', () => {
    expect(previousDayISO('2026-03-01')).toBe('2026-02-28'); // 2026 is not a leap year
  });

  it('handles leap years', () => {
    expect(previousDayISO('2024-03-01')).toBe('2024-02-29');
  });

  it('crosses year boundaries', () => {
    expect(previousDayISO('2026-01-01')).toBe('2025-12-31');
  });

  it('is DST-safe (calendar arithmetic, no millisecond math)', () => {
    // 2026-03-08 is a US DST spring-forward; stepping over it must stay exact
    // regardless of the runner's timezone.
    expect(previousDayISO('2026-03-09')).toBe('2026-03-08');
  });

  it('returns malformed input unchanged', () => {
    expect(previousDayISO('not-a-date')).toBe('not-a-date');
  });
});

describe('currentStreak', () => {
  const WED = '2026-01-07';
  const TUE = '2026-01-06';
  const MON = '2026-01-05';
  const SUN = '2026-01-04';

  it('is 0 for no completions', () => {
    expect(currentStreak([], WED)).toBe(0);
  });

  it('counts today alone', () => {
    expect(currentStreak([WED], WED)).toBe(1);
  });

  it('counts yesterday alone via the grace rule', () => {
    expect(currentStreak([TUE], WED)).toBe(1);
  });

  it('counts an unbroken run ending today', () => {
    expect(currentStreak([SUN, MON, TUE, WED], WED)).toBe(4);
  });

  it('pinned case: Monday-only is dead by Wednesday (grace is one day)', () => {
    expect(currentStreak([MON], WED)).toBe(0);
  });

  it('counts a chain ending yesterday at full length', () => {
    expect(currentStreak([SUN, MON, TUE], WED)).toBe(3);
  });

  it('stops at a gap inside the run', () => {
    expect(currentStreak([MON, WED], WED)).toBe(1);
    expect(currentStreak([SUN, TUE, WED], WED)).toBe(2);
  });

  it('is 0 when the latest completion is older than yesterday', () => {
    expect(currentStreak([SUN], WED)).toBe(0);
  });

  it('tolerates unsorted and duplicate input', () => {
    expect(currentStreak([WED, MON, WED, TUE], WED)).toBe(3);
  });

  it('treats future-dated rows as dead (defensive against clock drift)', () => {
    expect(currentStreak(['2026-01-08'], WED)).toBe(0);
  });

  it('crosses month boundaries via string comparison', () => {
    expect(currentStreak(['2026-01-31', '2026-02-01'], '2026-02-01')).toBe(2);
  });

  it('crosses year boundaries via string comparison', () => {
    expect(currentStreak(['2025-12-31', '2026-01-01'], '2026-01-01')).toBe(2);
  });

  it('defaults `today` to the local day', () => {
    const today = localDateISO();
    expect(currentStreak([])).toBe(0);
    expect(currentStreak([today])).toBe(1);
  });
});
