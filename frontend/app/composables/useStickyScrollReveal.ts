import { useMotionValueEvent, useScroll } from "motion-v";
import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import { closestScrollPanel } from "~/utils/stickyScroll";

export function useStickyScrollReveal(root: Ref<HTMLElement | null>) {
  const active = ref(0);
  const { scrollYProgress } = useScroll(() => ({
    target: root,
    offset: ["start end", "end start"],
    trackContentSize: true,
  }));
  const update = () => {
    if (!root.value) return;
    const centers = Array.from(root.value.querySelectorAll<HTMLElement>("[data-sticky-panel]"), panel => {
      const rect = panel.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    const compact = window.matchMedia("(max-width: 767px), (orientation: portrait)").matches;
    const activationLine = compact ? Math.min(window.innerHeight / 2, 320) : window.innerHeight / 2;
    active.value = closestScrollPanel(centers, activationLine);
  };
  useMotionValueEvent(scrollYProgress, "change", update);
  let observer: ResizeObserver | undefined;
  onMounted(async () => {
    await nextTick();
    if (!root.value) return;
    observer = new ResizeObserver(update);
    observer.observe(root.value);
    window.addEventListener("resize", update, { passive: true });
    update();
  });
  onBeforeUnmount(() => {
    observer?.disconnect();
    window.removeEventListener("resize", update);
  });
  return { active };
}
