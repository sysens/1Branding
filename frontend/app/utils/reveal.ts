// How things come into view on the site, in two looks:
//
// - "blur" (headings, v-blur-reveal): out of a blur, fading in and settling up
//   a little, 1.3s on an ease-out-cubic (a stronger ease-out had the text 95%
//   in after 150ms, which read as a pop rather than a reveal), while a soft
//   edge sweeps it in from left to right: apple.com/iphone-18-pro's animated
//   headline ("Welcome to the mother chip.") lights up left to right as a
//   300%-wide gradient slides across it (`gradient-swipe`, 3.5s). Here the
//   sweep is a mask, so the heading keeps its own colours (white, black, the
//   green accents).
// - "rise" (everything else: text, buttons, cards, media; v-rise): measured on
//   apple.com/iphone, no blur: fading in over 0.9s while rising 30px over
//   0.7s, both ease-in-out.
// - A pill button with v-rise and [data-pill] (the landing's buttons) opens the
//   way apple.com/macbook-pro's "Compare MacBook Pro models" button does,
//   about 1s: a small circle grows in, the arrow pops up in it, the circle
//   stretches into the pill from its middle while the arrow slides to its
//   place at the end, and the label fades in last.
//
// A section's items come in one after another, REVEAL_STEP_MS apart, in
// document order (plugins/blur-reveal.ts), as Apple's do.
//
// Both are Web Animations of opacity, filter and translate, which run on the
// compositor and stay smooth while the page is busy (hydrating sections,
// decoding images, a 3D scene starting). The hidden state before a reveal is
// CSS ([data-blur-reveal] / [data-rise] without [data-revealed],
// assets/css/tailwind.css), only while scripting is on and motion is allowed,
// so the server-rendered content is never lost. `translate` is used, not
// `transform`, so an element's own transforms stay untouched; it needs a
// block or inline-block box for that to move it.

export type RevealLook = "blur" | "rise";

const BLUR_IN: KeyframeAnimationOptions = { duration: 1300, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" };
const RISE_FADE: KeyframeAnimationOptions = { duration: 900, easing: "cubic-bezier(0.42, 0, 0.58, 1)" };
const RISE_MOVE: KeyframeAnimationOptions = { duration: 700, easing: "cubic-bezier(0.42, 0, 0.58, 1)" };
const OUT: KeyframeAnimationOptions = { duration: 450, easing: "cubic-bezier(0.4, 0, 1, 1)" };

// The sweep: a mask three times the element's width, opaque on its left
// third and clear on its right third with a soft ramp between; sliding it
// from its right end (all clear) to its left end (all opaque) uncovers the
// element from left to right.
const SWEEP_MASK = "linear-gradient(90deg, #000 40%, transparent 60%)";
const sweepKeyframe = (position: string): Keyframe => ({
  maskImage: SWEEP_MASK,
  maskSize: "300% 100%",
  maskRepeat: "no-repeat",
  maskPosition: position,
  webkitMaskImage: SWEEP_MASK,
  webkitMaskSize: "300% 100%",
  webkitMaskRepeat: "no-repeat",
  webkitMaskPosition: position,
});
// An element with a mask of its own (the awards' outlined year) would see it
// swapped for the sweep's and back: it gets the blur without the sweep.
const hasOwnMask = (element: HTMLElement) => {
  const style = getComputedStyle(element);
  return (style.maskImage || style.webkitMaskImage || "none") !== "none";
};

// The edge crosses the heading in about 0.7s, as in the video of Apple's
// page, on a soft ease-in-out so the travel itself is seen.
const SWEEP: KeyframeAnimationOptions = { duration: 1100, easing: "cubic-bezier(0.45, 0, 0.25, 1)" };

export type RevealOptions = { sweep?: boolean };

/** The gap between one item of a section and the next (apple.com: ~0.15s). */
export const REVEAL_STEP_MS = 150;

const running = new WeakMap<HTMLElement, Animation[]>();
// Whether each element was last asked to show or to hide.
const wanted = new WeakMap<HTMLElement, boolean>();

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const lookOf = (element: HTMLElement): RevealLook => (element.hasAttribute("data-rise") ? "rise" : "blur");

// The element's own translate moved down by `by` (its own is kept: some
// elements centre themselves with it).
const lowered = (element: HTMLElement, by: string) => {
  const own = getComputedStyle(element).translate;
  const [x = "0px", y = "0px"] = own === "none" ? [] : own.split(" ");
  return `${x} calc(${y} + ${by})`;
};

const hidden = (element: HTMLElement, look: RevealLook): Keyframe =>
  look === "rise"
    ? { opacity: 0, translate: lowered(element, "30px") }
    : { opacity: 0, filter: "blur(16px)", translate: lowered(element, "0.28em") };

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
  const previous = running.get(element) ?? [];
  const from = previous.some((animation) => animation.playState !== "finished") ? current(element) : null;
  previous.forEach((animation) => animation.cancel());
  running.delete(element);
  return from;
};

const track = (element: HTMLElement, animations: Animation[]) => {
  running.set(element, animations);
  // The fade is the longer of a rise's two animations, and it comes last.
  const last = animations[animations.length - 1];
  if (last) last.onfinish = () => running.delete(element);
};

