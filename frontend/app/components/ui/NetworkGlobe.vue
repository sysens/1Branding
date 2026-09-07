<script setup lang="ts">
import { Pause, Play, RotateCcw } from "lucide-vue-next";

const { targetRef, isActive } = useViewportActivity({
  rootMargin: "400px 0px",
});
const { canvasRef, labelsRef, paused, animating, status, onKeydown, reset } =
  useNetworkGlobe(isActive);
</script>

<template>
  <div
    ref="targetRef"
    class="network-globe"
    :data-state="status"
    :data-animating="animating"
    :aria-busy="status === 'loading'"
  >
    <canvas
      ref="canvasRef"
      tabindex="0"
      role="img"
      aria-label="Rotating world globe with country markers and connecting routes"
      @keydown="onKeydown"
    />
    <div ref="labelsRef" class="network-globe__labels" aria-hidden="true" />
    <img
      v-if="status !== 'ready'"
      :src="'/globe/preview.v1.webp'"
      class="network-globe__fallback"
      alt="World globe with illuminated continents"
      width="800"
      height="800"
      loading="lazy"
      decoding="async"
    />
    <div v-if="status === 'ready'" class="network-globe__controls">
      <button
        type="button"
        :aria-label="paused ? 'Resume rotation' : 'Pause rotation'"
        :title="paused ? 'Resume rotation' : 'Pause rotation'"
        :aria-pressed="paused"
        @click="paused = !paused"
      >
        <Play v-if="paused" :size="17" /><Pause v-else :size="17" />
      </button>
      <button
        type="button"
        aria-label="Reset globe"
        title="Reset globe"
        @click="reset"
      >
        <RotateCcw :size="17" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.network-globe {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #040507;
}
canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: pan-y;
}
canvas:active {
  cursor: grabbing;
}
canvas:focus-visible {
  outline: 1px solid #a3b7cd;
  outline-offset: -5px;
}
.network-globe__labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.network-globe__labels :deep(.network-globe__label) {
  position: absolute;
  left: 0;
  top: 0;
  padding: 4px 7px;
  background: #101112e8;
  color: #efefea;
  font-family: monospace;
  font-weight: 700;
  font-size: 10px;
  line-height: 1;
  letter-spacing: 0;
  text-transform: uppercase;
  white-space: nowrap;
  will-change: transform;
}
.network-globe__controls {
  position: absolute;
  bottom: 24px;
  right: 28px;
  display: flex;
  gap: 8px;
}
button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid #ffffff32;
  border-radius: 50%;
  background: #080a0cba;
  color: #eee;
}
button:hover,
button:focus-visible {
  border-color: #ff7a35;
  color: #ffa471;
  outline: none;
}
.network-globe__fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
@media (max-width: 767px) {
  .network-globe__controls {
    right: 16px;
    bottom: 16px;
  }
}
</style>
