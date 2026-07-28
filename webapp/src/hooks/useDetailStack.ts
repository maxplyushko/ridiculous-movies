import { useState } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack.ts";
import { useAnimatedClose } from "@/hooks/useAnimatedClose.ts";
import { useRegisterSubPage } from "@/hooks/useSubPage.ts";
import { PAGE_EXIT_MS } from "@/components/Presence.tsx";

export function useDetailStack<TEntry>() {
  const [stack, setStack] = useState<TEntry[]>([]);
  const [topEl, setTopEl] = useState<HTMLDivElement | null>(null);

  const push = (entry: TEntry) => setStack((s) => [...s, entry]);
  const popNow = () => setStack((s) => s.slice(0, -1));
  const reset = () => setStack([]);

  useRegisterSubPage(stack.length > 0);

  const pop = useAnimatedClose(topEl, "movie-list__add__movie--closing", PAGE_EXIT_MS, popNow);

  useSwipeBack(popNow, topEl);

  return { stack, push, pop, reset, setTopEl };
}
