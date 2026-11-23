<script setup lang="ts">
import Eyebrow from "../ui/Eyebrow.vue";
import Wrap from "../ui/Wrap.vue";
</script>

<template>
  <Wrap
    as="section"
    aria-labelledby="hero-title"
    class="flex min-h-[clamp(445px,35cqi,545px)] items-center pb-[62px] pt-[45px] max-[690px]:block max-[690px]:min-h-0 max-[690px]:pb-[38px] max-[690px]:pt-[19px]"
  >
    <div class="max-w-[48%] max-[690px]:max-w-full">
      <Eyebrow tone="hero">Предложение OneBranding</Eyebrow>
      <h1
        id="hero-title"
        class="text-[length:clamp(56px,6cqi,92px)] font-[515] leading-[.98] tracking-[-.047em] max-[900px]:text-[length:clamp(44px,6.4cqi,60px)] max-[690px]:text-[length:clamp(44px,10.5cqi,69px)]"
      >
        Ребрендинг<br>ERTEX Group
      </h1>
      <p
        class="mb-[26px] mt-6 max-w-[424px] text-[length:clamp(16px,1.1cqi,19px)] leading-[1.58] text-[#d8e1ed] max-[900px]:max-w-[350px] max-[690px]:mb-5 max-[690px]:mt-[15px] max-[690px]:max-w-[440px]"
      >
        Покупатель увидел ткань на выставке. Через неделю взял образец в руки и вспомнил, у кого его заказать. С этой задачи мы начали работу над фирменным стилем.
      </p>
      <a
        class="inline-flex items-center gap-[19px] border-b border-[#a9bede] pb-[6px] text-[14px] font-[570] text-white hover:border-white"
        href="#idea"
      >Посмотреть концепцию</a>
    </div>
  </Wrap>
</template>
