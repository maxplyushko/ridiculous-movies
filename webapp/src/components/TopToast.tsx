import { useCallback, useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";

const AUTO_DISMISS_MS = 5000;
const SWIPE_UP_THRESHOLD = 40;

export default function TopToast({ message, onDismiss }: Readonly<{ message: string; onDismiss: () => void }>) {
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setVisible(false);
    window.setTimeout(onDismiss, 250);
  }, [onDismiss]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(close, AUTO_DISMISS_MS);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [close]);

  const onTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta < 0) setDragY(delta);
  };
  const onTouchEnd = () => {
    if (dragY < -SWIPE_UP_THRESHOLD) close();
    else setDragY(0);
    startYRef.current = null;
    setDragging(false);
  };

  const translateY = visible ? dragY : -160;

  return (
    <div className="top-toast-layer">
      <div
        className={`top-toast${visible ? " top-toast--visible" : ""}`}
        style={{ transform: `translateY(${translateY}px)`, transition: dragging ? "none" : undefined }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={close}
      >
        <Users size={20} className="top-toast__icon" />
        <span className="top-toast__text">{message}</span>
      </div>
    </div>
  );
}
