<script setup lang="ts">
import { media } from "../../media";
import Wrap from "../ui/Wrap.vue";
</script>

<template>
  <Wrap
    class="relative flex min-h-[116px] items-center gap-[clamp(18px,3.5cqi,66px)] py-[25px] before:absolute before:inset-x-[--gap] before:top-0 before:border-t before:border-ertex-rule max-[690px]:min-h-[92px] max-[690px]:gap-5 max-[400px]:gap-[14px]"
  >
    <a href="#top" aria-label="ERTEX Group, в начало">
      <img :src="media('logo-light.png')" alt="ERTEX Group" class="w-[105px] max-[690px]:w-[72px]">
    </a>
    <img :src="media('onebranding-credit.svg')" alt="branded by OneBranding" class="block h-auto w-[178px] max-[690px]:w-[130px] max-[400px]:w-[113px]">
    <a class="ml-auto text-[13px] text-ertex-muted max-[690px]:text-[12px]" href="#top">Наверх</a>
  </Wrap>
</template>
