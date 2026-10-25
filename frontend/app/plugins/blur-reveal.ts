import type { ObjectDirective } from "vue";
import { prefersReducedMotion, REVEAL_STEP_MS, revealIn } from "~/utils/reveal";

// v-blur-reveal (headings) and v-rise (text, buttons, cards, media): content
// comes into view in the looks of utils/reveal.ts, the way apple.com/iphone
// does it. The value is an optional delay in seconds.
//
// A section's content comes in as one chain, in document order (heading,
// link, then the cards left to right), each item 0.15s after the one before.
// As on apple.com, the chain starts when the first item is 10% into the
// screen, and takes every item of the section that is on screen top to bottom
// at that moment, even ones still off to the side (the rest of a row of
// cards); items further down join the chain as they come up, after the items
// still waiting their turn. Items inside a [data-reveal-row] count as on
// screen once the row's top is: a row whose items sit at different heights
// (the social wall's staggered columns) still comes in left to right.
//
// The attribute is rendered on the server, and once the app has mounted every
// such element in the page is watched, whether or not its section has hydrated
// yet: the landing hydrates its sections lazily, and waiting for that made
// content appear late and all at once. `data-blur-reveal="manual"` marks text
// a section reveals itself (on a scroll cue); it shares the hidden state but is
// not watched here. A value of `false` turns the reveal off for that element
// (the first cards of a list that is on screen as the page opens, which come
// in with CSS instead).

const SELECTOR = '[data-blur-reveal]:not([data-blur-reveal="manual"]):not([data-revealed]), [data-rise]:not([data-revealed])';
const CUE = 0.9;

let observer: IntersectionObserver | null = null;
const watched = new WeakSet<Element>();
// When the next item of each section's chain may start (performance.now ms).
const chains = new WeakMap<Element, number>();

const delayOf = (element: HTMLElement) => Number.parseFloat(element.style.getPropertyValue("--reveal-delay")) || 0;
const groupOf = (element: Element) => element.closest("section, [data-reveal-group]") ?? document.body;

// On screen top to bottom (past the cue line, not scrolled away), shown at all.
const inBand = (element: HTMLElement) => {
  const own = element.getBoundingClientRect();
  if (own.width === 0 && own.height === 0) return false;
  const rect = (element.closest("[data-reveal-row]") ?? element).getBoundingClientRect();
  return rect.top < innerHeight * CUE && rect.bottom > 0;
};

const play = (trigger: HTMLElement) => {
  const group = groupOf(trigger);
  const members = Array.from(group.querySelectorAll<HTMLElement>(SELECTOR)).filter(
    (element) => groupOf(element) === group && watched.has(element) && (element === trigger || inBand(element)),
  );
  const now = performance.now();
  let at = Math.max(now, chains.get(group) ?? 0);
  for (const element of members) {
    observer?.unobserve(element);
    const delay = Math.max(at - now, delayOf(element) * 1000);
    revealIn(element, delay);
    at = now + delay + REVEAL_STEP_MS;
  }
  chains.set(group, at);
};

const getObserver = () =>
  (observer ??= new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting && !entry.target.hasAttribute("data-revealed"))
      .forEach((entry) => {
        // An earlier entry's chain may have taken this one already.
        if (!entry.target.hasAttribute("data-revealed")) play(entry.target as HTMLElement);
      });
    // Apple's cue: when the element is 10% of the screen into view.
  }, { rootMargin: `0px 0px -${Math.round((1 - CUE) * 100)}% 0px` }));

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

const directive = (attribute: string): ObjectDirective<HTMLElement, number | false | undefined> => ({
  getSSRProps: (binding) => (binding.value === false ? {} : {
    [attribute]: "",
    style: binding.value ? { "--reveal-delay": `${binding.value}s` } : undefined,
  }),
  mounted(element, binding) {
    if (binding.value === false) return;
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
