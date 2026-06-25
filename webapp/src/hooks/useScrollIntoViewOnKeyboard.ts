const scrollIntoViewAfterKeyboard = (el: HTMLElement) => {
  const scroll = () => el.scrollIntoView({ block: "center", behavior: "smooth" });

  if (window.visualViewport) {
    let fired = false;
    const onResize = () => {
      fired = true;
      setTimeout(scroll, 50);
    };
    window.visualViewport.addEventListener('resize', onResize, { once: true });
    setTimeout(() => {
      if (!fired) window.visualViewport!.removeEventListener('resize', onResize);
      scroll();
    }, 400);
  } else {
    setTimeout(scroll, 300);
  }
};

export default scrollIntoViewAfterKeyboard;
