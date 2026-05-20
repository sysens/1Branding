<script setup lang="ts">
type Props = {
  text: string;
};

defineProps<Props>();
</script>

<template>
  <svg
    class="static-outline-number"
    width="100%"
    height="100%"
    viewBox="0 0 1120 300"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="static-outline-number-stroke" x1="0%" y1="8%" x2="100%" y2="92%">
        <stop offset="0%" stop-color="#67ff55" stop-opacity="0.98" />
        <stop offset="34%" stop-color="#03cb00" stop-opacity="0.9" />
        <stop offset="70%" stop-color="#029300" stop-opacity="0.58" />
        <stop offset="100%" stop-color="#015800" stop-opacity="0.22" />
      </linearGradient>
    </defs>

    <text
      x="50%"
      y="56%"
      text-anchor="middle"
      dominant-baseline="middle"
      stroke="url(#static-outline-number-stroke)"
      class="static-outline-number__text"
    >
      {{ text }}
    </text>
  </svg>
</template>

<style scoped>
.static-outline-number {
  display: block;
  overflow: visible;
}

.static-outline-number__text {
  fill: transparent;
  stroke-width: 2.35;
  vector-effect: non-scaling-stroke;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 318px;
  font-weight: 700;
  letter-spacing: -0.08em;
}
</style>
