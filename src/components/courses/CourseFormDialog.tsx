import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  addCourse,
  DuplicateCodeError,
  updateCourse,
  ValidationError,
  type CourseInput,
} from '../../data/courses';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DifficultyPicker } from './DifficultyPicker';
import type { StoredCourse } from './types';

type FieldErrors = Partial<Record<keyof CourseInput, string>>;

const CREDIT_HOUR_OPTIONS = [1, 2, 3, 4, 5, 6].map((hours) => ({
  value: String(hours),
  label: String(hours),
}));

const DEFAULT_CREDIT_HOURS = '3';
const DEFAULT_DIFFICULTY = 3;

/**
 * `ValidationError.message` is prefixed with the field name — "code: Use 2–10
 * characters…" — which is right for a log but wrong beside a label that already
 * reads "Course code". Strips that prefix for display, falling back to the full
 * message if the data layer ever stops adding it.
 *
 * Raised with ox-alpha as a finding: the error should carry the bare message so
 * the UI doesn't have to reverse-engineer it. This goes away when it does.
 */
function fieldMessage(error: ValidationError): string {
  const prefix = `${error.field}: `;
  return error.message.startsWith(prefix)
    ? error.message.slice(prefix.length)
    : error.message;
}

interface CourseFormDialogProps {
  open: boolean;
  /** Present = edit that course. Absent = add a new one. */
  course?: StoredCourse;
  onClose: () => void;
}

/**
 * Add/edit form for a single course.
 *
 * The data layer is the only validator. Rather than re-implement its rules here
 * (two sources of truth that drift), the form submits and maps what comes back:
 * `ValidationError.field` names the input to flag, `DuplicateCodeError` always
 * means the code field. Credit hours and difficulty use closed-set controls, so
 * an out-of-range number can't be submitted in the first place — which leaves
 * the two free-text fields as the only realistic error sources.
 *
 * Field state is seeded from props at mount. The page gives this component a
 * `key` that changes on every open, so each open remounts with fresh state —
 * no reset-in-an-effect, and a cancelled edit can't leak into the next add.
 */
export function CourseFormDialog({ open, course, onClose }: CourseFormDialogProps) {
  const [code, setCode] = useState(course?.code ?? '');
  const [name, setName] = useState(course?.name ?? '');
  const [creditHours, setCreditHours] = useState(
    String(course?.creditHours ?? DEFAULT_CREDIT_HOURS),
  );
  const [difficulty, setDifficulty] = useState(course?.difficulty ?? DEFAULT_DIFFICULTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const creditHoursRef = useRef<HTMLSelectElement>(null);
  const difficultyRef = useRef<HTMLInputElement>(null);

  // Child effects run before parent ones, so Dialog has already called
  // showModal() by now and this focus sticks. Without it the platform would
  // focus the ✕ button, which is first in the dialog's DOM order.
  useEffect(() => {
    if (open) codeRef.current?.focus();
  }, [open]);

  function focusField(field: keyof CourseInput) {
    const refs = {
      code: codeRef,
      name: nameRef,
      creditHours: creditHoursRef,
      difficulty: difficultyRef,
    };
    refs[field].current?.focus();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setSaving(true);

    const input: CourseInput = {
      code,
      name,
      creditHours: Number(creditHours),
      difficulty,
    };

    try {
      if (course) await updateCourse(course.id, input);
      else await addCourse(input);
      onClose();
    } catch (error) {
      if (error instanceof ValidationError) {
        // Assigned via a variable so the key stays a literal for TS.
        const fieldErrors: FieldErrors = {};
        fieldErrors[error.field] = fieldMessage(error);
        setErrors(fieldErrors);
        focusField(error.field);
      } else if (error instanceof DuplicateCodeError) {
        setErrors({ code: error.message });
        focusField('code');
      } else {
        setFormError("Couldn't save this course. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={course ? `Edit ${course.code}` : 'Add a course'}
    >
      {/* noValidate: the data layer owns the rules, so we suppress the
          browser's own bubbles and show our inline messages instead. */}
      <form onSubmit={(event) => void save(event)} className="space-y-4" noValidate>
        <Input
          ref={codeRef}
          label="Course code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          error={errors.code}
          hint="Letters, numbers and hyphens — e.g. CS-101"
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
        />
        <Input
          ref={nameRef}
          label="Course name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          autoComplete="off"
        />
        <Select
          ref={creditHoursRef}
          label="Credit hours"
          value={creditHours}
          onChange={(event) => setCreditHours(event.target.value)}
          error={errors.creditHours}
          options={CREDIT_HOUR_OPTIONS}
        />
        <DifficultyPicker
          ref={difficultyRef}
          value={difficulty}
          onChange={setDifficulty}
          error={errors.difficulty}
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
            {saving ? 'Saving…' : course ? 'Save changes' : 'Add course'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
