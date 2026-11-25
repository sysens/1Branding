<script setup lang="ts">
// A funnel as horizontal bars: each step's count, its width against the
// first step, and the conversion from the step before.
const props = defineProps<{ steps: Array<{ name: string; count: number }> }>();
const first = computed(() => props.steps[0]?.count || 0);
</script>

<template>
  <div class="grid gap-3">
    <div v-for="(step, index) in props.steps" :key="step.name" class="grid gap-1.5">
      <div class="flex items-baseline justify-between gap-2 text-sm">
        <span class="truncate">{{ step.name }}</span>
        <span class="flex items-baseline gap-2 tabular-nums">
          <span v-if="index > 0" class="text-muted-foreground text-xs">
            {{ formatPercent(props.steps[index - 1]!.count ? (step.count / props.steps[index - 1]!.count) * 100 : null, 0) }}
          </span>
          <span class="font-medium">{{ formatNumber(step.count) }}</span>
        </span>
      </div>
      <div class="bg-muted h-2 overflow-hidden rounded-full">
        <div class="bg-primary h-full rounded-full transition-[width] duration-500" :style="{ width: `${first ? Math.max((step.count / first) * 100, step.count ? 1.5 : 0) : 0}%` }" />
      </div>
    </div>
  </div>
</template>
