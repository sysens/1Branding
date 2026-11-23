<script setup lang="ts">
import { media } from "../../media";

// The pencil sketch of the mark; a click opens it full size.
defineEmits<{ open: [] }>();
</script>

<template>
  <figure>
    <button
      type="button"
      class="relative block w-full overflow-hidden border border-ertex-rule bg-white p-0 text-left"
      aria-label="Рассмотреть эскиз логотипа"
      @click="$emit('open')"
    >
      <img
        :src="media('sketch.webp')"
        loading="lazy"
        alt="Карандашный эскиз на бумаге. Тканые ленты, построение буквы x и полный логотип ERTEX Group."
        class="aspect-[1.5] h-auto w-full object-cover"
      >
      <span
        class="absolute bottom-3 right-3 grid h-[33px] w-[33px] place-items-center rounded-full border border-[#c9d0d7] bg-[#fffe] text-[22px] text-[#0c1723]"
        aria-hidden="true"
      >⤢</span>
    </button>
    <figcaption class="mt-[11px] flex justify-between gap-3 text-[13px] text-ertex-ink max-[690px]:text-[12px]">
      Эскиз логотипа <span class="text-ertex-muted">Поиск формы</span>
    </figcaption>
  </figure>
</template>
