import { useMotionValue, useScroll, useTransform, type MotionValue } from "motion-v";
import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

export interface MacbookMotion {
  deviceScale: Ref<number>;
  deviceHeight: Ref<number>;
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  rotate: MotionValue<number>;
  translate: MotionValue<number>;
  textTransform: MotionValue<number>;
  textOpacity: MotionValue<number>;
}

export function useMacbookScroll(root: Ref<HTMLElement | null>, device: Ref<HTMLElement | null>): MacbookMotion {
  const endScale = useMotionValue(1.5);
  const deviceScale = ref(1);
  const deviceHeight = ref(1176);
  const motionEnabled = useMotionValue(1);
  let cleanup: (() => void) | undefined;
  onMounted(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const compact = mobile.matches || window.innerHeight > window.innerWidth;
      deviceScale.value = Math.max(0.2, Math.min(compact ? 0.8 : 1,
        (window.innerWidth - 48) / 768, (window.innerHeight - 160) / 576));
      endScale.set(1.5);
      deviceHeight.value = (reduced.matches ? 576 : 1176) * deviceScale.value;
      motionEnabled.set(reduced.matches ? 0 : 1);
    };
    update();
    mobile.addEventListener("change", update);
    reduced.addEventListener("change", update);
    window.addEventListener("resize", update, { passive: true });
    cleanup = () => {
      mobile.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  });
  onBeforeUnmount(() => cleanup?.());

  // The display travels just past the 544px keyboard and finishes below the fixed header.
  const { scrollYProgress } = useScroll(() => ({
    target: root,
    offset: [`${device.value?.offsetTop ?? 32}px center`, `${(device.value?.offsetTop ?? 32) + 600 * deviceScale.value}px 112px`],
    trackContentSize: true,
  }));
  const progress = useTransform(() => scrollYProgress.get() * motionEnabled.get());
  const opening = useTransform(progress, [0, 0.3], [0, 1]);

  return {
    deviceScale,
    deviceHeight,
    scaleX: useTransform(() => 1.2 + (endScale.get() - 1.2) * opening.get()),
    scaleY: useTransform(() => 0.6 + (endScale.get() - 0.6) * opening.get()),
    rotate: useTransform(progress, [0.1, 0.12, 0.3], [-28, -28, 0]),
    translate: useTransform(progress, [0, 1], [0, 600]),
    textTransform: useTransform(progress, [0, 0.3], [0, 100]),
    textOpacity: useTransform(progress, [0, 0.2], [1, 0]),
  };
}
