/**
 * 100lvh in pixels: the window's height with the browser's bars hidden.
 *
 * On a phone window.innerHeight is not one number: it is ~55-110px shorter
 * while the address bar (and Safari's toolbar) show, and grows when they hide
 * as the page is scrolled down. CSS lengths in vh do not follow it (vh is the
 * large height, like lvh), so a section laid out in vh and timed in script by
 * window.innerHeight drifted apart from its own layout, and jumped each time
 * the bars came or went. Scroll-driven sections whose layout is in vh take
 * their screen of scroll from here instead. On a desktop it equals
 * window.innerHeight.
 */
let probe: HTMLElement | null = null;
let cached = 0;

const measure = () => {
  cached = probe?.offsetHeight || window.innerHeight;
};

export const largeViewportHeight = (): number => {
  if (typeof window === "undefined") return 0;
  if (!probe) {
    probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    // 100vh for browsers without lvh (there the two are the same length).
    probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    measure();
    // It changes with the window or the phone's orientation, not with the bars.
    window.addEventListener("resize", measure, { passive: true });
  }
  return cached || window.innerHeight;
};
