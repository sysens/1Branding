import type { ObjectDirective } from "vue";
import { prefersReducedMotion, revealIn } from "~/utils/reveal";

// v-blur-reveal: the element comes in out of a blur (utils/reveal.ts) the
// first time it scrolls into view. The value is an optional delay in seconds,
// for staggering the lines of a heading. Elements that come into view together
// (a list scrolled in) follow one another from the top down.
//
// The attribute is rendered on the server, and once the app has mounted every
// such element in the page is watched, whether or not its section has hydrated
// yet: the landing hydrates its sections lazily, and waiting for that made
// headings appear late and all at once. `data-blur-reveal="manual"` marks text
// a section reveals itself (on a scroll cue); it shares the hidden state but is
// not watched here.

const SELECTOR = '[data-blur-reveal]:not([data-blur-reveal="manual"]):not([data-revealed])';
const BATCH_STEP = 0.09;

let observer: IntersectionObserver | null = null;
const watched = new WeakSet<Element>();

const delayOf = (element: HTMLElement) => Number.parseFloat(element.style.getPropertyValue("--reveal-delay")) || 0;

const getObserver = () =>
  (observer ??= new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      .forEach((entry, order) => {
        const target = entry.target as HTMLElement;
        observer?.unobserve(target);
        revealIn(target, Math.max(delayOf(target), order * BATCH_STEP) * 1000);
      });
  }, { rootMargin: "0px 0px -12% 0px" }));

const watch = (element: HTMLElement) => {
  if (watched.has(element) || element.hasAttribute("data-revealed")) return;
  watched.add(element);
  if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
    revealIn(element);
    return;
  }
  getObserver().observe(element);
};

const watchPage = () => {
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach(watch);
};

const blurReveal: ObjectDirective<HTMLElement, number | undefined> = {
  getSSRProps: (binding) => ({
    "data-blur-reveal": "",
    style: binding.value ? { "--reveal-delay": `${binding.value}s` } : undefined,
  }),
  mounted(element, binding) {
    if (!element.hasAttribute("data-blur-reveal")) element.setAttribute("data-blur-reveal", "");
    if (binding.value) element.style.setProperty("--reveal-delay", `${binding.value}s`);
    watch(element);
  },
  beforeUnmount(element) {
    observer?.unobserve(element);
  },
};

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("blur-reveal", blurReveal);
  if (import.meta.server) return;
  nuxtApp.hook("app:mounted", watchPage);
  nuxtApp.hook("page:finish", watchPage);
});
