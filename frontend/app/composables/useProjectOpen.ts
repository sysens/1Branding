import { useRouter } from "vue-router";

// Opening a project from the /projects grid, after askphill.com's case cards
// (read from its page-transition code and frames of it), with the project's
// own page inside the disc instead of a colour:
//
// The page changes as a view transition (nuxt.config.ts). Over the old page,
// the new one shows only through a disc with an arrow cut out of it, in the
// middle of the card that was clicked, the new page's own middle in it: the
// disc springs up there (from a quarter of its size, turned half round and
// clear, to its size, a tenth of the screen's longer side, upright; a spring
// of damping 24, stiffness 375, overshooting a little), then grows from there
// until it covers the screen (0.5 s, speeding up), its arrow closing, while
// the page slides into its place; the old page fades in the last 0.2 s. The
// shapes and timings are in assets/css/tailwind.css (.ob-project-open); here
// the card's middle, the page's offset and the size that covers the screen
// are handed over as custom properties.
//
// While the new page loads the card gives a little under the press. Without
// view transitions, with reduced motion, or a click that opens a new tab, the
// link works as any other.

export const PROJECT_OPEN_CLASS = "ob-project-open";
const PROPERTIES = ["--ob-open-x", "--ob-open-y", "--ob-open-mx", "--ob-open-my", "--ob-open-dx", "--ob-open-dy", "--ob-open-end", "--ob-open-spring"] as const;

/** A spring from 0 to 1 as a CSS linear() easing. */
const springEasing = (damping: number, stiffness: number) => {
  const w0 = Math.sqrt(stiffness);
  const zeta = damping / (2 * w0);
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  const at = (t: number) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  // It settles (within 0.2%) in about 0.52 s, the disc's time in the CSS.
  const duration = -Math.log(0.002) / (zeta * w0);
  const points = Array.from({ length: 41 }, (_, step) => at((duration * step) / 40).toFixed(4));
  points[40] = "1";
  return `linear(${points.join(", ")})`;
};

/**
 * The grid's click handler, on each card in the capture phase (so it comes
 * before the link's own navigation): `open(event, to)`.
 */
export const useProjectOpen = () => {
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  let busy = false;

  return (event: MouseEvent, to: string) => {
    if (busy) {
      event.preventDefault();
      return;
    }
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!("startViewTransition" in document) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    busy = true;

    const card = event.currentTarget as HTMLElement;
    const box = card.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    // The disc covers the screen once its radius reaches the farthest corner.
    const far = Math.max(
      Math.hypot(x, y),
      Math.hypot(innerWidth - x, y),
      Math.hypot(x, innerHeight - y),
      Math.hypot(innerWidth - x, innerHeight - y)
    );

    // While the disc springs up, the new page's middle (its logo, its title)
    // is in it: the page is moved by the card's offset from the screen's
    // middle, and slides back into place as the disc grows.
    const root = document.documentElement;
    root.style.setProperty("--ob-open-x", `${Math.round(x)}px`);
    root.style.setProperty("--ob-open-y", `${Math.round(y)}px`);
    root.style.setProperty("--ob-open-mx", `${Math.round(innerWidth / 2)}px`);
    root.style.setProperty("--ob-open-my", `${Math.round(innerHeight / 2)}px`);
    root.style.setProperty("--ob-open-dx", `${Math.round(x - innerWidth / 2)}px`);
    root.style.setProperty("--ob-open-dy", `${Math.round(y - innerHeight / 2)}px`);
    root.style.setProperty("--ob-open-end", `${Math.ceil(far * 2.1)}px`);
    if (CSS.supports("animation-timing-function", "linear(0, 1)")) root.style.setProperty("--ob-open-spring", springEasing(24, 375));
    root.classList.add(PROJECT_OPEN_CLASS);
    card.classList.add("is-opening");

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      busy = false;
      window.clearTimeout(safety);
      root.classList.remove(PROJECT_OPEN_CLASS);
      PROPERTIES.forEach((name) => root.style.removeProperty(name));
      card.classList.remove("is-opening");
    };
    // Whatever goes wrong, the next page change is an ordinary one.
    const safety = window.setTimeout(finish, 12000);

    let transitionStarted = false;
    const stopStart = nuxtApp.hook("page:view-transition:start", (transition) => {
      stopStart();
      transitionStarted = true;
      transition.finished.finally(finish);
    });
    // The browser skipped the transition: done once the new page is in.
    const stopFinish = nuxtApp.hook("page:finish", () => {
      stopFinish();
      if (!transitionStarted) finish();
    });
    router.push(to).catch(finish);
  };
};
