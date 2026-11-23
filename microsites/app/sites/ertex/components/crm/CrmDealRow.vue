<script setup lang="ts">
import type { Deal } from "../../data/crm";
import { formatDayMonth, formatMoney, formatNumber, parseDay } from "../../utils/format";
import CrmStatus from "./CrmStatus.vue";

defineProps<{ deal: Deal }>();
defineEmits<{ open: [] }>();

const CELL = "whitespace-nowrap border-b border-[rgba(184,204,238,.045)] px-2 py-3";
</script>

<template>
  <tr class="transition-colors duration-150 hover:bg-[rgba(43,74,121,.1)]">
    <td :class="CELL" class="pl-0">
      <button
        type="button"
        class="flex w-full items-center gap-[10px] border-0 bg-transparent p-0 text-left leading-[1.4] text-[#d9e5f7]"
        :aria-label="`Открыть запрос ${deal.id}, ${deal.product}`"
        @click="$emit('open')"
      >
        <!-- The fabric's colour with a faint knit texture over it. -->
        <span
          class="h-[29px] w-[27px] flex-none rounded border border-[rgba(255,255,255,.1)] bg-[color:var(--swatch)] bg-[image:repeating-linear-gradient(96deg,transparent_0_2px,rgba(255,255,255,.045)_2px_3px),repeating-linear-gradient(0deg,transparent_0_3px,rgba(0,0,0,.13)_3px_4px)]"
          :style="{ '--swatch': deal.color }"
          aria-hidden="true"
        />
        <span>
          <strong class="block text-[14px] font-medium">{{ deal.product }}</strong>
          <small class="mt-[3px] block text-[11px] text-[#a5b7d1]">{{ deal.id }} · {{ formatDayMonth(parseDay(deal.created)) }}</small>
        </span>
      </button>
    </td>
    <td :class="CELL">{{ formatNumber(deal.qty) }} кг</td>
    <td :class="CELL">{{ formatMoney(deal.amount) }}</td>
    <td :class="CELL"><CrmStatus :stage="deal.stage" /></td>
  </tr>
</template>
