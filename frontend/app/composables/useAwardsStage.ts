import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import type { AwardsRenderer } from "~/utils/awards/renderer";

export function useAwardsStage(root: Ref<HTMLElement | null>, canvas: Ref<HTMLCanvasElement | null>, { numeral = true } = {}) {
  const ready = ref(false);
  let renderer: AwardsRenderer | null = null;
  let pending: AbortController | null = null;
  let cleanup: (() => void) | undefined;
  let disposed = false;
  let generation = 0;

  const resize = () => {
    if (!root.value || !renderer) return;
    renderer.resize(root.value.clientWidth, root.value.clientHeight);
    renderer.render();
  };
  const start = async () => {
    if (pending || renderer || !canvas.value || disposed) return;
    const controller = new AbortController();
    pending = controller;
    const version = ++generation;
    try {
      const { createAwardsRenderer } = await import("~/utils/awards/renderer");
      if (disposed || version !== generation || !canvas.value) return;
      const next = createAwardsRenderer(canvas.value, { numeral });
      if (disposed || version !== generation) { next.dispose(false); return; }
      renderer = next;
      resize();
      ready.value = true;
    } catch (error) {
      if (version === generation) {
        ready.value = false;
        if (!controller.signal.aborted) console.warn("Awards stage:", error instanceof Error ? error.message : "Renderer unavailable");
      }
    } finally {
      if (version === generation) pending = null;
    }
  };
  onMounted(() => {
    const element = root.value;
    const surface = canvas.value;
    if (!element || !surface) return;
    const near = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void start();
    }, { rootMargin: "800px" });
    const observer = new ResizeObserver(resize);
    const lost = (event: Event) => {
      event.preventDefault();
      generation++;
      pending?.abort(); pending = null;
      ready.value = false;
      renderer?.dispose(false); renderer = null;
    };
    const restored = () => { void start(); };
    near.observe(element); observer.observe(element);
    surface.addEventListener("webglcontextlost", lost);
    surface.addEventListener("webglcontextrestored", restored);
    cleanup = () => {
      near.disconnect(); observer.disconnect();
      surface.removeEventListener("webglcontextlost", lost);
      surface.removeEventListener("webglcontextrestored", restored);
    };
  });
  onBeforeUnmount(() => {
    disposed = true; generation++;
    pending?.abort();
    cleanup?.(); renderer?.dispose();
  });
  return { ready };
}
