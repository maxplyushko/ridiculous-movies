import { useEffect, useState } from "react";

const COLLAPSE_AT = 28;
const EXPAND_AT = 6;

export function useCollapseOnScroll<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const scroller = el?.closest(".app-main");
    if (!scroller) return;
    const onScroll = () => {
      const y = scroller.scrollTop;
      setCollapsed((cur) => (cur ? y > EXPAND_AT : y > COLLAPSE_AT));
    };
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [el]);

  return { setEl, collapsed };
}
