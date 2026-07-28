import { useEffect, useState } from "react";
import { onKeyboardViewportChange } from "@/hooks/useTelegramKeyboard.ts";

function measure(): number {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
}

export function useKeyboardOffset(enabled: boolean): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const sync = () => setOffset(measure());
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
