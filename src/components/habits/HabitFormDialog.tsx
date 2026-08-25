import { useEffect, useRef, useState, type FormEvent } from 'react';
import { addHabit, HABIT_TITLE_MAX, updateHabit } from '../../data/habits';
import { ValidationError } from '../../data/errors';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import type { StoredHabit } from './types';

interface HabitFormDialogProps {
  open: boolean;
  /** Present = edit that habit. Absent = add a new one. */
  habit?: StoredHabit;
  onClose: () => void;
}

/**
 * Add/edit form for a single habit — one free-text field. State is seeded
 * from props at mount; the page supplies a per-open `key`, so each open
 * remounts with fresh state (no reset-in-an-effect).
 *
 * The data layer owns validation: `ValidationError` with field `'title'`
 * maps onto the input, everything else is a generic failure.
 */
export function HabitFormDialog({ open, habit, onClose }: HabitFormDialogProps) {
  const [title, setTitle] = useState(habit?.title ?? '');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // Child effects run before parent ones, so Dialog has already called
  // showModal() by now and this focus sticks.
  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFormError(null);
    setSaving(true);

    try {
      if (habit) await updateHabit(habit.id, { title });
      else await addHabit({ title });
      onClose();
    } catch (err) {
      if (err instanceof ValidationError && err.field === 'title') {
        setError(err.message);
        // Keyboard users land back on the field that needs fixing.
        titleRef.current?.focus();
      } else {
        setFormError("Couldn't save this habit. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={habit ? 'Edit habit' : 'Add a habit'}>
      {/* noValidate: the data layer owns the rules; we show inline messages. */}
      <form onSubmit={(event) => void save(event)} className="space-y-4" noValidate>
        <Input
          ref={titleRef}
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={error ?? undefined}
          hint={`Up to ${HABIT_TITLE_MAX} characters`}
          autoComplete="off"
          maxLength={HABIT_TITLE_MAX}
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
            {saving ? 'Saving…' : habit ? 'Save changes' : 'Add habit'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
