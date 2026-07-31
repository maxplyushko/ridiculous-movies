import { useEffect } from "react";
import { getTelegramWebApp, isTelegramMiniApp } from "@/lib/telegram/telegram.ts";

export const KEYBOARD_MIN_PX = 80;
const KB_OPEN_CLASS = "kb-open";

export function onKeyboardViewportChange(callback: () => void): () => void {
  const cleanups: Array<() => void> = [];

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener("resize", callback);
    vv.addEventListener("scroll", callback);
    cleanups.push(() => {
      vv.removeEventListener("resize", callback);
      vv.removeEventListener("scroll", callback);
    });
  } else {
    window.addEventListener("resize", callback);
    cleanups.push(() => window.removeEventListener("resize", callback));
  }

  if (isTelegramMiniApp()) {
    const webApp = getTelegramWebApp();
    if (webApp?.onEvent) {
      webApp.onEvent("viewportChanged", callback);
      cleanups.push(() => webApp.offEvent?.("viewportChanged", callback));
    }
  }

  return () => cleanups.forEach((cleanup) => cleanup());
}

export function getLayoutViewportHeight(): number {
  return window.innerHeight || document.documentElement.clientHeight;
}

/**
 * Height of the on-screen keyboard. Deliberately ignores `visualViewport.offsetTop`:
 * Telegram iOS pans the layout viewport rather than resizing it, so subtracting the
 * offset would cancel out the shrunken height and always report zero.
 */
export function getKeyboardHeightPx(): number {
  const vv = window.visualViewport;
  if (vv) return Math.max(0, Math.round(getLayoutViewportHeight() - vv.height));

  if (isTelegramMiniApp()) {
    const height = getTelegramWebApp()?.viewportHeight;
    if (height) return Math.max(0, Math.round(getLayoutViewportHeight() - height));
  }

  return 0;
}

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
}

/**
 * Mirrors on-screen-keyboard visibility onto a `kb-open` class on the root element.
 * Purely observational — it never scrolls, resizes or otherwise corrects the viewport.
 */
export function useKeyboardOpenClass(): void {
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      const open = isTextEntry(document.activeElement)
        && getKeyboardHeightPx() > KEYBOARD_MIN_PX;
      root.classList.toggle(KB_OPEN_CLASS, open);
    };

    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", sync);
    const unsubscribe = onKeyboardViewportChange(sync);
    sync();

    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
      unsubscribe();
      root.classList.remove(KB_OPEN_CLASS);
    };
  }, []);
}
