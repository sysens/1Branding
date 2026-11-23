<script setup lang="ts">
withDefaults(defineProps<{ tone?: "light" | "dark" }>(), { tone: "light" });
</script>

<template>
  <p
    class="text-[11px] font-[650] uppercase tracking-[.17em]"
    :class="tone === 'light' ? 'mb-6 text-[#546477]' : 'mb-8 text-[#92a5c0]'"
  >
    <slot />
  </p>
</template>
