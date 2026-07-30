import { Loader } from "lucide-react";
import { useDialogA11y } from "@/hooks/useDialogA11y.ts";

type ConfirmDialogProps = {
  message: string;
  error: string | null;
  isLoading: boolean;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
};

export function ConfirmDialog({
  message,
  error,
  isLoading,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  children,
}: Readonly<ConfirmDialogProps>) {
  const dialogRef = useDialogA11y(onCancel);
  return (
    <div className="confirm-dialog-overlay">
      <div
        ref={dialogRef}
        className="confirm-dialog"
        style={children ? { position: "relative", overflow: "visible" } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-describedby="confirm-dialog-message"
      >
        {children}
        <p id="confirm-dialog-message">{message}</p>
        {error && <span className="confirm-dialog__error">{error}</span>}
        <div className="confirm-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isLoading}>{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={isLoading} aria-busy={isLoading}>
            {isLoading && <Loader size={14} className="confirm-dialog__spinner" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
