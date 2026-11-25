<script setup lang="ts">
// Stacked bars by day (leads by channel, visits by source): shadcn-vue's
// chart container around unovis.
import type { ChartConfig } from "@/components/ui/chart";
import { VisAxis, VisStackedBar, VisXYContainer } from "@unovis/vue";
import { ChartContainer, ChartCrosshair, ChartTooltip, ChartTooltipContent, componentToString } from "@/components/ui/chart";

const props = defineProps<{
  /** One row per day: { day: "YYYY-MM-DD", <seriesKey>: number, ... }. */
  data: Array<Record<string, number | string>>;
  series: Array<{ key: string; label: string; color: string }>;
  height?: string;
}>();

const config = computed<ChartConfig>(() => Object.fromEntries(props.series.map((s) => [s.key, { label: s.label, color: s.color }])));
const indexed = computed(() => props.data.map((row, index) => ({ ...row, index })));
const x = (d: { index: number }) => d.index;
const ys = computed(() => props.series.map((s) => (d: Record<string, number>) => Number(d[s.key] ?? 0)));
const colors = computed(() => props.series.map((s) => s.color));
const tick = (i: number) => {
  const row = props.data[Math.round(i)];
  return row ? formatDay(String(row.day), true) : "";
};
const tooltip = computed(() => componentToString(config.value, ChartTooltipContent, {
  labelFormatter: (i: number | Date) => formatDay(String(props.data[Math.round(Number(i))]?.day ?? ""), true),
}));
</script>

<template>
  <ChartContainer :config="config" :class="props.height ?? 'aspect-auto h-64 w-full'" cursor>
    <VisXYContainer :data="indexed" :y-domain="undefined">
      <VisStackedBar :x="x" :y="ys" :color="colors" :rounded-corners="3" :bar-padding="0.2" />
      <VisAxis type="x" :x="x" :tick-line="false" :domain-line="false" :grid-line="false" :num-ticks="Math.min(props.data.length, 8)" :tick-format="tick" />
      <VisAxis type="y" :tick-line="false" :domain-line="false" :num-ticks="4" :tick-format="(v: number) => formatNumber(v)" />
      <ChartTooltip />
      <ChartCrosshair :template="tooltip" color="#0000" />
    </VisXYContainer>
  </ChartContainer>
</template>