// The pill's opening (see the header). Measured on Apple's: the circle in
// ~0.35s, the stretch ~0.55s on an ease-in-out, the label fading in over
// 0.38s after 0.6s. The circle is the button clipped to its height at its
// middle; `scale` and `clip-path` leave the button's own transform (its
// hover zoom) and translate alone.
const PILL_STRETCH = "cubic-bezier(0.65, 0, 0.35, 1)";
const pillIn = (element: HTMLElement, delay: number): Animation[] => {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (!width || !height || width <= height) {
    return [element.animate([{ offset: 0, opacity: 0 }], { ...RISE_FADE, delay, fill: "backwards" })];
  }
  const side = (width - height) / 2;
  const style = getComputedStyle(element);
  // Measured before the button is scaled down for the circle.
  const icon = element.querySelector("svg");
  const own = element.getBoundingClientRect();
  const box = icon?.getBoundingClientRect();
  const animations = [
    element.animate([{ opacity: 0, scale: "0.2" }, { opacity: 1, scale: "1" }], { duration: 380, delay, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "backwards" }),
    element.animate([{ clipPath: `inset(0px ${side}px round ${height}px)` }, { clipPath: `inset(0px 0px round ${height}px)` }], { duration: 560, delay: delay + 350, easing: PILL_STRETCH, fill: "backwards" }),
  ];
  if (icon && box) {
    // The arrow starts in the circle (the button's middle).
    const shift = own.left + own.width / 2 - (box.left + box.width / 2);
    animations.push(
      icon.animate([{ scale: "0" }, { scale: "1.15", offset: 0.6 }, { scale: "1" }], { duration: 360, delay: delay + 150, easing: "ease-out", fill: "backwards" }),
      icon.animate([{ translate: `${shift}px 0` }, { translate: "0 0" }], { duration: 560, delay: delay + 350, easing: PILL_STRETCH, fill: "backwards" }),
      // Its colour held while the label's is still clear.
      icon.animate([{ color: style.color }, { color: style.color }], { duration: 1000, delay, fill: "backwards" }),
    );
  }
  animations.push(element.animate(
    [{ color: "transparent", textShadow: "0 0 0 transparent" }, { color: style.color, textShadow: style.textShadow }],
    { duration: 380, delay: delay + 620, easing: "cubic-bezier(0.42, 0, 0.58, 1)", fill: "backwards" },
  ));
  return animations;
};

/** Shows the element: from hidden (or from where it is) to its own style. */
export function revealIn(element: HTMLElement, delayMs = 0, look: RevealLook = lookOf(element), options: RevealOptions = {}): void {
  wanted.set(element, true);
  const from = take(element);
  element.setAttribute("data-revealed", "");
  if (prefersReducedMotion() || typeof element.animate !== "function") return;
  const delay = from ? 0 : delayMs;
  if (look === "rise" && !from && element.hasAttribute("data-pill")) {
    track(element, pillIn(element, delay));
    return;
  }
  // Keyframes at offset 0 only: the end is the element's own style, whatever
  // its opacity or filter normally is.
  if (look === "rise" && !from) {
    const start = hidden(element, "rise");
    track(element, [
      element.animate([{ offset: 0, translate: start.translate }], { ...RISE_MOVE, delay, fill: "backwards" }),
      element.animate([{ offset: 0, opacity: 0 }], { ...RISE_FADE, delay, fill: "backwards" }),
    ]);
    return;
  }
  const timing = look === "rise" ? RISE_FADE : BLUR_IN;
  const sweep = look === "blur" && !from && options.sweep !== false && !hasOwnMask(element);
  const animations = [element.animate([{ offset: 0, ...(from ?? hidden(element, look)) }], { ...timing, delay, fill: "backwards" })];
  if (sweep) animations.unshift(element.animate([sweepKeyframe("100% 0"), sweepKeyframe("0% 0")], { ...SWEEP, delay, fill: "backwards" }));
  track(element, animations);
}

/** Hides the element again (a section scrolled back past its cue). */
export function revealOut(element: HTMLElement, look: RevealLook = lookOf(element)): void {
  wanted.set(element, false);
  if (!element.hasAttribute("data-revealed")) return;
  const from = take(element);
  if (prefersReducedMotion() || typeof element.animate !== "function") {
    element.removeAttribute("data-revealed");
    return;
  }
  const animation = element.animate([{ offset: 0, ...(from ?? {}) }, { offset: 1, ...hidden(element, look) }], { ...OUT, fill: "forwards" });
  running.set(element, [animation]);
  animation.onfinish = () => {
    // The CSS hidden state takes over once the attribute is gone.
    element.removeAttribute("data-revealed");
    animation.cancel();
    running.delete(element);
  };
}

/** Reveals or hides the element to match `shown`, only when that changes. */
export function revealTo(element: HTMLElement, shown: boolean, delayMs = 0, options: RevealOptions = {}): void {
  if ((wanted.get(element) ?? element.hasAttribute("data-revealed")) === shown) return;
  if (shown) revealIn(element, delayMs, lookOf(element), options);
  else revealOut(element);
}
