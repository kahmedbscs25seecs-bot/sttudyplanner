import { useId, type Ref, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  /** Validation message. Present = the field renders in its error state. */
  error?: string;
  /** Persistent help text. Hidden while an error is showing. */
  hint?: string;
  /** React 19 passes `ref` as a normal prop — no forwardRef needed. */
  ref?: Ref<HTMLTextAreaElement>;
}

/**
 * Multi-line sibling of Input — same label/error/hint contract and the same
 * ARIA wiring, so the two read identically inside a form. Vertical-only resize:
 * horizontal dragging breaks the dialog's layout and buys nothing.
 */
export function Textarea({
  label,
  error,
  hint,
  id,
  rows = 3,
  className = '',
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;
  const hintId = `${textareaId}-hint`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`w-full resize-y rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 ${
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
