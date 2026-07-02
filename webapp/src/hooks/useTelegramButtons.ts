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

export function useTelegramMainButton(
  text: string,
  onClick: () => void,
  disabled = false,
  loading = false,
) {
  const cbRef = useRef(onClick);
  // eslint-disable-next-line react-hooks/refs
  cbRef.current = onClick;

  useEffect(() => {
    const btn = getTelegramWebApp()?.MainButton;
    if (!btn) return;
    const handler = () => cbRef.current();
    btn.setText(text).show().onClick(handler);
    return () => {
      btn.offClick(handler).hide();
    };
  }, [text]);

  useEffect(() => {
    const btn = getTelegramWebApp()?.MainButton;
    if (!btn) return;
    btn.setText(text);
    if (disabled) btn.disable(); else btn.enable();
    if (loading) btn.showProgress(false); else btn.hideProgress();
  }, [text, disabled, loading]);
}
