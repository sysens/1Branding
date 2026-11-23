<script setup lang="ts">
import { VIEWS, type CrmView, type Stage } from "../../data/crm";
import { media } from "../../media";
import CrmIcon from "./CrmIcon.vue";

// The app's left column (a top bar on phones): logo, workspace, the three views.
defineProps<{ view: CrmView; counts: Record<Stage, number> }>();
defineEmits<{ select: [view: CrmView] }>();

const ICONS = { all: "overview", samples: "samples", orders: "orders" } as const;
</script>

<template>
  <aside
    class="relative flex flex-col border-r border-[rgba(193,211,255,.095)] bg-[linear-gradient(155deg,#151e30_0%,#0d1420_50%,#0a111b_100%)] px-4 pb-[23px] pt-7 max-[1050px]:px-[10px] max-[1050px]:pb-5 max-[1050px]:pt-[26px] max-[760px]:flex-row max-[760px]:items-center max-[760px]:gap-[15px] max-[760px]:border-b max-[760px]:border-r-0 max-[760px]:px-[17px] max-[760px]:py-[15px] max-[460px]:gap-[7px] max-[460px]:px-[11px] max-[460px]:py-[13px]"
    aria-label="Разделы демо CRM"
  >
    <a class="mx-2 block w-[108px] max-[760px]:m-0 max-[760px]:w-[76px] max-[460px]:w-[63px]" href="#crm" aria-label="ERTEX CRM">
      <img
        :src="media('logo-dark.png')"
        alt="ERTEX Group"
        width="1503"
        height="476"
        class="block h-auto max-h-[46px] w-[108px] object-contain object-left max-[760px]:w-[76px] max-[460px]:w-[63px]"
      >
    </a>
    <span class="mx-2 mb-[34px] mt-[10px] text-[10px] tracking-[.035em] text-[#74849b] max-[1050px]:text-[9px] max-[760px]:hidden">Отдел продаж</span>

    <nav class="flex flex-col gap-[7px] max-[760px]:ml-auto max-[760px]:flex-row max-[760px]:gap-1">
      <button
        v-for="item in VIEWS"
        :key="item.id"
        type="button"
        :aria-pressed="item.id === view"
        class="flex min-h-[43px] items-center gap-[10px] rounded-[7px] border p-[10px] text-left text-[13px] font-medium transition-[background,color] duration-200 ease-[ease] hover:bg-[rgba(130,158,208,.08)] hover:text-white max-[1050px]:gap-[7px] max-[1050px]:px-2 max-[1050px]:py-[9px] max-[760px]:min-h-[35px] max-[760px]:gap-[5px] max-[760px]:p-2 max-[760px]:text-[10px] max-[460px]:px-[6px] max-[460px]:py-[7px] max-[460px]:text-[9px]"
        :class="item.id === view
          ? 'border-[rgba(143,178,255,.18)] bg-[linear-gradient(110deg,rgba(78,120,205,.22),rgba(42,70,123,.08))] text-[#f1f5ff] shadow-[inset_0_1px_0_rgba(210,226,255,.04)]'
          : 'border-transparent text-[#8d9db6]'"
        @click="$emit('select', item.id)"
      >
        <CrmIcon :name="ICONS[item.id]" />
        <span>{{ item.label }}</span>
        <b
          v-if="item.stage"
          class="ml-auto rounded px-[5px] py-[2px] text-[10px] font-medium text-[#9eb5df] [background:rgba(97,130,186,.12)] max-[760px]:hidden"
        >{{ counts[item.stage] }}</b>
      </button>
    </nav>

    <div class="mt-auto flex gap-[7px] px-2 pt-9 text-[9px] leading-[1.8] text-[#b4c2d6] max-[760px]:hidden">
      <span class="mt-[6px] h-[5px] w-[5px] flex-none rounded-full bg-[#4f81ce]" />
      <span>Демо-пространство<br><small class="text-[8px] text-[#64748b]">Данные для презентации</small></span>
    </div>
  </aside>
</template>
