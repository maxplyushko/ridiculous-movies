import { useEffect, useSyncExternalStore } from "react";

let openCount = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useRegisterSubPage(open: boolean) {
  useEffect(() => {
    if (!open) return;
    openCount += 1;
    emit();
    return () => {
      openCount -= 1;
      emit();
    };
  }, [open]);
}

export function useSubPageOpen() {
  return useSyncExternalStore(subscribe, () => openCount > 0, () => false);
}

const BAR_HIDDEN_CLASS = "bottom-bar-hidden";

/**
 * Hides the app's bottom bar for as long as the calling component is mounted.
 * For full-screen pages that own the whole viewport and carry their own actions.
 */
export function useHideBottomBar() {
  useEffect(() => {
    document.body.classList.add(BAR_HIDDEN_CLASS);
    return () => document.body.classList.remove(BAR_HIDDEN_CLASS);
  }, []);
}
