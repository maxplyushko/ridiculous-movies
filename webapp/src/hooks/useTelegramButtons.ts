import { useEffect, useRef } from "react";
import { getTelegramWebApp } from "@/lib/telegram/telegram.ts";

export function useTelegramBackButton(onBack: () => void, active = true) {
  const cbRef = useRef(onBack);
  // eslint-disable-next-line react-hooks/refs
  cbRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    const btn = getTelegramWebApp()?.BackButton;
    if (!btn) return;
    const handler = () => cbRef.current();
    btn.show();
    btn.onClick(handler);
    return () => {
      btn.offClick(handler);
      btn.hide();
    };
  }, [active]);
}
