import { useEffect, useRef } from "react";

export function useAnimatedClose(
  el: HTMLElement | null,
  closingClass: string,
  ms: number,
  onClosed: () => void,
) {
  const onClosedRef = useRef(onClosed);
  useEffect(() => { onClosedRef.current = onClosed; }, [onClosed]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return () => {
    if (timerRef.current !== undefined) return;
    if (!el) {
      onClosedRef.current();
      return;
    }
    el.classList.add(closingClass);
    timerRef.current = setTimeout(() => {
      timerRef.current = undefined;
      el.classList.remove(closingClass);
      onClosedRef.current();
    }, ms);
  };
}
