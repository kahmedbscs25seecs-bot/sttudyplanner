import { Pencil, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { DifficultyMeter } from './DifficultyMeter';
import type { StoredCourse } from './types';

interface CourseCardProps {
  course: StoredCourse;
  onEdit: (course: StoredCourse) => void;
  onDelete: (course: StoredCourse) => void;
}

/**
 * One course at a glance: the code as a mono chip (the identifier you actually
 * search by), the name, then credit hours and difficulty on a footer rule.
 *
 * Actions stay permanently visible rather than appearing on hover — hover
 * reveals are unreachable on touch.
 */
export function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  const actionClass =
    'cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-paper hover:text-ink';

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-md border border-line bg-paper px-2 py-1 font-mono text-xs font-medium text-ink">
          {course.code}
        </span>
        <div className="-mr-1.5 -mt-1.5 flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => onEdit(course)}
            aria-label={`Edit ${course.code}`}
            className={actionClass}
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(course)}
            aria-label={`Delete ${course.code}`}
            className={`${actionClass} hover:bg-danger-tint hover:text-danger`}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <h3 className="font-display text-[0.95rem] font-semibold leading-snug text-ink">
        {course.name}
      </h3>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-3">
        <span className="text-xs text-muted">
          <span className="font-mono text-ink">{course.creditHours}</span>{' '}
          {course.creditHours === 1 ? 'credit hour' : 'credit hours'}
        </span>
        <DifficultyMeter value={course.difficulty} />
      </div>
    </Card>
  );
}
