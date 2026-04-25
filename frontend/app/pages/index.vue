<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";

import Spinner from "~/components/Spinner.vue";

import LeadingPage from "~/components/home/leadingPage.vue";
import NdNumberText from "~/components/home/ndNumberText.vue";
import PictureWord from "~/components/home/pictureOnWord.vue";
import GridSection from "~/components/home/GridSection.vue";
import EarthDives from "~/components/home/EarthDives.vue";
import InfoOnPicture from "~/components/home/InfoOnPicture.vue";
import RowShorteners from "~/components/home/rowShorteners.vue";
import ThreeLayer from "~/components/home/threeLayer.vue";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const { t } = useI18n();
const route = useRoute();
const nuxtApp = useNuxtApp();

const loading = ref(true);
const hashScrollDone = ref(false);

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
  : { data: ref<SeoRes | null>(null) as any };

const landingSeo = computed(() => seoData.value?.data?.seo?.landingPage ?? null);
const seoTitle = computed(() => landingSeo.value?.title?.trim() || t("seo.home"));
const seoDesc = computed(() => landingSeo.value?.description?.trim() || "");

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

      const lenis = (nuxtApp as any).$lenis;

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
  loading.value = false;

  if (route.hash && !hashScrollDone.value) {
    await scrollToHash();
    hashScrollDone.value = true;
  }
});
</script>

<template>
  <div class="relative overflow-x-hidden bg-black">
    <Spinner v-if="loading" src="/General/IMG_5528.mp4" :size="542" />

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
        <div class="relative bottom-96">
          <div>
            <HomeNumberText />
          </div>
        </div>
      </section>

      <div
        class="home-three-layer relative md:bottom-28 md:right-[42px] md:w-[120%] md:-translate-y-10 md:rotate-[-6deg] [transform-style:preserve-3d] md:pb-40"
      >
        <ThreeLayer :rows="3" :showTitle="false" :showButton="false" />
      </div>

      <div class="home-nd-number-text">
        <div class="relative">
          <NdNumberText />
        </div>
      </div>

      <div class="home-picture-word">
        <PictureWord />
      </div>

      <div class="home-grid relative bottom-32 md:bottom-80">
        <GridSection />
      </div>

      <div class="home-earth">
        <EarthDives />
      </div>

      <div class="home-info-picture relative md:bottom-0 py-28 md:py-0">
        <InfoOnPicture />
      </div>

      <div class="home-projects md:mb-[6.25rem] md:mt-32">
        <h1
          class="pb-20 text-center text-[40px] font-normal uppercase tracking-normal text-white md:text-[3.875rem] md:leading-[100%] md:tracking-[0]"
        >
          {{ $t("home.freshProjects") }}
        </h1>

        <LazyHomeThreeLayerSlug />
      </div>

      <div class="home-faq pt-20"><RowShorteners /></div>

      <div>
        <Footer />
      </div>
    </div>
  </div>
</template>

<style scoped>
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
    bottom: 7rem;
    right: 0;
    width: 100%;
    padding-bottom: 4rem;
    transform: translateY(-1.5rem) rotate(-4deg);
  }

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

  .home-nd-number-text :deep(.left-block video) {
    width: 23rem;
    height: 33rem;
    padding-bottom: 0;
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

  .home-picture-word :deep(.top-text) {
    left: 2rem;
    top: 18%;
    max-width: 34rem;
  }

  .home-picture-word :deep(.bottom-text) {
    right: 2rem;
    bottom: 16%;
    max-width: 32rem;
  }

  .home-picture-word :deep(.top-text h2),
  .home-picture-word :deep(.bottom-text h1) {
    font-size: 3.25rem;
    line-height: 1.1;
  }

  .home-picture-word :deep(.center-image) {
    top: 50%;
    width: 30rem;
    height: 32rem;
  }

  .home-grid {
    bottom: 6rem;
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

  .home-info-picture {
    bottom: 0;
  }

  .home-info-picture :deep(.main) {
    display: block;
  }

  .home-info-picture :deep(.left-col),
  .home-info-picture :deep(.right-col) {
    max-width: 100%;
  }

  .home-info-picture :deep(.right-col) {
    flex-direction: column-reverse;
  }

  .home-info-picture :deep(.left-col img),
  .home-info-picture :deep(.right-col img) {
    width: 100%;
    max-width: 42rem;
    height: 24rem;
    margin: 0 auto;
  }

  .home-info-picture :deep(.left-col h1),
  .home-info-picture :deep(.right-col h1) {
    font-size: 3rem;
  }

  .home-info-picture :deep(.left-col p),
  .home-info-picture :deep(.right-col p) {
    font-size: 1rem;
    line-height: 1.6;
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
