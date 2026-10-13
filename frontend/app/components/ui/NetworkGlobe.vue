<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";
import { Pause, Play, RotateCcw } from "lucide-vue-next";
import { useNetworkGlobe } from "~/composables/useNetworkGlobe";
import { useViewportActivity } from "~/composables/useViewportActivity";

// `controls` shows the pause and reset buttons (the landing leaves them out).
withDefaults(defineProps<{ showLabels?: boolean; controls?: boolean }>(), { showLabels: true, controls: true });

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
      :class="{ 'network-globe__canvas--hidden': status !== 'ready' }"
      :tabindex="status === 'ready' ? 0 : -1"
      :aria-hidden="status !== 'ready'"
      role="img"
      :aria-label="$t('a11y.globe')"
      @keydown="onKeydown"
    />
    <div v-show="showLabels" ref="labelsRef" class="network-globe__labels" aria-hidden="true" />
    <!-- sizes: the cover-fitted width in the landing's globe box (square on phones). -->
    <OptImage
      v-show="status !== 'ready'"
      src="/globe/preview-green.v1.webp"
      sizes="(max-width: 767px) 153vw, 1160px"
      :preview="false"
      class="network-globe__fallback"
      :alt="$t('a11y.globeImage')"
      width="1160"
      height="760"
      loading="lazy"
      decoding="async"
    />
    <div v-if="controls && status === 'ready'" class="network-globe__controls">
      <button
        type="button"
        :aria-label="paused ? $t('a11y.resumeGlobe') : $t('a11y.pauseGlobe')"
        :title="paused ? $t('a11y.resumeGlobe') : $t('a11y.pauseGlobe')"
        :aria-pressed="paused"
        @click="paused = !paused"
      >
        <Play v-if="paused" :size="17" /><Pause v-else :size="17" />
      </button>
      <button
        type="button"
        :aria-label="$t('a11y.resetGlobe')"
        :title="$t('a11y.resetGlobe')"
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
  background: transparent;
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
.network-globe__canvas--hidden { opacity: 0; }
canvas:focus-visible {
  outline: 1px solid #5dff86;
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
  opacity: 0;
  transition: opacity 150ms;
}
.network-globe:hover .network-globe__controls,
.network-globe:focus-within .network-globe__controls { opacity: 1; }
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
  border-color: #00db35;
  color: #95ffae;
  outline: none;
}
/* :deep: the fallback <img> is rendered inside OptImage. */
.network-globe :deep(.network-globe__fallback) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (max-width: 767px) {
  .network-globe__controls {
    right: 16px;
    bottom: 16px;
  }
}
@media (hover: none) { .network-globe__controls { opacity: 1; } }
</style>
