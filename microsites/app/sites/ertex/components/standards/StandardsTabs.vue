<script setup lang="ts">
import { STANDARD_TABS, type StandardTab } from "../../data/standards";

// The tab row. Arrow keys, Home and End move between tabs, as in a native tablist.
const selected = defineModel<StandardTab>({ required: true });

const buttons = ref<HTMLButtonElement[]>([]);

function onKeydown(event: KeyboardEvent, index: number) {
  const last = STANDARD_TABS.length - 1;
  const positions: Record<string, number> = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  };
  const next = positions[event.key];
  if (next === undefined) return;
  event.preventDefault();
  selected.value = STANDARD_TABS[next]!.id;
  buttons.value[next]?.focus();
}
</script>

<template>
  <div
    class="mt-[34px] flex gap-[clamp(16px,3.1cqi,52px)] overflow-auto border-b border-[#cbd6df] max-[690px]:mt-5 max-[690px]:gap-[21px] max-[370px]:gap-[14px]"
    role="tablist"
    aria-label="Разделы стандартов"
  >
    <button
      v-for="(tab, index) in STANDARD_TABS"
      :id="`tab-${tab.id}`"
      :key="tab.id"
      ref="buttons"
      type="button"
      role="tab"
      :aria-controls="`panel-${tab.id}`"
      :aria-selected="tab.id === selected"
      :tabindex="tab.id === selected ? 0 : -1"
      class="whitespace-nowrap border-b-2 pb-[14px] pt-3 text-[15px] max-[690px]:text-[14px] max-[370px]:text-[13px]"
      :class="tab.id === selected ? 'border-ertex-blue font-[620] text-ertex-blue' : 'border-transparent text-ertex-muted'"
      @click="selected = tab.id"
      @keydown="onKeydown($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
