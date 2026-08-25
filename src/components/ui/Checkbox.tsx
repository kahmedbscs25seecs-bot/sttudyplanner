import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  /** Stable accessible name, e.g. Mark "Morning run" done for today. */
  label: string;
  onToggle: () => void;
}

/**
 * A REAL checkbox: binary state means checkbox semantics, so Space-to-toggle
 * and `getByRole('checkbox')` come free — no aria-pressed button emulation.
 * The input is visually hidden; the styled peer span is the control you see
 * and click. `checked` is controlled with a real boolean, never `undefined`.
 *
 * Shared by habit check-off and task completion so the two can't drift apart.
 */
export function Checkbox({ checked, label, onToggle }: CheckboxProps) {
  return (
    <label className="relative inline-flex cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
          checked
            ? 'border-accent bg-accent text-white'
            : 'border-line bg-surface text-transparent hover:border-accent/40 hover:text-accent/30'
        }`}
      >
        <Check className="h-5 w-5" strokeWidth={2.5} />
      </span>
    </label>
  );
}
