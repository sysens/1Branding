<script setup lang="ts">
import { computed, ref } from "vue";
import { useSectionTitleReveal } from "~/composables/useSectionTitleReveal";
import LeadingPage from "~/components/home/leadingPage.vue";
import HeroClientsReveal from "~/components/home/HeroClientsReveal.vue";
import InfoOnPicture from "~/components/home/InfoOnPicture.vue";
import { resolveStrapiMediaUrl } from "~/utils/strapiMedia";
import { selectCollageSource } from "~/utils/collageMedia";
import { cmsSeoText } from "~/utils/seo";
import type { LandingMedia } from "~/types/landingPayload";

// Sections below the first screen hydrate (and download their JS) only when
// they come within 600px of the viewport; their server HTML is visible from the
// start. Hydrating the whole page up front was one ~340ms main-thread task.
const LAZY_HYDRATION = { rootMargin: "600px 0px" };

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = String(runtimeConfig.public.graphqlUrl || "");
const { t, locale } = useI18n();
const route = useRoute();
const { landingPage, seo: landingSeo, footerSocialMedia } = await useLandingPayload();
useHomePageReady();
const pageRoot = ref<HTMLElement | null>(null);
useSectionTitleReveal(pageRoot);

const brandCollageRows = computed(() => {
  const collage = landingPage.value?.brandCollage;
  if (!collage) return [];
  const urls = (items?: LandingMedia[] | null) => (items ?? [])
    .map(item => resolveStrapiMediaUrl(selectCollageSource(item), GRAPHQL_URL))
    .filter((url): url is string => Boolean(url));
  return [urls(collage.row1), urls(collage.row2), urls(collage.row3)];
});
const partnerLogos = computed(() => (landingPage.value?.section3?.partnersLogo ?? [])
  .map(item => resolveStrapiMediaUrl(item.url ?? null, GRAPHQL_URL))
  .filter((url): url is string => Boolean(url)));

// CMS copy wins once an editor fills it in; scaffolding placeholders fall back to i18n.
const seoTitle = computed(() => cmsSeoText(landingSeo.value?.title, 15) || t("seo.home.title"));
const seoDesc = computed(() => cmsSeoText(landingSeo.value?.description, 50) || t("seo.home.description"));
const origin = useSiteOrigin();
usePageSeo({
  title: seoTitle,
  description: seoDesc,
  structuredData: computed(() => ({
    "@type": "WebPage",
    "@id": `${origin}${route.path}#webpage`,
    url: `${origin}${route.path}`,
    name: seoTitle.value,
    description: seoDesc.value,
    inLanguage: locale.value === "en" ? "en" : "ru",
    isPartOf: { "@id": `${origin}/#website` },
    about: { "@id": `${origin}/#organization` },
    primaryImageOfPage: `${origin}/og-image.jpg`,
  })),
});
</script>

<template>
  <div ref="pageRoot" class="home-page-root relative min-h-screen bg-black">
    <div class="home-page-frame">
      <div class="home-page-content relative">
        <HeroClientsReveal>
          <template #hero>
            <div class="edge-gradient edge-gradient-left edge-gradient-soft" aria-hidden="true" />
            <div class="edge-gradient edge-gradient-right edge-gradient-soft" aria-hidden="true" />
            <div class="pointer-events-none absolute inset-0 top-[-250px] z-0">
              <LogoMarquee direction="vertical" :rows="15" :duration-seconds="120" :as-background="true" />
            </div>
            <div class="relative">
              <div class="pt-[30px] md:pt-10"><Header /></div>
              <section class="leading-target home-leading">
                <LeadingPage :landing-page="landingPage" />
              </section>
            </div>
          </template>
          <div>
            <HomeNumberText :section="landingPage?.section2" :partner-logos="partnerLogos" :collage-rows="brandCollageRows" />
          </div>
        </HeroClientsReveal>
        <div class="home-info-picture"><InfoOnPicture :section="landingPage?.section10" /></div>
        <LazyHomeDigitalExperienceSection :hydrate-on-visible="LAZY_HYDRATION" />
        <LazyHomeProjectMarqueeSection :hydrate-on-visible="LAZY_HYDRATION" />
        <LazyHomeWorldSection :hydrate-on-visible="LAZY_HYDRATION" />
        <div class="home-dark-sections">
          <div class="edge-gradient edge-gradient-left edge-gradient-soft" aria-hidden="true" />
          <div class="edge-gradient edge-gradient-right edge-gradient-soft" aria-hidden="true" />
          <div class="home-first-glance"><LazyHomeFirstGlanceSections :hydrate-on-visible="LAZY_HYDRATION" /></div>
          <LazyHomeAwardsSection :hydrate-on-visible="LAZY_HYDRATION" :logos="partnerLogos" />
          <LazyHomeBrandStoriesSection :hydrate-on-visible="LAZY_HYDRATION" />
          <LazyHomeAirwaysSceneSection :hydrate-on-visible="LAZY_HYDRATION" />
          <LazyFooter :hydrate-on-visible="LAZY_HYDRATION" use-prefetched-data :landing-page="landingPage" :social-media="footerSocialMedia" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../assets/css/home-page.css" />
