import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { hapticSpinReveal, hapticSpinStart, hapticSpinTick, stopHaptics } from "@/utils/haptics.ts";

const SPIN_TICK_MS = 65;
const SPIN_TICK_COUNT = 20;

export function useSpinPicker<T>() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const spin = (getFinal: () => T) => {
    if (spinning) return;
    const final = getFinal();
    hapticSpinStart();
    setSpinning(true);
    let ticks = 0;
    intervalRef.current = setInterval(() => {
      ticks++;
      hapticSpinTick();
      if (ticks >= SPIN_TICK_COUNT) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
        stopHaptics();
        setSpinning(false);
        setResult(final);
        hapticSpinReveal();
        confetti({
          origin: { x: 0.5, y: 0.5 },
          particleCount: 80,
          spread: 360,
          startVelocity: 30,
          ticks: 80,
          scalar: 0.9,
          colors: ["#3390ec", "#ff9500", "#ff3b30", "#34c759", "#ffd60a", "#bf5af2"],
          disableForReducedMotion: true,
        });
      }
    }, SPIN_TICK_MS);
  };

  const clear = () => setResult(null);

  return { spinning, result, spin, clear };
}
