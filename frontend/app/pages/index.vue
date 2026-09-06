<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";

import Spinner from "~/components/Spinner.vue";

import LeadingPage from "~/components/home/leadingPage.vue";
import HeroClientsReveal from "~/components/home/HeroClientsReveal.vue";
import NdNumberText from "~/components/home/ndNumberText.vue";
import FirstGlanceSections from "~/components/home/FirstGlanceSections.vue";
import GridSection from "~/components/home/GridSection.vue";
import EarthDives from "~/components/home/EarthDives.vue";
import InfoOnPicture from "~/components/home/InfoOnPicture.vue";
import RowShorteners from "~/components/home/rowShorteners.vue";
import ProjectTabletShowcase from "~/components/home/ProjectTabletShowcase.vue";
import ThreeLayerSlug from "~/components/home/threeLayerSlug.vue";
import { resolveStrapiMediaUrl } from "~/utils/strapiMedia";
import { selectCollageSource } from "~/utils/collageMedia";
import type { LandingMedia } from "~/types/landingPayload";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const { t } = useI18n();
const route = useRoute();
const nuxtApp = useNuxtApp();
const {
  landingPage,
  oneGuaranteeSection4,
  seo: landingSeo,
  footerSocialMedia,
} = await useLandingPayload();

const mapMediaUrls = (items?: Array<{ url?: string | null }> | null) =>
  (items ?? [])
    .map((item) => resolveStrapiMediaUrl(item.url ?? null, GRAPHQL_URL))
    .filter((url): url is string => Boolean(url));

const brandCollageRows = computed(() => {
  const collage = landingPage.value?.brandCollage;

  if (!collage) return [];

  const mapCollageUrls = (items?: LandingMedia[] | null) => (items ?? [])
    .map(item => resolveStrapiMediaUrl(selectCollageSource(item), GRAPHQL_URL))
    .filter((url): url is string => Boolean(url));

  return [
    mapCollageUrls(collage.row1),
    mapCollageUrls(collage.row2),
    mapCollageUrls(collage.row3),
  ];
});

const partnerLogos = computed(() =>
  mapMediaUrls(landingPage.value?.section3?.partnersLogo)
);

const loading = ref(true);
const hashScrollDone = ref(false);
const INITIAL_LOADER_MIN_MS = 450;
const INITIAL_LOADER_MAX_MS = 1200;

type LenisScrollOptions = {
  offset?: number;
  duration?: number;
  immediate?: boolean;
  lock?: boolean;
};

type LenisInstance = {
  scrollTo: (target: Element | number, options?: LenisScrollOptions) => void;
};

type NuxtAppWithLenis = ReturnType<typeof useNuxtApp> & {
  $lenis?: LenisInstance;
};

const seoTitle = computed(() => landingSeo.value?.title?.trim() || t("seo.home"));
const seoDesc = computed(() => landingSeo.value?.description?.trim() || "");
const freshProjectsTitle = computed(() => t("home.freshProjects").trim() || "Fresh projects");
const freshProjectsTitleParts = computed(() => {
  const [first = "", ...rest] = freshProjectsTitle.value.split(/\s+/).filter(Boolean);

  return {
    first,
    rest: rest.join(" "),
  };
});

const siteUrl = ((runtimeConfig.public.siteUrl as string) || "").replace(/\/$/, "");
const canonical = computed(() => (siteUrl ? siteUrl + route.path : ""));

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDesc.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDesc.value,
  ogType: "website",
  ogUrl: () => canonical.value || undefined,
  twitterCard: "summary",
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDesc.value,
});

useHead(() => ({
  link: canonical.value ? [{ rel: "canonical", href: canonical.value }] : [],
}));

const HASH_OFFSET = 120;

const scrollToHash = async () => {
  if (!process.client) return;
  if (!route.hash) return;

  const id = route.hash.slice(1);
  if (!id) return;

  await nextTick();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;

      const lenis = (nuxtApp as NuxtAppWithLenis).$lenis;

      if (lenis?.scrollTo) {
        lenis.scrollTo(el, {
          offset: -HASH_OFFSET,
          duration: 1,
          immediate: false,
          lock: false,
        });
      } else {
        const top = window.scrollY + el.getBoundingClientRect().top - HASH_OFFSET;
        window.scrollTo({
          top,
          behavior: "auto",
        });
      }
    });
  });
};

const waitForInitialPaint = async () => {
  if (!process.client) return;

  const minDelay = new Promise<void>((resolve) => {
    window.setTimeout(resolve, INITIAL_LOADER_MIN_MS);
  });

  const maxDelay = new Promise<void>((resolve) => {
    window.setTimeout(resolve, INITIAL_LOADER_MAX_MS);
  });

  const domReady = new Promise<void>((resolve) => {
    if (document.readyState !== "loading") {
      resolve();
      return;
    }

    document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
  });

  await Promise.race([Promise.all([minDelay, domReady]), maxDelay]);
};

watch(
  () => route.hash,
  async (newHash, oldHash) => {
    if (!newHash) return;
    if (newHash === oldHash) return;

    hashScrollDone.value = false;
    await scrollToHash();
    hashScrollDone.value = true;
  }
);

