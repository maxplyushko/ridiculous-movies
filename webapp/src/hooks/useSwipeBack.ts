import { useEffect, useRef } from "react";

const EDGE_ZONE = 28;
const THRESHOLD = 80;

export function useSwipeBack(onBack: () => void, element: HTMLElement | null) {
  const onBackRef = useRef(onBack);
  useEffect(() => { onBackRef.current = onBack; }, [onBack]);

  useEffect(() => {
    const el = element;
    if (!el) return;

    // eslint-disable-next-line react-hooks/immutability
    el.style.transform = "";
    el.style.transition = "";

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let directionLocked = false;

    const applyTranslate = (x: number, animated: boolean) => {
      el.style.transition = animated ? "transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)" : "none";
      el.style.transform = x > 0 ? `translateX(${x}px)` : "";
    };

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX > EDGE_ZONE) return;
      const target = touch.target as HTMLElement;
      if (target.closest(".user-chip-row")) return;
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
      directionLocked = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);

      if (!directionLocked) {
        if (Math.abs(dx) < 8 && dy < 8) return;
        if (dy > Math.abs(dx)) {
          tracking = false;
          return;
        }
        directionLocked = true;
      }

      if (dx > 0) {
        e.preventDefault();
        applyTranslate(dx, false);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking || !directionLocked) {
        tracking = false;
        return;
      }
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;

      if (dx > THRESHOLD) {
        applyTranslate(window.innerWidth, true);
        el.addEventListener("transitionend", () => {
          onBackRef.current();
        }, { once: true });
      } else {
        applyTranslate(0, true);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [element]);
}
