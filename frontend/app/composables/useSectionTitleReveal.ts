import { nextTick, onBeforeUnmount, onMounted, type Ref } from "vue";

export function useSectionTitleReveal(root: Ref<HTMLElement | null>): void {
  let dispose: (() => void) | undefined;
  let disposed = false;
  onMounted(async () => {
    await nextTick();
    if (!root.value || disposed) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const seen = new WeakSet<Element>();
    const ambientSeen = new WeakSet<Element>();
    const ambientObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement)
          entry.target.style.setProperty("--ambient-play-state", entry.isIntersecting ? "running" : "paused");
      }
    });
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (reduced.matches) continue;
        const animation = entry.target.animate([
          { transform: "translateY(44px)", opacity: 0 },
          { transform: "translateY(0)", opacity: 1 },
        ], { duration: 750, easing: "cubic-bezier(.2,.7,.2,1)", fill: "none" });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }
    }, { rootMargin: "0px 0px -7% 0px", threshold: .12 });
    const observe = () => {
      root.value?.querySelectorAll(".hero-light-transition,.awards-transition").forEach(surface => {
        if (ambientSeen.has(surface)) return;
        ambientSeen.add(surface); ambientObserver.observe(surface);
      });
      root.value?.querySelectorAll("h1,h2,.world-section__statement").forEach(title => {
        if (seen.has(title)) return;
        seen.add(title); observer.observe(title);
      });
    };
    const mutations = new MutationObserver(observe);
    mutations.observe(root.value, { childList: true, subtree: true });
    const cancel = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
    reduced.addEventListener("change", cancel);
    observe();
    dispose = () => { observer.disconnect(); ambientObserver.disconnect(); mutations.disconnect(); cancel(); reduced.removeEventListener("change", cancel); };
  });
  onBeforeUnmount(() => { disposed = true; dispose?.(); });
}
