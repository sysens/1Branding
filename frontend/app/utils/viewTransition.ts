// A page change runs as a view transition (nuxt.config.ts, experimental
// viewTransition; assets/css/tailwind.css): for about a second the new page
// rises into place under the old one. plugins/lenis.client.ts marks <html>
// with VIEW_TRANSITION_CLASS meanwhile and sends VIEW_TRANSITION_END when it
// is over (by then the new page's scroll is in place too). An opening
// animation set up during it would play half hidden: it can wait for this.

export const VIEW_TRANSITION_CLASS = "ob-view-transition";
export const VIEW_TRANSITION_END = "ob:view-transition-end";

/** Resolves once no page transition is running (at once if none is). */
export function afterViewTransition(timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    if (!document.documentElement.classList.contains(VIEW_TRANSITION_CLASS)) {
      resolve();
      return;
    }
    const done = () => {
      window.removeEventListener(VIEW_TRANSITION_END, done);
      clearTimeout(timer);
      resolve();
    };
    window.addEventListener(VIEW_TRANSITION_END, done);
    // In case the end is never announced (an aborted transition).
    const timer = setTimeout(done, timeoutMs);
  });
}
