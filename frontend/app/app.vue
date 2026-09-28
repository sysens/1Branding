<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import GradualBlur from "./components/GradualBlur.vue";
import BrandCursor from "./components/ui/BrandCursor.vue";
import { organizationGraph, withSiteName, type SeoLocale } from "~/utils/seo";

const route = useRoute();
const { locale } = useI18n();
const runtimeConfig = useRuntimeConfig();
const siteOrigin = useSiteOrigin();
const seoLocale = computed<SeoLocale>(() => (locale.value === "en" ? "en" : "ru"));

const listFromEnv = (value: unknown) => String(value || "")
  .split(",")
  .map((item) => item.trim())
  .filter((item) => /^https?:\/\//i.test(item));

// Organization + WebSite graph on every page; page-level JSON-LD references it by @id.
const organizationJsonLd = computed(() => JSON.stringify({
  "@context": "https://schema.org",
  "@graph": organizationGraph(siteOrigin, seoLocale.value, {
    telephone: String(runtimeConfig.public.orgPhone || "").trim(),
    email: String(runtimeConfig.public.orgEmail || "").trim(),
    sameAs: listFromEnv(runtimeConfig.public.orgSameAs),
  }),
}).replace(/</g, "\\u003c"));

useHead({
  titleTemplate: (titleChunk) => withSiteName(titleChunk || ""),
  htmlAttrs: { lang: () => seoLocale.value, dir: "ltr" },
  script: [{ type: "application/ld+json", key: "org-jsonld", innerHTML: organizationJsonLd }],
});
const showPageBlur = computed(() => !/^\/(?:en|ru)?\/?$/.test(route.path) && !route.path.endsWith("/Projects"));
const showBottomBlur = computed(() =>
  showPageBlur.value && !route.path.replace(/\/$/, "").endsWith("/ContactPage")
);

// Bottom blur must not sit over the footer once the page is scrolled to its end
const isPageEnd = ref(false);

const updateIsPageEnd = () => {
  const doc = document.documentElement;
  const maxScroll = doc.scrollHeight - window.innerHeight;
  isPageEnd.value = maxScroll <= 8 || window.scrollY >= maxScroll - 8;
};

onMounted(() => {
  window.addEventListener("scroll", updateIsPageEnd, { passive: true });
  window.addEventListener("resize", updateIsPageEnd, { passive: true });
  updateIsPageEnd();
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateIsPageEnd);
  window.removeEventListener("resize", updateIsPageEnd);
});

watch(
  () => route.path,
  async () => {
    await nextTick();
    requestAnimationFrame(updateIsPageEnd);
  }
);
</script>

<template>
  <div class="app-shell min-h-screen overscroll-y-none">
    <ClientOnly><BrandCursor /></ClientOnly>
    <NuxtLoadingIndicator color="#03cb00" :height="4" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <GradualBlur
      v-if="showBottomBlur"
      target="page"
      position="bottom"
      height="6rem"
      :strength="2"
      :divCount="5"
      curve="bezier"
      :exponential="true"
      :opacity="1"
      :z-index="700"
      :style="{ opacity: isPageEnd ? 0 : 1 }"
    />

    <GradualBlur
      v-if="showPageBlur"
      target="page"
      position="top"
      height="6rem"
      :strength="2"
      :divCount="5"
      curve="bezier"
      :exponential="true"
      :opacity="1"
      :z-index="700"
    />
  </div>
</template>

<style scoped>
.app-shell {
  overflow-x: clip;
}
</style>
