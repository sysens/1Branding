<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";

import Spinner from "~/components/Spinner.vue";

import LeadingPage from "~/components/home/leadingPage.vue";
import NdNumberText from "~/components/home/ndNumberText.vue";
import FirstGlanceSections from "~/components/home/FirstGlanceSections.vue";
import GridSection from "~/components/home/GridSection.vue";
import EarthDives from "~/components/home/EarthDives.vue";
import InfoOnPicture from "~/components/home/InfoOnPicture.vue";
import RowShorteners from "~/components/home/rowShorteners.vue";
import ThreeLayer from "~/components/home/threeLayer.vue";
import UiContainerScrollAnimation from "~/components/ui/container-scroll-animation.vue";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const { t } = useI18n();
const route = useRoute();
const nuxtApp = useNuxtApp();
const { rowSets: brandCollageRows } = await useBrandCollageRows();

const loading = ref(true);
const hashScrollDone = ref(false);
const INITIAL_LOADER_MIN_MS = 450;
const INITIAL_LOADER_MAX_MS = 1200;

type SeoRes = {
  data?: {
    seo?: {
      landingPage?: {
        title?: string | null;
        description?: string | null;
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

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

const seoQuery = `
  query SeoHome {
    seo {
      landingPage {
        title
        description
      }
    }
  }
`;

const canFetchSeo = Boolean(GRAPHQL_URL);

const { data: seoData } = canFetchSeo
  ? await useFetch<SeoRes>(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { query: seoQuery },
      server: true,
      key: "seo-home",
    })
  : { data: ref<SeoRes | null>(null) };

const landingSeo = computed(() => seoData.value?.data?.seo?.landingPage ?? null);
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
  <div class="relative min-h-screen overflow-x-hidden bg-black">
    <Spinner v-if="loading" :size="542" />

    <div class="home-page-frame">
      <div class="edge-gradient edge-gradient-left edge-gradient-soft"></div>
      <div class="edge-gradient edge-gradient-right edge-gradient-soft"></div>

      <div class="relative z-10">
        <div class="relative overflow-x-hidden">
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
              <LeadingPage />
            </section>
          </div>
        </div>

        <section class="home-number-text">
          <div>
            <HomeNumberText />
          </div>
        </section>

        <div
          class="home-three-layer"
        >
          <ThreeLayer
            :rows="3"
            :row-sets="brandCollageRows"
            :showTitle="false"
            :showButton="false"
          />
        </div>

        <div class="home-nd-number-text">
          <div class="relative">
            <NdNumberText />
          </div>
        </div>

        <div class="home-first-glance">
          <FirstGlanceSections />
        </div>

        <div class="home-grid">
          <GridSection />
        </div>

        <div class="home-earth">
          <EarthDives />
        </div>

        <div class="home-info-picture">
          <InfoOnPicture />
        </div>

        <div class="home-projects">
          <div class="home-project-scroll">
            <UiContainerScrollAnimation>
              <template #title>
                <div class="project-scroll-copy">
                  <h2 class="project-scroll-title">
                    We build digital experiences<br />
                    that feel <span>premium</span> work flawlessly
                  </h2>
                  <p class="project-scroll-description">
                    and turn every interaction into a stronger connection between the brand and its audience.
                  </p>
                </div>
              </template>

              <div class="project-dashboard-preview" aria-hidden="true">
                <div class="project-dashboard-preview__topbar">
                  <div class="project-dashboard-preview__brand">one</div>
                  <div class="project-dashboard-preview__tabs">
                    <span>Home</span>
                    <span>Analytics</span>
                    <span>Product</span>
                    <span>Customers</span>
                  </div>
                  <div class="project-dashboard-preview__user"></div>
                </div>
                <div class="project-dashboard-preview__headline">
                  <span>Powerful dashboard for</span>
                  <strong>Sales &amp; Engagement</strong>
                </div>
                <div class="project-dashboard-preview__grid">
                  <div class="project-dashboard-preview__panel project-dashboard-preview__panel--wide">
                    <div class="project-dashboard-preview__metric">$17,495.79</div>
                    <div class="project-dashboard-preview__bars">
                      <span v-for="height in [34, 48, 42, 64, 86, 46, 74]" :key="height" :style="{ height: `${height}%` }"></span>
                    </div>
                  </div>
                  <div class="project-dashboard-preview__panel">
                    <div class="project-dashboard-preview__list">
                      <span v-for="row in 5" :key="row"></span>
                    </div>
                  </div>
                  <div class="project-dashboard-preview__panel">
                    <div class="project-dashboard-preview__line"></div>
                    <div class="project-dashboard-preview__metric">11.3k</div>
                  </div>
                  <div class="project-dashboard-preview__panel project-dashboard-preview__panel--small">
                    <div class="project-dashboard-preview__dots">
                      <span v-for="dot in 24" :key="dot"></span>
                    </div>
                  </div>
                  <div class="project-dashboard-preview__panel project-dashboard-preview__panel--small">
                    <div class="project-dashboard-preview__metric">23.5k</div>
                    <div class="project-dashboard-preview__line project-dashboard-preview__line--short"></div>
                  </div>
                </div>
              </div>
            </UiContainerScrollAnimation>
          </div>

          <h1
            class="fresh-projects-title pb-20 text-center text-[40px] font-normal tracking-normal text-white md:text-[3.875rem] md:leading-[100%] md:tracking-[0]"
          >
            <span class="fresh-projects-title__green">
              {{ freshProjectsTitleParts.first }}
            </span>
            <span v-if="freshProjectsTitleParts.rest">
              {{ " " + freshProjectsTitleParts.rest }}
            </span>
          </h1>

          <LazyHomeThreeLayerSlug />
        </div>

        <div class="home-faq"><RowShorteners /></div>

        <div>
          <Footer />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page-frame {
  position: relative;
  width: min(100%, 1728px);
  min-height: 100vh;
  margin-inline: auto;
  overflow: hidden;
  background: #000;
}

.home-number-text {
  margin-top: clamp(-13rem, -12vw, -5rem);
}

.home-three-layer {
  position: relative;
  width: 100%;
  z-index: 1;
  margin-top: clamp(1.5rem, 4vw, 4rem);
  padding-bottom: clamp(4rem, 8vw, 10rem);
  transform: none;
  transform-style: preserve-3d;
}

.home-grid {
  margin-top: clamp(-8rem, -7vw, -3rem);
}

.home-nd-number-text {
  margin-bottom: clamp(-5rem, -5vw, -2rem);
}

.home-info-picture {
  position: relative;
  padding-block: clamp(4rem, 7vw, 7rem);
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

.project-scroll-copy {
  color: #ffffff;
  font-family: var(--app-font-display, "SF Pro Display", "SF Pro Text", sans-serif);
  text-align: center;
}

.project-scroll-title {
  margin: 0;
  font-size: clamp(2.5rem, 5.4vw, 5.25rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: 0;
}

.project-scroll-title span {
  color: #03cb00;
}

.project-scroll-description {
  margin: clamp(0.8rem, 1.6vw, 1.25rem) auto 0;
  max-width: 58rem;
  color: #ffffff;
  font-size: clamp(1rem, 1.45vw, 1.45rem);
  line-height: 1.35;
}

.project-dashboard-preview {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 14px;
  background: linear-gradient(180deg, #06110d 0%, #040908 46%, #030504 100%);
  box-shadow: inset 0 0 0 1px rgba(93, 255, 93, 0.1);
}

.project-dashboard-preview__topbar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: clamp(1rem, 2vw, 1.5rem);
}

.project-dashboard-preview__brand,
.project-dashboard-preview__tabs span,
.project-dashboard-preview__user {
  border: 1px solid rgba(89, 255, 72, 0.18);
  background: rgba(0, 0, 0, 0.36);
}

.project-dashboard-preview__brand {
  display: grid;
  width: 3.25rem;
  height: 3.25rem;
  place-items: center;
  border-radius: 9999px;
  color: #03cb00;
  font-weight: 800;
}

.project-dashboard-preview__tabs {
  display: flex;
  flex: 1;
  gap: 0.65rem;
}

.project-dashboard-preview__tabs span {
  border-radius: 9999px;
  padding: 0.65rem 1rem;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.8rem;
}

.project-dashboard-preview__user {
  width: 5.5rem;
  height: 2.5rem;
  border-radius: 9999px;
}

.project-dashboard-preview__headline {
  position: relative;
  z-index: 1;
  margin-top: clamp(0.5rem, 2vw, 1.5rem);
  text-align: center;
}

.project-dashboard-preview__headline span,
.project-dashboard-preview__headline strong {
  display: block;
  font-size: clamp(1.5rem, 2.4vw, 2.5rem);
  line-height: 1.05;
}

.project-dashboard-preview__headline span {
  color: rgba(255, 255, 255, 0.92);
}

.project-dashboard-preview__headline strong {
  color: #59ff48;
}

.project-dashboard-preview__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: clamp(0.75rem, 1.2vw, 1rem);
  padding: clamp(1rem, 2vw, 1.5rem);
}

.project-dashboard-preview__panel {
  min-height: 10rem;
  border: 1px solid rgba(89, 255, 72, 0.16);
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.48);
  box-shadow: inset 0 0 30px rgba(3, 203, 0, 0.08);
}

.project-dashboard-preview__panel--wide {
  grid-row: span 2;
  padding: 1.25rem;
}

.project-dashboard-preview__panel--small {
  min-height: 8rem;
  padding: 1rem;
}

.project-dashboard-preview__metric {
  color: #baffb3;
  font-size: clamp(1.4rem, 2.3vw, 2.2rem);
  font-weight: 800;
}

.project-dashboard-preview__bars {
  display: flex;
  align-items: end;
  height: 11rem;
  gap: 0.7rem;
  margin-top: 1.4rem;
}

.project-dashboard-preview__bars span {
  flex: 1;
  min-width: 0.8rem;
  border-radius: 9999px 9999px 0 0;
  background: linear-gradient(180deg, #8cff3f 0%, #03cb00 55%, rgba(3, 203, 0, 0.18) 100%);
  box-shadow: 0 0 24px rgba(89, 255, 72, 0.38);
}

.project-dashboard-preview__list {
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
}

.project-dashboard-preview__list span {
  height: 1.4rem;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.18), rgba(3, 203, 0, 0.24));
}

.project-dashboard-preview__line {
  width: 80%;
  height: 5rem;
  margin: 1.5rem auto;
  border-bottom: 3px solid #59ff48;
  border-radius: 0 0 50% 50%;
  box-shadow: 0 0 20px rgba(89, 255, 72, 0.42);
}

.project-dashboard-preview__line--short {
  width: 100%;
  height: 3rem;
  margin: 0.75rem 0 0;
}

.project-dashboard-preview__dots {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
}

.project-dashboard-preview__dots span {
  aspect-ratio: 1;
  border-radius: 9999px;
  background: rgba(89, 255, 72, 0.22);
}

.project-dashboard-preview__dots span:nth-child(5n) {
  background: #59ff48;
  box-shadow: 0 0 18px rgba(89, 255, 72, 0.72);
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
  .home-number-text {
    margin-top: clamp(-11rem, -9vw, -4rem);
  }

  .home-three-layer {
    margin-top: clamp(2.5rem, 5vw, 5.5rem);
    padding-bottom: clamp(3.5rem, 6vw, 7rem);
  }

  .home-grid {
    margin-top: clamp(-6rem, -5vw, -2.5rem);
  }

  .home-nd-number-text {
    margin-bottom: clamp(-7rem, -6vw, -3rem);
  }
}

@media (min-width: 768px) {
  .home-three-layer {
    transform: rotate(-6deg);
  }
}

@media (max-width: 767px) {
  .home-number-text {
    margin-top: clamp(-7rem, -16vw, -3rem);
  }

  .home-three-layer {
    margin-top: 2rem;
    padding-bottom: 3rem;
  }

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

  .home-three-layer {
    right: 0;
    width: 100%;
    padding-bottom: 4rem;
    transform: rotate(-4deg);
  }

  .home-three-layer :deep(.marquee-image-frame),
  .home-three-layer :deep(.animate-marquee img),
  .home-three-layer :deep(.animate-marquee-reverse img) {
    width: 26rem;
    height: 14.5rem;
    border-radius: 1.5rem;
  }

  .home-three-layer :deep(a[href="/Projects"]),
  .home-three-layer :deep(.flex.justify-center a) {
    width: 15rem;
    height: 3.5rem;
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
