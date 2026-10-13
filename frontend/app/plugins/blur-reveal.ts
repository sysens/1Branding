import type { ObjectDirective } from "vue";

// v-blur-reveal: the element comes in out of a blur (fading in and settling up
// a little) the first time it scrolls into view. The value is an optional delay
// in seconds, for staggering the lines of a heading. The hidden start state is
// CSS (assets/css/tailwind.css, [data-blur-reveal]) and only applies while
// scripting is on and motion is allowed, so the server-rendered text is never
// lost; the attribute is rendered on the server too, so it does not pop.
// Elements that come into view together (a list scrolled in) follow one
// another from the top down: each gets a little more delay (--reveal-batch).

let observer: IntersectionObserver | null = null;

const reveal = (element: Element) => element.classList.add("is-revealed");

const blurReveal: ObjectDirective<HTMLElement, number | undefined> = {
  getSSRProps: (binding) => ({
    "data-blur-reveal": "",
    style: binding.value ? { "--reveal-delay": `${binding.value}s` } : undefined,
  }),
  mounted(element, binding) {
    element.setAttribute("data-blur-reveal", "");
    if (binding.value) element.style.setProperty("--reveal-delay", `${binding.value}s`);
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal(element);
      return;
    }
    observer ??= new IntersectionObserver((entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        .forEach((entry, order) => {
          const target = entry.target as HTMLElement;
          target.style.setProperty("--reveal-batch", `${(order * 0.09).toFixed(2)}s`);
          reveal(target);
          observer?.unobserve(target);
        });
    }, { rootMargin: "0px 0px -12% 0px" });
    observer.observe(element);
  },
  beforeUnmount(element) {
    observer?.unobserve(element);
  },
};

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("blur-reveal", blurReveal);
});
