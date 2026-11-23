<script setup lang="ts">
import FeedPiece from "./FeedPiece.vue";
import PostCollection from "./posts/PostCollection.vue";
import PostSample from "./posts/PostSample.vue";
import PostTouch from "./posts/PostTouch.vue";
</script>

<template>
  <div
    class="mx-auto max-w-[1440px] p-[clamp(20px,3.7cqi,58px)] text-white [background:radial-gradient(ellipse_at_25%_-20%,#173b72_0,transparent_55%),#08162b] max-[760px]:p-6 max-[390px]:p-[18px]"
  >
    <div class="flex justify-between gap-4 pb-7 text-[10px] uppercase tracking-[.13em] text-[#9cacbf] max-[760px]:pb-5 max-[760px]:text-[9px] max-[390px]:tracking-[.07em]">
      <span>Лента / три направления</span>
      <span>Публикации 4:5</span>
    </div>

    <div class="grid grid-cols-3 gap-[clamp(16px,2cqi,32px)] max-[760px]:mx-auto max-[760px]:max-w-[460px] max-[760px]:grid-cols-1 max-[760px]:gap-8">
      <FeedPiece title="Коллекция" note="Продукт и настроение"><PostCollection /></FeedPiece>
      <FeedPiece title="Деталь" note="Фактура крупным планом"><PostTouch /></FeedPiece>
      <FeedPiece title="Приглашение" note="От интереса к выбору"><PostSample /></FeedPiece>
    </div>

    <div class="mt-[37px] flex items-center gap-[9px] border-t border-[#ffffff20] pt-[22px] text-[10px] leading-normal text-[#adbacb] max-[760px]:mt-[30px] max-[760px]:flex-wrap">
      <span class="h-[5px] w-[5px] flex-none rounded-full bg-[#628dff]" aria-hidden="true" />
      Серия о выборе ткани
      <span class="ml-auto text-[9px] text-[#697e9b] max-[760px]:ml-[14px] max-[760px]:w-full">Для презентации</span>
    </div>
  </div>
</template>
