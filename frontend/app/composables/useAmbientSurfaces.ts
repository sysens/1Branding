import { nextTick, onBeforeUnmount, onMounted, type Ref } from "vue";

// The landing's ambient light surfaces (the hero and awards light
// transitions) animate only while on screen: each gets --ambient-play-state
// "running" or "paused". Headings are not animated here: they come in through
// v-blur-reveal (plugins/blur-reveal.ts), one look for all of them.
export function useAmbientSurfaces(root: Ref<HTMLElement | null>): void {
  let dispose: (() => void) | undefined;
  let disposed = false;
  onMounted(async () => {
    await nextTick();
    if (!root.value || disposed) return;
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement)
          entry.target.style.setProperty("--ambient-play-state", entry.isIntersecting ? "running" : "paused");
      }
    });
    const observe = () => {
      root.value?.querySelectorAll(".hero-light-transition,.awards-transition").forEach((surface) => {
        if (seen.has(surface)) return;
        seen.add(surface);
        observer.observe(surface);
      });
    };
    const mutations = new MutationObserver(observe);
    mutations.observe(root.value, { childList: true, subtree: true });
    observe();
    dispose = () => {
      observer.disconnect();
      mutations.disconnect();
    };
  });
  onBeforeUnmount(() => {
    disposed = true;
    dispose?.();
  });
}