onMounted(async () => {
  await nextTick();
  await waitForInitialPaint();
  loading.value = false;

  if (route.hash && !hashScrollDone.value) {
    await scrollToHash();
    hashScrollDone.value = true;
  }
});
</script>

<template>
  <div class="home-page-root relative min-h-screen bg-black">
    <Spinner v-if="loading" :size="542" />

    <div class="home-page-frame">
      <div class="edge-gradient edge-gradient-left edge-gradient-soft"></div>
      <div class="edge-gradient edge-gradient-right edge-gradient-soft"></div>

      <div class="home-page-content relative">
        <HeroClientsReveal>
          <template #hero>
            <div class="pointer-events-none absolute inset-0 top-[-250px] z-0">
              <LogoMarquee
                direction="vertical"
                :rows="15"
                :duration-seconds="120"
                :as-background="true"
              />
            </div>

            <div class="relative">
              <div class="pt-[30px] md:pt-10">
                <Header />
              </div>

              <section class="leading-target home-leading">
                <LeadingPage :landing-page="landingPage" />
              </section>
            </div>
          </template>

            <div>
              <HomeNumberText
                :section="landingPage?.section2"
                :partner-logos="partnerLogos"
                :collage-rows="brandCollageRows"
              />
            </div>
        </HeroClientsReveal>

        <div class="home-nd-number-text">
          <div class="relative">
            <NdNumberText :section="landingPage?.section5" />
          </div>
        </div>

        <div class="home-first-glance">
          <FirstGlanceSections />
        </div>

        <div class="home-grid">
          <GridSection :section="landingPage?.section7" />
        </div>

        <div class="home-earth">
          <EarthDives :section="oneGuaranteeSection4" />
        </div>

        <div class="home-info-picture">
          <InfoOnPicture :section="landingPage?.section10" />
        </div>

        <div class="home-projects">
          <div class="home-project-scroll">
            <ProjectTabletShowcase />
          </div>

          <h1
            class="fresh-projects-title pb-20 mt-20 text-center text-[40px] font-normal tracking-normal text-white md:text-[3.875rem] md:leading-[100%] md:tracking-[0]"
          >
            <span class="fresh-projects-title__green">
              {{ freshProjectsTitleParts.first }}
            </span>
            <span v-if="freshProjectsTitleParts.rest">
              {{ " " + freshProjectsTitleParts.rest }}
            </span>
          </h1>
          <ThreeLayerSlug />
        </div>

        <div class="home-faq">
          <RowShorteners :section="landingPage?.section11" />
        </div>

        <div>
          <Footer
            use-prefetched-data
            :landing-page="landingPage"
            :social-media="footerSocialMedia"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page-root {
  overflow-x: clip;
}

.home-page-frame {
  position: relative;
  width: min(100%, 1728px);
  min-height: 100vh;
  margin-inline: auto;
  overflow: clip;
  background: #000;
}

.home-grid {
  margin-top: clamp(-8rem, -7vw, -3rem);
}

.home-nd-number-text {
  margin-bottom: clamp(-5rem, -5vw, -2rem);
}

.home-info-picture {
  position: relative;
  z-index: 31;
  padding-block: clamp(4rem, 7vw, 7rem);
  background: #000;
}

.home-projects {
  margin-top: clamp(4rem, 8vw, 8rem);
  margin-bottom: clamp(4rem, 6vw, 6.25rem);
}

.home-project-scroll {
  position: relative;
  z-index: 2;
  margin-bottom: clamp(-5rem, -6vw, -2rem);
}

.fresh-projects-title {
  text-transform: none;
}

.fresh-projects-title__green {
  color: #03cb00;
}

.home-faq {
  padding-top: clamp(3rem, 5vw, 5rem);
}

@media (min-width: 1280px) and (min-height: 900px) {
  .home-grid {
    margin-top: clamp(-6rem, -5vw, -2.5rem);
  }

  .home-nd-number-text {
    margin-bottom: clamp(-7rem, -6vw, -3rem);
  }
}

