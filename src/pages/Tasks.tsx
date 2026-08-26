import { useState } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { useCourses } from '../data/courses';
import {
  deleteTask,
  setTaskStatus,
  useTasks,
} from '../data/tasks';
import { localDateISO } from '../lib/streaks';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { DoneSection } from '../components/tasks/DoneSection';
import { TaskBucketSection } from '../components/tasks/TaskBucketSection';
import { TaskFormDialog } from '../components/tasks/TaskFormDialog';
import { groupByBucket } from '../components/tasks/buckets';
import { hasId as taskHasId, type StoredTask } from '../components/tasks/types';
import { hasId as courseHasId } from '../components/courses/types';

interface FormState {
  open: boolean;
  /** Absent = adding. Kept across close so the title doesn't flicker. */
  task?: StoredTask;
  /** Bumped on every open; used as the form's `key` to remount it clean. */
  session: number;
}

/** Placeholder row matching TaskRow's shape while the first read resolves. */
function TaskRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="h-9 w-9 rounded-full bg-line" />
      <div className="h-4 w-1/3 rounded bg-line" />
      <div className="ml-auto h-6 w-14 rounded-md bg-line" />
    </div>
  );
}

export function Tasks() {
  const tasks = useTasks();
  const courses = useCourses();
  const [form, setForm] = useState<FormState>({ open: false, session: 0 });
  const [pendingDelete, setPendingDelete] = useState<StoredTask | null>(null);
  const [deleting, setDeleting] = useState(false);
  // ONE error banner (Day-3 lesson): cleared at the start of every mutating
  // action, so a stale failure can never mask a later outcome.
  const [actionError, setActionError] = useState<string | null>(null);

  // One timestamp per render: bucket boundaries and labels must agree even if
  // a render straddles midnight; the next interaction picks up the new day.
  const today = localDateISO();

  const stored = tasks?.filter(taskHasId);
  // Gate on BOTH queries — sections and course chips resolve together.
  const loading = stored === undefined || courses === undefined;

  const open = stored?.filter((t) => t.status === 'todo') ?? [];
  const done = stored?.filter((t) => t.status === 'done') ?? [];
  const buckets = stored ? groupByBucket(open, today) : [];

  const courseCodeById = new Map<number, string>(
    (courses ?? []).filter(courseHasId).map((course) => [course.id, course.code]),
  );

  const openAdd = () => setForm((prev) => ({ open: true, session: prev.session + 1 }));
  const openEdit = (task: StoredTask) =>
    setForm((prev) => ({ open: true, task, session: prev.session + 1 }));
  const closeForm = () => setForm((prev) => ({ ...prev, open: false }));

  function toggle(task: StoredTask) {
    setActionError(null);
    // Absolute status (not a toggle): rapid double-clicks stay idempotent.
    setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done').catch(() => {
      setActionError("Couldn't save that status change. Please try again.");
    });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteTask(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setActionError(`Couldn't delete "${pendingDelete.title}". Please try again.`);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const subtitle =
    stored && stored.length > 0
      ? `${String(open.length)} ${open.length === 1 ? 'task' : 'tasks'} open · ${String(done.length)} done`
      : "Assignments and deadlines, sorted by what's due next.";

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={subtitle}
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add task
          </Button>
        }
      />

      {actionError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger/30 bg-danger-tint px-3 py-2 text-sm font-medium text-danger"
        >
          {actionError}
        </p>
      )}

      {loading ? (
        <>
          <p role="status" className="sr-only">
            Loading tasks…
          </p>
          <div className="space-y-3">
            <TaskRowSkeleton />
            <TaskRowSkeleton />
            <TaskRowSkeleton />
          </div>
        </>
      ) : stored.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description="Add assignments and personal deadlines — each can carry a due date and link to a course, or stand entirely alone."
          action={
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add your first task
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {buckets.map(({ bucket, tasks: bucketTasks }) => (
            <TaskBucketSection
              key={bucket}
              bucket={bucket}
              tasks={bucketTasks}
              today={today}
              courseCodeById={courseCodeById}
              onToggle={toggle}
              onEdit={openEdit}
              onDelete={setPendingDelete}
            />
          ))}

          <DoneSection
            tasks={[...done]}
            today={today}
            onUncomplete={(task) => toggle(task)}
          />
        </div>
      )}

      <TaskFormDialog
        key={form.session}
        open={form.open}
        task={form.task}
        courses={(courses ?? []).filter(courseHasId).map((course) => ({
          id: course.id,
          code: course.code,
        }))}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete task?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed. This can't be undone.`
            : ''
        }
        confirmLabel="Delete task"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
