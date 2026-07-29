import { getTelegramWebApp, isTelegramMiniApp } from "@/lib/telegram/telegram.ts";

export const KEYBOARD_MIN_PX = 80;

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

export function getKeyboardOffsetPx(): number {
  const vv = window.visualViewport;
  if (vv) {
    return Math.max(0, Math.round(getLayoutViewportHeight() - vv.height - vv.offsetTop));
  }

  if (isTelegramMiniApp()) {
    const height = getTelegramWebApp()?.viewportHeight;
    if (height) return Math.max(0, Math.round(getLayoutViewportHeight() - height));
  }

  return 0;
}
