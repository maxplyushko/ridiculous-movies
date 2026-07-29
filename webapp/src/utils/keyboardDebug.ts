import { getTelegramWebApp } from "@/lib/telegram/telegram.ts";

const DEBUG_TOKEN = "kbdebug";

export function isKeyboardDebugEnabled(): boolean {
  if (import.meta.env.VITE_KB_DEBUG === "1") return true;
  if (window.location.search.includes(DEBUG_TOKEN)) return true;
  if (window.location.hash.includes(DEBUG_TOKEN)) return true;
  return getTelegramWebApp()?.initDataUnsafe?.start_param === DEBUG_TOKEN;
}
