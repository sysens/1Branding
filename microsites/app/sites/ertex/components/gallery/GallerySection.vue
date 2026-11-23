<script setup lang="ts">
import { GALLERY, GALLERY_PAGE_SIZE, type GalleryCategory } from "../../data/gallery";
import SectionHeading from "../ui/SectionHeading.vue";
import Wrap from "../ui/Wrap.vue";
import ApplicationGuides from "./ApplicationGuides.vue";
import GalleryFilters from "./GalleryFilters.vue";
import GalleryLightbox from "./GalleryLightbox.vue";
import GalleryTile from "./GalleryTile.vue";

const category = ref<GalleryCategory>("Все");
const visibleCount = ref(GALLERY_PAGE_SIZE);
const openIndex = ref<number | null>(null);

const filtered = computed(() => (category.value === "Все" ? GALLERY : GALLERY.filter((item) => item.category === category.value)));
const visible = computed(() => filtered.value.slice(0, visibleCount.value));
const remaining = computed(() => filtered.value.length - visible.value.length);

watch(category, () => { visibleCount.value = GALLERY_PAGE_SIZE; });

// "Показать ещё" moves keyboard focus to the first of the new tiles.
const tiles: (InstanceType<typeof GalleryTile> | null)[] = [];
const setTile = (index: number, tile: unknown) => { tiles[index] = tile as InstanceType<typeof GalleryTile> | null; };
async function showMore() {
  const firstNew = visibleCount.value;
  visibleCount.value += GALLERY_PAGE_SIZE;
  await nextTick();
  tiles[firstNew]?.focus();
}
</script>

<template>
  <Wrap
    id="gallery"
    as="section"
    aria-labelledby="gallery-title"
    class="scroll-m-3 border-t border-[#d8dfe7] py-[clamp(64px,7.2cqi,118px)] max-[690px]:py-[53px]"
  >
    <div class="flex items-end justify-between gap-8 max-[690px]:block">
      <SectionHeading eyebrow="Применение" title-id="gallery-title">Стиль в работе</SectionHeading>
      <p class="max-w-[340px] text-[16px] leading-[1.45] text-ertex-muted max-[690px]:mt-[14px]">
        Посмотрите, как меняются масштаб и материал одного знака. Выберите носитель, чтобы рассмотреть детали.
      </p>
    </div>

    <GalleryFilters v-model="category" />

    <div class="grid grid-cols-3 gap-x-[18px] gap-y-[30px] max-[690px]:grid-cols-2 max-[690px]:gap-x-[10px] max-[690px]:gap-y-[22px] max-[370px]:grid-cols-1">
      <GalleryTile
        v-for="(item, index) in visible"
        :key="item.id"
        :ref="(tile) => setTile(index, tile)"
        :item="item"
        @open="openIndex = index"
      />
    </div>
    <p class="sr-only" aria-live="polite">Показано {{ visible.length }} из {{ filtered.length }}</p>

    <button
      v-if="remaining > 0"
      type="button"
      class="mx-auto mt-8 block rounded-[30px] border border-ertex-rule bg-[#f4f6f8] px-[21px] py-[11px] text-[14px] font-[550] hover:border-ertex-navy"
      @click="showMore"
    >
      Показать ещё ({{ Math.min(GALLERY_PAGE_SIZE, remaining) }})
    </button>

    <ApplicationGuides />

    <GalleryLightbox v-model:index="openIndex" :items="filtered" />
  </Wrap>
</template>
