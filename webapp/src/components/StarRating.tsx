import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";

const STAR_INDICES = Array.from({ length: 10 }, (_, i) => i + 1);

type StarRatingProps = {
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
};

function pointValue(btn: HTMLElement, clientX: number, n: number, step: number): number {
  if (step >= 1) return n;
  const rect = btn.getBoundingClientRect();
  return clientX - rect.left < rect.width / 2 ? n - 0.5 : n;
}

export function StarRating({ value, onChange, step = 1 }: Readonly<StarRatingProps>) {
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
      if (btn?.dataset.star) {
        onChangeRef.current(pointValue(btn, touch.clientX, Number(btn.dataset.star), step));
      }
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, [step]);

  return (
    <div className="star-rating" ref={containerRef}>
      {STAR_INDICES.map((n) => {
        const filled = value !== null && n <= value;
        const half = value !== null && !filled && n - 0.5 <= value;
        return (
          <button
            key={n}
            type="button"
            data-star={n}
            className={`star-rating__item${filled ? " star-rating__item--filled" : ""}`}
            onClick={(e) => {
              hapticTabTap();
              const isKeyboardActivation = e.detail === 0;
              onChange(isKeyboardActivation ? n : pointValue(e.currentTarget, e.clientX, n, step));
            }}
            aria-label={`Rate ${n} out of 10${value !== null ? `, current rating ${value}` : ""}`}
          >
            <span className="star-rating__glyph">
              <Star size={22} className="star-rating__icon" strokeWidth={2.5} />
              {half && (
                <Star size={22} className="star-rating__icon star-rating__icon--half" strokeWidth={2.5} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
