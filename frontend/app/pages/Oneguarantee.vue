<script setup lang="ts">
import Spinner from "~/components/Spinner.vue";

import EarthDives from "~/components/home/EarthDives.vue";
import BigPhotoo from "~/components/OneGuarantee/BigPhotoo.vue";
import GuaranteeMarquee from "~/components/OneGuarantee/GuaranteeMarquee.vue";
import InfoSection from "~/components/OneGuarantee/InfoSection.vue";
import Reasons from "~/components/OneGuarantee/Reasons.vue";
import { ref, computed, onMounted, nextTick } from "vue";

interface LenisController {
  start?: () => void;
  stop?: () => void;
  resize?: () => void;
  scrollTo?: (
    to: number | string | HTMLElement,
    options?: Record<string, boolean | number | string>
  ) => void;
}

interface LenisAwareNuxtApp extends ReturnType<typeof useNuxtApp> {
  $lenis?: LenisController;
}

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const { t } = useI18n();

const loading = ref(true);
const emptySeoData = ref<SeoRes | null>(null);
const oneGuaranteeVideoPoster = "/OneGuarantee/image95.png";
const oneGuaranteeVideoSrc = "/OneGuarantee/Img%205714.mp4";

type SeoRes = {
  data?: {
    seo?: {
      oneGuaranteePage?: {
        title?: string | null;
        description?: string | null;
      } | null;
    } | null;
  };
};

const seoQuery = `
  query OneGuaranteeSeo {
    seo {
      oneGuaranteePage {
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
      key: "seo-one-guarantee-page",
    })
  : { data: emptySeoData };

const seo = computed(() => seoData.value?.data?.seo?.oneGuaranteePage ?? null);

const seoTitle = computed(() => seo.value?.title?.trim() || t("seo.oneGuarantee"));
const seoDescription = computed(() => seo.value?.description?.trim() || "");

const route = useRoute();
const siteUrl = ((runtimeConfig.public.siteUrl as string) || "").replace(/\/$/, "");
const canonical = computed(() => (siteUrl ? siteUrl + route.path : ""));

useSeoMeta({
  title: seoTitle.value,
  description: seoDescription.value,

  ogTitle: seoTitle.value,
  ogDescription: seoDescription.value,
  ogType: "website",
  ogUrl: canonical.value || undefined,

  twitterCard: "summary",
  twitterTitle: seoTitle.value,
  twitterDescription: seoDescription.value,
});

useHead({
  link: canonical.value ? [{ rel: "canonical", href: canonical.value }] : [],
});

const getLenis = () => {
  const nuxtApp = useNuxtApp() as LenisAwareNuxtApp;
  return nuxtApp.$lenis;
};

const raf2 = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

const refreshLenis = async () => {
  if (!process.client) return;
  await nextTick();
  await raf2();
  const lenis = getLenis();
  if (!lenis) return;
  lenis.resize?.();
};

const stabilizeAfterAssets = async () => {
  if (!process.client) return;

  const fontsReady =
    "fonts" in document ? document.fonts.ready.catch(() => null) : Promise.resolve(null);

  const imgs = Array.from(document.images || []);
  const imagesReady = Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve(null);
      return new Promise((res) => {
        const done = () => res(null);
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    })
  );

  await Promise.race([
    Promise.all([fontsReady, imagesReady]),
    new Promise((r) => setTimeout(r, 1200)),
  ]);
  await refreshLenis();
};

onMounted(async () => {
  await nextTick();

  loading.value = false;

  await nextTick();
  await refreshLenis();
  await stabilizeAfterAssets();
});
</script>

<template>
  <div class="bg-black relative overflow-x-hidden">
    <Spinner
      v-if="loading"
      src="/General/IMG_5528.mp4"
      :size="542"
      class="fixed inset-0 z-[9999]"
    />

    <div class="edge-gradient edge-gradient-left edge-gradient-strong"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-strong"></div>

    <div class="relative z-10">
      <div>
        <div>
          <div>
            <div class="videoBackground relative h-screen overflow-hidden">
              <video
                class="absolute inset-0 w-full h-full object-cover"
                autoplay
                muted
                loop
                playsinline
                preload="none"
                :poster="oneGuaranteeVideoPoster"
              >
                <source :src="oneGuaranteeVideoSrc" type="video/mp4" />
              </video>

              <div
                class="vg bg-[url('/home/Ellipse.png')] bg-contain bg-top bg-no-repeat relative z-10 md:pt-[60px] pt-[30px] m]"
              >
                <Header />

                <h1
                  class="text-[#FFFFFF] font-normal md:text-[50px] md:leading-[100%] md:tracking-[0] md:pt-[127px] pt-[137px] md:pb-[60px] pb-[30px] text-[40px] leading-[100%] tracking-normal text-center products"
                ></h1>
              </div>
            </div>
          </div>
        </div>

        <div class="relative bottom-10">
          <InfoSection />
        </div>

        <div>
          <div class="containerr">
            <div class="md:px-0 px-[20px]">
              <h1
                class="text-[#FFFFFF] md:px-0 md:mt-[130px] text-center pb-[29px] font-normal md:text-[62px] leading-[100%] md:tracking-normal text-[40px] tracking-[0%]"
              >
                {{ $t("oneGuarantee.clientsTitle") }}
              </h1>

              <p
                class="text-[#FFFFFF] font-light md:text-[16px] pb-[43px] md:leading-[28px] md:tracking-normal text-center text-[14px] leading-[120%] tracking-[0%] font-['Inter']"
              >
                {{ $t("oneGuarantee.clientsSubtitle") }}
              </p>
            </div>
          </div>

          <GuaranteeMarquee :rows="2" :showTitle="false" :showButton="false" />
        </div>

        <div>
          <EarthDives />
        </div>

        <div class="containerr">
          <Reasons />
        </div>

        <div class="containerr">
          <BigPhotoo />
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>
