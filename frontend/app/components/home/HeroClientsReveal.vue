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

// GSAP is loaded on demand, a moment after mount. Until then the hero showed
// its first state (fully lit) even on a page reloaded halfway through the
// transition, as if the section had started over. This draws the timeline's
// state for the current position at once (the same trigger and tweens as the
// timeline below: 55% of the screen to the transition's bottom at the top; the
// hero fades over the first 85%, the light moves 4% -> -6%), and on every
// scroll until GSAP takes over.
const paintCurrentState = () => {
  if (!hero.value || !transition.value) return;
  const box = transition.value.getBoundingClientRect();
  const start = window.innerHeight * 0.55;
  const distance = box.height + start;
  const progress = distance > 0 ? Math.min(1, Math.max(0, (start - box.top) / distance)) : 0;
  hero.value.style.opacity = String(1 - Math.min(1, progress / 0.85));
  transition.value.style.setProperty("--light-shift", `${(4 - 10 * progress).toFixed(4)}%`);
};

onMounted(async () => {
  if (curtain.value) stopStickyTop = watchStickyTop(curtain.value);
  const motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (motion) {
    paintCurrentState();
    window.addEventListener("scroll", paintCurrentState, { passive: true });
  }
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);
  window.removeEventListener("scroll", paintCurrentState);
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
  window.removeEventListener("scroll", paintCurrentState);
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
