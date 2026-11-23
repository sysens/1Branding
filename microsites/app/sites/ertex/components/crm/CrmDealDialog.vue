<script setup lang="ts">
import { ADVANCE_LABELS, NEXT_STEPS, STAGE_NAMES, type Deal } from "../../data/crm";
import { useModal } from "../../composables/useModal";
import { formatDayMonth, formatMoney, formatNumber, parseDay } from "../../utils/format";

// A deal's card: figures, the next step, and a button that moves it on.
const props = defineProps<{ deal?: Deal }>();
defineEmits<{ advance: [] }>();
const open = defineModel<boolean>("open", { default: false });

const { dialog, onClose, onClick } = useModal(open);

const fields = computed(() => {
  const deal = props.deal;
  if (!deal) return [];
  return [
    { label: "Объём", value: `${formatNumber(deal.qty)} кг` },
    { label: "Сумма запроса", value: formatMoney(deal.amount) },
    { label: "Дата запроса", value: `${formatDayMonth(parseDay(deal.created))} 2026` },
    { label: "Текущий этап", value: STAGE_NAMES[deal.stage] },
  ];
});
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="er-crm-detail-title"
    class="max-h-[90vh] w-[min(520px,calc(100%_-_32px))] overflow-y-auto rounded-[17px] border border-[#35476b] p-[34px] font-ertex-ui text-[#e5eeff] shadow-[0_35px_120px_rgba(0,0,0,.65)] [background:radial-gradient(ellipse_at_0_0,#1b345b,transparent_75%),#0f1725] backdrop:bg-[rgba(2,6,13,.72)] backdrop:backdrop-blur-[7px]"
    @close="onClose"
    @click="onClick"
  >
    <form method="dialog">
      <button
        class="absolute right-[15px] top-3 h-8 w-8 rounded-full border border-[#334564] bg-[#19263c] text-[24px] leading-none text-[#adbfdb]"
        aria-label="Закрыть карточку"
        value="close"
      >×</button>
    </form>
    <template v-if="deal">
      <span class="text-[11px] tracking-[.08em] text-[#82a8eb]">Запрос {{ deal.id }}</span>
      <h3 id="er-crm-detail-title" class="mb-2 mt-[15px] text-[30px] font-[550] leading-[1.1] tracking-[-.04em]">{{ deal.product }}</h3>
      <p class="mb-[25px] text-[12px] leading-normal text-[#8195b3]">{{ deal.client }}</p>

      <div class="grid grid-cols-2 gap-x-4 gap-y-[22px] border-y border-[#283b56] py-[22px]">
        <div v-for="field in fields" :key="field.label">
          <span class="mb-2 block text-[10px] text-[#7188aa]">{{ field.label }}</span>
          <strong class="text-[16px] font-medium">{{ field.value }}</strong>
        </div>
      </div>

      <div class="my-6">
        <span class="mb-2 block text-[10px] text-[#7188aa]">Следующий шаг</span>
        <p class="text-[14px] leading-[1.6] text-[#bccce2]">{{ NEXT_STEPS[deal.stage] }}</p>
      </div>

      <button
        type="button"
        class="w-full rounded-lg border px-[17px] py-3 text-[12px]"
        :class="deal.stage === 'production' ? 'cursor-default border-[#29466b] bg-[#182a42] text-[#7891b5]' : 'border-[#5d8de5] bg-[#2867d5] text-white'"
        :disabled="deal.stage === 'production'"
        @click="$emit('advance')"
      >
        {{ ADVANCE_LABELS[deal.stage] }}
      </button>
      <p class="mt-[13px] text-center text-[9px] leading-normal text-[#a5b7d1]">Демонстрация процесса. Изменения действуют только в этой сессии.</p>
    </template>
  </dialog>
</template>
