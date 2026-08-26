import { CalendarClock, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { formatDueDate } from '../../lib/dueDates';
import type { StoredTask } from './types';

interface TaskRowProps {
  task: StoredTask;
  /** Course code for the chip; undefined = unassigned (no chip). */
  courseCode?: string;
  today: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Same visual language as HabitRow/CourseCard row actions. */
const actionClass =
  'cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-paper hover:text-ink';

/**
 * One task as a list row — pure presentation. The due date renders relative
 * to `today` ('Aug 22' / 'Aug 22, 2025'); overdue styling is the section's
 * job, so the row itself stays neutral.
 */
export function TaskRow({
  task,
  courseCode,
  today,
  onToggle,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const done = task.status === 'done';

  return (
    <Card className="flex items-center gap-3 p-4">
      {/* Stable name regardless of state, matching the habits precedent —
          `checked` carries the state, the label stays queryable. */}
      <Checkbox
        checked={done}
        label={`Mark "${task.title}" done`}
        onToggle={onToggle}
      />

      <div className="min-w-0 flex-1">
        <h3
          className={`truncate font-display text-[0.95rem] font-semibold leading-snug ${
            done ? 'text-muted line-through' : 'text-ink'
          }`}
        >
          {task.title}
        </h3>
        {task.dueDate && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
            {formatDueDate(task.dueDate, today)}
          </p>
        )}
      </div>

      {courseCode && (
        <span className="shrink-0 rounded-md border border-line bg-paper px-2 py-1 font-mono text-xs font-medium text-ink">
          {courseCode}
        </span>
      )}

      <div className="-mr-1.5 flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit "${task.title}"`}
          className={actionClass}
        >
          <Pencil className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete "${task.title}"`}
          className={`${actionClass} hover:bg-danger-tint hover:text-danger`}
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </Card>
  );
}
