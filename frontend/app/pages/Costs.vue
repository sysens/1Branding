<script setup lang="ts">
import Spinner from "~/components/Spinner.vue";
import Warning from "~/components/Costs/Warning.vue";
import { ref, computed, onMounted, nextTick } from "vue";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const { t } = useI18n();

const loading = ref(true);

type SeoRes = {
  data?: {
    seo?: {
      pricePage?: {
        title?: string | null;
        description?: string | null;
      } | null;
    } | null;
  };
};

const seoQuery = `
  query PriceSeo {
    seo {
      pricePage {
        title
        description
      }
    }
  }
`;

const { data: seoData } = await useFetch<SeoRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: { query: seoQuery },
  server: true,
  key: "seo-price-page",
});

const seo = computed(() => seoData.value?.data?.seo?.pricePage ?? null);

const seoTitle = computed(() => seo.value?.title?.trim() || t("seo.price"));
const seoDescription = computed(() => seo.value?.description?.trim() || "");

const route = useRoute();
const siteUrl = ((runtimeConfig.public.siteUrl as string) || "").replace(/\/$/, "");
const canonical = computed(() => (siteUrl ? siteUrl + route.path : ""));

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogType: "website",
  ogUrl: () => canonical.value || undefined,
  twitterCard: "summary",
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
});

useHead(() => ({
  link: canonical.value ? [{ rel: "canonical", href: canonical.value }] : [],
}));

onMounted(async () => {
  await nextTick();
  setTimeout(() => {
    loading.value = false;
  }, 1500);
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
