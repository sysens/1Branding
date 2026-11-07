<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createAura, type AuraController } from "~/utils/aura/engine.js";

// A slowly moving green-lime aura with the OneBranding "1" floating inside it,
// drawn in WebGL (utils/aura/engine.js: the renderer from the OneBranding aura
// files, no dependencies). Without WebGL it falls back to a still gradient and
// the mark as an SVG. Ported from that package's React component.
const props = withDefaults(defineProps<{
  speed?: number;
  intensity?: number;
  grain?: number;
  scale?: number;
  color?: string;
  midColor?: string;
  deepColor?: string;
  paused?: boolean;
  cursorInteraction?: boolean;
  dpr?: number;
  logoColor?: string;
  /** The mark's height as a share of the smaller side (0.15 to 0.48). */
  logoSize?: number;
  floatLogo?: boolean;
  label?: string;
}>(), {
  speed: 0.5,
  intensity: 1.2,
  grain: 0.07,
  scale: 1,
  color: "#d4ff45",
  midColor: "#00efa5",
  deepColor: "#126b2a",
  paused: false,
  cursorInteraction: true,
  dpr: 1.5,
  logoColor: "#1a1a1a",
  logoSize: 0.4,
  floatLogo: true,
  label: "OneBranding aura",
});

const canvas = ref<HTMLCanvasElement | null>(null);
let engine: AuraController | null = null;

const options = () => ({
  speed: props.speed,
  intensity: props.intensity,
  grain: props.grain,
  scale: props.scale,
  color: props.color,
  midColor: props.midColor,
  deepColor: props.deepColor,
  paused: props.paused,
  cursorInteraction: props.cursorInteraction,
  dpr: props.dpr,
  showLogo: true,
  floatLogo: props.floatLogo,
  logoColor: props.logoColor,
  logoSize: props.logoSize,
});

onMounted(() => {
  if (canvas.value) engine = createAura(canvas.value, options());
});

watch(() => [
  props.speed, props.intensity, props.grain, props.scale, props.color, props.midColor,
  props.deepColor, props.paused, props.cursorInteraction, props.dpr, props.floatLogo,
  props.logoColor, props.logoSize,
], () => engine?.update(options()));

onBeforeUnmount(() => {
  engine?.destroy();
  engine = null;
});
</script>

<template>
  <div
    class="one-aura"
    role="img"
    :aria-label="label"
    :style="{ '--one-aura-logo-size': `calc(var(--one-aura-side, 600px) * ${logoSize})` }"
  >
    <canvas ref="canvas" class="one-aura__canvas" aria-hidden="true" />
    <div class="one-aura__overlay">
      <svg class="one-aura__logo" viewBox="384 214 182 274" :fill="logoColor" :data-float="floatLogo ? 'true' : 'false'" aria-hidden="true">
        <path d="M482.8 214.3H565.5L493.5 487.2C464 487.2 435.5 481.8 409.5 470.8L451 322L530.5 299.5H384Z" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.one-aura {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}

.one-aura__canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  touch-action: pan-y;
}

.one-aura__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.one-aura__logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: block;
  width: auto;
  height: var(--one-aura-logo-size, calc(var(--one-aura-side, 600px) * 0.4));
  max-width: 70%;
  overflow: visible;
}

/* WebGL composites the mark inside the aura; the SVG is the fallback only. */
.one-aura[data-aura-renderer="webgl"] .one-aura__logo {
  visibility: hidden;
  animation: none;
}

.one-aura__logo[data-float="true"] {
  animation: one-aura-logo-float 9s ease-in-out infinite;
  transform-origin: center;
  will-change: transform;
}

.one-aura[data-aura-paused="true"] .one-aura__logo {
  animation-play-state: paused;
}

@keyframes one-aura-logo-float {
  0%, 100% { transform: translate(-50%, -51%) rotate(-1deg); }
  25% { transform: translate(-46%, -53%) rotate(1deg); }
  50% { transform: translate(-50%, -50%) rotate(1.2deg); }
  75% { transform: translate(-54%, -48%) rotate(-0.8deg); }
}

@media (prefers-reduced-motion: reduce) {
  .one-aura__logo[data-float="true"] { animation: none; }
}

/* Static fallback when WebGL is unavailable or the context is lost. */
.one-aura__canvas[data-renderer="fallback"] {
  visibility: hidden;
}

.one-aura[data-aura-fallback="true"]::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 55% 42%, transparent 18%, #00efa544 27%, transparent 43%),
    radial-gradient(circle at 48% 54%, #79be2240 14%, #d4ff4599 25%, #5b9e2833 35%, transparent 50%),
    #000;
}
</style>
