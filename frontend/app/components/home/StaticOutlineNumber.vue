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
const hoverGlowFilterId = `static-outline-number-glow-${rawId}`;

const strokeGradientUrl = computed(() => `url(#${strokeGradientId})`);
const hoverGradientUrl = computed(() => `url(#${hoverGradientId})`);
const revealMaskUrl = computed(() => `url(#${revealMaskId})`);
const textMaskUrl = computed(() => `url(#${textMaskId})`);
const hoverGlowFilterUrl = computed(() => `url(#${hoverGlowFilterId})`);
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

      <mask
        :id="textMaskId"
        maskUnits="userSpaceOnUse"
        x="-220"
        y="-220"
        width="1560"
        height="740"
      >
        <rect x="-220" y="-220" width="1560" height="740" :fill="revealMaskUrl" />
      </mask>

      <filter
        :id="hoverGlowFilterId"
        filterUnits="userSpaceOnUse"
        x="-220"
        y="-220"
        width="1560"
        height="740"
        color-interpolation-filters="sRGB"
      >
        <feDropShadow
          in="SourceGraphic"
          dx="0"
          dy="0"
          stdDeviation="18"
          flood-color="#03cb00"
          flood-opacity="0.9"
          result="glow-near"
        />
        <feDropShadow
          in="SourceGraphic"
          dx="0"
          dy="0"
          stdDeviation="34"
          flood-color="#00ff0d"
          flood-opacity="0.68"
          result="glow-mid"
        />
        <feDropShadow
          in="SourceGraphic"
          dx="0"
          dy="0"
          stdDeviation="58"
          flood-color="#00ff0d"
          flood-opacity="0.32"
          result="glow-far"
        />
        <feMerge>
          <feMergeNode in="glow-far" />
          <feMergeNode in="glow-mid" />
          <feMergeNode in="glow-near" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
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
      :filter="hoverGlowFilterUrl"
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
  font-size: 480px;
  font-weight: 700;
  letter-spacing: -0.08em;
}

.static-outline-number__text--gradient {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.static-outline-number__text--gradient-visible {
  opacity: 1;
}
</style>
