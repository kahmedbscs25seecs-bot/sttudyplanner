import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  /** Called when the dialog closes — via Escape, the ✕, or a child action. */
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Modal built on the native `<dialog>` element, which gives us focus trapping,
 * Escape-to-close, and inert background content from the platform — no
 * focus-trap library and no `aria-modal` bookkeeping.
 *
 * Deliberately does *not* close on backdrop click: these dialogs hold typed
 * input, and a stray click outside shouldn't discard it. Escape and the
 * explicit controls are the ways out.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Mirror React state onto the imperative dialog API. Guarded on `el.open` so
  // re-renders don't call showModal() on an already-open dialog (which throws).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-surface p-0 text-ink shadow-[0_8px_32px_rgba(17,24,32,0.16)] backdrop:bg-ink/40"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id={titleId} className="font-display text-base font-semibold text-ink">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="-mr-1 -mt-0.5 cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-paper hover:text-ink"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
