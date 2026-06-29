import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { hapticTabTap } from "../haptics.ts";

const STAR_INDICES = Array.from({ length: 10 }, (_, i) => i + 1);

type StarRatingProps = {
  value: number | null;
  onChange: (v: number | null) => void;
};

export function StarRating({ value, onChange }: Readonly<StarRatingProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  // eslint-disable-next-line react-hooks/refs
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const btn = target?.closest('[data-star]') as HTMLElement | null;
      if (btn?.dataset.star) onChangeRef.current(Number(btn.dataset.star));
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  return (
    <div className="star-rating" ref={containerRef}>
      {STAR_INDICES.map((n) => {
        const filled = value !== null && n <= value;
        return (
          <button
            key={n}
            type="button"
            data-star={n}
            className={`star-rating__item${filled ? " star-rating__item--filled" : ""}`}
            onClick={() => { hapticTabTap(); onChange(n); }}
            aria-label={`Rate ${n}`}
          >
            <Star size={22} className="star-rating__icon" strokeWidth={2.5} />
          </button>
        );
      })}
    </div>
  );
}
