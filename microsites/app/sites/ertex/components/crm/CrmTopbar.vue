<script setup lang="ts">
import { PERIODS } from "../../data/crm";

defineProps<{ title: string; range: string }>();
const days = defineModel<number>("days", { required: true });
</script>

<template>
  <header class="flex items-center justify-between gap-4 max-[460px]:items-start max-[460px]:gap-2">
    <div>
      <p class="mb-[9px] text-[10px] text-[#748299]">ERTEX <span class="px-[9px] text-[#40506a]">/</span> Продажи</p>
      <h3 class="text-[25px] font-[550] leading-[1.16] tracking-[-.04em] max-[760px]:text-[23px] max-[460px]:text-[21px]">{{ title }}</h3>
    </div>
    <div class="flex min-w-[174px] flex-col gap-[5px] max-[760px]:min-w-[150px] max-[460px]:min-w-[130px]">
      <label for="er-crm-period" class="text-[9px] text-[#7888a1]">Период</label>
      <select
        id="er-crm-period"
        v-model.number="days"
        class="w-full rounded-[6px] border border-[#29354a] bg-[#121c2b] py-[9px] pl-[11px] pr-[30px] text-[13px] text-[#d7e2f3] [color-scheme:dark] max-[760px]:pl-[9px] max-[760px]:text-[10px] max-[460px]:pr-[19px] max-[460px]:text-[9px]"
      >
        <option v-for="period in PERIODS" :key="period.days" :value="period.days">{{ period.label }}</option>
      </select>
    </div>
  </header>

  <div class="mb-[19px] mt-[17px] flex items-center gap-[6px] text-[10px] text-[#8291a7]">
    <span class="h-[5px] w-[5px] rounded-full bg-[#5e8cf1]" />
    <span>{{ range }}</span>
    <span class="ml-[3px] rounded-[3px] border border-[#30415b] px-[5px] py-[2px] text-[8px] uppercase tracking-[.08em] text-[#9bb8e9]">Демо</span>
  </div>
</template>
