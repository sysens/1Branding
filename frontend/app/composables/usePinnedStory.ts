import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";

export function usePinnedStory(root: Ref<HTMLElement | null>, count: () => number) {
  const activeIndex = ref(0);
  const direction = ref(1);
  let cleanup: (() => void) | undefined;
  let generation = 0;

  const setup = async () => {
    const current = ++generation;
    cleanup?.();
    cleanup = undefined;
    await nextTick();
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"), import("gsap/ScrollTrigger"),
    ]);
    if (current !== generation || !root.value) return;
    const stage = root.value.querySelector<HTMLElement>(".number-story__stage");
    if (!stage || count() < 2) return;
    gsap.registerPlugin(ScrollTrigger);
    const progress = { value: 0 };
    const timeline = gsap.to(progress, {
      value: 1,
      ease: "none",
      onUpdate: () => {
        const next = Math.min(count() - 1, Math.floor(progress.value * count()));
        if (next !== activeIndex.value) {
          direction.value = next > activeIndex.value ? 1 : -1;
          activeIndex.value = next;
        }
      },
      scrollTrigger: {
        trigger: stage,
        start: () => window.innerWidth < 768 ? "top top" : "top 118px",
        end: () => "+=" + count() * Math.max(320, window.innerHeight * 0.5),
        pin: true,
        scrub: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? true : 0.45,
        invalidateOnRefresh: true,
      },
    });
    cleanup = () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
    ScrollTrigger.refresh();
  };

  onMounted(setup);
  watch(count, setup);
  onBeforeUnmount(() => {
    generation++;
    cleanup?.();
  });
  return { activeIndex, direction };
}
