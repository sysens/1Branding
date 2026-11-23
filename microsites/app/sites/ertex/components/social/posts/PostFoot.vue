<script setup lang="ts">
// The line at a post's bottom edge: a call to look closer and an arrow.
defineProps<{ label: string }>();
</script>

<template>
  <div class="absolute bottom-[5.5%] left-[8%] right-[8%] z-[3] flex items-center justify-between text-[length:2.5cqw] leading-[1.3] tracking-[-.01em]">
    <span>{{ label }}</span>
    <span class="text-[length:6cqw] leading-none" aria-hidden="true">↗</span>
  </div>
</template>
