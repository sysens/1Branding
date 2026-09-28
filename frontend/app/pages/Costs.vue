<script setup lang="ts">
import Spinner from "~/components/Spinner.vue";
import Warning from "~/components/Costs/Warning.vue";
import { ref, computed, onMounted, nextTick } from "vue";

const { t } = useI18n();

const loading = ref(true);

const cmsSeo = await useCmsSeo("pricePage");
const localePath = useLocalePath();
usePageSeo({
  title: computed(() => cmsSeo.title.value || t("seo.price.title")),
  description: computed(() => cmsSeo.description.value || t("seo.price.description")),
  breadcrumbs: computed(() => [{ name: t("nav.prices"), path: localePath("/Costs") }]),
});

onMounted(async () => {
  await nextTick();
  // Reveal once web fonts are ready (the slider measures text), capped so the
  // loader never holds already-rendered content back (it used to wait 1.5s).
  const fontsReady = "fonts" in document ? document.fonts.ready.catch(() => null) : Promise.resolve(null);
  await Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 400))]);
  loading.value = false;
});
</script>

<template>
  <div class="relative min-h-screen bg-black overflow-hidden">
    <Spinner v-if="loading" :size="542" />

    <div class="edge-gradient edge-gradient-left edge-gradient-strong"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-strong"></div>

    <div class="relative z-10">
      <div class="vg md:pt-[60px] pt-[30px]">
        <Header />

        <h1 class="sr-only">{{ $t("seo.price.h1") }}</h1>

        <div class="mx-auto max-w-[1760px] touch-pan-y">
          <CostsSlider />
        </div>
      </div>

      <div class="mx-auto max-w-[1660px]">
        <Warning />
      </div>

      <Footer />
    </div>
  </div>
</template>
