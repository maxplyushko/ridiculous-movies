import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/Dialog.tsx";
import { hapticTabTap } from "@/utils/haptics.ts";

type GuestLimitModalProps = {
  onClose: () => void;
};

export function GuestLimitModal({ onClose }: Readonly<GuestLimitModalProps>) {
  const { t } = useTranslation();
  return (
    <Dialog className="confirm-dialog" onClose={onClose} describedBy="guest-limit-message">
      <p id="guest-limit-message">{t('guestLimit.message')}</p>
      <div className="confirm-dialog__actions">
        <button type="button" onClick={() => { hapticTabTap(); onClose(); }}>
          {t('guestLimit.ok')}
        </button>
      </div>
    </Dialog>
  );
}
