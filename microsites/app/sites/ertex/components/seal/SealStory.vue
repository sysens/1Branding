<script setup lang="ts">
import { media } from "../../media";
import SectionHeading from "../ui/SectionHeading.vue";
import Wrap from "../ui/Wrap.vue";
</script>

<template>
  <section class="bg-[#09111b] text-[#f4f7fb]" aria-labelledby="seal-title">
    <Wrap class="grid grid-cols-[1fr_1.7fr] items-center gap-[clamp(26px,6cqi,96px)] py-[clamp(40px,5cqi,84px)] max-[690px]:grid-cols-1 max-[690px]:gap-[27px] max-[690px]:py-[43px]">
      <div>
        <SectionHeading eyebrow="Деталь упаковки" title-id="seal-title" tone="seal" title-class="mb-[21px] max-[690px]:text-[44px]">
          Печать <br class="max-[690px]:hidden">на сгибе
        </SectionHeading>
        <p class="max-w-[29em] text-[length:clamp(15px,1.15cqi,19px)] leading-[1.55] text-[#cfdaeb]">
          Пломба огибает край коробки. Сверху виден логотип, на торце&nbsp;— крупный «x». Поэтому комплект образцов легко узнать и на столе у покупателя, и на полке в шоуруме.
        </p>
      </div>
      <figure>
        <img
          :src="media('proposal/seal.webp')"
          alt="Кобальтовый логотип ERTEX Group на тёмной пломбе, переходящей с крышки на торец крафтовой коробки"
          loading="lazy"
          width="1450"
          height="967"
          class="h-auto w-full"
        >
      </figure>
    </Wrap>
  </section>
</template>
