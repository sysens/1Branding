<script setup lang="ts">
// One numbered step; the number (01, 02, ...) comes from a CSS counter on the list.
defineProps<{ title: string; text: string }>();
</script>

<template>
  <li
    class="grid grid-cols-[27px_1fr] gap-4 border-t border-ertex-rule pb-[23px] pt-[18px] [counter-increment:step] before:pt-[6px] before:text-[12px] before:tabular-nums before:text-ertex-blue before:content-[counter(step,decimal-leading-zero)]"
  >
    <div>
      <h3 class="text-[length:clamp(21px,1.8cqi,29px)] font-[520] leading-[1.2] tracking-[-.035em]">{{ title }}</h3>
      <p class="mt-2 text-[15px] leading-[1.55] text-ertex-muted">{{ text }}</p>
    </div>
  </li>
</template>
