import { Flame } from 'lucide-react';

interface HabitStreakBadgeProps {
  streak: number;
}

/**
 * Current-streak chip. Renders NOTHING at ≤0 — an empty badge reads as noise,
 * and absence is the zero state. The sr-only text gives the number a
 * queryable, self-describing accessible name.
 */
export function HabitStreakBadge({ streak }: HabitStreakBadgeProps) {
  if (streak <= 0) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-accent-tint px-2 py-1 font-mono text-xs font-medium text-accent">
      <Flame aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
      {streak}
      <span className="sr-only">{streak} day streak</span>
    </span>
  );
}
