import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import type { MarqueeRenderer } from "~/utils/marquee/renderer";

export function useThreeDMarquee(
  root: Ref<HTMLElement | null>,
  canvas: Ref<HTMLCanvasElement | null>,
  images: () => readonly string[],
  paused: Ref<boolean>,
) {
  const ready = ref(false);
  let renderer: MarqueeRenderer | null = null;
  let cleanup: (() => void) | undefined;
  let disposed = false;
  let initializing = false;
  let pending: AbortController | null = null;
  let version = 0;
  let visible = false;
  let reduced = false;
  let frame = 0;
  let last = 0;
  let time = 0;

  const requestRender = () => {
    if (!frame && renderer && !disposed) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };
  const tick = (now: number) => {
    frame = 0;
    if (!renderer || disposed) return;
    const elapsed = Math.max(0, (now - last) / 1000);
    const delta = Math.min(elapsed, 0.05);
    last = now;
    const moving = visible && !document.hidden && !paused.value && !reduced;
    if (moving) time += elapsed;
    const settling = renderer.render(time, delta, !reduced);
    if (visible && !document.hidden && (moving || settling)) frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    if (!root.value || !renderer) return;
    renderer.resize(root.value.clientWidth, root.value.clientHeight);
    requestRender();
  };
  const start = async () => {
    if (initializing || renderer || !canvas.value || disposed) return;
    initializing = true;
    const controller = new AbortController();
    pending = controller;
    const current = ++version;
    try {
      const { createMarqueeRenderer } = await import("~/utils/marquee/renderer");
      if (disposed || current !== version || !canvas.value) return;
      const next = await createMarqueeRenderer(canvas.value, images(), controller.signal);
      if (disposed || current !== version) { next.dispose(false); return; }
      renderer = next;
      resize();
      renderer.render(time, 0, !reduced);
      ready.value = true;
    } catch {
      if (current === version) ready.value = false;
    } finally {
      if (current === version) { initializing = false; pending = null; }
    }
  };
  watch(paused, requestRender);
  watch(() => [...images()], () => {
    version++;
    pending?.abort();
    initializing = false;
    ready.value = false;
    renderer?.dispose(false);
    renderer = null;
    if (visible) void start();
  });

  onMounted(() => {
    const element = root.value;
    const surface = canvas.value;
    if (!element || !surface) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => { reduced = media.matches; requestRender(); };
    preference();
    const near = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void start();
    }, { rootMargin: "1000px" });
    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) { void start(); requestRender(); }
    });
    const observer = new ResizeObserver(resize);
    const move = (event: PointerEvent) => {
      if (!renderer || event.pointerType === "touch") return;
      const bounds = surface.getBoundingClientRect();
      const title = renderer.hover((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
      surface.title = title ?? "";
      requestRender();
    };
    const leave = () => { renderer?.clearHover(); surface.title = ""; requestRender(); };
    const lost = (event: Event) => {
      event.preventDefault();
      version++;
      pending?.abort();
      initializing = false;
      cancelAnimationFrame(frame);
      frame = 0;
      ready.value = false;
      renderer?.dispose(false);
      renderer = null;
    };
    const restored = () => { void start(); };
    near.observe(element);
    visibility.observe(element);
    observer.observe(element);
    media.addEventListener("change", preference);
    document.addEventListener("visibilitychange", requestRender);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerleave", leave);
    surface.addEventListener("webglcontextlost", lost);
    surface.addEventListener("webglcontextrestored", restored);
    cleanup = () => {
      near.disconnect(); visibility.disconnect(); observer.disconnect();
      media.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", requestRender);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", leave);
      surface.removeEventListener("webglcontextlost", lost);
      surface.removeEventListener("webglcontextrestored", restored);
    };
  });
  onBeforeUnmount(() => {
    disposed = true;
    version++;
    pending?.abort();
    cancelAnimationFrame(frame);
    cleanup?.();
    renderer?.dispose();
  });
  return { ready };
}
