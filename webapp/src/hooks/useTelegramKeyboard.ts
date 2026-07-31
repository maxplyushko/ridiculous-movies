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

/**
 * Space below the visual viewport that still belongs to the layout viewport.
 * Used to size the shell; zero on clients that pan instead of resize.
 */
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

/**
 * Height of the on-screen keyboard. Unlike {@link getKeyboardOffsetPx} this never
 * subtracts `visualViewport.offsetTop`: Telegram iOS pans the layout viewport rather
 * than resizing it, so the offset and the shrunken height would cancel each other out.
 */
export function getKeyboardHeightPx(): number {
  const vv = window.visualViewport;
  if (vv) {
    return Math.max(0, Math.round(getLayoutViewportHeight() - vv.height));
  }

  if (isTelegramMiniApp()) {
    const height = getTelegramWebApp()?.viewportHeight;
    if (height) return Math.max(0, Math.round(getLayoutViewportHeight() - height));
  }

  return 0;
}
