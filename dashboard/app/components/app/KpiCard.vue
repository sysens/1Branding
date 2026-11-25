<script setup lang="ts">
// One KPI tile: the value and its change against the previous period.
// For costs (CPL, CAC, spend) a rise is bad: `lowerIsBetter` colours it so.
import { TrendingDown, TrendingUp } from "@lucide/vue";

const props = defineProps<{
  title: string;
  value: string;
  change?: number | null;
  lowerIsBetter?: boolean;
  hint?: string;
  loading?: boolean;
}>();

const good = computed(() => {
  if (props.change === null || props.change === undefined || props.change === 0) return null;
  return props.lowerIsBetter ? props.change < 0 : props.change > 0;
});
</script>

<template>
  <Card class="@container/card gap-2 py-4">
    <CardHeader class="px-4">
      <CardDescription>{{ title }}</CardDescription>
      <CardTitle class="text-xl font-semibold tabular-nums @[220px]/card:text-2xl @[300px]/card:text-3xl">
        <Skeleton v-if="loading" class="h-8 w-24" />
        <template v-else>{{ value }}</template>
      </CardTitle>
      <CardAction v-if="!loading && change !== null && change !== undefined">
        <Badge
          variant="outline"
          :class="good === null ? '' : good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
        >
          <TrendingUp v-if="change >= 0" />
          <TrendingDown v-else />
          {{ change > 0 ? "+" : "" }}{{ formatNumber(change, Math.abs(change) < 10 ? 1 : 0) }}%
        </Badge>
      </CardAction>
    </CardHeader>
    <CardFooter v-if="hint" class="text-muted-foreground px-4 text-xs">{{ hint }}</CardFooter>
  </Card>
</template>
