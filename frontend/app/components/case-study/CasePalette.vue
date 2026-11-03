<script setup lang="ts">
// The project's colours as a row of cards with the picture's corners, each
// labelled with its hex code in ink that reads on it.
import type { CaseColor } from "~/utils/caseStudy";

defineProps<{ label: string; colors: CaseColor[] }>();
</script>

<template>
  <ul class="case-palette" :aria-label="label">
    <li
      v-for="color in colors"
      :key="color.hex"
      :class="`case-palette__swatch--${color.ink}`"
      :style="{ background: color.hex }"
    >
      <span>{{ color.hex }}</span>
    </li>
  </ul>
</template>

<style scoped>
.case-palette {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(8rem, 40%), 1fr));
  gap: clamp(0.5rem, 1vw, 1rem);
  /* The space above is CaseSections' to set. */
  margin-bottom: 0;
  padding: 0;
  list-style: none;
}

/* A light colour (white, cream) keeps an outline on the white page. */
.case-palette li {
  display: flex;
  align-items: flex-end;
  min-height: clamp(8rem, 14vw, 15rem);
  padding: clamp(0.875rem, 1.4vw, 1.5rem);
  border-radius: clamp(1rem, 1.7vw, 1.5rem);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 600;
  line-height: var(--type-small-lh);
  letter-spacing: 0.02em;
}

.case-palette__swatch--dark {
  color: #111;
}

.case-palette__swatch--light {
  color: #fff;
}
</style>
