<script setup lang="ts">
import type { ChartBin } from "../../composables/useCrm";
import CrmPanelHeading from "./CrmPanelHeading.vue";

// New requests per day or per six days, as bars up to 48px tall.
const props = defineProps<{ bins: ChartBin[]; label: string }>();

const max = computed(() => Math.max(1, ...props.bins.map((bin) => bin.count)));
const barHeight = (count: number) => `${Math.max(2, (count / max.value) * 48)}px`;
</script>

<template>
  <div class="min-w-0">
    <CrmPanelHeading title="Новые запросы">
      <span class="text-[9px] text-[#a5b7d1]">шт.</span>
    </CrmPanelHeading>
    <div class="flex h-[79px] items-stretch justify-between gap-[9px] px-px max-[760px]:h-[78px]" role="img" :aria-label="label">
      <div v-for="bin in bins" :key="bin.label" class="flex min-w-0 flex-1 flex-col items-center justify-end gap-[5px]">
        <div
          class="relative min-h-[2px] w-full max-w-[32px] rounded-t-[3px] max-[760px]:max-w-[46px]"
          :class="bin.count ? 'bg-[linear-gradient(0deg,#19375f,#4b85ef)] shadow-[inset_0_-1px_0_#78a6fa]' : 'bg-[#1b2638]'"
          :style="{ height: barHeight(bin.count) }"
        >
          <span class="absolute -top-3 left-0 right-0 text-center text-[11px] text-[#a5b9db] max-[760px]:text-[8px] max-[460px]:text-[9px]">{{ bin.count }}</span>
        </div>
        <small class="whitespace-nowrap text-[11px] text-[#7a90ae] max-[760px]:text-[9px]">{{ bin.label }}</small>
      </div>
    </div>
  </div>
</template>
