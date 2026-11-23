<script setup lang="ts">
import { media } from "../../media";

// The X as an app/profile icon, with what it is for.
</script>

<template>
  <div class="mt-[38px] flex items-center gap-5">
    <span
      class="relative grid h-[62px] w-[62px] flex-none place-items-center rounded-[17px] bg-[radial-gradient(circle_at_50%_130%,#4a80ff,#004dda_65%,#023d9b)] shadow-[inset_0_1px_0_#ffffff40,inset_0_-2px_3px_#ffffff40,0_7px_15px_#0004]"
      aria-hidden="true"
    >
      <img :src="media('x.png')" alt="" class="h-[31px] w-[34px] object-contain brightness-0 invert">
    </span>
    <div>
      <strong class="mb-[7px] block text-[12px] font-medium">Узнаваемость в малом</strong>
      <span class="block text-[10px] leading-normal text-[#758ba9]">Иконка профиля и обложки актуального</span>
    </div>
  </div>
</template>
