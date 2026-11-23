<script setup lang="ts">
// A <details> row with a "+"/"−" marker. The slot holds its paragraphs.
withDefaults(defineProps<{ summary: string; open?: boolean; large?: boolean }>(), {
  open: false,
  large: false,
});
</script>

<template>
  <details
    :open="open"
    class="group/disclosure border-t border-ertex-rule [&>p]:pb-[14px] [&>p]:pr-[22px] [&>p]:text-[16px] [&>p]:leading-[1.55] [&>p]:text-ertex-muted"
  >
    <summary
      class="flex cursor-pointer list-none items-center justify-between gap-[15px] py-[14px] font-[590] after:text-[20px] after:font-[430] after:leading-none after:content-['+'] group-open/disclosure:after:content-['−'] [&::-webkit-details-marker]:hidden"
      :class="large ? 'text-[16px]' : 'text-[15px]'"
    >
      {{ summary }}
    </summary>
    <slot />
  </details>
</template>
