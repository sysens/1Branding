import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import type { AwardsGallery } from "~/utils/awards/gallery";

export function useAwardsGallery(root: Ref<HTMLElement | null>, surface: Ref<HTMLElement | null>, paused: Ref<boolean>) {
  const ready = ref(false);
  let renderer: AwardsGallery | null = null;
  let disposed = false;
  let initializing = false;
  let visible = false;
  let reduced = false;
  let frame = 0;
  let time = 0;
  let last = 0;
  let cleanup: (() => void) | undefined;
  const schedule = () => {
    if (!disposed && renderer && !frame) frame = requestAnimationFrame(tick);
  };
  const tick = (now: number) => {
    frame = 0;
    if (!renderer || disposed) return;
    const moving = visible && !document.hidden && !paused.value && !reduced;
    if (moving) time += Math.min((now - last) / 1000 || 0, .05);
    last = now;
    renderer.render(time);
    if (moving) schedule();
  };
  const resize = () => {
    if (!root.value || !renderer) return;
    renderer.resize(root.value.clientWidth, root.value.clientHeight);
    schedule();
  };
  const start = async () => {
    if (initializing || renderer || disposed) return;
    initializing = true;
    try {
      const { createAwardsGallery } = await import("~/utils/awards/gallery");
      if (disposed || !surface.value) return;
      renderer = createAwardsGallery(surface.value);
      resize();
      renderer.render(time);
      ready.value = true;
    } catch (error) {
      if (!disposed) console.warn("Awards gallery:", error instanceof Error ? error.message : "Gallery unavailable");
    } finally { initializing = false; }
  };
  watch(paused, schedule);
  onMounted(() => {
    if (!root.value) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => { reduced = media.matches; schedule(); };
    preference();
    const near = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void start();
    }, { rootMargin: "800px" });
    const activity = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) { void start(); schedule(); }
    });
    const observer = new ResizeObserver(resize);
    near.observe(root.value); activity.observe(root.value); observer.observe(root.value);
    media.addEventListener("change", preference);
    document.addEventListener("visibilitychange", schedule);
    cleanup = () => {
      near.disconnect(); activity.disconnect(); observer.disconnect();
      media.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", schedule);
    };
  });
  onBeforeUnmount(() => {
    disposed = true; cancelAnimationFrame(frame); cleanup?.(); renderer?.dispose();
  });
  return { ready };
}
