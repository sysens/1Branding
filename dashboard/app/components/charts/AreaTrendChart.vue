<script setup lang="ts">
// Lines with a soft area under them, by day or month (visits and visitors,
// revenue against plan).
import type { ChartConfig } from "@/components/ui/chart";
import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import { ChartContainer, ChartCrosshair, ChartTooltip, ChartTooltipContent, componentToString } from "@/components/ui/chart";

const props = defineProps<{
  data: Array<Record<string, number | string | null>>;
  /** The row field with the day ("YYYY-MM-DD") or month ("YYYY-MM-01"). */
  dateKey: string;
  series: Array<{ key: string; label: string; color: string; area?: boolean; dashed?: boolean }>;
  monthly?: boolean;
  format?: (value: number) => string;
  height?: string;
}>();

const config = computed<ChartConfig>(() => Object.fromEntries(props.series.map((s) => [s.key, { label: s.label, color: s.color }])));
const indexed = computed(() => props.data.map((row, index) => ({ ...row, index })));
const x = (d: { index: number }) => d.index;
const label = (i: number | Date) => {
  const value = String(props.data[Math.round(Number(i))]?.[props.dateKey] ?? "");
  if (!value) return "";
  if (props.monthly) return new Date(`${value.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString("ru-RU", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(/\s?г\.$/, "");
  return formatDay(value, true);
};
const tooltip = computed(() => componentToString(config.value, ChartTooltipContent, { labelFormatter: label }));
const y = (key: string) => (d: Record<string, number | null>) => (d[key] === null || d[key] === undefined ? undefined : Number(d[key]));
</script>

<template>
  <ChartContainer :config="config" :class="props.height ?? 'aspect-auto h-64 w-full'" cursor>
    <VisXYContainer :data="indexed">
      <template v-for="s in props.series" :key="s.key">
        <VisArea v-if="s.area" :x="x" :y="y(s.key)" :color="s.color" :opacity="0.15" />
        <VisLine :x="x" :y="y(s.key)" :color="s.color" :line-width="2" :line-dash-array="s.dashed ? [4, 4] : undefined" />
      </template>
      <VisAxis type="x" :x="x" :tick-line="false" :domain-line="false" :grid-line="false" :num-ticks="Math.min(props.data.length, 8)" :tick-format="label" />
      <VisAxis type="y" :tick-line="false" :domain-line="false" :num-ticks="4" :tick-format="(v: number) => (props.format ? props.format(v) : formatNumber(v))" />
      <ChartTooltip />
      <ChartCrosshair :template="tooltip" color="#0000" />
    </VisXYContainer>
  </ChartContainer>
</template>
