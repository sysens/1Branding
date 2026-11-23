<script setup lang="ts">
// A panel's title on the left, a hint or action (default slot) on the right.
defineProps<{ title?: string }>();
</script>

<template>
  <div class="mb-[13px] flex items-center justify-between gap-3">
    <h4 class="text-[14px] font-medium tracking-[-.01em] text-[#c9d7ec]">
      <slot name="title">{{ title }}</slot>
    </h4>
    <slot />
  </div>
</template>
