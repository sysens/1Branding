<script setup lang="ts">
import { galleryThumbnail, type GalleryItem } from "../../data/gallery";

defineProps<{ item: GalleryItem }>();
defineEmits<{ open: [] }>();

const button = ref<HTMLButtonElement>();
defineExpose({ focus: () => button.value?.focus({ preventScroll: true }) });
</script>

<template>
  <!-- The picture is 452px tall at every width, as on the original page. -->
  <button ref="button" type="button" class="group min-w-0 p-0 text-left" @click="$emit('open')">
    <span class="block overflow-hidden">
      <img
        :src="galleryThumbnail(item)"
        :alt="item.alt"
        loading="lazy"
        width="640"
        height="452"
        class="h-[452px] w-full bg-[#edf1f5] object-cover transition-transform duration-[220ms] group-hover:scale-[1.035]"
      >
    </span>
    <span class="mt-[10px] block text-[17px] font-[550] leading-[1.3] tracking-[-.024em] max-[900px]:text-[15px]">{{ item.caption }}</span>
    <span class="mt-[3px] block text-[13px] leading-[1.4] text-ertex-muted max-[690px]:text-[12px]">{{ item.category }}</span>
  </button>
</template>
