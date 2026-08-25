import { useEffect, useRef } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** What will happen, stated plainly. Reads as the body of the dialog. */
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Disables both controls while the action is in flight. */
  busy?: boolean;
}

/**
 * Destructive-action confirmation. Focus moves to Cancel whenever the dialog
 * opens — the safe option is what you get by hitting Enter straight away.
 * (Explicit effect, not DOM order: the header ✕ button is the first focusable
 * element inside <dialog>, and native showModal() would pick it.)
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Child effects run before parent ones, so Dialog has already called
  // showModal() by now and this focus sticks.
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
