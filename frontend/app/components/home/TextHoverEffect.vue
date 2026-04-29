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

const gradientUrl = computed(() => `url(#${gradientId})`);
const revealMaskUrl = computed(() => `url(#${revealMaskId})`);
const textMaskUrl = computed(() => `url(#${textMaskId})`);
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
    viewBox="0 0 300 100"
    xmlns="http://www.w3.org/2000/svg"
    class="text-hover-effect select-none"
    role="img"
    :aria-label="text"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
    @pointermove="updateMaskPosition"
  >
    <defs>
      <linearGradient :id="gradientId" gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="25%">
        <template v-if="hovered">
          <stop offset="0%" stop-color="#eab308" />
          <stop offset="25%" stop-color="#ef4444" />
          <stop offset="50%" stop-color="#3b82f6" />
          <stop offset="75%" stop-color="#06b6d4" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </template>
      </linearGradient>

      <radialGradient
        :id="revealMaskId"
        gradientUnits="userSpaceOnUse"
        r="20%"
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
      stroke-width="0.3"
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
      stroke-width="0.3"
      class="text-hover-effect__outline"
    >
      {{ text }}
    </text>

    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      :stroke="gradientUrl"
      stroke-width="0.3"
      :mask="textMaskUrl"
      class="text-hover-effect__reveal"
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
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 4.5rem;
  font-weight: 700;
  letter-spacing: -0.06em;
}

.text-hover-effect__ghost {
  stroke: rgba(229, 229, 229, 0.65);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.text-hover-effect__ghost--visible {
  opacity: 0.7;
}

.text-hover-effect__outline {
  animation: text-hover-draw 3.8s ease-in-out both;
  stroke: rgba(229, 229, 229, 0.08);
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
}

.text-hover-effect__reveal {
  opacity: 1;
}

@keyframes text-hover-draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
