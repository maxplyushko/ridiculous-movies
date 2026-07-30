import { useEffect, useRef, useState } from "react";
import { hapticSpinReveal, hapticSpinStart, hapticSpinTick, stopHaptics } from "@/utils/haptics.ts";

const TICK_MS = 65;
const TICK_COUNT = 20;

export function useReelPicker<T>() {
  const [display, setDisplay] = useState<T | null>(null);
  const [final, setFinal] = useState<T | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [resultKey, setResultKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const reset = () => {
    clearInterval(intervalRef.current);
    stopHaptics();
    setSpinning(false);
    setDisplay(null);
    setFinal(null);
  };

  const spin = (pick: () => T) => {
    if (spinning) return;
    const chosen = pick();
    hapticSpinStart();
    setSpinning(true);
    setFinal(null);
    setDisplay(pick());
    let ticks = 0;
    intervalRef.current = setInterval(() => {
      ticks++;
      setDisplay(pick());
      hapticSpinTick();
      if (ticks >= TICK_COUNT) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
        stopHaptics();
        setSpinning(false);
        setDisplay(chosen);
        setFinal(chosen);
        setResultKey((k) => k + 1);
        hapticSpinReveal();
      }
    }, TICK_MS);
  };

  return { display, final, spinning, resultKey, reset, spin };
}
