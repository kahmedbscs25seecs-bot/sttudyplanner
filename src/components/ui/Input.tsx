import { useId, type InputHTMLAttributes, type Ref } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Validation message. Present = the field renders in its error state. */
  error?: string;
  /** Persistent help text. Hidden while an error is showing. */
  hint?: string;
  /** React 19 passes `ref` as a normal prop — no forwardRef needed. */
  ref?: Ref<HTMLInputElement>;
}

/**
 * Labeled text input. Focus shifts the border to the accent color; an `error`
 * shifts it to danger and wires `aria-invalid` + `aria-describedby` so screen
 * readers announce the reason when focus lands on the field.
 */
export function Input({ label, error, hint, id, className = '', ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 ${
          error ? 'border-danger focus:border-danger' : 'border-line focus:border-accent'
        } ${className}`}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
