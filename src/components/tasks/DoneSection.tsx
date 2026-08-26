import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { formatDueDate } from '../../lib/dueDates';
import type { StoredTask } from './types';

interface DoneSectionProps {
  tasks: StoredTask[];
  today: string;
  onUncomplete: (task: StoredTask) => void;
}

/**
 * Completed tasks, collapsed by default via a native <details> disclosure —
 * keyboard operation, aria-expanded and toggling come free from the platform.
 * Sorted most-recently-completed first; a stampless row (shouldn't exist,
 * but never say never) sinks to the end.
 */
export function DoneSection({ tasks, today, onUncomplete }: DoneSectionProps) {
  if (tasks.length === 0) return null;

  const sorted = [...tasks].sort((a, b) => {
    if (a.completedAt && b.completedAt && a.completedAt !== b.completedAt) {
      return a.completedAt < b.completedAt ? 1 : -1;
    }
    if (a.completedAt !== b.completedAt) return a.completedAt ? -1 : 1;
    return (b.id ?? 0) - (a.id ?? 0);
  });

  return (
    <details className="group">
      <summary className="cursor-pointer list-none">
        {/* Count sits beside the heading, not inside it — keeps the h2's
            accessible name exactly "Done", trivially queryable. */}
        <h2 className="mr-2 inline-flex font-display text-sm font-semibold uppercase tracking-wide text-muted transition-colors group-open:text-ink">
          Done
        </h2>
        <span className="font-mono text-xs font-medium text-muted">{tasks.length}</span>
      </summary>
      <ul className="mt-3 list-none space-y-3 opacity-80">
        {sorted.map((task) => (
          <li key={task.id}>
            <Card className="flex items-center gap-3 p-4">
              <Checkbox
                checked
                label={`Mark "${task.title}" done`}
                onToggle={() => onUncomplete(task)}
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-[0.95rem] font-semibold leading-snug text-muted line-through">
                  {task.title}
                </h3>
                {task.dueDate && (
                  <p className="mt-0.5 text-xs text-muted">
                    Was due {formatDueDate(task.dueDate, today)}
                  </p>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </details>
  );
}
