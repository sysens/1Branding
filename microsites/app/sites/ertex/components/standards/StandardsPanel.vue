<script setup lang="ts">
// A tab's panel: the demonstration ("stage") on the left, the rules on the right.
defineProps<{
  id: string;
  /** Layout and colours of the stage box (its size is set here). */
  stageClass?: string;
}>();
</script>

<template>
  <div
    :id="`panel-${id}`"
    role="tabpanel"
    :aria-labelledby="`tab-${id}`"
    class="grid grid-cols-[minmax(0,1.25fr)_minmax(0,.85fr)] items-start gap-[clamp(30px,5.5cqi,100px)] pt-9 [&>*]:min-w-0 max-[900px]:grid-cols-[1.05fr_1fr] max-[900px]:gap-[25px] max-[690px]:grid-cols-[minmax(0,1fr)] max-[690px]:pt-[22px]"
  >
    <!-- The width of its column. (On the original page a stage never got
         narrower than its min-height × 1.85 = 610px, and between ~900 and
         ~1300px wide it ran over the text beside it.) -->
    <div
      class="relative aspect-[1.85] min-h-[330px] w-full max-[900px]:min-h-[275px] max-[690px]:aspect-[1.6] max-[690px]:min-h-[215px]"
      :class="stageClass"
    >
      <slot name="stage" />
    </div>
    <slot />
  </div>
</template>
