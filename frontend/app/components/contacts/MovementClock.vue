<script setup lang="ts">
import { EMBLEM_STYLE } from "~/utils/chronograph/emblem";

// `centered`: the clock sits on the middle of the page, its green light band
// running through it (the contact page's top). The clock is then sized by the
// parent's --clock (its diameter) and put by --clock-top (its top edge's
// distance from the top of the parent); the artwork is placed around it.
defineProps<{ centered?: boolean }>();

const { targetRef, isActive } = useViewportActivity({ rootMargin: "0px" });
const { canvasRef, ready, running } = useChronograph(isActive);
</script>

<template>
  <div class="movement-art" :class="{ 'is-centered': centered }" aria-hidden="true">
    <picture>
      <source v-if="!centered" media="(max-width: 767px)" srcset="/Contacts/movement-background-mobile.jpg" >
      <img
        src="/Contacts/movement-background.jpg" class="movement-art__background"
        :class="{ 'movement-art__background--left': centered }"
        width="1920" height="689" loading="lazy" decoding="async" alt=""
      >
    </picture>
    <!-- Centred: the artwork twice, one copy showing the light band left of the
         clock and one the band right of it, so the two pulse out of turn. -->
    <img
      v-if="centered"
      src="/Contacts/movement-background.jpg" class="movement-art__background movement-art__background--right"
      width="1920" height="689" loading="lazy" decoding="async" alt=""
    >
    <div ref="targetRef" class="movement-art__clock" :data-state="running ? 'playing' : ready ? 'paused' : 'loading'">
      <div v-if="!ready" class="movement-art__placeholder">
        <img src="/General/logorobo.webp" width="222" height="493" alt="" :style="EMBLEM_STYLE" >
      </div>
      <canvas ref="canvasRef" width="806" height="806" :class="{ 'is-ready': ready }" />
    </div>
  </div>
</template>

<style scoped>
.movement-art {
  position: absolute;
  top: 0;
  left: 50%;
  width: clamp(84.375rem, 119.33vw, 101.875rem);
  aspect-ratio: 1920 / 689;
  transform: translateX(-55.215%);
  pointer-events: none;
}
.movement-art__background {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  filter: grayscale(1) sepia(1) saturate(4) hue-rotate(62deg) brightness(0.85);
  opacity: 0.78;
}
.movement-art__clock {
  position: absolute;
  left: 21.41%;
  top: 18.54%;
  width: 20.37%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50%;
  background: #080a0a;
}
.movement-art__placeholder {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 0 0.5rem #22272a;
  border-radius: inherit;
  background: #0b0e0c;
}
.movement-art__placeholder img {
  position: absolute;
  opacity: 0.72;
}
canvas {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
}
canvas.is-ready { opacity: 1; }
@media (min-width: 1500px) {
  .movement-art { width: 120rem; transform: translateX(-54.6875%); }
  /* From ~1830px wide the fixed 1920px artwork's edges come into view; fade them
     into the footer background instead of showing a hard vertical cut. */
  .movement-art__background {
    -webkit-mask-image:
      linear-gradient(90deg, transparent 0, #000 14%, #000 84%, transparent 100%),
      linear-gradient(180deg, #000 78%, transparent 100%);
    -webkit-mask-composite: source-in;
    mask-image:
      linear-gradient(90deg, transparent 0, #000 14%, #000 84%, transparent 100%),
      linear-gradient(180deg, #000 78%, transparent 100%);
    mask-composite: intersect;
  }
}
@media (min-width: 768px) and (max-width: 1023px) {
  .movement-art { width: 89.375rem; left: -255px; transform: none; }
}
@media (max-width: 767px) {
  .movement-art {
    width: 47.9375rem;
    aspect-ratio: 767 / 560;
    left: 50%;
    transform: translateX(-50%);
  }
  .movement-art__clock { width: 13rem; top: 1.75rem; left: calc(49% - 6.5rem); }
}

/* Centred on the clock, at every width. The artwork's clock is 20.37% of its
   width, its centre 31.6% across and its top edge 18.54% of the height (6.653%
   of the width = 0.3266 clocks) down; so the artwork is as wide as 1/0.2037
   clocks and moved up by 0.3266 clocks (plus where the clock's top should be).
   The mask lets the light band fade out on both sides and at the foot. */
.movement-art.is-centered {
  width: calc(var(--clock, 21rem) / 0.2037);
  aspect-ratio: 1920 / 689;
  left: 50%;
  top: calc(var(--clock, 21rem) * -0.3266 + var(--clock-top, 0px));
  transform: translateX(-31.6%);
  -webkit-mask-image:
    linear-gradient(90deg, transparent 0, #000 7%, #000 52%, transparent 67%),
    linear-gradient(180deg, #000 78%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(90deg, transparent 0, #000 7%, #000 52%, transparent 67%),
    linear-gradient(180deg, #000 78%, transparent 100%);
  mask-composite: intersect;
}
.movement-art.is-centered .movement-art__background {
  -webkit-mask-image: none;
  mask-image: none;
  /* The same green tint, then a gentle contrast step (everything under about
     12% brightness goes to pure black, the rest keeps its soft falloff): the
     artwork's dark blue-grey ground becomes the page's black, and the light
     band keeps its wide soft edges. */
  filter: grayscale(1) sepia(1) saturate(4) hue-rotate(62deg) brightness(0.9) contrast(1.32) brightness(1.1);
}
/* The light bands breathe: each side swells and fades back, never fully lit and
   never quite out, and the two are half a turn apart. */
.movement-art.is-centered .movement-art__background--left,
.movement-art.is-centered .movement-art__background--right {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  animation: movement-band-pulse 4.4s ease-in-out infinite;
}
.movement-art.is-centered .movement-art__background--left {
  -webkit-mask-image: linear-gradient(90deg, #000 31.6%, transparent 31.6%);
  mask-image: linear-gradient(90deg, #000 31.6%, transparent 31.6%);
}
.movement-art.is-centered .movement-art__background--right {
  -webkit-mask-image: linear-gradient(90deg, transparent 31.6%, #000 31.6%);
  mask-image: linear-gradient(90deg, transparent 31.6%, #000 31.6%);
  animation-delay: -2.2s;
}
@keyframes movement-band-pulse {
  0%, 100% { opacity: 0.28; }
  50% { opacity: 0.82; }
}
@media (prefers-reduced-motion: reduce) {
  .movement-art.is-centered .movement-art__background--left,
  .movement-art.is-centered .movement-art__background--right {
    animation: none;
    opacity: 0.6;
  }
}
.movement-art.is-centered .movement-art__clock {
  width: 20.37%;
  top: 18.54%;
  left: 21.41%;
}
</style>
