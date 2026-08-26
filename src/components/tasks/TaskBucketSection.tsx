import type { DueBucket } from '../../lib/dueDates';
import type { StoredTask } from './types';
import { TaskRow } from './TaskRow';

interface TaskBucketSectionProps {
  bucket: DueBucket;
  tasks: StoredTask[];
  today: string;
  /** Course codes by id, for the per-row chip. */
  courseCodeById: ReadonlyMap<number, string>;
  onToggle: (task: StoredTask) => void;
  onEdit: (task: StoredTask) => void;
  onDelete: (task: StoredTask) => void;
}

const HEADING_LABELS: Record<DueBucket, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'This week',
  later: 'Later',
  none: 'No date',
};

/** One due-date section: heading with count, then the rows. */
export function TaskBucketSection({
  bucket,
  tasks,
  today,
  courseCodeById,
  onToggle,
  onEdit,
  onDelete,
}: TaskBucketSectionProps) {
  const label = HEADING_LABELS[bucket] ?? bucket;

  return (
    <section aria-label={label}>
      <h2
        className={`mb-2 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide ${
          bucket === 'overdue' ? 'text-danger' : 'text-muted'
        }`}
      >
        {label}
        <span className="font-mono text-xs font-medium opacity-70">{tasks.length}</span>
      </h2>
      {/* Single column on purpose — the page reads top-down by urgency. */}
      <ul className="list-none space-y-3">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskRow
              task={task}
              courseCode={
                task.courseId !== undefined ? courseCodeById.get(task.courseId) : undefined
              }
              today={today}
              onToggle={() => onToggle(task)}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
