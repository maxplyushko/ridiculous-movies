import { onKeyboardViewportChange } from "@/hooks/useTelegramKeyboard.ts";

const scrollIntoViewAfterKeyboard = (el: HTMLElement) => {
  const scroll = () => el.scrollIntoView({ block: "center", behavior: "smooth" });

  let fired = false;
  const unsubscribe = onKeyboardViewportChange(() => {
    fired = true;
    unsubscribe();
    setTimeout(scroll, 50);
  });
  setTimeout(() => {
    if (!fired) {
      unsubscribe();
      scroll();
    }
  }, 400);
};

export default scrollIntoViewAfterKeyboard;
