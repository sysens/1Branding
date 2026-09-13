<template>
  <div class="awards-transition" aria-hidden="true"><div class="awards-transition__light" /></div>
</template>

<style scoped>
.awards-transition {
  position: relative;
  overflow: clip;
  height: 560px;
  margin-top: -175px;
  mask-image: linear-gradient(to bottom, transparent, #000 20%);
}
.awards-transition__light { position: absolute; inset: -5%; background: radial-gradient(ellipse 78% 100% at 50% -25%, #000 33%, #001d00 45%, #007500 58%, #57b500 70%, #e0eb20 84%, #ffff25 100%); animation: awards-breathe 7s ease-in-out infinite alternate; }
.awards-transition__light { animation-play-state: var(--ambient-play-state, paused); }
@keyframes awards-breathe { to { transform: scaleX(1.045); filter: brightness(1.06); } }
@media (prefers-reduced-motion: reduce) { .awards-transition__light { animation: none; } }
@media (min-width: 1440px) { .awards-transition { height: 620px; margin-top: -210px; } }
@media (max-width: 767px) { .awards-transition { height: 330px; margin-top: -55px; background-size: 130% 100%; background-position: center; } }
</style>
