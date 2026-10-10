<script setup lang="ts">
withDefaults(defineProps<{ direction?: "to-light" | "to-dark" }>(), { direction: "to-light" });
</script>

<template>
  <div class="hero-light-transition" :class="{ 'hero-light-transition--reverse': direction === 'to-dark' }" aria-hidden="true">
    <div class="hero-light-transition__surface"><div class="hero-light-transition__light" /></div>
  </div>
</template>

<style scoped>
.hero-light-transition {
  position: relative;
  width: 100%;
  height: auto;
  aspect-ratio: 2 / 1;
  min-height: 22rem;
  /* Ultra-wide screens: at 2:1 the light would be two screens tall on 32:9. */
  max-height: max(22rem, 100svh);
  margin-bottom: -1px;
  overflow: clip;
  pointer-events: none;
  isolation: isolate;
  /* Fade the entire leading edge so the light never starts at a cut-off line. */
  mask-image: linear-gradient(to bottom, transparent, #000 15%);
}

.hero-light-transition__surface {
  position: absolute;
  inset: 0 -2%;
}
.hero-light-transition__light {
  position: absolute; inset: 0;
  /* Keep the arc proportional to its width, with no opaque black fill over the hero. */
  background: radial-gradient(ellipse var(--light-radius-x, 68%) var(--light-radius-y, 64%) at 50% calc(var(--light-center-y, -4%) + var(--light-shift, 0%)),
    rgb(0 95 31 / 0) 60%, rgb(0 95 31 / .1) 70%, rgb(0 118 38 / .4) 82%,
    rgb(0 131 43 / .7) 92%, #04a446 104%, #52bc7e 116%,
    #a3e0c4 134%, #d5f6e8 143%, #fff 151%);
  animation: transition-breathe 7s ease-in-out infinite alternate;
  animation-play-state: var(--ambient-play-state, paused);
  transform-origin: center top;
}
@keyframes transition-breathe { from { transform: scaleX(1); filter: brightness(1); } to { transform: scaleX(1.045); filter: brightness(1.075); } }

.hero-light-transition--reverse {
  margin-top: -1px;
  margin-bottom: 0;
  mask-image: linear-gradient(to bottom, #000 85%, transparent);
}
.hero-light-transition--reverse .hero-light-transition__surface {
  transform: rotate(180deg);
}

@media (max-width: 767px) {
  .hero-light-transition {
    height: clamp(18rem, 48svh, 28rem);
    min-height: 18rem;
    aspect-ratio: auto;
  }

}
@media (prefers-reduced-motion: reduce) { .hero-light-transition__light { animation: none; } }
</style>
