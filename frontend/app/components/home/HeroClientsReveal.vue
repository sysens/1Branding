<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const hero = ref<HTMLElement | null>(null);
const foreground = ref<HTMLElement | null>(null);
let cleanup: (() => void) | undefined;
let disposed = false;

onMounted(async () => {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);
  if (disposed || !hero.value || !foreground.value) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.to(hero.value, {
      scale: 0.9,
      y: -70,
      opacity: 0.45,
      ease: "none",
      scrollTrigger: {
        trigger: foreground.value,
        start: "top bottom",
        end: "top top",
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
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
    <section ref="foreground" class="home-number-text"><slot /></section>
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
}
</style>
