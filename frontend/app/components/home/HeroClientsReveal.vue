<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import HeroLightTransition from "./HeroLightTransition.vue";

const hero = ref<HTMLElement | null>(null);
const transition = ref<HTMLElement | null>(null);
let cleanup: (() => void) | undefined;
let disposed = false;

onMounted(async () => {
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
        start: "top bottom",
        end: "bottom top",
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });
    timeline.fromTo(
      hero.value,
      { scale: 1, y: 0, opacity: 1 },
      { scale: 0.94, y: -64, opacity: 0, duration: 0.85, ease: "none" },
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
});
</script>

<template>
  <div class="home-reveal-stack">
    <div class="home-hero-curtain">
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
  position: sticky;
  top: 0;
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
