<script setup lang="ts">
import { galleryImage, type GalleryItem } from "../../data/gallery";
import MediaDialog from "../ui/MediaDialog.vue";

// The open picture with "Назад"/"Далее" (and the arrow keys), looping
// through the filtered set. `index` is null while closed.
const props = defineProps<{ items: GalleryItem[] }>();
const index = defineModel<number | null>("index", { required: true });

const item = computed(() => (index.value === null ? undefined : props.items[index.value]));
const open = computed({
  get: () => index.value !== null,
  set: (value) => { if (!value) index.value = null; },
});

const previous = ref<HTMLButtonElement>();
const next = ref<HTMLButtonElement>();

function step(by: 1 | -1, focus = false) {
  if (index.value === null) return;
  const count = props.items.length;
  index.value = (index.value + by + count) % count;
  if (focus) (by === 1 ? next : previous).value?.focus({ preventScroll: true });
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  step(event.key === "ArrowRight" ? 1 : -1, true);
}
</script>

<template>
  <MediaDialog v-model:open="open" :title="item?.caption ?? ''" @keydown="onKeydown">
    <template v-if="item">
      <img :src="galleryImage(item)" :alt="item.alt" class="block max-h-[67dvh] w-full bg-[#061326] object-contain">
      <p class="px-[18px] py-[14px] text-[15px] leading-normal text-[#d7e5f4] max-[690px]:text-[14px]">{{ item.alt }}</p>
    </template>
    <template #controls>
      <div class="flex items-center justify-between gap-[10px] px-[15px] pb-3 pt-2 text-[14px]">
        <button ref="previous" type="button" class="rounded-[23px] border border-[#698099] px-3 py-[7px] text-white" @click="step(-1, true)">Назад</button>
        <span class="text-[#c7d6e9]">{{ (index ?? 0) + 1 }} из {{ items.length }}</span>
        <button ref="next" type="button" class="rounded-[23px] border border-[#698099] px-3 py-[7px] text-white" @click="step(1, true)">Далее</button>
      </div>
    </template>
  </MediaDialog>
</template>
