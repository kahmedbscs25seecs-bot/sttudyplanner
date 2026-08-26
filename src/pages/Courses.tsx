import { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { deleteCourse, useCourses } from '../data/courses';
import { useTaskCountsByCourse } from '../data/tasks';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { CourseCard } from '../components/courses/CourseCard';
import { CourseFormDialog } from '../components/courses/CourseFormDialog';
import { hasId, type StoredCourse } from '../components/courses/types';

interface FormState {
  open: boolean;
  /** Absent = adding. Kept across close so the title doesn't flicker. */
  course?: StoredCourse;
  /** Bumped on every open; used as the form's `key` to remount it clean. */
  session: number;
}

/** Placeholder card matching CourseCard's shape while the first read resolves. */
function CourseSkeleton() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="h-6 w-20 rounded-md bg-line" />
      <div className="h-4 w-3/4 rounded bg-line" />
      <div className="mt-1 flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="h-3 w-24 rounded bg-line" />
        <div className="h-3 w-20 rounded bg-line" />
      </div>
    </Card>
  );
}

export function Courses() {
  const courses = useCourses();
  const taskCountsByCourse = useTaskCountsByCourse();
  const [form, setForm] = useState<FormState>({ open: false, session: 0 });
  const [pendingDelete, setPendingDelete] = useState<StoredCourse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // useCourses() gives undefined while loading and [] when there are genuinely
  // no courses — different screens, so they're never collapsed into one check.
  const stored = courses?.filter(hasId);
  const totalCreditHours = stored?.reduce((sum, course) => sum + course.creditHours, 0) ?? 0;

  const openAdd = () =>
    setForm((prev) => ({ open: true, session: prev.session + 1 }));
  const openEdit = (course: StoredCourse) =>
    setForm((prev) => ({ open: true, course, session: prev.session + 1 }));
  const closeForm = () => setForm((prev) => ({ ...prev, open: false }));

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCourse(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setDeleteError(`Couldn't delete ${pendingDelete.code}. Please try again.`);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  // The confirm names the consequence: tasks are KEPT and moved to Unassigned
  // (Day-3 deletion policy — user content is never destroyed as a side effect).
  const pendingTaskCount = pendingDelete
    ? (taskCountsByCourse?.get(pendingDelete.id) ?? 0)
    : 0;
  const taskSentence =
    pendingTaskCount === 0
      ? ''
      : ` Its ${pendingTaskCount} ${pendingTaskCount === 1 ? 'task' : 'tasks'} will be kept and moved to Unassigned.`;

  const subtitle =
    stored && stored.length > 0
      ? `${String(stored.length)} ${stored.length === 1 ? 'course' : 'courses'} · ${String(totalCreditHours)} credit hours`
      : "Your semester's courses — the spine of everything.";

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle={subtitle}
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add course
          </Button>
        }
      />

      {deleteError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger/30 bg-danger-tint px-3 py-2 text-sm font-medium text-danger"
        >
          {deleteError}
        </p>
      )}

      {stored === undefined ? (
        <>
          <p role="status" className="sr-only">
            Loading courses…
          </p>
          <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <CourseSkeleton />
            <CourseSkeleton />
            <CourseSkeleton />
          </div>
        </>
      ) : stored.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Add your semester's courses by code, name, credit hours and difficulty. Tasks, habits and resources will all link back to them."
          action={
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add your first course
            </Button>
          }
        />
      ) : (
        <ul className="grid list-none gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stored.map((course) => (
            <li key={course.id}>
              <CourseCard course={course} onEdit={openEdit} onDelete={setPendingDelete} />
            </li>
          ))}
        </ul>
      )}

      <CourseFormDialog
        key={form.session}
        open={form.open}
        course={form.course}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete course?"
        message={
          pendingDelete
            ? `${pendingDelete.code} — ${pendingDelete.name} will be removed.${taskSentence} This can't be undone.`
            : ''
        }
        confirmLabel="Delete course"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
