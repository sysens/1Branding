<script setup lang="ts">
import ProfileBadge from "./ProfileBadge.vue";
import SocialEyebrow from "./SocialEyebrow.vue";

const SPECS = ["1080 × 1920", "Story", "Переход к образцам"];
</script>

<template>
  <div class="relative z-[2] max-w-[455px] max-[760px]:m-auto max-[760px]:w-full max-[760px]:max-w-[460px]">
    <SocialEyebrow tone="dark">Вертикальная история / 9:16</SocialEyebrow>
    <h3 class="text-[length:clamp(38px,4.6cqi,66px)] font-[450] leading-[1.05] tracking-[-.05em] max-[760px]:text-[48px] max-[390px]:text-[42px]">
      Из ленты —<br><em class="not-italic text-[#729dff]">к диалогу.</em>
    </h3>
    <p class="mt-[26px] max-w-[365px] text-[14px] leading-[1.65] tracking-[-.015em] text-[#97a8bf] max-[1000px]:text-[13px] max-[760px]:max-w-[400px] max-[760px]:text-[14px]">
      Крупный материал, короткое сообщение и понятный следующий шаг. Знак X объединяет цифровые форматы с физическим опытом бренда.
    </p>
    <ProfileBadge />
    <div class="mt-[38px] flex flex-wrap gap-2">
      <span v-for="spec in SPECS" :key="spec" class="border border-[#ffffff20] px-[10px] py-[7px] text-[9px] tracking-[.04em] text-[#8ea2bf]">{{ spec }}</span>
    </div>
  </div>
</template>
