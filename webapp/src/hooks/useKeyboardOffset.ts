import { useEffect, useState } from "react";
import { getKeyboardOffsetPx, onKeyboardViewportChange } from "@/hooks/useTelegramKeyboard.ts";

export function useKeyboardOffset(enabled: boolean): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const sync = () => setOffset(getKeyboardOffsetPx());
    sync();
    const unsubscribe = onKeyboardViewportChange(sync);
    const vv = window.visualViewport;
    vv?.addEventListener("scroll", sync);
    return () => {
      unsubscribe();
      vv?.removeEventListener("scroll", sync);
    };
  }, [enabled]);

  return enabled ? offset : 0;
}
