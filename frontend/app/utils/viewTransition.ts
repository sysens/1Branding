// A page change runs as a view transition (nuxt.config.ts, experimental
// viewTransition; assets/css/tailwind.css): for about a second the new page
// rises into place under the old one. plugins/lenis.client.ts marks <html>
// with VIEW_TRANSITION_CLASS meanwhile and sends VIEW_TRANSITION_END when it
// is over. It also settles each new page's scroll (the top, or where the
// visitor left it on a reload or back/forward) and records that here
// (markPageSettled). An opening animation can wait for both, and skip itself
// when the page was put back further down (pageWasRestored).

export const VIEW_TRANSITION_CLASS = "ob-view-transition";
export const VIEW_TRANSITION_END = "ob:view-transition-end";
const PAGE_SETTLED = "ob:page-settled";
const SETTLED_PATH = "data-settled-path";
const SCROLL_RESTORED = "data-scroll-restored";

/** The page at `path` has its scroll in place; `restored`: put back further down. */
export function markPageSettled(path: string, restored: boolean): void {
  const root = document.documentElement;
  root.setAttribute(SETTLED_PATH, path);
  root.toggleAttribute(SCROLL_RESTORED, restored);
  window.dispatchEvent(new Event(PAGE_SETTLED));
}

/** Whether the current page was put back where the visitor left it. */
export function pageWasRestored(): boolean {
  return document.documentElement.hasAttribute(SCROLL_RESTORED);
}

/**
 * Resolves once the page at `path` has its scroll settled and no page
 * transition is running (at once if both are so already).
 */
export function afterPageSettles(path: string, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    const root = document.documentElement;
    const ready = () => root.getAttribute(SETTLED_PATH) === path && !root.classList.contains(VIEW_TRANSITION_CLASS);
    if (ready()) {
      resolve();
      return;
    }
    const check = () => {
      if (ready()) done();
    };
    const done = () => {
      window.removeEventListener(PAGE_SETTLED, check);
      window.removeEventListener(VIEW_TRANSITION_END, check);
      clearTimeout(timer);
      resolve();
    };
    window.addEventListener(PAGE_SETTLED, check);
    window.addEventListener(VIEW_TRANSITION_END, check);
    // In case it is never announced (an aborted transition).
    const timer = setTimeout(done, timeoutMs);
  });
}
