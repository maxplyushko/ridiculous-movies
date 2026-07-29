import {
  getKeyboardOffsetPx,
  getLayoutViewportHeight,
  onKeyboardViewportChange,
} from "@/hooks/useTelegramKeyboard.ts";
import { findScrollParent } from "@/utils/scrollParent.ts";

const SETTLE_MS = 600;
const MARGIN_PX = 16;

const revealInScroller = (el: HTMLElement) => {
  const scroller = findScrollParent(el);
  if (!scroller) return;

  const elRect = el.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();
  const unobscuredBottom = getLayoutViewportHeight() - getKeyboardOffsetPx();
  const visibleBottom = Math.min(scrollerRect.bottom, unobscuredBottom);
  const overflowBottom = elRect.bottom + MARGIN_PX - visibleBottom;
  const overflowTop = scrollerRect.top + MARGIN_PX - elRect.top;

  let delta = 0;
  if (overflowBottom > 0) delta = overflowBottom;
  else if (overflowTop > 0) delta = -overflowTop;
  if (delta === 0) return;

  const max = scroller.scrollHeight - scroller.clientHeight;
  scroller.scrollTop = Math.min(Math.max(scroller.scrollTop + delta, 0), max);
};

const scrollIntoViewAfterKeyboard = (el: HTMLElement) => {
  const deadline = performance.now() + SETTLE_MS;
  let stopped = false;

  function stop() {
    if (stopped) return;
    stopped = true;
    unsubscribe();
    clearTimeout(timer);
  }

  function run() {
    if (!el.isConnected || document.activeElement !== el) {
      stop();
      return;
    }
    revealInScroller(el);
    if (performance.now() >= deadline) stop();
  }

  const unsubscribe = onKeyboardViewportChange(run);
  const timer = setTimeout(() => {
    run();
    stop();
  }, SETTLE_MS);
  requestAnimationFrame(run);
};

export default scrollIntoViewAfterKeyboard;
