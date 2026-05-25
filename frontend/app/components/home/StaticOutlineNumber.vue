<script setup lang="ts">
import { computed, ref, useId } from "vue";

type Props = {
  text: string;
  duration?: number;
};

const props = withDefaults(defineProps<Props>(), {
  duration: 0.12,
});

const svgRef = ref<SVGSVGElement | null>(null);
const hovered = ref(false);
const maskPosition = ref({ cx: "50%", cy: "50%" });
const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

const strokeGradientId = `static-outline-number-stroke-${rawId}`;
const hoverGradientId = `static-outline-number-hover-${rawId}`;
const revealMaskId = `static-outline-number-reveal-${rawId}`;
const textMaskId = `static-outline-number-mask-${rawId}`;

const strokeGradientUrl = computed(() => `url(#${strokeGradientId})`);
const hoverGradientUrl = computed(() => `url(#${hoverGradientId})`);
const revealMaskUrl = computed(() => `url(#${revealMaskId})`);
const textMaskUrl = computed(() => `url(#${textMaskId})`);
const maskTransition = computed(() => `${props.duration}s ease-out`);

const updateMaskPosition = (event: PointerEvent) => {
  const svg = svgRef.value;

  if (!svg) {
    return;
  }

  hovered.value = true;

  const rect = svg.getBoundingClientRect();
  const cx = ((event.clientX - rect.left) / rect.width) * 100;
  const cy = ((event.clientY - rect.top) / rect.height) * 100;

  maskPosition.value = {
    cx: `${Math.min(Math.max(cx, 0), 100)}%`,
    cy: `${Math.min(Math.max(cy, 0), 100)}%`,
  };
};
</script>

<template>
  <svg
    ref="svgRef"
    class="static-outline-number"
    width="100%"
    height="100%"
    viewBox="0 0 1120 300"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    @pointerenter="updateMaskPosition"
    @pointerleave="hovered = false"
    @pointermove="updateMaskPosition"
  >
    <defs>
      <linearGradient :id="strokeGradientId" x1="0%" y1="8%" x2="100%" y2="92%">
        <stop offset="0%" stop-color="#67ff55" stop-opacity="0.98" />
        <stop offset="34%" stop-color="#03cb00" stop-opacity="0.9" />
        <stop offset="70%" stop-color="#029300" stop-opacity="0.58" />
        <stop offset="100%" stop-color="#015800" stop-opacity="0.22" />
      </linearGradient>

      <linearGradient
        :id="hoverGradientId"
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="0"
        x2="1120"
        y2="0"
      >
        <template v-if="hovered">
          <stop offset="0%" stop-color="#d8ffd2" />
          <stop offset="18%" stop-color="#7dff68" />
          <stop offset="42%" stop-color="#24ff1b" />
          <stop offset="70%" stop-color="#03cb00" />
          <stop offset="100%" stop-color="#00ff0d" />
        </template>
      </linearGradient>

      <radialGradient
        :id="revealMaskId"
        gradientUnits="userSpaceOnUse"
        :cx="maskPosition.cx"
        :cy="maskPosition.cy"
        r="28%"
        :style="{ transition: maskTransition }"
      >
        <stop offset="0%" stop-color="white" />
        <stop offset="100%" stop-color="black" />
      </radialGradient>

      <mask :id="textMaskId">
        <rect x="0" y="0" width="100%" height="100%" :fill="revealMaskUrl" />
      </mask>
    </defs>

    <text
      x="50%"
      y="56%"
      text-anchor="middle"
      dominant-baseline="middle"
      stroke-width="2.35"
      :stroke="strokeGradientUrl"
      class="static-outline-number__text"
    >
      {{ text }}
    </text>

    <text
      x="50%"
      y="56%"
      text-anchor="middle"
      dominant-baseline="middle"
      stroke-width="2.35"
      :stroke="hoverGradientUrl"
      :mask="textMaskUrl"
      class="static-outline-number__text static-outline-number__text--gradient"
      :class="{ 'static-outline-number__text--gradient-visible': hovered }"
    >
      {{ text }}
    </text>
  </svg>
</template>

<style scoped>
.static-outline-number {
  display: block;
  overflow: visible;
  cursor: pointer;
  user-select: none;
}

.static-outline-number__text {
  fill: transparent;
  vector-effect: non-scaling-stroke;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 318px;
  font-weight: 700;
  letter-spacing: -0.08em;
}

.static-outline-number__text--gradient {
  opacity: 0;
  filter: drop-shadow(0 0 18px rgba(3, 203, 0, 0.9))
          drop-shadow(0 0 34px rgba(0, 255, 13, 0.68))
          drop-shadow(0 0 58px rgba(0, 255, 13, 0.32));
  animation: glow-pulse 2s ease-in-out infinite;
  transition: opacity 0.2s ease;
}

.static-outline-number__text--gradient-visible {
  opacity: 1;
}

@keyframes glow-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 18px rgba(3, 203, 0, 0.9))
            drop-shadow(0 0 34px rgba(0, 255, 13, 0.68))
            drop-shadow(0 0 58px rgba(0, 255, 13, 0.32));
  }
  50% {
    filter: drop-shadow(0 0 28px rgba(3, 203, 0, 0.95))
            drop-shadow(0 0 48px rgba(0, 255, 13, 0.82))
            drop-shadow(0 0 78px rgba(0, 255, 13, 0.44));
  }
}
</style>
