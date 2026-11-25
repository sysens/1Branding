<script setup lang="ts">
import type { DateRange } from "reka-ui";
import { parseDate, type CalendarDate } from "@internationalized/date";
import { CalendarIcon, Check, ChevronDown, X } from "@lucide/vue";
import { ATTRIBUTION_LABELS } from "#shared/utils/constants";

const props = defineProps<{ show: string[] }>();
const { preset, range, channels, services, currency, attribution, set } = useFilters();
const { meta } = useMeta();

const presets = Object.entries(PERIOD_LABELS).filter(([key]) => key !== "custom") as Array<[PeriodPreset, string]>;
const rangeLabel = computed(() =>
  range.value.from === range.value.to ? formatDay(range.value.from) : `${formatDay(range.value.from, true)} – ${formatDay(range.value.to, true)}`);

const calendarOpen = ref(false);
const draft = shallowRef<DateRange>({ start: undefined, end: undefined });
watch(calendarOpen, (open) => {
  if (open) draft.value = { start: parseDate(range.value.from), end: parseDate(range.value.to) };
});
function applyRange(value: DateRange) {
  draft.value = value;
  if (value.start && value.end) {
    set({ preset: "custom", from: (value.start as CalendarDate).toString(), to: (value.end as CalendarDate).toString() });
    calendarOpen.value = false;
  }
}

const activeChannels = computed(() => (meta.value?.channels ?? []).filter((c) => c.isActive));
const activeServices = computed(() => (meta.value?.services ?? []).filter((s) => s.isActive));
const toggle = (list: number[], id: number) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
const summary = (ids: number[], names: Array<{ id: number; name: string }>, all: string) => {
  if (!ids.length) return all;
  if (ids.length === 1) return names.find((n) => n.id === ids[0])?.name ?? all;
  return `${ids.length} выбрано`;
};
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <template v-if="props.show.includes('period')">
      <Select :model-value="preset === 'custom' ? undefined : preset" @update:model-value="(v) => set({ preset: String(v), from: undefined, to: undefined })">
        <SelectTrigger size="sm" class="w-36">
          <SelectValue :placeholder="PERIOD_LABELS.custom" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="[key, label] in presets" :key="key" :value="key">{{ label }}</SelectItem>
        </SelectContent>
      </Select>
      <Popover v-model:open="calendarOpen">
        <PopoverTrigger as-child>
          <Button variant="outline" size="sm" class="font-normal">
            <CalendarIcon class="text-muted-foreground" />
            {{ rangeLabel }}
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" align="start">
          <RangeCalendar :model-value="draft" locale="ru" :number-of-months="2" weekday-format="short" @update:model-value="applyRange" />
        </PopoverContent>
      </Popover>
    </template>

    <Popover v-if="props.show.includes('channels')">
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm" class="font-normal" :class="channels.length ? 'border-primary/40' : ''">
          {{ summary(channels, activeChannels, "Все каналы") }}
          <ChevronDown class="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Канал…" />
          <CommandList>
            <CommandEmpty>Ничего не найдено</CommandEmpty>
            <CommandGroup>
              <CommandItem v-for="c in activeChannels" :key="c.id" :value="c.name" @select="set({ channels: toggle(channels, c.id) })">
                <span class="size-2 rounded-full" :style="{ background: c.color ?? 'var(--muted-foreground)' }" />
                {{ c.name }}
                <Check v-if="channels.includes(c.id)" class="ml-auto" />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <div v-if="channels.length" class="border-t p-1">
          <Button variant="ghost" size="sm" class="w-full justify-center" @click="set({ channels: [] })">Сбросить</Button>
        </div>
      </PopoverContent>
    </Popover>

    <Popover v-if="props.show.includes('services')">
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm" class="font-normal" :class="services.length ? 'border-primary/40' : ''">
          {{ summary(services, activeServices, "Все услуги") }}
          <ChevronDown class="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Услуга или пакет…" />
          <CommandList>
            <CommandEmpty>Ничего не найдено</CommandEmpty>
            <CommandGroup>
              <CommandItem v-for="s in activeServices" :key="s.id" :value="s.name" @select="set({ services: toggle(services, s.id) })">
                {{ s.name }}
                <Check v-if="services.includes(s.id)" class="ml-auto" />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <div v-if="services.length" class="border-t p-1">
          <Button variant="ghost" size="sm" class="w-full justify-center" @click="set({ services: [] })">Сбросить</Button>
        </div>
      </PopoverContent>
    </Popover>

    <Select v-if="props.show.includes('attribution')" :model-value="attribution" @update:model-value="(v) => set({ attribution: String(v) })">
      <SelectTrigger size="sm" class="w-60">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="(label, key) in ATTRIBUTION_LABELS" :key="key" :value="key">{{ label }}</SelectItem>
      </SelectContent>
    </Select>

    <ToggleGroup
      v-if="props.show.includes('currency')"
      type="single"
      variant="outline"
      size="sm"
      :model-value="currency"
      @update:model-value="(v) => v && set({ currency: String(v) })"
    >
      <ToggleGroupItem value="USD" class="px-3">USD</ToggleGroupItem>
      <ToggleGroupItem value="UZS" class="px-3">UZS</ToggleGroupItem>
    </ToggleGroup>

    <Button
      v-if="channels.length || services.length || preset === 'custom'"
      variant="ghost"
      size="sm"
      class="text-muted-foreground"
      @click="set({ channels: [], services: [], preset: undefined, from: undefined, to: undefined })"
    >
      <X />
      Сбросить
    </Button>
  </div>
</template>
