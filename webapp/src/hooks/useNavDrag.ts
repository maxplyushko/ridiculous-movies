import { useEffect, useLayoutEffect, useRef } from "react";
import { hapticTabTap } from "@/utils/haptics.ts";

const PADDING_PX = 12;
const INDICATOR_PX = 50;
const INDICATOR_TRANSFORM = "translateY(-50%)";
const INDICATOR_TRANSFORM_DRAGGING = "translateY(-50%) scale(1.15)";

function calcLeft(nav: HTMLElement, idx: number, count: number): number {
  const step = (nav.offsetWidth - 2 * PADDING_PX) / count;
  return PADDING_PX + idx * step + (step - INDICATOR_PX) / 2;
}

export function useNavDrag(
  tabCount: number,
  currentIndex: number,
  onSwitch: (index: number) => void,
) {
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const dragRef = useRef<{ startX: number; startIdx: number } | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const onSwitchRef = useRef(onSwitch);
  // eslint-disable-next-line react-hooks/refs
  currentIndexRef.current = currentIndex;
  // eslint-disable-next-line react-hooks/refs
  onSwitchRef.current = onSwitch;

  const move = (idx: number, animated: boolean) => {
    const nav = navRef.current;
    const ind = indicatorRef.current;
    if (!nav || !ind) return;
    ind.style.transition = animated ? "left 0.3s cubic-bezier(0.34,1.56,0.64,1)" : "none";
    ind.style.left = `${calcLeft(nav, idx, tabCount)}px`;
  };

  useLayoutEffect(() => { move(currentIndex, false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dragRef.current) move(currentIndex, true);
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const onStart = (e: TouchEvent) => {
      dragRef.current = { startX: e.touches[0].clientX, startIdx: currentIndexRef.current };
      if (indicatorRef.current) indicatorRef.current.style.transform = INDICATOR_TRANSFORM_DRAGGING;
    };

    const onMove = (e: TouchEvent) => {
      const s = dragRef.current;
      if (!s || !navRef.current || !indicatorRef.current) return;
      e.preventDefault();
      const step = (navRef.current.offsetWidth - 2 * PADDING_PX) / tabCount;
      const frac = Math.max(-s.startIdx, Math.min(tabCount - 1 - s.startIdx,
        (e.touches[0].clientX - s.startX) / step));
      indicatorRef.current.style.transition = "none";
      indicatorRef.current.style.left = `${calcLeft(navRef.current, s.startIdx + frac, tabCount)}px`;
    };

    const onEnd = (e: TouchEvent) => {
      const s = dragRef.current;
      if (!s || !navRef.current || !indicatorRef.current) return;
      const step = (navRef.current.offsetWidth - 2 * PADDING_PX) / tabCount;
      const target = Math.max(0, Math.min(tabCount - 1,
        Math.round(s.startIdx + (e.changedTouches[0].clientX - s.startX) / step)));
      dragRef.current = null;
      indicatorRef.current.style.transition = "left 0.3s cubic-bezier(0.34,1.56,0.64,1)";
      indicatorRef.current.style.left = `${calcLeft(navRef.current, target, tabCount)}px`;
      indicatorRef.current.style.transform = INDICATOR_TRANSFORM;
      if (target !== s.startIdx) {
        hapticTabTap();
        onSwitchRef.current(target);
      }
    };

    nav.addEventListener("touchstart", onStart, { passive: true });
    nav.addEventListener("touchmove", onMove, { passive: false });
    nav.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      nav.removeEventListener("touchstart", onStart);
      nav.removeEventListener("touchmove", onMove);
      nav.removeEventListener("touchend", onEnd);
    };
  }, [tabCount]);

  return { navRef, indicatorRef };
}
