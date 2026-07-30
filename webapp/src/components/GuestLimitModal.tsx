import { useTranslation } from "react-i18next";
import { useDialogA11y } from "@/hooks/useDialogA11y.ts";
import { hapticTabTap } from "@/utils/haptics.ts";

type GuestLimitModalProps = {
  onClose: () => void;
};

export function GuestLimitModal({ onClose }: Readonly<GuestLimitModalProps>) {
  const { t } = useTranslation();
  const dialogRef = useDialogA11y(onClose);
  return (
    <div className="confirm-dialog-overlay">
      <div
        ref={dialogRef}
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-describedby="guest-limit-message"
      >
        <p id="guest-limit-message">{t('guestLimit.message')}</p>
        <div className="confirm-dialog__actions">
          <button type="button" onClick={() => { hapticTabTap(); onClose(); }}>
            {t('guestLimit.ok')}
          </button>
        </div>
      </div>
    </div>
  );
}
