<script setup lang="ts">
import { STAGE_NAMES, type Stage } from "../../data/crm";

defineProps<{ stage: Stage }>();

const TONES: Record<Stage, string> = {
  inquiry: "bg-[#1b2638] text-[#a8bad5]",
  samples: "bg-[rgba(40,95,187,.15)] text-[#7daafd]",
  approval: "bg-[rgba(163,130,65,.1)] text-[#bea77f]",
  production: "bg-[rgba(66,136,121,.12)] text-[#78bcae]",
};
</script>

<template>
  <span
    class="inline-flex items-center gap-[5px] rounded px-[6px] py-1 text-[11px] before:h-1 before:w-1 before:rounded-full before:bg-current"
    :class="TONES[stage]"
  >{{ STAGE_NAMES[stage] }}</span>
</template>
