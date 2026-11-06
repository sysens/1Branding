<script setup lang="ts">
import { toSiteLocale } from "~/utils/locales";
import { computed, ref } from "vue";
import { useAmbientSurfaces } from "~/composables/useAmbientSurfaces";
import LeadingPage from "~/components/home/LeadingPage.vue";
import HeroClientsReveal from "~/components/home/HeroClientsReveal.vue";
import InfoOnPicture from "~/components/home/InfoOnPicture.vue";
import { selectCollageSource } from "~/utils/collageMedia";
import { cmsSeoText } from "~/utils/seo";
import { lazySection } from "~/utils/lazySections";
import type { LandingMedia } from "~/types/landingPayload";

// Sections below the first screen hydrate (and download their JS) only when
// they come within 600px of the viewport; their server HTML is visible from the
// start. Hydrating the whole page up front was one ~340ms main-thread task.
// lazySection() lets a reload wait until the ones on screen have drawn
// themselves (utils/lazySections.ts).
const LAZY_HYDRATION = { rootMargin: "600px 0px" };

const cmsMedia = useCmsMedia();
const { t, locale } = useI18n();
const route = useRoute();
const { landingPage, seo: landingSeo } = await useLandingPayload();
useHomePageReady();
const pageRoot = ref<HTMLElement | null>(null);
useAmbientSurfaces(pageRoot);

const brandCollageRows = computed(() => {
  const collage = landingPage.value?.brandCollage;
  if (!collage) return [];
  const urls = (items?: LandingMedia[] | null) => (items ?? [])
    .map(item => cmsMedia(selectCollageSource(item)))
    .filter((url): url is string => Boolean(url));
  return [urls(collage.row1), urls(collage.row2), urls(collage.row3)];
});
// The clients' logos in the strip above Awwward come from the CMS (LandingPage >
// section3 > partnersLogo), so editors add, remove and reorder them in Strapi.
// Alt: the media's alternative text, else its file name; ratio: its width /
// height, which evens out the logos' sizes in the strip.
const partners = computed(() => (landingPage.value?.section3?.partnersLogo ?? [])
  .map(item => ({
    src: cmsMedia(item.url ?? null),
    alt: item.alternativeText?.trim() || (item.name ?? "").replace(/\.[^.]+$/, ""),
    ratio: item.width && item.height ? item.width / item.height : 0,
  }))
  .filter((logo): logo is { src: string; alt: string; ratio: number } => Boolean(logo.src)));
const partnerLogos = computed(() => partners.value.map(logo => logo.src));
const partnerAlts = computed(() => partners.value.map(logo => logo.alt));
const partnerRatios = computed(() => partners.value.map(logo => logo.ratio));

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
            <div class="pointer-events-none absolute inset-0 top-[-250px] z-0">
              <LogoMarquee direction="vertical" :rows="15" :duration-seconds="120" :as-background="true" />
            </div>
            <div class="home-hero-shade" aria-hidden="true" />
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
        <LazyHomeProjectSlideWall :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('slide-wall')" />
        <LazyHomeWorldSection :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('world')" />
        <LazyHomeOneSystemStats :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('stats')" />
        <div class="home-dark-sections">
          <div class="edge-gradient edge-gradient-left edge-gradient-soft" aria-hidden="true" />
          <div class="edge-gradient edge-gradient-right edge-gradient-soft" aria-hidden="true" />
          <LazyHomeAwardsSection
            :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('awards')"
            :logos="partnerLogos"
            :alts="partnerAlts"
            :ratios="partnerRatios"
            :numeral="false"
            :transition="false"
          />
          <!-- BrandStoriesSection (Apex / Perfect Candy / GreenGo) and the glow
               that led into it were taken off the landing; they stay for other pages. -->
          <LazyHomeAirwaysSceneSection :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('airways')" />
          <LazyHomePresentationGallery :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('presentations')" />
          <LazyHomeSocialIdentity :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('social')" />
          <LazyHomeOnePartnerServices :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('services')" />
          <LazyHomeAwardVision :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('vision')" />
          <LazyHomeBrandCompare :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('compare')" />
          <LazyHomeAuditStrategy :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('audit')" />
          <LazyHomeClientsGrid :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('clients')" />
          <LazyHomeFreshProjects :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('fresh-projects')" />
          <!-- FAQ must hydrate immediately: lazy hydration can reset the open
               item while the visitor is interacting with an answer. -->
          <HomeFaqAccordion />
          <LazyHomeRobotShowcase :hydrate-on-visible="LAZY_HYDRATION" v-bind="lazySection('robot')" :scene-url="landingPage?.splineRobot?.sceneUrl" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../assets/css/home-page.css" />
