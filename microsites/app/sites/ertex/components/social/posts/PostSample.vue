<script setup lang="ts">
import { media } from "../../../media";
import PostCard from "./PostCard.vue";
import PostLabel from "./PostLabel.vue";
import PostLogo from "./PostLogo.vue";
import PostTitle from "./PostTitle.vue";
</script>

<template>
  <PostCard aria-label="Макет поста: Начните с образца" class="bg-[#f4f4ef] text-[#002863]">
    <PostLogo light />
    <PostLabel class="mt-[13%] text-[#687c94]">Ваш следующий шаг</PostLabel>
    <PostTitle class="mt-[4%]">Начните<br>с образца.</PostTitle>
    <p class="relative z-[2] mt-[5%] text-[length:3.2cqw] leading-[1.45] text-[#687387]">Оцените цвет, фактуру<br>и ощущение материала.</p>
    <div class="absolute bottom-[17%] left-[8%] right-[8%] h-[28%] -rotate-3 overflow-hidden shadow-[0_10px_15px_#05152a15]">
      <img
        :src="media('proposal/swatchbook.webp')"
        alt="Открытый каталог ERTEX Group с образцами трикотажных тканей"
        loading="lazy"
        width="1440"
        height="1019"
        class="h-full w-full object-cover object-[70%_48%]"
      >
    </div>
    <span class="absolute bottom-[6%] left-[8%] right-[8%] flex items-center justify-between border-t border-[#00286330] pt-[4%] text-[length:3.2cqw] font-semibold">
      Подобрать образцы <span class="text-[length:6cqw] font-normal" aria-hidden="true">↗</span>
    </span>
  </PostCard>
</template>
