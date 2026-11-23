<script setup lang="ts">
import StoryScreen from "./StoryScreen.vue";
</script>

<template>
  <figure class="relative z-[3] w-full max-w-[296px] justify-self-center [perspective:1300px] max-[1000px]:max-w-[265px] max-[760px]:max-w-[280px] max-[390px]:max-w-[248px]">
    <div class="relative rotate-[4deg] rounded-[37px] bg-[#07101c] p-[10px] shadow-[inset_0_0_0_1px_#7890ad80,inset_0_0_0_3px_#202d42,17px_24px_40px_#0005]">
      <StoryScreen />
      <span class="absolute bottom-[19px] left-[36%] right-[36%] h-[3px] rounded-[3px] bg-white" aria-hidden="true" />
    </div>
    <figcaption class="mt-[26px] text-center text-[9px] leading-normal text-[#758caa]">Пример Story. Кнопка показана как элемент макета.</figcaption>
  </figure>
</template>
