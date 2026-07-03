import { Loader } from "lucide-react";

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
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog" style={children ? { position: "relative", overflow: "visible" } : undefined} onClick={(e) => e.stopPropagation()}>
        {children}
        <p>{message}</p>
        {error && <span className="confirm-dialog__error">{error}</span>}
        <div className="confirm-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isLoading}>{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <Loader size={14} className="confirm-dialog__spinner" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
