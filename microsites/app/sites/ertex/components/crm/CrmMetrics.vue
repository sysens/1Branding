<script setup lang="ts">
import { formatMoney, formatNumber } from "../../utils/format";
import CrmMetric from "./CrmMetric.vue";

defineProps<{ total: number; activeDeals: number; volume: number; samples: number }>();
</script>

<template>
  <div class="grid grid-cols-[1.25fr_1fr_1fr] gap-[10px] max-[460px]:grid-cols-2 max-[460px]:gap-2" aria-live="polite">
    <CrmMetric label="Сумма запросов" primary>
      <template #value>{{ formatMoney(total) }}</template>
      {{ activeDeals }} активных сделок за период
    </CrmMetric>
    <CrmMetric label="Объём в работе">
      <template #value>{{ formatNumber(volume) }}<i class="text-[17px] font-normal not-italic tracking-[-.02em] text-[#74859e]"> кг</i></template>
      Подтверждённые заказы
    </CrmMetric>
    <CrmMetric label="Образцы у клиентов">
      <template #value>{{ samples }}</template>
      Ожидают обратной связи
    </CrmMetric>
  </div>
</template>
