import type { ObjectDirective } from "vue";
import { lookOf, prefersReducedMotion, REVEAL_STAGGER, revealIn } from "~/utils/reveal";

// v-blur-reveal (headings) and v-rise (text, buttons, cards, media): the
// element comes into view the first time it scrolls in, in the look of
// utils/reveal.ts. The value is an optional delay in seconds. Elements that
// come into view together follow one another, top to bottom and left to
// right, as on apple.com.
//
// The attribute is rendered on the server, and once the app has mounted every
// such element in the page is watched, whether or not its section has hydrated
// yet: the landing hydrates its sections lazily, and waiting for that made
// content appear late and all at once. `data-blur-reveal="manual"` marks text
// a section reveals itself (on a scroll cue); it shares the hidden state but is
// not watched here.

const SELECTOR = '[data-blur-reveal]:not([data-blur-reveal="manual"]):not([data-revealed]), [data-rise]:not([data-revealed])';

let observer: IntersectionObserver | null = null;
const watched = new WeakSet<Element>();

const delayOf = (element: HTMLElement) => Number.parseFloat(element.style.getPropertyValue("--reveal-delay")) || 0;

const getObserver = () =>
  (observer ??= new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
      .forEach((entry, order) => {
        const target = entry.target as HTMLElement;
        observer?.unobserve(target);
        revealIn(target, Math.max(delayOf(target), order * REVEAL_STAGGER[lookOf(target)]) * 1000);
      });
    // Apple's cue: when the element is 10% of the screen into view.
  }, { rootMargin: "0px 0px -10% 0px" }));

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

const directive = (attribute: string): ObjectDirective<HTMLElement, number | undefined> => ({
  getSSRProps: (binding) => ({
    [attribute]: "",
    style: binding.value ? { "--reveal-delay": `${binding.value}s` } : undefined,
  }),
  mounted(element, binding) {
    if (!element.hasAttribute(attribute)) element.setAttribute(attribute, "");
    if (binding.value) element.style.setProperty("--reveal-delay", `${binding.value}s`);
    watch(element);
  },
  beforeUnmount(element) {
    observer?.unobserve(element);
  },
});

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("blur-reveal", directive("data-blur-reveal"));
  nuxtApp.vueApp.directive("rise", directive("data-rise"));
  if (import.meta.server) return;
  nuxtApp.hook("app:mounted", watchPage);
  nuxtApp.hook("page:finish", watchPage);
});
