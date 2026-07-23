import { getTelegramWebApp, isTelegramMiniApp } from "@/lib/telegram/telegram.ts";

export function onKeyboardViewportChange(callback: () => void): () => void {
  if (isTelegramMiniApp()) {
    const webApp = getTelegramWebApp();
    if (webApp?.onEvent) {
      webApp.onEvent("viewportChanged", callback);
      return () => webApp.offEvent?.("viewportChanged", callback);
    }
  }

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener("resize", callback);
    return () => vv.removeEventListener("resize", callback);
  }

  return () => {};
}

export function getKeyboardViewportHeight(): number | undefined {
  if (isTelegramMiniApp()) {
    const webApp = getTelegramWebApp();
    const height = webApp?.viewportStableHeight ?? webApp?.viewportHeight;
    if (height) return height;
  }
  return window.visualViewport?.height;
}
