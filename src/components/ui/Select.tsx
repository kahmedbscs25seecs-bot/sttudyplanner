import { useId, type Ref, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  /** Option values, rendered in order. */
  options: readonly { value: string; label: string }[];
  /** React 19 passes `ref` as a normal prop — no forwardRef needed. */
  ref?: Ref<HTMLSelectElement>;
}

/**
 * Labeled select. Used wherever the data layer only accepts a small closed set
 * (credit hours, difficulty) — a select makes an out-of-range value impossible
 * to submit instead of relying on a message after the fact.
 *
 * `appearance-none` drops the OS control styling so the field matches Input, so
 * the chevron has to be drawn back in — without it the field reads as a text
 * box and the dropdown is undiscoverable.
 */
export function Select({
  label,
  error,
  options,
  id,
  className = '',
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full appearance-none rounded-lg border bg-surface py-2 pl-3 pr-9 text-sm text-ink ${
            error ? 'border-danger focus:border-danger' : 'border-line focus:border-accent'
          } ${className}`}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          strokeWidth={1.75}
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
