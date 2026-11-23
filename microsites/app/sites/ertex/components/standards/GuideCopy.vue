<script setup lang="ts">
// The rules beside a stage: a title, a lead paragraph and disclosures (slot).
defineProps<{ title: string; lead: string }>();
</script>

<template>
  <div>
    <h3 class="mb-[14px] mt-px text-[length:clamp(25px,2.5cqi,40px)] font-[520] leading-[1.12] tracking-[-.036em]">{{ title }}</h3>
    <p class="mb-5 text-[16px] leading-[1.55] text-ertex-muted">{{ lead }}</p>
    <slot />
  </div>
</template>
