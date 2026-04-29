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

const gradientId = `text-gradient-${rawId}`;
const revealMaskId = `reveal-mask-${rawId}`;
const textMaskId = `text-mask-${rawId}`;
const glowId = `text-glow-${rawId}`;

const gradientUrl = computed(() => `url(#${gradientId})`);
const revealMaskUrl = computed(() => `url(#${revealMaskId})`);
const textMaskUrl = computed(() => `url(#${textMaskId})`);
const glowUrl = computed(() => `url(#${glowId})`);
const maskTransition = computed(() => `${props.duration}s ease-out`);

const updateMaskPosition = (event: PointerEvent) => {
  const svg = svgRef.value;

  if (!svg) {
    return;
  }

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
    width="100%"
    height="100%"
    viewBox="0 0 460 160"
    xmlns="http://www.w3.org/2000/svg"
    class="text-hover-effect select-none"
    role="img"
    :aria-label="text"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
    @pointermove="updateMaskPosition"
  >
    <defs>
      <filter :id="glowId" x="-20%" y="-40%" width="140%" height="180%">
        <feGaussianBlur stdDeviation="3.2" result="blur" />
        <feColorMatrix
          in="blur"
          result="greenGlow"
          type="matrix"
          values="0 0 0 0 0.01 0 0 0 0 0.80 0 0 0 0 0.08 0 0 0 0.85 0"
        />
        <feMerge>
          <feMergeNode in="greenGlow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <linearGradient :id="gradientId" gradientUnits="userSpaceOnUse">
        <stop offset="0%" :stop-color="hovered ? '#eab308' : '#03cb00'" />
        <stop offset="25%" :stop-color="hovered ? '#ef4444' : '#03cb00'" />
        <stop offset="50%" :stop-color="hovered ? '#3b82f6' : '#03cb00'" />
        <stop offset="75%" :stop-color="hovered ? '#06b6d4' : '#03cb00'" />
        <stop offset="100%" :stop-color="hovered ? '#8b5cf6' : '#03cb00'" />
      </linearGradient>

      <radialGradient
        :id="revealMaskId"
        gradientUnits="userSpaceOnUse"
        r="24%"
        :cx="maskPosition.cx"
        :cy="maskPosition.cy"
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
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      stroke-width="1.1"
      class="text-hover-effect__ghost"
      :class="{ 'text-hover-effect__ghost--visible': hovered }"
    >
      {{ text }}
    </text>

    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      stroke-width="1.15"
      class="text-hover-effect__outline"
      :filter="glowUrl"
    >
      {{ text }}
    </text>

    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      :stroke="gradientUrl"
      stroke-width="1.35"
      :mask="textMaskUrl"
      class="text-hover-effect__reveal"
      :filter="glowUrl"
    >
      {{ text }}
    </text>
  </svg>
</template>

<style scoped>
.text-hover-effect {
  overflow: visible;
}

.text-hover-effect__ghost,
.text-hover-effect__outline,
.text-hover-effect__reveal {
  fill: transparent;
  font-family: "Oswald", "Helvetica Neue", Arial, sans-serif;
  font-size: 7.25rem;
  font-weight: 700;
  letter-spacing: -0.08em;
}

.text-hover-effect__ghost {
  stroke: rgba(255, 255, 255, 0.72);
  opacity: 0;
  transition: opacity 0.24s ease;
}

.text-hover-effect__ghost--visible {
  opacity: 0.55;
}

.text-hover-effect__outline {
  animation: text-hover-draw 3.8s ease-in-out both;
  stroke: rgba(3, 203, 0, 0.76);
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
}

.text-hover-effect__reveal {
  opacity: 0.98;
}

@keyframes text-hover-draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
