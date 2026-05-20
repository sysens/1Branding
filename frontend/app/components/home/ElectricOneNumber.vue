<script setup lang="ts">
import { computed, useId } from "vue";

const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
const glowFilterId = `electric-one-glow-${rawId}`;
const displaceFilterId = `electric-one-displace-${rawId}`;
const strokeGradientId = `electric-one-stroke-${rawId}`;
const sparkGradientId = `electric-one-spark-${rawId}`;

const glowFilterUrl = computed(() => `url(#${glowFilterId})`);
const displaceFilterUrl = computed(() => `url(#${displaceFilterId})`);
const strokeGradientUrl = computed(() => `url(#${strokeGradientId})`);
const sparkGradientUrl = computed(() => `url(#${sparkGradientId})`);

const numberPath =
  "M 220 26 C 228 26 235 33 235 41 L 235 578 C 235 589 226 598 215 598 L 148 598 C 137 598 128 589 128 578 L 128 244 C 128 230 119 221 105 221 L 48 221 C 37 221 28 212 28 201 L 28 132 C 28 122 34 113 44 110 C 91 97 126 73 157 38 C 164 30 174 26 185 27 L 220 26 Z";
</script>

<template>
  <svg
    class="electric-one-number"
    viewBox="-34 -42 348 704"
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient :id="strokeGradientId" x1="12%" y1="8%" x2="86%" y2="96%">
        <stop offset="0%" stop-color="#b6ffd4" stop-opacity="0.92" />
        <stop offset="28%" stop-color="#28ff85" stop-opacity="1" />
        <stop offset="58%" stop-color="#03cb72" stop-opacity="0.86" />
        <stop offset="100%" stop-color="#008d4c" stop-opacity="0.34" />
      </linearGradient>

      <linearGradient :id="sparkGradientId" x1="8%" y1="0%" x2="92%" y2="100%">
        <stop offset="0%" stop-color="#d9ffe8" stop-opacity="0" />
        <stop offset="42%" stop-color="#49ff9a" stop-opacity="0.95" />
        <stop offset="50%" stop-color="#f3fff8" stop-opacity="1" />
        <stop offset="58%" stop-color="#36ff8d" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#00b967" stop-opacity="0" />
      </linearGradient>

      <filter :id="glowFilterId" x="-80%" y="-40%" width="260%" height="180%">
        <feGaussianBlur stdDeviation="5" result="softGlow" />
        <feColorMatrix
          in="softGlow"
          type="matrix"
          values="0 0 0 0 0.02 0 0 0 0 1 0 0 0 0 0.45 0 0 0 0.9 0"
          result="greenGlow"
        />
        <feMerge>
          <feMergeNode in="greenGlow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter :id="displaceFilterId" x="-90%" y="-45%" width="280%" height="190%">
        <feTurbulence type="fractalNoise" baseFrequency="0.028 0.12" numOctaves="3" seed="9" result="noise">
          <animate
            attributeName="baseFrequency"
            values="0.026 0.1;0.045 0.16;0.03 0.12"
            dur="1.75s"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>

    <path
      :d="numberPath"
      class="electric-one-number__shadow"
    />

    <path
      :d="numberPath"
      class="electric-one-number__glow"
      :stroke="strokeGradientUrl"
      :filter="glowFilterUrl"
      pathLength="1000"
    />

    <path
      :d="numberPath"
      class="electric-one-number__energy"
      :stroke="strokeGradientUrl"
      :filter="displaceFilterUrl"
      pathLength="1000"
    />

    <path
      :d="numberPath"
      class="electric-one-number__core"
      :stroke="strokeGradientUrl"
      pathLength="1000"
    />

    <path
      :d="numberPath"
      class="electric-one-number__spark"
      :stroke="sparkGradientUrl"
      pathLength="1000"
    />
  </svg>
</template>

<style scoped>
.electric-one-number {
  display: block;
  overflow: visible;
}

.electric-one-number__shadow {
  fill: rgba(0, 22, 12, 0.2);
  opacity: 0.48;
}

.electric-one-number__glow,
.electric-one-number__energy,
.electric-one-number__core,
.electric-one-number__spark {
  fill: transparent;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.electric-one-number__glow {
  stroke-width: 12;
  opacity: 0.62;
  animation: electric-one-pulse 2.2s ease-in-out infinite;
}

.electric-one-number__energy {
  stroke-width: 5.5;
  opacity: 0.88;
  animation: electric-one-jitter 1.25s steps(2, end) infinite;
}

.electric-one-number__core {
  stroke-width: 2.8;
  opacity: 0.85;
}

.electric-one-number__spark {
  stroke-width: 6.2;
  stroke-dasharray: 135 865;
  stroke-dashoffset: 0;
  opacity: 0.96;
  filter: drop-shadow(0 0 8px rgba(47, 255, 147, 0.98))
    drop-shadow(0 0 22px rgba(3, 203, 114, 0.7));
  animation: electric-one-run 2.45s linear infinite;
}

@keyframes electric-one-run {
  0% {
    stroke-dashoffset: 0;
  }

  100% {
    stroke-dashoffset: -1000;
  }
}

@keyframes electric-one-pulse {
  0%,
  100% {
    opacity: 0.5;
  }

  45% {
    opacity: 0.78;
  }

  64% {
    opacity: 0.42;
  }
}

@keyframes electric-one-jitter {
  0%,
  100% {
    opacity: 0.88;
  }

  50% {
    opacity: 0.68;
  }
}
</style>
