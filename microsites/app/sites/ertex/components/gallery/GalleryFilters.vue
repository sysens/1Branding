<script setup lang="ts">
import { GALLERY_CATEGORIES, type GalleryCategory } from "../../data/gallery";

const category = defineModel<GalleryCategory>({ required: true });
</script>

<template>
  <div
    class="mb-[23px] mt-[34px] flex flex-wrap gap-2 max-[690px]:mb-[17px] max-[690px]:mt-[22px] max-[690px]:gap-[6px]"
    aria-label="Фильтры по носителям"
  >
    <button
      v-for="name in GALLERY_CATEGORIES"
      :key="name"
      type="button"
      :aria-pressed="name === category"
      class="rounded-[30px] border px-[15px] py-2 text-[14px] max-[690px]:px-[10px] max-[690px]:py-[6px] max-[690px]:text-[13px]"
      :class="name === category ? 'border-ertex-navy bg-ertex-navy text-white' : 'border-ertex-rule bg-white hover:border-ertex-navy'"
      @click="category = name"
    >
      {{ name }}
    </button>
  </div>
</template>
