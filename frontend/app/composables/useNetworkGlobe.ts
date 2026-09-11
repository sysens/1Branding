import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import type { GlobeRenderer } from "~/utils/globe/renderer";
import { loadGlobePositions } from "~/utils/globe/assets";

export function useNetworkGlobe(active: Ref<boolean>) {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const labelsRef = ref<HTMLElement | null>(null);
  const paused = ref(false);
  const animating = ref(false);
  const status = ref<"loading" | "ready" | "error">("loading");
  const abort = new AbortController();
  let renderer: GlobeRenderer | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let preference: MediaQueryList | null = null;
  let initializing = false,
    disposed = false,
    frame = 0,
    previous = 0,
    elapsed = 0;

  const tick = (now: number) => {
    if (!animating.value || disposed) return;
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    elapsed += delta;
    renderer?.render(elapsed, delta, true);
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    previous = 0;
    animating.value =
      status.value === "ready" &&
      active.value &&
      !paused.value &&
      !document.hidden;
    if (status.value === "ready") renderer?.render(elapsed, 0, animating.value);
    if (animating.value) frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    const canvas = canvasRef.value;
    if (canvas) renderer?.resize(canvas.clientWidth, canvas.clientHeight);
  };
  const initialize = async () => {
    if (
      initializing ||
      renderer ||
      !active.value ||
      !canvasRef.value ||
      !labelsRef.value
    )
      return;
    initializing = true;
    try {
      const [module, points, outlines] = await Promise.all([
        import("~/utils/globe/renderer"),
        loadGlobePositions("/globe/land-points.v1.bin", abort.signal, 512_000),
        loadGlobePositions("/globe/outlines.v1.bin", abort.signal, 512_000, 24),
      ]);
      if (disposed || !canvasRef.value || !labelsRef.value) return;
      renderer = module.createGlobeRenderer(
        canvasRef.value,
        labelsRef.value,
        points,
        outlines,
      );
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvasRef.value);
      resize();
      status.value = "ready";
      sync();
    } catch (error) {
      if (!disposed) {
        status.value = "error";
        console.error("Globe preview:", error);
      }
    }
  };
  const changePreference = () => {
    paused.value = preference?.matches ?? false;
    sync();
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    status.value = "error";
    sync();
  };
  const contextRestored = () => {
    resizeObserver?.disconnect();
    renderer?.dispose(false);
    renderer = null;
    initializing = false;
    status.value = "loading";
    void initialize();
  };
  onMounted(() => {
    preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    paused.value = preference.matches;
    preference.addEventListener("change", changePreference);
    document.addEventListener("visibilitychange", sync);
    canvasRef.value?.addEventListener("webglcontextlost", contextLost);
    canvasRef.value?.addEventListener("webglcontextrestored", contextRestored);
    void initialize();
  });
  watch(active, () => {
    void initialize();
    sync();
  });
  watch(paused, sync);
  onBeforeUnmount(() => {
    disposed = true;
    abort.abort();
    cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    preference?.removeEventListener("change", changePreference);
    document.removeEventListener("visibilitychange", sync);
    canvasRef.value?.removeEventListener("webglcontextlost", contextLost);
    canvasRef.value?.removeEventListener(
      "webglcontextrestored",
      contextRestored,
    );
    renderer?.dispose();
  });
  function onKeydown(event: KeyboardEvent): void {
    const directions: Record<string, readonly [number, number]> = {
      ArrowLeft: [-0.12, 0],
      ArrowRight: [0.12, 0],
      ArrowUp: [0, -0.08],
      ArrowDown: [0, 0.08],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    renderer?.rotate(...direction);
  }
  return {
    canvasRef,
    labelsRef,
    paused,
    animating,
    status,
    onKeydown,
    reset: () => renderer?.reset(),
  };
}
