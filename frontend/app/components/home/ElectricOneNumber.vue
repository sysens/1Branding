<script setup lang="ts">
import { computed, useId } from "vue";

const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
const displaceFilterId = `electric-one-displace-${rawId}`;
const activeFilterId = `electric-one-active-${rawId}`;
const strokeGradientId = `electric-one-stroke-${rawId}`;
const sparkGradientId = `electric-one-spark-${rawId}`;

const displaceFilterUrl = computed(() => `url(#${displaceFilterId})`);
const activeFilterUrl = computed(() => `url(#${activeFilterId})`);
const strokeGradientUrl = computed(() => `url(#${strokeGradientId})`);
const sparkGradientUrl = computed(() => `url(#${sparkGradientId})`);

const numberPath =
  "M 218 27 C 230 27 239 36 239 48 L 239 572 C 239 588 227 600 211 600 L 151 600 C 136 600 124 588 124 573 L 124 253 C 124 239 113 229 99 229 L 48 229 C 34 229 23 218 23 204 L 23 143 C 23 130 32 119 45 115 C 91 103 128 78 158 41 C 173 27 187 28 218 27 Z";
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

      <filter :id="displaceFilterId" color-interpolation-filters="sRGB" x="-90%" y="-55%" width="280%" height="210%">
        <feTurbulence type="turbulence" baseFrequency="0.012 0.05" numOctaves="4" result="noise1" seed="1" />
        <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
          <animate attributeName="dy" values="704; 0" dur="4.6s" repeatCount="indefinite" calcMode="linear" />
        </feOffset>

        <feTurbulence type="turbulence" baseFrequency="0.012 0.05" numOctaves="4" result="noise2" seed="3" />
        <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
          <animate attributeName="dy" values="0; -704" dur="4.6s" repeatCount="indefinite" calcMode="linear" />
        </feOffset>

        <feTurbulence type="turbulence" baseFrequency="0.018 0.055" numOctaves="3" result="noise3" seed="5" />
        <feOffset in="noise3" dx="0" dy="0" result="offsetNoise3">
          <animate attributeName="dx" values="348; 0" dur="4.6s" repeatCount="indefinite" calcMode="linear" />
        </feOffset>

        <feTurbulence type="turbulence" baseFrequency="0.018 0.055" numOctaves="3" result="noise4" seed="7" />
        <feOffset in="noise4" dx="0" dy="0" result="offsetNoise4">
          <animate attributeName="dx" values="0; -348" dur="4.6s" repeatCount="indefinite" calcMode="linear" />
        </feOffset>

        <feComposite in="offsetNoise1" in2="offsetNoise2" operator="add" result="verticalNoise" />
        <feComposite in="offsetNoise3" in2="offsetNoise4" operator="add" result="horizontalNoise" />
        <feBlend in="verticalNoise" in2="horizontalNoise" mode="screen" result="combinedNoise" />

        <feDisplacementMap
          in="SourceGraphic"
          in2="combinedNoise"
          scale="10"
          xChannelSelector="R"
          yChannelSelector="G"
          result="electricLine"
        />
        <feGaussianBlur in="electricLine" stdDeviation="3.2" result="smokeNear" />
        <feGaussianBlur in="electricLine" stdDeviation="9" result="smokeFar" />
        <feTurbulence type="fractalNoise" baseFrequency="0.016 0.045" numOctaves="3" seed="19" result="smokeNoise">
          <animate
            attributeName="baseFrequency"
            values="0.014 0.04;0.02 0.055;0.016 0.045"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap in="smokeFar" in2="smokeNoise" scale="18" result="smoke" />
        <feColorMatrix
          in="smoke"
          type="matrix"
          values="0 0 0 0 0.00 0 0 0 0 0.85 0 0 0 0 0.38 0 0 0 0.48 0"
          result="greenSmoke"
        />
        <feMerge>
          <feMergeNode in="greenSmoke" />
          <feMergeNode in="smokeNear" />
          <feMergeNode in="electricLine" />
        </feMerge>
      </filter>

      <filter :id="activeFilterId" color-interpolation-filters="sRGB" x="-120%" y="-80%" width="340%" height="260%">
        <feTurbulence type="turbulence" baseFrequency="0.02 0.09" numOctaves="4" seed="13" result="activeNoise">
          <animate
            attributeName="baseFrequency"
            values="0.018 0.08;0.028 0.13;0.02 0.09"
            dur="1.25s"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="activeNoise"
          scale="18"
          xChannelSelector="R"
          yChannelSelector="G"
          result="activeLine"
        />
        <feGaussianBlur in="activeLine" stdDeviation="2.2" result="activeGlowNear" />
        <feGaussianBlur in="activeLine" stdDeviation="6" result="activeGlowFar" />
        <feColorMatrix
          in="activeGlowFar"
          type="matrix"
          values="0 0 0 0 0.02 0 0 0 0 1 0 0 0 0 0.42 0 0 0 0.72 0"
          result="greenGlowFar"
        />
        <feMerge>
          <feMergeNode in="greenGlowFar" />
          <feMergeNode in="activeGlowNear" />
          <feMergeNode in="activeLine" />
        </feMerge>
      </filter>
    </defs>

    <path
      :d="numberPath"
      class="electric-one-number__glow"
      :stroke="strokeGradientUrl"
      :filter="displaceFilterUrl"
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
      class="electric-one-number__spark"
      :stroke="sparkGradientUrl"
      :filter="activeFilterUrl"
      pathLength="1000"
    />
  </svg>
</template>

<style scoped>
.electric-one-number {
  display: block;
  overflow: visible;
}

.electric-one-number__glow,
.electric-one-number__energy,
.electric-one-number__spark {
  fill: transparent;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.electric-one-number__glow {
  stroke-width: 9.5;
  opacity: 0.52;
  animation: electric-one-pulse 2.2s ease-in-out infinite;
}

.electric-one-number__energy {
  stroke-width: 2.35;
  opacity: 0.94;
  animation: electric-one-jitter 0.9s steps(2, end) infinite;
}

.electric-one-number__spark {
  stroke-width: 3.4;
  stroke-dasharray: 190 810;
  stroke-dashoffset: 0;
  opacity: 1;
  animation: electric-one-run 2.7s linear infinite;
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
    opacity: 0.46;
  }

  45% {
    opacity: 0.68;
  }

  64% {
    opacity: 0.42;
  }
}

@keyframes electric-one-jitter {
  0%,
  100% {
    opacity: 0.78;
  }

  50% {
    opacity: 1;
  }
}
</style>
