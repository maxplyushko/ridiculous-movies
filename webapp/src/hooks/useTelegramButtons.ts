import { useEffect, useRef } from "react";
import { getTelegramWebApp } from "@/lib/telegram/telegram.ts";

type StackEntry = { id: number; handler: () => void };

let stack: StackEntry[] = [];
let idCounter = 0;
let wiredHandler: (() => void) | null = null;

function syncBackButton() {
  const btn = getTelegramWebApp()?.BackButton;
  if (!btn) return;
  if (wiredHandler) {
    btn.offClick(wiredHandler);
    wiredHandler = null;
  }
  if (stack.length === 0) {
    btn.hide();
    return;
  }
  const top = stack[stack.length - 1];
  wiredHandler = () => top.handler();
  btn.onClick(wiredHandler);
  btn.show();
}

export function useTelegramBackButton(onBack: () => void, active = true) {
  const cbRef = useRef(onBack);
  cbRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    if (!getTelegramWebApp()?.BackButton) return;
    const entry: StackEntry = { id: idCounter++, handler: () => cbRef.current() };
    stack.push(entry);
    syncBackButton();
    return () => {
      stack = stack.filter((e) => e !== entry);
      syncBackButton();
    };
  }, [active]);
}
