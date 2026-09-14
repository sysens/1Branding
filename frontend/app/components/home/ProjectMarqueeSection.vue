<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import HeroLightTransition from "./HeroLightTransition.vue";
import ThreeDMarquee from "~/components/ui/ThreeDMarquee.vue";

const transition = ref<HTMLElement | null>(null);
let disposed = false;
let cleanup: (() => void) | undefined;
onMounted(async () => {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
  if (disposed || !transition.value) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.fromTo(transition.value, { "--light-shift": "4%" }, {
      "--light-shift": "-6%", ease: "none",
      scrollTrigger: { trigger: transition.value, start: "top bottom", end: "bottom top", scrub: 0.5, invalidateOnRefresh: true },
    });
  });
  cleanup = () => media.revert();
});
onBeforeUnmount(() => { disposed = true; cleanup?.(); });
</script>

<template>
  <section id="project-marquee" class="project-marquee-section" aria-label="Selected branding projects">
    <div ref="transition" class="project-marquee-section__transition"><HeroLightTransition direction="to-dark" /></div>
    <ThreeDMarquee />
  </section>
</template>

<style scoped>
.project-marquee-section { position: relative; isolation: isolate; background: #000; }
.project-marquee-section__transition { position: relative; z-index: 1; pointer-events: none; }
.project-marquee-section__transition {
  --light-radius-x: 94%;
  --light-radius-y: 78%;
  --light-center-y: -20%;
}
.project-marquee-section__transition :deep(.hero-light-transition) { height: clamp(26rem, 72svh, 44rem); }
.project-marquee-section :deep(.three-d-marquee) { margin-top: -8rem; }
@media (max-width: 767px), (orientation: portrait) {
  .project-marquee-section__transition {
    --light-radius-x: 125%;
    --light-radius-y: 88%;
    --light-center-y: -34%;
  }
  .project-marquee-section__transition :deep(.hero-light-transition) { height: clamp(10rem, 28vw, 16rem); min-height: 10rem; aspect-ratio: auto; }
  .project-marquee-section :deep(.three-d-marquee) { margin-top: -4rem; }
}
</style>
