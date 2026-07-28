import { useEffect, useRef, useState, type ReactNode } from "react";

export const PAGE_EXIT_MS = 300;
export const DIALOG_EXIT_MS = 180;

const EXITING_CLASS = "presence--exiting";

type PresenceProps = {
  show: boolean;
  exitMs?: number;
  children: ReactNode;
};

export function Presence({ show, exitMs = DIALOG_EXIT_MS, children }: Readonly<PresenceProps>) {
  const [, forceRender] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<ReactNode>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (show) {
      clearTimeout(timerRef.current);
      cancelAnimationFrame(frameRef.current ?? 0);
      timerRef.current = undefined;
      wrapRef.current?.classList.remove(EXITING_CLASS);
      return;
    }
    if (lastRef.current === null) return;
    // start the exit on a frame the closing render is not competing with
    frameRef.current = requestAnimationFrame(() => wrapRef.current?.classList.add(EXITING_CLASS));
    timerRef.current = setTimeout(() => {
      timerRef.current = undefined;
      lastRef.current = null;
      wrapRef.current?.classList.remove(EXITING_CLASS);
      forceRender((n) => n + 1);
    }, exitMs);
  }, [show, exitMs]);

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    cancelAnimationFrame(frameRef.current ?? 0);
  }, []);

  if (show) {
    lastRef.current = children; // eslint-disable-line react-hooks/refs
  }

  return (
    <div className="presence" ref={wrapRef}>
      {show ? children : lastRef.current /* eslint-disable-line react-hooks/refs */}
    </div>
  );
}
