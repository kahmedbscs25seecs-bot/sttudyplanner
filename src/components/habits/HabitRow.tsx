import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { HabitCheckoff } from './HabitCheckoff';
import { HabitStreakBadge } from './HabitStreakBadge';
import type { StoredHabit } from './types';

interface HabitRowProps {
  habit: StoredHabit;
  done: boolean;
  streak: number;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/** Same visual language as CourseCard's row actions. */
const actionClass =
  'cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40';

/**
 * One habit as a list row — pure presentation. All state (`done`, `streak`,
 * position flags) is derived in the page so the row never owns data logic.
 * Actions are always visible (hover-reveal is unreachable on touch), and
 * reorder is buttons-first: keyboard-operable, disabled at the ends.
 */
export function HabitRow({
  habit,
  done,
  streak,
  isFirst,
  isLast,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: HabitRowProps) {
  const title = habit.title;

  return (
    <Card className="flex items-center gap-3 p-4">
      <HabitCheckoff done={done} label={`Mark "${title}" done for today`} onToggle={onToggle} />

      <h3
        className={`min-w-0 flex-1 truncate font-display text-[0.95rem] font-semibold leading-snug ${
          done ? 'text-muted line-through' : 'text-ink'
        }`}
      >
        {title}
      </h3>

      <HabitStreakBadge streak={streak} />

      <div className="-mr-1.5 flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label={`Move "${title}" up`}
          className={actionClass}
        >
          <ChevronUp className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label={`Move "${title}" down`}
          className={actionClass}
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit "${title}"`}
          className={actionClass}
        >
          <Pencil className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete "${title}"`}
          className={`${actionClass} hover:bg-danger-tint hover:text-danger`}
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </Card>
  );
}
