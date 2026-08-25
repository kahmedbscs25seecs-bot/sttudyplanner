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
 * Destructive-action confirmation. Cancel comes first in the DOM so it takes
 * initial focus inside the modal — the safe option is the one you get by
 * hitting Enter straight away.
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
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
