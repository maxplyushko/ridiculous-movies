import { useEffect, useRef } from "react";
import { getTelegramWebApp } from "@/lib/telegram/telegram.ts";
import { getKeyboardOffsetPx, getLayoutViewportHeight } from "@/hooks/useTelegramKeyboard.ts";
import { isKeyboardDebugEnabled } from "@/utils/keyboardDebug.ts";

export function KeyboardDebugOverlay() {
  const nodeRef = useRef<HTMLPreElement>(null);
  const enabled = isKeyboardDebugEnabled();

  useEffect(() => {
    if (!enabled) return;
    const node = nodeRef.current;
    if (!node) return;

    const counters = { vvResize: 0, vvScroll: 0, tgViewport: 0, winScroll: 0, focusIn: 0 };
    const peaks = { offsetTop: 0, pageTop: 0, scrollTop: 0, kbInset: 0 };
    let frame = 0;

    const vv = window.visualViewport;
    const webApp = getTelegramWebApp();

    const sample = () => {
      const offsetTop = Math.round(vv?.offsetTop ?? 0);
      const pageTop = Math.round(vv?.pageTop ?? 0);
      const scrollTop = Math.round(document.scrollingElement?.scrollTop ?? 0);
      const kb = getKeyboardOffsetPx();
      peaks.offsetTop = Math.max(peaks.offsetTop, offsetTop);
      peaks.pageTop = Math.max(peaks.pageTop, pageTop);
      peaks.scrollTop = Math.max(peaks.scrollTop, scrollTop);
      peaks.kbInset = Math.max(peaks.kbInset, kb);
      return { offsetTop, pageTop, scrollTop, kb };
    };

    const render = () => {
      const s = sample();
      const active = document.activeElement;
      let activeLabel = "none";
      if (active instanceof HTMLElement) {
        const idSuffix = active.id ? `#${active.id}` : "";
        activeLabel = `${active.tagName}${idSuffix}`;
      }
      const inset = getComputedStyle(document.documentElement).getPropertyValue("--kb-inset").trim();
      node.textContent = [
        `inner   ${getLayoutViewportHeight()}`,
        `vv.h    ${Math.round(vv?.height ?? -1)}`,
        `vv.oTop ${s.offsetTop}  peak ${peaks.offsetTop}`,
        `vv.pTop ${s.pageTop}  peak ${peaks.pageTop}`,
        `doc.sT  ${s.scrollTop}  peak ${peaks.scrollTop}`,
        `kb      ${s.kb}  peak ${peaks.kbInset}`,
        `--kb    ${inset || "unset"}`,
        `tg.vh   ${webApp?.viewportHeight ?? "-"}`,
        `tg.vsh  ${webApp?.viewportStableHeight ?? "-"}`,
        `tg.exp  ${String(webApp?.isExpanded ?? "-")}`,
        `ev r${counters.vvResize} s${counters.vvScroll} t${counters.tgViewport} w${counters.winScroll} f${counters.focusIn}`,
        `focus   ${activeLabel}`,
      ].join("\n");
      frame = requestAnimationFrame(render);
    };

    const onVvResize = () => { counters.vvResize += 1; sample(); };
    const onVvScroll = () => { counters.vvScroll += 1; sample(); };
    const onTgViewport = () => { counters.tgViewport += 1; sample(); };
    const onWinScroll = () => { counters.winScroll += 1; sample(); };
    const onFocusIn = () => { counters.focusIn += 1; };

    vv?.addEventListener("resize", onVvResize);
    vv?.addEventListener("scroll", onVvScroll);
    window.addEventListener("scroll", onWinScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    webApp?.onEvent?.("viewportChanged", onTgViewport);
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      vv?.removeEventListener("resize", onVvResize);
      vv?.removeEventListener("scroll", onVvScroll);
      window.removeEventListener("scroll", onWinScroll);
      document.removeEventListener("focusin", onFocusIn);
      webApp?.offEvent?.("viewportChanged", onTgViewport);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <pre className="kb-debug" ref={nodeRef} aria-hidden="true" />;
}
