<script setup lang="ts">
import SocialEyebrow from "./SocialEyebrow.vue";
</script>

<template>
  <div class="mx-auto mb-12 grid max-w-[1440px] grid-cols-[1.35fr_1fr] items-end gap-10 max-[760px]:mb-8 max-[760px]:grid-cols-1 max-[760px]:gap-6">
    <div>
      <SocialEyebrow>Social Media Pack</SocialEyebrow>
      <h2 id="er-social-title" class="text-[length:clamp(42px,5.7cqi,86px)] font-medium leading-[1.02] tracking-[-.055em]">
        Лента<br><em class="not-italic text-[#004dda]">и сторис</em>
      </h2>
    </div>
    <div class="max-w-[400px] justify-self-end pb-[6px] max-[760px]:max-w-[430px] max-[760px]:justify-self-start">
      <p class="text-[length:clamp(16px,1.4cqi,21px)] leading-normal tracking-[-.025em]">
        В ленте покупатель знакомится с коллекцией, рассматривает переплетение нитей и выбирает образцы. В сторис тот же путь занимает один экран.
      </p>
      <span class="mt-5 block text-[11px] leading-[1.6] text-[#6b7685] max-[760px]:mt-3">Концепция оформления социальных сетей</span>
    </div>
  </div>
</template>
