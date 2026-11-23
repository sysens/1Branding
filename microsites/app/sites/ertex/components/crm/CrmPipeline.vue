<script setup lang="ts">
import { STAGE_NAMES, STAGES, type Stage } from "../../data/crm";
import CrmPanelHeading from "./CrmPanelHeading.vue";

// The four stages of a deal with their counts; a click filters the table.
defineProps<{ counts: Record<Stage, number>; active: Stage | null }>();
defineEmits<{ toggle: [stage: Stage]; reset: [] }>();

const DOTS: Record<Stage, string> = {
  inquiry: "bg-[#8f9cba]",
  samples: "bg-[#6099ff]",
  approval: "bg-[#c3a26e]",
  production: "bg-[#67b4a2]",
};
</script>

<template>
  <div>
    <CrmPanelHeading title="Путь к заказу">
      <button type="button" class="border-0 bg-transparent py-[3px] text-[11px] text-[#7499dd]" @click="$emit('reset')">Все этапы</button>
    </CrmPanelHeading>
    <div class="grid grid-cols-4 gap-[6px] max-[460px]:gap-1" aria-label="Фильтр по этапу сделки">
      <button
        v-for="stage in STAGES"
        :key="stage"
        type="button"
        :aria-pressed="stage === active"
        class="relative flex min-w-0 flex-col items-start rounded-[7px] border px-[10px] pb-[11px] pt-3 text-left text-[#8294b0] transition-[background,border-color] duration-200 ease-[ease] hover:border-[#456aa1] hover:bg-[#15253c] max-[1050px]:pl-2 max-[460px]:px-[7px] max-[460px]:py-3"
        :class="stage === active ? 'border-[#456aa1] bg-[#15253c]' : 'border-[rgba(193,211,255,.095)] bg-[#101925]'"
        @click="$emit('toggle', stage)"
      >
        <span class="absolute right-[11px] top-[15px] h-[5px] w-[5px] rounded-full" :class="DOTS[stage]" />
        <b class="mb-[7px] text-[24px] font-medium leading-none tracking-[-.05em] text-[#dde8fa]">{{ counts[stage] }}</b>
        <span class="whitespace-nowrap text-[13px] max-[760px]:text-[10px] max-[460px]:text-[9px]">{{ STAGE_NAMES[stage] }}</span>
      </button>
    </div>
  </div>
</template>