@media (max-width: 767px) {
  .home-grid {
    margin-top: clamp(-4rem, -10vw, -2rem);
  }

  .home-nd-number-text {
    margin-bottom: -2rem;
  }

  .home-info-picture {
    padding-block: 4rem;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .home-leading :deep(.products) {
    justify-content: center;
  }

  .home-leading :deep(.mainImg) {
    width: 31rem;
    height: 16rem;
  }

  .home-leading :deep(.contact-fab) {
    right: 3.5rem;
    bottom: 5rem;
  }

  .home-leading :deep(.contact-fab img) {
    width: 5.75rem;
    height: 5.75rem;
  }

  .home-number-text :deep(.containerr.objects-center) {
    display: block;
    height: auto;
    min-height: auto;
    padding-top: 9rem;
  }

  .home-number-text :deep(.left-block) {
    display: flex;
    justify-content: center;
    padding-bottom: 2rem;
  }

  .home-number-text :deep(.right-block) {
    text-align: center;
  }

  .home-number-text :deep(.right-block h1) {
    font-size: 3rem;
  }

  .home-number-text :deep(.right-block p) {
    font-size: 1.125rem;
    max-width: 42rem;
    margin: 0 auto;
  }

  .home-number-text :deep(.left-block img[src="/home/ikkimun.png"]) {
    width: 26rem;
    height: auto;
  }

  .home-number-text :deep(img[src="/home/BirImage.png"]) {
    width: 33rem;
    height: 29rem;
    left: 50%;
    top: 60%;
  }

  .home-number-text :deep(.relative.z-0 + .relative.z-0) {
    margin-top: 5rem;
  }

  .home-nd-number-text :deep(.pin-wrap) {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 3rem;
    padding-bottom: 3rem;
  }

  .home-nd-number-text :deep(.left-block),
  .home-nd-number-text :deep(.right-block) {
    left: 0;
    right: 0;
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .home-nd-number-text :deep(.left-block .electric-one-number) {
    width: 22rem;
    height: 32rem;
    top: 0;
  }

  .home-nd-number-text :deep(.right-block) {
    min-height: 22rem;
    height: 22rem;
    margin-top: 1rem;
  }

  .home-nd-number-text :deep(.panel) {
    justify-content: center;
  }

  .home-nd-number-text :deep(.panel h1) {
    font-size: 3rem;
  }

  .home-nd-number-text :deep(.panel p) {
    font-size: 1.125rem;
    max-width: 38rem;
    margin: 0 auto;
  }

  .home-grid :deep(.containerr) {
    margin-top: 14rem;
  }

  .home-grid :deep(h1) {
    padding-top: 0;
    padding-bottom: 2rem;
    font-size: 3rem;
    line-height: 1.1;
  }

  .home-grid :deep(.parent) {
    grid-template-columns: 1fr;
    gap: 0.875rem;
  }

  .home-grid :deep(.div1),
  .home-grid :deep(.div2),
  .home-grid :deep(.div3),
  .home-grid :deep(.div4),
  .home-grid :deep(.div5),
  .home-grid :deep(.div6) {
    grid-area: auto !important;
    height: 15rem !important;
  }

  .home-grid :deep(.card) {
    height: 15rem !important;
    border-radius: 1.5rem;
  }

  .home-grid :deep(.img) {
    height: 15rem !important;
  }

  .home-earth :deep(.containerr > .md\:flex),
  .home-earth :deep(.containerr > .inline-block) {
    display: block;
  }

  .home-earth :deep(h1) {
    font-size: 3rem;
    line-height: 1.1;
    margin-bottom: 1rem;
  }

  .home-earth :deep(.left-earth-video) {
    width: 25rem;
    height: 27rem;
  }

  .home-earth :deep(.rowSection) {
    gap: 1rem;
  }

  .home-earth :deep(.row-item) {
    height: auto;
    min-height: 10rem;
    border-radius: 1.5rem;
    padding: 1.5rem;
  }

  .home-earth :deep(.row-item img) {
    width: 3.75rem;
    height: 3.75rem;
  }

  .home-earth :deep(.row-item h1) {
    font-size: 1.25rem;
    line-height: 1.2;
    margin-bottom: 0.75rem;
  }

  .home-earth :deep(.row-item p) {
    font-size: 1rem;
    padding-top: 0;
  }

  .home-big-brand :deep(section) {
    margin-bottom: 11rem;
    height: 22rem;
  }

  .home-big-brand :deep(.animate-marquee > div) {
    gap: 2.5rem;
    height: 22rem;
  }

  .home-big-brand :deep(.group > div:first-child) {
    width: 5.5rem;
    height: 5.5rem;
  }

  .home-big-brand :deep(.group p) {
    padding-top: 2.5rem;
    font-size: 1.25rem;
  }

  .home-info-picture :deep(.info-stack) {
    gap: 5rem;
    padding-top: 3.5rem;
    padding-bottom: 4.5rem;
  }

  .home-info-picture :deep(.info-title) {
    font-size: 3rem;
    line-height: 1.05;
  }

  .home-info-picture :deep(.info-description) {
    font-size: 1rem;
    line-height: 1.5;
  }

  .home-info-picture :deep(.info-image-frame) {
    width: 100%;
    max-width: 100%;
    aspect-ratio: 2.16 / 1;
  }

  .home-projects {
    margin-top: 5rem;
    margin-bottom: 4rem;
  }

  .home-projects > h1 {
    padding-bottom: 3rem;
    font-size: 3rem;
  }

  .home-projects :deep(.marquee-section img) {
    width: 18rem;
    height: 10rem;
    border-radius: 1.5rem;
  }

  .home-projects :deep(a[href*="/Projects"]) {
    width: 15rem;
    height: 3.5rem;
  }

  .home-faq :deep(.faq-title) {
    font-size: 3rem;
    line-height: 1.15;
    padding-bottom: 3rem;
  }

  .home-faq :deep(.faq-item) {
    border-radius: 1.25rem;
    padding: 1.5rem;
  }

  .home-faq :deep(.faq-item h1) {
    font-size: 1.25rem;
  }

  .home-faq :deep(.faq-item p) {
    font-size: 1rem;
    line-height: 1.6;
  }
}
</style>
