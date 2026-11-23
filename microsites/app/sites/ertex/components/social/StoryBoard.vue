<script setup lang="ts">
import { media } from "../../media";
import StoryIntro from "./StoryIntro.vue";
import StoryPhone from "./StoryPhone.vue";
</script>

<template>
  <div
    class="relative mx-auto mt-6 grid min-h-[700px] max-w-[1440px] grid-cols-[1.1fr_1fr] items-center gap-[clamp(30px,6cqi,100px)] overflow-hidden px-[clamp(28px,6cqi,96px)] py-[clamp(35px,5cqi,80px)] text-white [background:radial-gradient(ellipse_at_80%_65%,#163f81_0,#0a213f_36%,#08162b_74%)] max-[1000px]:min-h-[630px] max-[1000px]:gap-[30px] max-[1000px]:px-[35px] max-[1000px]:py-[45px] max-[760px]:grid-cols-1 max-[760px]:gap-[42px] max-[760px]:px-7 max-[760px]:py-[42px] max-[390px]:px-5 max-[390px]:py-8"
  >
    <StoryIntro />
    <StoryPhone />
    <img
      :src="media('x.png')"
      alt=""
      aria-hidden="true"
      loading="lazy"
      class="pointer-events-none absolute -right-[4%] top-[18%] z-0 w-[53%] -rotate-[8deg] opacity-[.025] brightness-0 invert max-[760px]:-right-[27%] max-[760px]:bottom-[15%] max-[760px]:top-auto max-[760px]:w-full"
    >
  </div>
</template>
