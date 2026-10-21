// One look for every heading that comes into view on the site: out of a blur,
// fading in and settling up a little, on a long, soft ease-out (as on
// apple.com). Web Animations of opacity, filter and translate run on the
// compositor, so they stay smooth while the page is busy (hydrating sections,
// decoding images, a 3D scene starting).
//
// The hidden state before a reveal is CSS ([data-blur-reveal] without
// [data-revealed], assets/css/tailwind.css), only while scripting is on and
// motion is allowed, so the server-rendered text is never lost. The
// animations use `translate`, not `transform`, so an element's own transforms
// stay untouched; it needs a block or inline-block box for that to move it.

// Hidden: transparent, blurred and 0.28em below where the element sits (its
// own `translate`, if it has one, is kept: some centre themselves with it).
const BLUR = "blur(16px)";
const hidden = (element: HTMLElement): Keyframe => {
  const own = getComputedStyle(element).translate;
  const [x = "0px", y = "0px"] = own === "none" ? [] : own.split(" ");
  return { opacity: 0, filter: BLUR, translate: `${x} calc(${y} + 0.28em)` };
};
// Ease-out-cubic over 1.3s: the blur clears and the text rises at an even,
// unhurried pace (a stronger ease-out had it 95% in after 150ms, which read as
// a pop rather than a reveal).
const IN: KeyframeAnimationOptions = { duration: 1300, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" };
const OUT: KeyframeAnimationOptions = { duration: 450, easing: "cubic-bezier(0.4, 0, 1, 1)" };

const running = new WeakMap<HTMLElement, Animation>();
// Whether each element was last asked to show or to hide.
const wanted = new WeakMap<HTMLElement, boolean>();

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Where an element is right now, when an animation is cut short: the next one
// starts from there instead of jumping.
const current = (element: HTMLElement): Keyframe => {
  const style = getComputedStyle(element);
  return {
    opacity: style.opacity,
    filter: style.filter === "none" ? "blur(0px)" : style.filter,
    translate: style.translate === "none" ? "0 0" : style.translate,
  };
};

const take = (element: HTMLElement) => {
  const previous = running.get(element);
  const from = previous && previous.playState !== "finished" ? current(element) : null;
  previous?.cancel();
  running.delete(element);
  return from;
};

/** Shows the element: from hidden (or from where it is) to its own style. */
export function revealIn(element: HTMLElement, delayMs = 0): void {
  wanted.set(element, true);
  const from = take(element);
  element.setAttribute("data-revealed", "");
  if (prefersReducedMotion() || typeof element.animate !== "function") return;
  // One keyframe at offset 0: the end is the element's own style, whatever
  // its opacity or filter normally is.
  const animation = element.animate([{ offset: 0, ...(from ?? hidden(element)) }], {
    ...IN,
    delay: from ? 0 : delayMs,
    fill: "backwards",
  });
  running.set(element, animation);
  animation.onfinish = () => running.delete(element);
}

/** Hides the element again (a section scrolled back past its cue). */
export function revealOut(element: HTMLElement): void {
  wanted.set(element, false);
  if (!element.hasAttribute("data-revealed")) return;
  const from = take(element);
  if (prefersReducedMotion() || typeof element.animate !== "function") {
    element.removeAttribute("data-revealed");
    return;
  }
  const animation = element.animate([{ offset: 0, ...(from ?? {}) }, { offset: 1, ...hidden(element) }], { ...OUT, fill: "forwards" });
  running.set(element, animation);
  animation.onfinish = () => {
    // The CSS hidden state takes over once the attribute is gone.
    element.removeAttribute("data-revealed");
    animation.cancel();
    running.delete(element);
  };
}

/** Reveals or hides the element to match `shown`, only when that changes. */
export function revealTo(element: HTMLElement, shown: boolean, delayMs = 0): void {
  if ((wanted.get(element) ?? element.hasAttribute("data-revealed")) === shown) return;
  if (shown) revealIn(element, delayMs);
  else revealOut(element);
}
