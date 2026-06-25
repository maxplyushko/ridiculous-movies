const scrollIntoViewAfterKeyboard = (el: HTMLElement) => {
  const scroll = () => el.scrollIntoView({ block: "center", behavior: "smooth" });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => setTimeout(scroll, 50), { once: true });
  } else {
    setTimeout(scroll, 300);
  }
};

export default scrollIntoViewAfterKeyboard;
