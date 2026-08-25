/**
 * Adjacent-swap helper for manual reordering.
 *
 * Lives in its own module (not inside a component file) because
 * `react-refresh/only-export-components` forbids component files from
 * exporting non-components — and because pure reorder math is unit-testable.
 */

/**
 * Returns a NEW array with positions `i` and `j` exchanged. Out-of-range or
 * equal indices are a no-op copy, so callers can rely on a defined result
 * without pre-checking bounds (row buttons are disabled at the ends anyway).
 */
export function swap(ids: readonly number[], i: number, j: number): number[] {
  const next = [...ids];
  if (i === j) return next;
  if (i < 0 || j < 0 || i >= next.length || j >= next.length) return next;
  const atI = next[i];
  const atJ = next[j];
  if (atI === undefined || atJ === undefined) return next;
  next[i] = atJ;
  next[j] = atI;
  return next;
}
