import { useEffect, useRef, useState, type FormEvent } from 'react';
import { TASK_NOTES_MAX, TASK_TITLE_MAX, updateTask, addTask } from '../../data/tasks';
import type { TaskPatch } from '../../data/tasks';
import { ValidationError } from '../../data/errors';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import type { FieldErrors, StoredTask } from './types';

interface CourseOption {
  id: number;
  code: string;
}

interface TaskFormDialogProps {
  open: boolean;
  /** Present = edit that task. Absent = add a new one. */
  task?: StoredTask;
  courses: CourseOption[];
  onClose: () => void;
}

/**
 * Add/edit form for one task.
 *
 * The submit mapping is the delicate part — it must match the data layer's
 * exact semantics (see src/data/tasks.ts):
 * - ADD (TaskInput): an emptied field is OMITTED — addTask skips undefined
 *   keys, so nothing is stored.
 * - EDIT (TaskPatch): an emptied field sends `null` = CLEAR it; a filled
 *   field sends its value; untouched state isn't resent.
 * (`validatedNotes` rejects '', so the empty-notes case MUST map to null.)
 */
export function TaskFormDialog({ open, task, courses, onClose }: TaskFormDialogProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [courseId, setCourseId] = useState(task?.courseId !== undefined ? String(task.courseId) : '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // Child effects run before parent ones, so Dialog has already called
  // showModal() by now and this focus sticks.
  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  function focusField(field: keyof FieldErrors) {
    const refs: Partial<Record<keyof FieldErrors, typeof titleRef>> = { title: titleRef };
    refs[field]?.current?.focus();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setSaving(true);

    try {
      if (task) {
        // EDIT — null clears, value sets, absent leaves alone.
        const patch: TaskPatch = { title };
        patch.courseId = courseId === '' ? null : Number(courseId);
        patch.dueDate = dueDate.trim() === '' ? null : dueDate;
        const trimmedNotes = notes.trim();
        patch.notes = trimmedNotes === '' ? null : notes;
        await updateTask(task.id, patch);
      } else {
        // ADD — emptied fields are omitted entirely (addTask skips them).
        const input: Parameters<typeof addTask>[0] = { title };
        if (courseId !== '') input.courseId = Number(courseId);
        if (dueDate.trim() !== '') input.dueDate = dueDate;
        if (notes.trim() !== '') input.notes = notes;
        await addTask(input);
      }
      onClose();
    } catch (error) {
      if (error instanceof ValidationError && isTaskField(error.field)) {
        // Assigned via a variable so the key stays a literal for TS.
        const fieldErrors: FieldErrors = {};
        fieldErrors[error.field] = error.message;
        setErrors(fieldErrors);
        focusField(error.field);
      } else {
        setFormError("Couldn't save this task. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={task ? 'Edit task' : 'Add a task'}>
      {/* noValidate: the data layer owns the rules; we show inline messages. */}
      <form onSubmit={(event) => void save(event)} className="space-y-4" noValidate>
        <Input
          ref={titleRef}
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
          autoComplete="off"
          maxLength={TASK_TITLE_MAX}
        />
        <Select
          label="Course"
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          error={errors.courseId}
          options={[
            { value: '', label: '— No course —' },
            ...courses.map((course) => ({
              value: String(course.id),
              label: course.code,
            })),
          ]}
        />
        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          error={errors.dueDate}
          hint="Optional — leave empty for no deadline"
        />
        <Textarea
          label="Notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          error={errors.notes}
          rows={3}
          maxLength={TASK_NOTES_MAX}
          hint={`Optional — up to ${TASK_NOTES_MAX} characters`}
        />

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger-tint px-3 py-2 text-xs font-medium text-danger"
          >
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : task ? 'Save changes' : 'Add task'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

const TASK_FIELDS: readonly string[] = ['title', 'courseId', 'dueDate', 'notes'];

function isTaskField(field: string): field is keyof FieldErrors {
  return TASK_FIELDS.includes(field);
}
