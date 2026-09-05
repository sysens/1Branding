import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import type { ChronographRenderer } from "~/utils/chronograph/renderer";

export function useChronograph(active: Ref<boolean>) {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const ready = ref(false);
  const running = ref(false);
  let renderer: ChronographRenderer | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let preference: MediaQueryList | null = null;
  let initialized = false;
  let disposed = false;
  let frame = 0;
  let elapsed = 0;
  let previous = 0;

  const tick = (timestamp: number) => {
    if (!running.value || disposed) return;
    if (previous) elapsed += (timestamp - previous) / 1000;
    previous = timestamp;
    renderer?.render(elapsed);
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    previous = 0;
    running.value = ready.value && active.value && !document.hidden && !preference?.matches;
    if (running.value) frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    const canvas = canvasRef.value;
    if (!canvas || !renderer) return;
    renderer.resize(canvas.clientWidth, window.devicePixelRatio);
    renderer.render(elapsed);
  };
  const initialize = async () => {
    if (initialized || !active.value || !canvasRef.value) return;
    initialized = true;
    try {
      const logo = new Image();
      logo.src = "/General/logorobo.webp";
      const [{ createChronographRenderer }] = await Promise.all([
        import("~/utils/chronograph/renderer"), logo.decode(),
      ]);
      if (disposed || !canvasRef.value) return;
      renderer = createChronographRenderer(canvasRef.value, logo);
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvasRef.value);
      resize();
      ready.value = true;
      sync();
    } catch (error) {
      if (!disposed) console.error("Unable to initialize the contact clock.", error);
    }
  };

  onMounted(() => {
    preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("resize", resize);
    void initialize();
  });
  watch(active, () => { void initialize(); sync(); });
  onBeforeUnmount(() => {
    disposed = true;
    running.value = false;
    cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    preference?.removeEventListener("change", sync);
    document.removeEventListener("visibilitychange", sync);
    window.removeEventListener("resize", resize);
    renderer = null;
  });
  return { canvasRef, ready, running };
}
