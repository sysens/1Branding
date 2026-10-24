<template>
  <div class="awards-transition" aria-hidden="true"><div class="awards-transition__light" /></div>
</template>

<style scoped>
.awards-transition {
  position: relative;
  overflow: clip;
  /* An explicit width keeps max-height from narrowing the light through the ratio. */
  width: 100%;
  height: auto;
  aspect-ratio: 2.4 / 1;
  /* Ultra-wide screens: keep the light within one screen instead of ~1.5. */
  max-height: max(9.375rem, 85svh);
  margin-top: -175px;
  margin-bottom: -1px;
  mask-image: linear-gradient(to bottom, transparent, #000 20%);
}
.awards-transition__light { position: absolute; inset: 0; background: radial-gradient(ellipse 64% 72% at 50% -12%, #000 44%, #001d00 59%, #007500 76%, #57b500 96%, #e0eb20 127%, #ffff25 145%); animation: awards-breathe 7s ease-in-out infinite alternate; }
.awards-transition__light { animation-play-state: var(--ambient-play-state, paused); }
@keyframes awards-breathe { to { transform: scaleX(1.035); } }
@media (prefers-reduced-motion: reduce) { .awards-transition__light { animation: none; } }
@media (min-width: 1440px) { .awards-transition { margin-top: -210px; } }
@media (max-width: 767px), (orientation: portrait) { .awards-transition { min-height: 9.375rem; aspect-ratio: 2.4 / 1; margin-top: -55px; } }
</style>
