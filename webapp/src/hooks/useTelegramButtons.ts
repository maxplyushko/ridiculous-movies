import { useEffect, useRef } from "react";
import { getTelegramWebApp } from "../api/telegram.ts";

export function useTelegramBackButton(onBack: () => void) {
  const cbRef = useRef(onBack);
  cbRef.current = onBack;

  useEffect(() => {
    const btn = getTelegramWebApp()?.BackButton;
    if (!btn) return;
    const handler = () => cbRef.current();
    btn.show();
    btn.onClick(handler);
    return () => {
      btn.offClick(handler);
      btn.hide();
    };
  }, []);
}

export function useTelegramMainButton(
  text: string,
  onClick: () => void,
  disabled = false,
  loading = false,
) {
  const cbRef = useRef(onClick);
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
