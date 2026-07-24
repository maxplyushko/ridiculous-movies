import { useTranslation } from "react-i18next";
import { hapticTabTap } from "@/utils/haptics.ts";

type GuestLimitModalProps = {
  onClose: () => void;
};

export function GuestLimitModal({ onClose }: Readonly<GuestLimitModalProps>) {
  const { t } = useTranslation();
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p>{t('guestLimit.message')}</p>
        <div className="confirm-dialog__actions">
          <button type="button" onClick={() => { hapticTabTap(); onClose(); }}>
            {t('guestLimit.ok')}
          </button>
        </div>
      </div>
    </div>
  );
}
