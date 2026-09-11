import { useMotionValue, useScroll, useTransform, type MotionValue } from "motion-v";
import { onBeforeUnmount, onMounted, type Ref } from "vue";

export interface MacbookMotion {
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  rotate: MotionValue<number>;
  translate: MotionValue<number>;
  textTransform: MotionValue<number>;
  textOpacity: MotionValue<number>;
}

export function useMacbookScroll(root: Ref<HTMLElement | null>, device: Ref<HTMLElement | null>): MacbookMotion {
  const endScale = useMotionValue(1.5);
  const motionEnabled = useMotionValue(1);
  let cleanup: (() => void) | undefined;
  onMounted(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      endScale.set(mobile.matches ? 1 : 1.5);
      motionEnabled.set(reduced.matches ? 0 : 1);
    };
    update();
    mobile.addEventListener("change", update);
    reduced.addEventListener("change", update);
    cleanup = () => {
      mobile.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  });
  onBeforeUnmount(() => cleanup?.());

  // Keep the original travel distance but start when the lid, not the section, reaches mid-screen.
  const { scrollYProgress } = useScroll(() => ({
    target: root,
    offset: [`${device.value?.offsetTop ?? 0}px center`, "end center"],
    trackContentSize: true,
  }));
  const progress = useTransform(() => scrollYProgress.get() * motionEnabled.get());
  const opening = useTransform(progress, [0, 0.3], [0, 1]);

  // These are the original Aceternity ranges; only the final scale is responsive.
  return {
    scaleX: useTransform(() => 1.2 + (endScale.get() - 1.2) * opening.get()),
    scaleY: useTransform(() => 0.6 + (endScale.get() - 0.6) * opening.get()),
    rotate: useTransform(progress, [0.1, 0.12, 0.3], [-28, -28, 0]),
    translate: useTransform(progress, [0, 1], [0, 1500]),
    textTransform: useTransform(progress, [0, 0.3], [0, 100]),
    textOpacity: useTransform(progress, [0, 0.2], [1, 0]),
  };
}
