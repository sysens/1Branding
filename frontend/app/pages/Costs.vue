<script setup lang="ts">
import Warning from "~/components/Costs/Warning.vue";
import { computed } from "vue";

const { t } = useI18n();

const cmsSeo = await useCmsSeo("pricePage");
const localePath = useLocalePath();
usePageSeo({
  title: computed(() => cmsSeo.title.value || t("seo.price.title")),
  description: computed(() => cmsSeo.description.value || t("seo.price.description")),
  breadcrumbs: computed(() => [{ name: t("nav.prices"), path: localePath("/Costs") }]),
});

</script>

<template>
  <div class="relative min-h-screen bg-black overflow-hidden">

    <div class="edge-gradient edge-gradient-left edge-gradient-strong"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-strong"></div>

    <div class="relative z-10">
      <div class="vg md:pt-[60px] pt-[30px]">

        <h1 class="sr-only">{{ $t("seo.price.h1") }}</h1>

        <div class="mx-auto max-w-[1760px] touch-pan-y">
          <CostsSlider />
        </div>
      </div>

      <div class="mx-auto max-w-[1660px]">
        <Warning />
      </div>

    </div>
  </div>
</template>
