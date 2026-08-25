/**
 * Local-calendar date helpers and habit-streak math.
 * Dates are 'YYYY-MM-DD' strings in the user's LOCAL timezone; ISO dates
 * compare correctly as plain strings, so boundaries cost nothing.
 */

/** Local-calendar 'YYYY-MM-DD' for a Date (defaults to now). */
export function localDateISO(date: Date = new Date()): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseISO(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/**
 * The local calendar day before `iso`.
 * Calendar arithmetic (not millisecond subtraction): DST days are 23 or 25
 * hours, so subtracting fixed offsets drifts across transitions. Malformed
 * input returns the input unchanged — callers pass stored ISO dates.
 */
export function previousDayISO(iso: string): string {
  const parts = parseISO(iso);
  if (!parts) return iso;
  // Date(y, m, d) normalizes out-of-range d (0 → last day of prior month).
  const prior = new Date(parts.year, parts.month - 1, parts.day - 1);
  return localDateISO(prior);
}

/**
 * Current streak of consecutive completed days.
 *
 * Alive iff the latest completion is TODAY or YESTERDAY (one day of grace —
 * yesterday's run still counts before today is done). The streak then counts
 * backwards through consecutive days from that latest completion.
 *
 * Future-dated rows (clock drift) are ignored entirely: they cannot be real
 * completions, so they must not suppress an otherwise-alive streak.
 *
 * Tolerates unsorted and duplicate input. Examples (today = Wed):
 *   {}                    → 0
 *   {Wed}                 → 1
 *   {Tue}                 → 1   (grace)
 *   {Mon, Tue, Wed}       → 3
 *   {Mon}                 → 0   (Tue missed — grace does not extend two days)
 *   {Thu, Wed}            → 1   (Thu is drift; Wed still counts)
 */
export function currentStreak(dates: readonly string[], today?: string): number {
  if (dates.length === 0) return 0;
  const anchor = today ?? localDateISO();

  // Drop future-dated rows first — they're clock-drift noise, not signal.
  const unique = [...new Set(dates)].filter((date) => date <= anchor).sort();
  const latest = unique.at(-1);
  if (!latest || (latest !== anchor && latest !== previousDayISO(anchor))) {
    return 0;
  }

  let streak = 1;
  for (let i = unique.length - 1; i > 0; i -= 1) {
    const current = unique[i];
    const prior = unique[i - 1];
    if (current === undefined || prior === undefined) break;
    if (previousDayISO(current) !== prior) break;
    streak += 1;
  }
  return streak;
}
