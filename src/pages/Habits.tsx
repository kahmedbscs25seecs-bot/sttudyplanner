import { useState } from 'react';
import { Flame, Plus } from 'lucide-react';
import {
  deleteHabit,
  reorderHabits,
  setCompleted,
  useCompletionsByHabit,
  useHabits,
} from '../data/habits';
import { currentStreak, localDateISO } from '../lib/streaks';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { HabitFormDialog } from '../components/habits/HabitFormDialog';
import { HabitRow } from '../components/habits/HabitRow';
import { swap } from '../components/habits/reorder';
import { hasId, type StoredHabit } from '../components/habits/types';

interface FormState {
  open: boolean;
  /** Absent = adding. Kept across close so the title doesn't flicker. */
  habit?: StoredHabit;
  /** Bumped on every open; used as the form's `key` to remount it clean. */
  session: number;
}

/** Placeholder row matching HabitRow's shape while the first read resolves. */
function HabitRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="h-9 w-9 rounded-full bg-line" />
      <div className="h-4 w-1/3 rounded bg-line" />
      <div className="ml-auto h-6 w-14 rounded-md bg-line" />
    </div>
  );
}

export function Habits() {
  const habits = useHabits();
  const completionsByHabit = useCompletionsByHabit();
  const [form, setForm] = useState<FormState>({ open: false, session: 0 });
  const [pendingDelete, setPendingDelete] = useState<StoredHabit | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // One timestamp per render: check-off state and streak math must agree even
  // if a render straddles midnight; the next interaction picks up the new day.
  const today = localDateISO();

  const stored = habits?.filter(hasId);

  // Gate on BOTH queries — otherwise streak badges and check states pop in a
  // frame late while completions are still resolving.
  const loading = stored === undefined || completionsByHabit === undefined;

  /**
   * Absolute state (not a toggle): two rapid clicks before a re-render both
   * send the SAME `done`, so idempotency makes the second a harmless no-op —
   * never an unintended un-check. Don't "simplify" this to !done-from-db.
   */
  function isDone(habit: StoredHabit): boolean {
    return completionsByHabit?.get(habit.id)?.includes(today) ?? false;
  }

  const doneCount = stored?.filter(isDone).length ?? 0;

  const openAdd = () => setForm((prev) => ({ open: true, session: prev.session + 1 }));
  const openEdit = (habit: StoredHabit) =>
    setForm((prev) => ({ open: true, habit, session: prev.session + 1 }));
  const closeForm = () => setForm((prev) => ({ ...prev, open: false }));

  function toggle(habit: StoredHabit) {
    setActionError(null);
    setCompleted(habit.id, today, !isDone(habit)).catch(() => {
      setActionError("Couldn't save that check-off. Please try again.");
    });
  }

  /** delta −1 = up, +1 = down; ends are guarded here AND by disabled buttons. */
  function move(habit: StoredHabit, delta: -1 | 1) {
    if (!stored) return;
    const ids = stored.map((h) => h.id);
    const index = ids.indexOf(habit.id);
    const target = index + delta;
    if (index === -1 || target < 0 || target >= ids.length) return;
    setActionError(null);
    reorderHabits(swap(ids, index, target)).catch(() => {
      setActionError("Couldn't save that order. Please try again.");
    });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteHabit(pendingDelete.id); // cascades check-off history
      setPendingDelete(null);
    } catch {
      setDeleteError(`Couldn't delete "${pendingDelete.title}". Please try again.`);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const subtitle =
    stored && stored.length > 0
      ? `${String(stored.length)} ${stored.length === 1 ? 'habit' : 'habits'} · ${String(doneCount)} done today`
      : 'Small daily actions that compound over a semester.';

  return (
    <div>
      <PageHeader
        title="Habits"
        subtitle={subtitle}
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add habit
          </Button>
        }
      />

      {(deleteError ?? actionError) && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger/30 bg-danger-tint px-3 py-2 text-sm font-medium text-danger"
        >
          {deleteError ?? actionError}
        </p>
      )}

      {loading ? (
        <>
          <p role="status" className="sr-only">
            Loading habits…
          </p>
          <div className="space-y-3">
            <HabitRowSkeleton />
            <HabitRowSkeleton />
            <HabitRowSkeleton />
          </div>
        </>
      ) : stored.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="No habits yet"
          description="Add small daily actions — revision sprints, reading, exercise. Check them off each day and watch the streaks build."
          action={
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add your first habit
            </Button>
          }
        />
      ) : (
        // Single column on purpose: manual reorder is only meaningful in 1-D.
        <ul className="list-none space-y-3">
          {stored.map((habit, index) => (
            <li key={habit.id}>
              <HabitRow
                habit={habit}
                done={isDone(habit)}
                streak={currentStreak(completionsByHabit?.get(habit.id) ?? [], today)}
                isFirst={index === 0}
                isLast={index === stored.length - 1}
                onToggle={() => toggle(habit)}
                onEdit={() => openEdit(habit)}
                onDelete={() => setPendingDelete(habit)}
                onMoveUp={() => move(habit, -1)}
                onMoveDown={() => move(habit, 1)}
              />
            </li>
          ))}
        </ul>
      )}

      <HabitFormDialog
        key={form.session}
        open={form.open}
        habit={form.habit}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete habit?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" and its check-off history will be removed. This can't be undone.`
            : ''
        }
        confirmLabel="Delete habit"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
