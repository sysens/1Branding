<script setup lang="ts">
import { toSiteLocale } from "~/utils/locales";
import { computed, ref } from "vue";
import { useAmbientSurfaces } from "~/composables/useAmbientSurfaces";
import LeadingPage from "~/components/home/LeadingPage.vue";
import HeroClientsReveal from "~/components/home/HeroClientsReveal.vue";
import InfoOnPicture from "~/components/home/InfoOnPicture.vue";
import { selectCollageSource } from "~/utils/collageMedia";
import { cmsSeoText } from "~/utils/seo";
import type { LandingMedia } from "~/types/landingPayload";

// Sections below the first screen hydrate (and download their JS) only when
// they come within 600px of the viewport; their server HTML is visible from the
// start. Hydrating the whole page up front was one ~340ms main-thread task.
const LAZY_HYDRATION = { rootMargin: "600px 0px" };

// PROTOTYPE "2500 → ONE" hero (components/home/HeroOneAssembly.vue). Set to
// false to switch it off; ?hero=classic shows the classic hero for comparison.
const HERO_ONE_ENABLED = true;

const cmsMedia = useCmsMedia();
const { t, locale } = useI18n();
const route = useRoute();
const { landingPage, seo: landingSeo } = await useLandingPayload();
useHomePageReady();
const pageRoot = ref<HTMLElement | null>(null);
useAmbientSurfaces(pageRoot);
const heroOne = computed(() => HERO_ONE_ENABLED && route.query.hero !== "classic");
// The wall dims only once the mark has drawn its first frame (no WebGL: no dim).
const heroOneReady = ref(false);

const brandCollageRows = computed(() => {
  const collage = landingPage.value?.brandCollage;
  if (!collage) return [];
  const urls = (items?: LandingMedia[] | null) => (items ?? [])
    .map(item => cmsMedia(selectCollageSource(item)))
    .filter((url): url is string => Boolean(url));
  return [urls(collage.row1), urls(collage.row2), urls(collage.row3)];
});
const partnerLogos = computed(() => (landingPage.value?.section3?.partnersLogo ?? [])
  .map(item => cmsMedia(item.url ?? null))
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
    inLanguage: toSiteLocale(locale.value),
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
            <div class="hero-wall pointer-events-none absolute inset-0 top-[-250px] z-0" :class="{ 'hero-wall--dim': heroOne && heroOneReady }">
              <LogoMarquee direction="vertical" :rows="15" :duration-seconds="120" :as-background="true" />
            </div>
            <div class="home-hero-shade" aria-hidden="true" />
            <ClientOnly v-if="heroOne">
              <LazyHomeHeroOneAssembly @ready="heroOneReady = true" />
            </ClientOnly>
            <div class="relative">
              <div class="pt-[1.875rem] md:pt-10" />
              <section class="leading-target home-leading">
                <LeadingPage :landing-page="landingPage" />
              </section>
            </div>
          </template>
          <div>
            <HomeNumberText :partner-logos="partnerLogos" :collage-rows="brandCollageRows" />
          </div>
        </HeroClientsReveal>
        <div class="home-info-picture"><InfoOnPicture :section="landingPage?.section10" /></div>
        <!-- DigitalExperienceSection (MacBook), ProjectMarqueeSection (3D card
             marquee) and FirstGlanceSections (Vivea / Starbucks) were taken off
             the landing; their components stay for other pages. -->
        <LazyHomeProjectSlideWall :hydrate-on-visible="LAZY_HYDRATION" />
        <LazyHomeWorldSection :hydrate-on-visible="LAZY_HYDRATION" />
        <LazyHomeOneSystemStats :hydrate-on-visible="LAZY_HYDRATION" />
        <div class="home-dark-sections">
          <div class="edge-gradient edge-gradient-left edge-gradient-soft" aria-hidden="true" />
          <div class="edge-gradient edge-gradient-right edge-gradient-soft" aria-hidden="true" />
          <LazyHomeAwardsSection :hydrate-on-visible="LAZY_HYDRATION" :numeral="false" :transition="false" />
          <!-- BrandStoriesSection (Apex / Perfect Candy / GreenGo) and the glow
               that led into it were taken off the landing; they stay for other pages. -->
          <LazyHomeAirwaysSceneSection :hydrate-on-visible="LAZY_HYDRATION" />
          <LazyHomePresentationGallery :hydrate-on-visible="LAZY_HYDRATION" />
          <LazyHomeSocialIdentity :hydrate-on-visible="LAZY_HYDRATION" />
          <LazyHomeOnePartnerServices :hydrate-on-visible="LAZY_HYDRATION" />
          <LazyHomeAwardVision :hydrate-on-visible="LAZY_HYDRATION" />
          <LazyHomeBrandCompare :hydrate-on-visible="LAZY_HYDRATION" />
          <LazyHomeAuditStrategy :hydrate-on-visible="LAZY_HYDRATION" />
          <LazyHomeClientsGrid :hydrate-on-visible="LAZY_HYDRATION" />
          <LazyHomeFreshProjects :hydrate-on-visible="LAZY_HYDRATION" />
          <!-- FAQ must hydrate immediately: lazy hydration can reset the open
               item while the visitor is interacting with an answer. -->
          <HomeFaqAccordion />
          <LazyHomeRobotShowcase :hydrate-on-visible="LAZY_HYDRATION" :scene-url="landingPage?.splineRobot?.sceneUrl" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../assets/css/home-page.css" />

<style scoped>
/* PROTOTYPE "2500 → ONE": the logo wall steps back behind the assembled mark. */
.hero-wall {
  transition: filter 1.2s ease;
}
.hero-wall--dim {
  filter: brightness(0.3) saturate(0.7);
}
</style>
