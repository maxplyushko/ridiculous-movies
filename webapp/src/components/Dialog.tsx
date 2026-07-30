import { useEffect, useRef, type ReactNode } from "react";

type DialogProps = {
  className: string;
  onClose: () => void;
  ariaLabel?: string;
  labelledBy?: string;
  describedBy?: string;
  children: ReactNode;
};

export function Dialog({ className, onClose, ariaLabel, labelledBy, describedBy, children }: Readonly<DialogProps>) {
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
      onClose();
    };
    node.addEventListener("cancel", onNativeCancel);
    return () => node.removeEventListener("cancel", onNativeCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={className}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
