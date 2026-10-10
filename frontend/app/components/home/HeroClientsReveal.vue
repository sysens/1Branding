<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import HeroLightTransition from "./HeroLightTransition.vue";

const curtain = ref<HTMLElement | null>(null);
const hero = ref<HTMLElement | null>(null);
const transition = ref<HTMLElement | null>(null);
let cleanup: (() => void) | undefined;
let stopStickyTop: (() => void) | undefined;
let disposed = false;

// The hero is taller than the screen (the slogan starts near the bottom of the
// first view), so a sticky top of 0 would pin it before the slogan is fully
// visible. A negative top lets it scroll until its end is in view, then pins it.
const watchStickyTop = (element: HTMLElement) => {
  const update = () => {
    const overflow = element.offsetHeight - window.innerHeight;
    element.style.setProperty("--hero-sticky-top", `${-Math.max(0, overflow)}px`);
  };
  update();
  const observer = new ResizeObserver(update);
  observer.observe(element);
  window.addEventListener("resize", update, { passive: true });
  return () => {
    observer.disconnect();
    window.removeEventListener("resize", update);
  };
};

onMounted(async () => {
  if (curtain.value) stopStickyTop = watchStickyTop(curtain.value);
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);
  if (disposed || !hero.value || !transition.value) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: transition.value,
        // Starts once the light has risen past the slogan, so the slogan stays
        // fully visible while it scrolls into view.
        start: "top 55%",
        end: "bottom top",
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });
    timeline.fromTo(
      hero.value,
      { opacity: 1 },
      { opacity: 0, duration: 0.85, ease: "none" },
      0,
    );
    timeline.fromTo(
      transition.value,
      { "--light-shift": "4%" },
      { "--light-shift": "-6%", duration: 1, ease: "none" },
      0,
    );
  });
  cleanup = () => media.revert();
});

onBeforeUnmount(() => {
  disposed = true;
  cleanup?.();
  stopStickyTop?.();
});
</script>

<template>
  <div class="home-reveal-stack">
    <div ref="curtain" class="home-hero-curtain">
      <div ref="hero" class="home-hero-surface"><slot name="hero" /></div>
    </div>
    <section class="home-number-text">
      <div ref="transition"><HeroLightTransition /></div>
      <slot />
    </section>
  </div>
</template>

<style scoped>
.home-reveal-stack {
  position: relative;
  isolation: isolate;
}
.home-hero-curtain {
  background: #000;
  position: sticky;
  top: var(--hero-sticky-top, 0px);
  z-index: 0;
  min-height: 100svh;
  isolation: isolate;
}
.home-hero-surface {
  position: relative;
  min-height: 100svh;
  overflow: clip;
  background: #000;
  transform-origin: center 35%;
}
.home-number-text {
  position: relative;
  z-index: 1;
  margin-top: -16svh;
}
</style>
