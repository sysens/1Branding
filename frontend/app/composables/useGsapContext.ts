import type { Ref } from "vue";
import { afterViewTransition } from "~/utils/viewTransition";

type Gsap = typeof import("gsap").gsap;
type ScrollTriggerPlugin = typeof import("gsap/ScrollTrigger").ScrollTrigger;

export type GsapTools = {
  gsap: Gsap;
  /** Registered when `scrollTrigger: true`. */
  ScrollTrigger: ScrollTriggerPlugin | null;
  /** The scope element (the ref's value when the animations were created). */
  el: HTMLElement;
};

type GsapContextOptions = {
  /** Load and register ScrollTrigger before `setup` runs. */
  scrollTrigger?: boolean;
  /**
   * Wait until the scope comes near the viewport (it starts at once when it is
   * already in view). Without it, the animations are set up on mount.
   */
  whenVisible?: { rootMargin?: string; threshold?: number };
  /** Also animate for visitors who ask for reduced motion (default: skip). */
  allowReducedMotion?: boolean;
  /**
   * Wait for the page transition to end before setting up (utils/viewTransition.ts):
   * for a page's opening animation, which would otherwise play half hidden under
   * it, and measure the page before its scroll is back at the top.
   */
  afterViewTransition?: boolean;
};

/**
 * The one way components set up GSAP animations: GSAP (and ScrollTrigger) are
 * loaded lazily, `setup` runs inside a gsap.context scoped to `scope`, and
 * everything is reverted on unmount. A component that unmounts while GSAP is
 * still loading never creates its animations, and nothing outside `scope` is
 * touched. With reduced motion the animations are skipped and the content
 * simply stays in place.
 *
 * Returns `refresh()` to rebuild the animations (e.g. after the content changed).
 */
export function useGsapContext(
  scope: Ref<HTMLElement | null>,
  setup: (tools: GsapTools & { ScrollTrigger: ScrollTriggerPlugin }) => void,
  options: GsapContextOptions & { scrollTrigger: true }
): { refresh: () => Promise<void> };
export function useGsapContext(
  scope: Ref<HTMLElement | null>,
  setup: (tools: GsapTools) => void,
  options?: GsapContextOptions
): { refresh: () => Promise<void> };
export function useGsapContext(
  scope: Ref<HTMLElement | null>,
  setup: (tools: GsapTools & { ScrollTrigger: ScrollTriggerPlugin }) => void,
  options: GsapContextOptions = {}
) {
  let ctx: { revert: () => void } | null = null;
  let observer: IntersectionObserver | null = null;
  let disposed = false;
  let starting = false;

  const start = async () => {
    if (ctx || starting || disposed) return;
    if (!options.allowReducedMotion && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    starting = true;
    await nextTick();
    const [{ gsap }, scrollTriggerModule] = await Promise.all([
      import("gsap"),
      options.scrollTrigger ? import("gsap/ScrollTrigger") : Promise.resolve(null),
      options.afterViewTransition ? afterViewTransition() : Promise.resolve(),
    ]);
    starting = false;
    const el = scope.value;
    if (disposed || ctx || !el) return;
    const ScrollTrigger = scrollTriggerModule?.ScrollTrigger ?? null;
    if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    // ScrollTrigger is only typed as present for callers that asked for it.
    ctx = gsap.context(() => setup({ gsap, ScrollTrigger: ScrollTrigger as ScrollTriggerPlugin, el }), el);
  };

  const revert = () => {
    ctx?.revert();
    ctx = null;
  };

  onMounted(() => {
    const el = scope.value;
    if (!el) return;
    if (!options.whenVisible) {
      void start();
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      void start();
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer?.disconnect();
        observer = null;
        void start();
      },
      { threshold: options.whenVisible.threshold ?? 0.01, rootMargin: options.whenVisible.rootMargin ?? "200px 0px" }
    );
    observer.observe(el);
  });

  onBeforeUnmount(() => {
    disposed = true;
    observer?.disconnect();
    observer = null;
    revert();
  });

  return {
    /** Rebuild the animations from scratch. */
    refresh: async () => {
      revert();
      await start();
    },
  };
}
