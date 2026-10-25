// A <details> that slides open and closed in every browser, the way the
// landing's FAQ answers do: the summary's click is taken over and the answer
// box (the element after the summary) eases its height between 0 and its own,
// its text fading in a moment after the box starts to grow. While it closes
// the element carries .is-closing, so its icon can turn back at once. Without
// JavaScript (or with reduced motion) the <details> opens and closes as usual,
// and the answers stay in the HTML for search engines.

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const running = new WeakMap<HTMLDetailsElement, Animation>();

export const toggleDetails = (event: MouseEvent) => {
  const summary = event.currentTarget as HTMLElement;
  const details = summary.parentElement as HTMLDetailsElement | null;
  const panel = summary.nextElementSibling as HTMLElement | null;
  if (!details || !panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  event.preventDefault();

  // A second click in mid-animation reverses from where the box is now.
  const from = `${panel.getBoundingClientRect().height}px`;
  running.get(details)?.cancel();
  const wasClosing = details.classList.contains("is-closing");
  const closing = details.open && !wasClosing;

  if (closing) {
    details.classList.add("is-closing");
    const close = panel.animate([{ height: from }, { height: "0px" }], { duration: 420, easing: EASE, fill: "forwards" });
    panel.firstElementChild?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "forwards" });
    running.set(details, close);
    close.onfinish = () => {
      details.open = false;
      close.cancel();
      details.classList.remove("is-closing");
      panel.firstElementChild?.getAnimations().forEach((animation) => animation.cancel());
    };
    return;
  }

  details.classList.remove("is-closing");
  details.open = true;
  const open = panel.animate([{ height: wasClosing ? from : "0px" }, { height: `${panel.scrollHeight}px` }], { duration: 560, easing: EASE });
  panel.firstElementChild?.getAnimations().forEach((animation) => animation.cancel());
  panel.firstElementChild?.animate(
    [{ opacity: 0, translate: "0 -0.6em" }, { opacity: 1, translate: "0 0" }],
    { duration: 620, delay: 80, easing: EASE, fill: "backwards" },
  );
  running.set(details, open);
};
