<script setup lang="ts">
import { media } from "../../media";

// The story itself, drawn at 9:16. Sizes are in cqw, so it scales with the phone.
</script>

<template>
  <article
    class="relative isolate aspect-[9/16] overflow-hidden rounded-[27px] bg-[#002863] [container-type:inline-size]"
    aria-label="Демонстрация Story ERTEX: Ваша идея начинается с ткани. Пример кнопки «Выбрать образцы»"
  >
    <div class="absolute left-[6%] right-[6%] top-[3%] z-[5] flex gap-1" aria-hidden="true">
      <i v-for="bar in 3" :key="bar" class="h-[2px] flex-1 rounded-[2px]" :class="bar === 1 ? 'bg-white' : 'bg-[#ffffff50]'" />
    </div>

    <div class="absolute left-[6%] right-[6%] top-[5%] z-[5] flex items-center gap-[7px] text-[length:3cqw] font-semibold">
      <span class="grid h-[8cqw] w-[8cqw] place-items-center rounded-full bg-[#004dda]" aria-hidden="true">
        <img :src="media('x.png')" alt="" class="w-[4.8cqw] brightness-0 invert">
      </span>
      <span>ertex.group <small class="mt-[2px] block text-[length:2cqw] font-normal text-[#b6c6dd]">Ткани для ваших идей</small></span>
      <b class="ml-auto text-[length:4cqw] tracking-[1px]" aria-hidden="true">•••</b>
    </div>

    <img
      :src="media('gallery/14.webp')"
      alt="Фирменная коробка ERTEX Group с тремя образцами трикотажа"
      loading="lazy"
      width="1440"
      height="1019"
      class="absolute left-0 top-[26%] z-0 h-[54%] w-full object-cover object-[52%_50%]"
    >
    <div
      class="absolute inset-0 z-[1] bg-[linear-gradient(180deg,#002863_8%,#002863e6_18%,#00286340_39%,transparent_52%,#061b3a85_72%,#061b3a_85%)]"
      aria-hidden="true"
    />

    <div class="absolute left-[8%] right-[8%] top-[16%] z-[2]">
      <span class="text-[length:2.3cqw] uppercase tracking-[.1em]">От идеи к материалу</span>
      <h4 class="mt-[6%] text-[length:11cqw] font-[520] leading-[1.02] tracking-[-.05em]">
        Ваша идея<br>начинается<br><em class="not-italic text-[#83acff]">с ткани.</em>
      </h4>
    </div>

    <div class="absolute bottom-[7%] left-[8%] right-[8%] z-[3]">
      <p class="text-[length:3.2cqw] leading-[1.45] text-[#bccce2]">Найдите своё сочетание<br>цвета и фактуры.</p>
      <span class="mt-[7%] flex items-center justify-between rounded-[99px] bg-white px-[6%] py-[5%] text-[length:3.7cqw] font-semibold text-[#002863] shadow-[0_4px_15px_#0002]">
        Выбрать образцы <span class="text-[length:5.5cqw] font-normal" aria-hidden="true">↗</span>
      </span>
      <img
        :src="media('logo-dark.png')"
        alt="ERTEX Group"
        loading="lazy"
        width="1503"
        height="476"
        class="mx-auto mt-[8%] block aspect-[1503/476] h-auto w-[32%] object-contain"
      >
    </div>
  </article>
</template>
