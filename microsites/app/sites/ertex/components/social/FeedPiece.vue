<script setup lang="ts">
// One post of the feed with its caption under it. The post lifts on hover.
defineProps<{ title: string; note: string }>();
</script>

<template>
  <figure class="group/piece min-w-0">
    <slot />
    <figcaption
      class="flex items-baseline justify-between gap-2 pt-[19px] text-[12px] text-[#e7effa] min-[1600px]:text-[14px] max-[1000px]:block max-[1000px]:text-[11px] max-[760px]:flex max-[760px]:text-[12px] max-[390px]:block"
    >
      <span>{{ title }}</span>
      <small
        class="text-[9px] text-[#7f91a9] min-[1600px]:text-[11px] max-[1000px]:mt-[6px] max-[1000px]:block max-[760px]:m-0 max-[760px]:text-[10px] max-[390px]:mt-[5px]"
      >{{ note }}</small>
    </figcaption>
  </figure>
</template>
