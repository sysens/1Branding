<script setup lang="ts">
import type { Deal } from "../../data/crm";
import CrmDealRow from "./CrmDealRow.vue";
import CrmPanelHeading from "./CrmPanelHeading.vue";

defineProps<{ deals: Deal[] }>();
defineEmits<{ open: [id: string] }>();

const COLUMNS = ["Запрос / материал", "Объём", "Сумма, USD", "Этап"];
</script>

<template>
  <div class="border-t border-[rgba(193,211,255,.095)] pt-[18px]">
    <CrmPanelHeading>
      <template #title>Активные сделки <span class="ml-[6px] text-[10px] text-[#607896]">{{ deals.length }}</span></template>
      <span class="text-[9px] text-[#a5b7d1] max-[760px]:hidden">Открыть карточку</span>
    </CrmPanelHeading>
    <div class="max-h-[277px] overflow-auto [scrollbar-color:#2d4261_transparent] [scrollbar-width:thin] min-[1500px]:max-h-[300px] max-[760px]:max-h-[292px]">
      <table class="w-full border-collapse text-left text-[13px] leading-[1.4] text-[#a0b2cb] tabular-nums max-[460px]:min-w-[430px]">
        <thead>
          <tr>
            <th
              v-for="column in COLUMNS"
              :key="column"
              scope="col"
              class="sticky top-0 z-[2] whitespace-nowrap border-b border-[rgba(193,211,255,.095)] bg-[#0e1521] px-2 py-[9px] text-[11px] font-medium text-[#a5b7d1] first:pl-0"
            >
              {{ column }}
            </th>
          </tr>
        </thead>
        <tbody>
          <CrmDealRow v-for="deal in deals" :key="deal.id" :deal="deal" @open="$emit('open', deal.id)" />
        </tbody>
      </table>
    </div>
    <p v-if="!deals.length" class="px-4 py-6 text-center text-[11px] text-[#8e9db4]">На этом этапе за выбранный период нет сделок.</p>
  </div>
</template>
