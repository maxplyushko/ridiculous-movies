import { Loader } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

type ConfirmDialogProps = {
  message: string;
  error: string | null;
  isLoading: boolean;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    node.showModal();
    return () => node.close();
  }, []);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const onNativeCancel = (e: Event) => {
      e.preventDefault();
      onCancel();
    };
    node.addEventListener("cancel", onNativeCancel);
    return () => node.removeEventListener("cancel", onNativeCancel);
  }, [onCancel]);

  return (
    <dialog ref={dialogRef} className="confirm-dialog" aria-describedby="confirm-dialog-message">
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
    </dialog>
  );
}
