import { Check } from 'lucide-react';

interface HabitCheckoffProps {
  done: boolean;
  /** Stable accessible name, e.g. Mark "Morning run" done for today. */
  label: string;
  onToggle: () => void;
}

/**
 * Today's check-off as a REAL checkbox: binary state means checkbox semantics,
 * so Space-to-toggle and `getByRole('checkbox')` come free — no aria-pressed
 * button emulation. The input is visually hidden; the styled peer span is the
 * control you see and click. `checked` is controlled with a real boolean.
 */
export function HabitCheckoff({ done, label, onToggle }: HabitCheckoffProps) {
  return (
    <label className="relative inline-flex cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        checked={done}
        onChange={onToggle}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
          done
            ? 'border-accent bg-accent text-white'
            : 'border-line bg-surface text-transparent hover:border-accent/40 hover:text-accent/30'
        }`}
      >
        <Check className="h-5 w-5" strokeWidth={2.5} />
      </span>
    </label>
  );
}
