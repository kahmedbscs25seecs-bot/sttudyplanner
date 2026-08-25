import { useId, type Ref } from 'react';
import { DIFFICULTY_STEPS, difficultyLabel } from './difficulty';

interface DifficultyPickerProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  /** Attached to the first radio so validation errors can focus the group. */
  ref?: Ref<HTMLInputElement>;
}

/**
 * Difficulty input as a fill-to-level segmented control, echoing
 * DifficultyMeter's shape. Built from real radios inside a fieldset, so arrow
 * keys move between levels and the legend is announced as the group name —
 * behavior we'd have to hand-roll with buttons.
 *
 * An `error` wires `aria-invalid` + `aria-describedby` onto every radio, not the
 * wrapping div — a plain div is in no control's accessibility tree, so a screen
 * reader landing on a radio would never announce it. A shared description id
 * across a radio group is valid ARIA.
 */
export function DifficultyPicker({ value, onChange, error, ref }: DifficultyPickerProps) {
  const errorId = useId();

  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 block text-sm font-medium text-ink">Difficulty</legend>
      <div className="flex gap-1.5">
        {DIFFICULTY_STEPS.map((step) => (
          <label key={step} className="flex-1 cursor-pointer">
            <input
              ref={step === 1 ? ref : undefined}
              type="radio"
              name="difficulty"
              value={step}
              checked={value === step}
              onChange={() => onChange(step)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="peer sr-only"
            />
            <span
              className={`flex h-9 items-center justify-center rounded-md border font-mono text-xs transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                step <= value
                  ? 'border-accent bg-accent text-white'
                  : 'border-line bg-surface text-muted hover:border-accent/40 hover:text-ink'
              }`}
            >
              {step}
            </span>
          </label>
        ))}
      </div>
      <p className="text-xs text-muted">
        Selected: <span className="text-ink">{difficultyLabel(value)}</span>
      </p>
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
