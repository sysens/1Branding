<script setup lang="ts">
import Eyebrow from "./Eyebrow.vue";

// Eyebrow + chapter title. The title is the slot, so it can hold line breaks.
withDefaults(defineProps<{
  eyebrow: string;
  titleId: string;
  tone?: "accent" | "seal";
  /** Extra classes for the <h2> (only properties or breakpoints it does not set). */
  titleClass?: string;
}>(), { tone: "accent" });
</script>

<template>
  <div>
    <Eyebrow :tone="tone">{{ eyebrow }}</Eyebrow>
    <h2
      :id="titleId"
      class="mt-[14px] text-[length:clamp(42px,4.55cqi,78px)] font-[505] leading-none tracking-[-.044em]"
      :class="titleClass"
    >
      <slot />
    </h2>
  </div>
</template>
