import { useEffect, useRef } from "react";

export function useCloseSwipeOnOutsideTap(openSwipeId: string | null, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (openSwipeId === null) return;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(".movie-item-wrapper")) return;
      onCloseRef.current();
    };
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("mousedown", handler);
    };
  }, [openSwipeId]);
}
