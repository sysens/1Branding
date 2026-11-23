<script setup lang="ts">
// The page's content column: full width of the frame, side gutters of --gap
// (set on the frame), never wider than 1720px.
withDefaults(defineProps<{ as?: string }>(), { as: "div" });
</script>

<template>
  <component :is="as" class="mx-auto w-full max-w-[1720px] px-[--gap]">
    <slot />
  </component>
</template>
