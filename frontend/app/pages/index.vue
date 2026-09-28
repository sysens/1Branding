<script setup lang="ts">
import { computed, ref } from "vue";
import { useSectionTitleReveal } from "~/composables/useSectionTitleReveal";
import Spinner from "~/components/Spinner.vue";
import LeadingPage from "~/components/home/leadingPage.vue";
import HeroClientsReveal from "~/components/home/HeroClientsReveal.vue";
import FirstGlanceSections from "~/components/home/FirstGlanceSections.vue";
import InfoOnPicture from "~/components/home/InfoOnPicture.vue";
import DigitalExperienceSection from "~/components/home/DigitalExperienceSection.vue";
import ProjectMarqueeSection from "~/components/home/ProjectMarqueeSection.vue";
import WorldSection from "~/components/home/WorldSection.vue";
import AwardsSection from "~/components/home/AwardsSection.vue";
import BrandStoriesSection from "~/components/home/BrandStoriesSection.vue";
import AirwaysSceneSection from "~/components/home/AirwaysSceneSection.vue";
import { resolveStrapiMediaUrl } from "~/utils/strapiMedia";
import { selectCollageSource } from "~/utils/collageMedia";
import { cmsSeoText } from "~/utils/seo";
import type { LandingMedia } from "~/types/landingPayload";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = String(runtimeConfig.public.graphqlUrl || "");
const { t, locale } = useI18n();
const route = useRoute();
const { landingPage, seo: landingSeo, footerSocialMedia } = await useLandingPayload();
const { loading } = useHomePageReady();
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
    <Spinner v-if="loading" :size="542" />
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
        <DigitalExperienceSection />
        <ProjectMarqueeSection />
        <WorldSection />
        <div class="home-dark-sections">
          <div class="edge-gradient edge-gradient-left edge-gradient-soft" aria-hidden="true" />
          <div class="edge-gradient edge-gradient-right edge-gradient-soft" aria-hidden="true" />
          <div class="home-first-glance"><FirstGlanceSections /></div>
          <AwardsSection :logos="partnerLogos" />
          <BrandStoriesSection />
          <AirwaysSceneSection />
          <Footer use-prefetched-data :landing-page="landingPage" :social-media="footerSocialMedia" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../assets/css/home-page.css" />
