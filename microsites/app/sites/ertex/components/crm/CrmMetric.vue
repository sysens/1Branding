<script setup lang="ts">
// One figure card. The primary card (the total) is lit and, on small phones,
// spans the row with its note moved to the right.
defineProps<{ label: string; primary?: boolean }>();
</script>

<template>
  <div
    class="relative min-h-[125px] min-w-0 overflow-hidden rounded-[10px] border px-[18px] py-5 max-[1050px]:px-[13px] max-[1050px]:py-[17px] max-[460px]:px-[13px] max-[460px]:py-4"
    :class="primary
      ? 'border-[rgba(73,121,215,.27)] [background:radial-gradient(ellipse_at_0_0,rgba(47,110,241,.23),transparent_90%),#101b2d] max-[460px]:col-span-full max-[460px]:min-h-[104px]'
      : 'border-[rgba(193,211,255,.095)] bg-[linear-gradient(130deg,#121b2b,#101722)] max-[460px]:min-h-[111px]'"
  >
    <span class="mb-[13px] block text-[13px] text-[#8c9db6] max-[760px]:text-[10px]" :class="{ 'max-[460px]:mb-[10px]': primary }">{{ label }}</span>
    <strong
      class="block whitespace-nowrap text-[31px] font-[550] leading-none tracking-[-.05em] text-[#f1f5ff] tabular-nums max-[1050px]:text-[27px]"
      :class="primary ? 'max-[460px]:text-[35px]' : 'max-[460px]:text-[28px]'"
    >
      <slot name="value" />
    </strong>
    <small
      class="mt-3 block leading-[1.3] text-[#a5b7d1]"
      :class="primary
        ? 'max-w-[70%] text-[11px] max-[760px]:max-w-none max-[460px]:absolute max-[460px]:bottom-5 max-[460px]:right-[14px] max-[460px]:max-w-[115px] max-[460px]:text-right max-[460px]:text-[9px]'
        : 'text-[11px]'"
    >
      <slot />
    </small>
  </div>
</template>
