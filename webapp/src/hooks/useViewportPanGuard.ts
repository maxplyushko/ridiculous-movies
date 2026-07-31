import { useEffect, useState } from "react";
import {
  KEYBOARD_MIN_PX,
  getKeyboardOffsetPx,
  onKeyboardViewportChange,
} from "@/hooks/useTelegramKeyboard.ts";

const KB_INSET_VAR = "--kb-inset";
const KB_OPEN_CLASS = "kb-open";
const FOCUS_BURST_MS = 700;
const SCROLL_BURST_MS = 200;

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
}

export function useViewportPanGuard(): void {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    let burstUntil = 0;
    let lastInset = -1;

    const unpan = () => {
      const scroller = document.scrollingElement;
      if ((scroller && scroller.scrollTop !== 0) || window.scrollY !== 0) window.scrollTo(0, 0);
    };

    const applyInset = () => {
      const offset = isTextEntry(document.activeElement) ? getKeyboardOffsetPx() : 0;
      const next = offset > KEYBOARD_MIN_PX ? offset : 0;
      if (next === lastInset) return;
      lastInset = next;
      root.classList.toggle(KB_OPEN_CLASS, next > 0);
      root.style.setProperty(KB_INSET_VAR, `${next}px`);
    };

    const correct = () => {
      unpan();
      applyInset();
    };

    const tick = () => {
      correct();
      frame = performance.now() < burstUntil ? requestAnimationFrame(tick) : 0;
    };

    const arm = (ms: number) => {
      burstUntil = Math.max(burstUntil, performance.now() + ms);
      if (frame === 0) frame = requestAnimationFrame(tick);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (isTextEntry(event.target)) arm(FOCUS_BURST_MS);
    };
    const onFocusOut = () => arm(FOCUS_BURST_MS);
    const onWindowScroll = () => {
      unpan();
      arm(SCROLL_BURST_MS);
    };
    const onViewportChange = () => arm(FOCUS_BURST_MS);
    const onTouchStart = (event: TouchEvent) => {
      if (isTextEntry(event.target)) arm(FOCUS_BURST_MS);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    const unsubscribe = onKeyboardViewportChange(onViewportChange);
    correct();

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("scroll", onWindowScroll);
      unsubscribe();
      if (frame !== 0) cancelAnimationFrame(frame);
      root.style.removeProperty(KB_INSET_VAR);
      root.classList.remove(KB_OPEN_CLASS);
    };
  }, []);
}

export function useIsKeyboardOpen(): boolean {
  const [open, setOpen] = useState(() => document.documentElement.classList.contains(KB_OPEN_CLASS));

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setOpen(root.classList.contains(KB_OPEN_CLASS));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return open;
}
