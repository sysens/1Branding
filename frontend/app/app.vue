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
import PageLoader from "./components/PageLoader.vue";
import { organizationGraph, withSiteName } from "~/utils/seo";
import { COMPANY, companyProfiles } from "~/utils/company";
import { LANGUAGE_TAGS, toSiteLocale } from "~/utils/locales";
import { SERVICE_PAGES, servicePath } from "~/utils/servicePages";

const route = useRoute();
const { locale, t } = useI18n();
const runtimeConfig = useRuntimeConfig();
const siteOrigin = useSiteOrigin();
const siteLocale = computed(() => toSiteLocale(locale.value));
// Shared with the footer (same query key), so it costs no extra request.
const { socialMedia } = await useFooterSocials();

const listFromEnv = (value: unknown) => String(value || "")
  .split(",")
  .map((item) => item.trim())
  .filter((item) => /^https?:\/\//i.test(item));

// Organization + WebSite graph on every page; page-level JSON-LD references it by @id.
const organizationJsonLd = computed(() => JSON.stringify({
  "@context": "https://schema.org",
  "@graph": organizationGraph(siteOrigin, siteLocale.value, {
    telephone: String(runtimeConfig.public.orgPhone || "").trim() || COMPANY.phone.e164,
    email: String(runtimeConfig.public.orgEmail || "").trim(),
    sameAs: [...new Set([
      ...companyProfiles(socialMedia.value).map((profile) => profile.url),
      ...listFromEnv(runtimeConfig.public.orgSameAs),
    ])],
    services: SERVICE_PAGES.map((page) => ({
      name: t(`servicePages.${page.key}.name`),
      url: `${siteOrigin}${servicePath(page.key, siteLocale.value)}`,
    })),
  }),
}).replace(/</g, "\\u003c"));

// Ownership checks for Search Console, Yandex Webmaster and Bing Webmaster,
// set from the environment once the owner has the codes.
const verificationMeta = [
  ["google-site-verification", runtimeConfig.public.googleSiteVerification],
  ["yandex-verification", runtimeConfig.public.yandexVerification],
  ["msvalidate.01", runtimeConfig.public.bingSiteVerification],
]
  .map(([name, content]) => ({ name: String(name), content: String(content || "").trim() }))
  .filter((meta) => meta.content);

useHead({
  titleTemplate: (titleChunk) => withSiteName(titleChunk || ""),
  htmlAttrs: { lang: () => LANGUAGE_TAGS[siteLocale.value], dir: "ltr" },
});
// Crawlers read these from the server HTML; no need to rebuild them while hydrating.
if (import.meta.server) {
  useServerHead({
    meta: verificationMeta,
    script: [{ type: "application/ld+json", key: "org-jsonld", innerHTML: organizationJsonLd }],
  });
}
// A page without the site header sets definePageMeta({ header: false }).
const showHeader = computed(() => route.meta.header !== false);
const showPageBlur = computed(() => !/^\/(?:en|ru|uz)?\/?$/.test(route.path) && !/\/(?:projects|showcase)\/?$/.test(route.path));
const showBottomBlur = computed(() =>
  showPageBlur.value && !route.path.replace(/\/$/, "").endsWith("/contact")
);

// Each blur layer is a backdrop-filter over the page, which makes scrolling
// costly on phones: touch screens get two layers instead of five.
const blurLayers = ref(5);

// Bottom blur must not sit over the footer once the page is scrolled to its end
const isPageEnd = ref(false);

const updateIsPageEnd = () => {
  const doc = document.documentElement;
  const maxScroll = doc.scrollHeight - window.innerHeight;
  isPageEnd.value = maxScroll <= 8 || window.scrollY >= maxScroll - 8;
};

onMounted(() => {
  if (matchMedia("(pointer: coarse)").matches) blurLayers.value = 2;
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
    <a href="#main-content" class="skip-link">{{ $t("common.skipToContent") }}</a>
    <PageLoader />
    <ClientOnly><BrandCursor /></ClientOnly>

    <!-- What stays on screen while the page scrolls under it (the header and
         the blur at the screen's top and bottom edges) hangs from zero-height
         lines that stick to those edges, in the page's own flow: the top ones
         before <main>, the bottom one after it. Sticky, not fixed: iOS 26
         Safari lets fixed layers drift away as its toolbar collapses on
         scroll (see Header.vue). -->
    <Header v-if="showHeader" />
    <div v-if="showPageBlur" class="screen-edge screen-edge--top" aria-hidden="true">
      <GradualBlur
        target="parent"
        position="top"
        height="6rem"
        :strength="2"
        :div-count="blurLayers"
        curve="bezier"
        :exponential="true"
        :opacity="1"
        :z-index="1"
      />
    </div>

    <main id="main-content">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </main>

    <div v-if="showBottomBlur" class="screen-edge screen-edge--bottom" aria-hidden="true">
      <GradualBlur
        target="parent"
        position="bottom"
        height="6rem"
        :strength="2"
        :div-count="blurLayers"
        curve="bezier"
        :exponential="true"
        :opacity="1"
        :z-index="1"
        :style="{ opacity: isPageEnd ? 0 : 1 }"
      />
    </div>
  </div>
</template>

<style scoped>
/* overflow-x: clip, not hidden: hidden would make the shell a scroller, and
   the sticky lines below (and every pinned section) would stick to it
   instead of the screen. */
.app-shell {
  overflow-x: clip;
}

/* A zero-height line stuck to the screen's top or bottom edge; the blur is
   laid out from it (6rem down from the top one, 6rem up from the bottom
   one). 800: over the page, under the header. */
.screen-edge {
  position: sticky;
  z-index: 800;
  height: 0;
  pointer-events: none;
}

.screen-edge--top {
  top: 0;
}

.screen-edge--bottom {
  bottom: 0;
}
</style>
