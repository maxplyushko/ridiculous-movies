import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTelegramBackButton } from "@/hooks/useTelegramButtons.ts";
import { isTelegramMiniApp } from "@/lib/telegram/telegram.ts";
import { hapticTabTap } from "@/utils/haptics.ts";

type PageBackButtonProps = {
  onBack: () => void;
  active?: boolean;
};

export function PageBackButton({ onBack, active = true }: Readonly<PageBackButtonProps>) {
  const { t } = useTranslation();
  useTelegramBackButton(onBack, active);

  if (!active || isTelegramMiniApp()) return null;

  return (
    <button type="button" className="page-back-btn" onClick={() => { hapticTabTap(); onBack(); }}>
      <ChevronLeft size={20} />
      {t('nav.back')}
    </button>
  );
}
