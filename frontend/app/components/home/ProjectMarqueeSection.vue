<script setup lang="ts">
import ThreeDMarquee from "~/components/ui/ThreeDMarquee.vue";
</script>

<template>
  <section id="project-marquee" class="project-marquee-section" aria-label="Selected branding projects">
    <!-- Design light (public/home/marquee/light.webp): built from colours measured
         on the design file - white, cream, lime, olive centre, vivid green sides
         and a dark dome whose veil lets the cards drift inside the light. -->
    <div class="project-marquee-section__light" aria-hidden="true" />
    <ThreeDMarquee class="project-marquee-section__marquee" />
  </section>
</template>

<style scoped>
/*
 * --overlap: how far the light reaches up over the MacBook section; it is
 *            transparent there, so the white page and the sliding screen fade in.
 * --frame-h: height of the measured light, kept at the design's 2.1:1 ratio.
 * The marquee is pulled up under the light so its cards start at the dome.
 */
.project-marquee-section {
  --overlap: clamp(9rem, 22svh, 16rem);
  --frame-h: clamp(16rem, 47.5vw, 60rem);
  position: relative;
  isolation: isolate;
  margin-top: calc(var(--overlap) * -1);
  padding-bottom: clamp(4rem, 9vw, 10rem);
  background: linear-gradient(to bottom, transparent 0, transparent var(--overlap), #000 var(--overlap));
}

.project-marquee-section__light {
  position: relative;
  z-index: 2;
  height: calc(var(--overlap) + var(--frame-h));
  pointer-events: none;
  background:
    url("/home/marquee/light.webp") center bottom / 100% var(--frame-h) no-repeat,
    linear-gradient(#fffefa, #fffefa) center top / 100% calc(var(--overlap) + 2px) no-repeat;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 var(--overlap));
  mask-image: linear-gradient(to bottom, transparent 0, #000 var(--overlap));
}

.project-marquee-section__marquee {
  position: relative;
  z-index: 1;
  margin-top: calc(var(--frame-h) * -0.42);
}

@media (max-width: 767px), (orientation: portrait) {
  .project-marquee-section {
    --overlap: 4rem;
    padding-bottom: 3rem;
  }
}
</style>
