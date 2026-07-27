import { useState } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack.ts";

export function useDetailStack<TEntry>() {
  const [stack, setStack] = useState<TEntry[]>([]);
  const [topEl, setTopEl] = useState<HTMLDivElement | null>(null);

  const push = (entry: TEntry) => setStack((s) => [...s, entry]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const reset = () => setStack([]);

  useSwipeBack(pop, topEl);

  return { stack, push, pop, reset, setTopEl };
}
