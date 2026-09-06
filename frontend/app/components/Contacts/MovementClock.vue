<script setup lang="ts">
import { EMBLEM_STYLE } from "~/utils/chronograph/emblem";

const { targetRef, isActive } = useViewportActivity({ rootMargin: "0px" });
const { canvasRef, ready, running } = useChronograph(isActive);
</script>

<template>
  <div class="movement-art" aria-hidden="true">
    <picture>
      <source media="(max-width: 767px)" srcset="/Contacts/movement-background-mobile.jpg" />
      <img
        src="/Contacts/movement-background.jpg" class="movement-art__background"
        width="1920" height="689" loading="lazy" decoding="async" alt=""
      />
    </picture>
    <div ref="targetRef" class="movement-art__clock" :data-state="running ? 'playing' : ready ? 'paused' : 'loading'">
      <div v-if="!ready" class="movement-art__placeholder">
        <img src="/General/logorobo.webp" width="222" height="493" alt="" :style="EMBLEM_STYLE" />
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
  width: clamp(1350px, 119.33vw, 1630px);
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
  box-shadow: inset 0 0 0 8px #22272a;
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
  .movement-art { width: 1920px; transform: translateX(-54.6875%); }
}
@media (min-width: 768px) and (max-width: 1023px) {
  .movement-art { width: 1430px; left: -255px; transform: none; }
}
@media (max-width: 767px) {
  .movement-art {
    width: 767px;
    aspect-ratio: 767 / 560;
    left: 50%;
    transform: translateX(-50%);
  }
  .movement-art__clock { width: 208px; top: 28px; left: calc(49% - 104px); }
}
</style>
