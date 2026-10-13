<script setup lang="ts">
import EarthDives from "~/components/home/EarthDives.vue";
import BigPhotoo from "~/components/OneGuarantee/BigPhotoo.vue";
import GuaranteeMarquee from "~/components/OneGuarantee/GuaranteeMarquee.vue";
import InfoSection from "~/components/OneGuarantee/InfoSection.vue";
import Reasons from "~/components/OneGuarantee/Reasons.vue";
import { computed, onMounted, nextTick, ref } from "vue";

interface LenisController {
  start?: () => void;
  stop?: () => void;
  resize?: () => void;
  scrollTo?: (
    to: number | string | HTMLElement,
    options?: Record<string, boolean | number | string>
  ) => void;
}

type LenisAwareNuxtApp = ReturnType<typeof useNuxtApp> & {
  $lenis?: LenisController;
};

const { t } = useI18n();

// WebP copy of the 523 KB PNG poster (32 KB).
const oneGuaranteeVideoPoster = "/OneGuarantee/image95.webp";
const oneGuaranteeVideoSrc = "/OneGuarantee/Img%205714.mp4";

// The background video (13 MB) is attached in the browser, and not at all on a
// data-saving or slow connection: those visitors keep the poster.
const heroVideo = ref<HTMLVideoElement | null>(null);
const heroVideoSrc = ref("");
const attachHeroVideo = async () => {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || /(^|-)(2g|3g)$/.test(connection?.effectiveType ?? "")) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  heroVideoSrc.value = oneGuaranteeVideoSrc;
  await nextTick();
  heroVideo.value?.load();
  heroVideo.value?.play().catch(() => {});
};

const cmsSeo = await useCmsSeo("oneGuaranteePage");
const localePath = useLocalePath();
usePageSeo({
  title: computed(() => cmsSeo.title.value || t("seo.oneGuarantee.title")),
  description: computed(() => cmsSeo.description.value || t("seo.oneGuarantee.description")),
  breadcrumbs: computed(() => [{ name: "OneGuarantee", path: localePath("/Oneguarantee") }]),
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
  void attachHeroVideo();
  await nextTick();
  await refreshLenis();
  await stabilizeAfterAssets();
});
</script>

<template>
  <div class="bg-black relative overflow-x-hidden">
    <div class="edge-gradient edge-gradient-left edge-gradient-strong"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-strong"></div>

    <div class="relative z-10">
      <div>
        <div>
          <div>
            <div class="videoBackground relative h-screen overflow-hidden">
              <video
                ref="heroVideo"
                class="absolute inset-0 w-full h-full object-cover"
                autoplay
                muted
                loop
                playsinline
                preload="none"
                aria-hidden="true"
                :poster="oneGuaranteeVideoPoster"
              >
                <source v-if="heroVideoSrc" :src="heroVideoSrc" type="video/mp4" />
              </video>

              <div
                class="vg bg-[url('/home/Ellipse.png')] bg-contain bg-top bg-no-repeat relative z-10 md:pt-[60px] pt-[30px]"
              >
                <Header />

                <h1
                  class="text-[#FFFFFF] font-normal md:text-[50px] md:leading-[100%] md:tracking-[0] md:pt-[127px] pt-[137px] md:pb-[60px] pb-[30px] text-[40px] leading-[100%] tracking-normal text-center products"
                ><span class="sr-only">{{ $t("seo.oneGuarantee.h1") }}</span></h1>
              </div>
            </div>
          </div>
        </div>

        <div class="relative bottom-10">
          <InfoSection />
        </div>

        <!-- Rendered only when the CMS has real client reviews. -->
        <GuaranteeMarquee :rows="2" :showTitle="false" :showButton="false">
          <template #header>
            <div class="containerr">
              <div class="md:px-0 px-[20px]">
                <h2
                  class="text-[#FFFFFF] md:px-0 md:mt-[130px] text-center pb-[29px] font-normal md:text-[62px] leading-[100%] md:tracking-normal text-[40px] tracking-[0%]"
                >
                  {{ $t("oneGuarantee.clientsTitle") }}
                </h2>

                <p
                  class="text-[#FFFFFF] font-light md:text-[16px] pb-[43px] md:leading-[28px] md:tracking-normal text-center text-[14px] leading-[120%] tracking-[0%] font-['Inter']"
                >
                  {{ $t("oneGuarantee.clientsSubtitle") }}
                </p>
              </div>
            </div>
          </template>
        </GuaranteeMarquee>

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
