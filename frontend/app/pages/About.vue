<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import Spinner from "~/components/Spinner.vue";
import Header from "~/components/Header.vue";
import Footer from "~/components/Footer.vue";
import BigPhoto from "~/components/About/BigPhoto.vue";
import ThreePic from "~/components/About/ThreePic.vue";
import TwoFlex from "~/components/About/TwoFlex.vue";
import ThreeLayer from "~/components/home/threeLayerSlug.vue";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const { t } = useI18n();
const route = useRoute();

const loading = ref(true);
const rootRef = ref<HTMLElement | null>(null);
const titleRef = ref<HTMLElement | null>(null);

type SeoRes = {
  data?: {
    seo?: {
      aboutPage?: {
        title?: string | null;
        description?: string | null;
      } | null;
    } | null;
  };
};

const seoQuery = `
  query AboutSeo {
    seo {
      aboutPage {
        title
        description
      }
    }
  }
`;

const { data: seoData } = await useFetch<SeoRes>(GRAPHQL_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: {
    query: seoQuery,
  },
  server: true,
  key: "seo-about-page",
});

const aboutSeo = computed(() => seoData.value?.data?.seo?.aboutPage ?? null);
const seoTitle = computed(() => aboutSeo.value?.title?.trim() || t("seo.about"));
const seoDescription = computed(() => aboutSeo.value?.description?.trim() || "");
const siteUrl = ((runtimeConfig.public.siteUrl as string) || "").replace(/\/$/, "");
const canonical = computed(() => (siteUrl ? `${siteUrl}${route.path}` : ""));

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogType: "website",
  ogUrl: () => canonical.value || undefined,
  twitterCard: "summary",
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
});

useHead(() => ({
  link: canonical.value ? [{ rel: "canonical", href: canonical.value }] : [],
}));

let ctx: { revert: () => void } | null = null;

onMounted(async () => {
  await nextTick();

  if (!rootRef.value || !titleRef.value) {
    loading.value = false;
    return;
  }

  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
    if (!titleRef.value) return;

    gsap.fromTo(
      titleRef.value,
      {
        x: -160,
        opacity: 0,
      },
      {
        x: 0,
        opacity: 1,
        duration: 1,
        delay: 0.6,
        ease: "power3.out",
      }
    );
  }, rootRef.value);

  loading.value = false;
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div
    ref="rootRef"
    class="relative min-h-screen overflow-x-hidden overscroll-y-none bg-black"
  >
    <Spinner v-if="loading" :size="542" />

    <div class="edge-gradient edge-gradient-left edge-gradient-soft" />
    <div class="edge-gradient edge-gradient-right edge-gradient-soft" />

    <div>
      <div
        class="vg relative z-10 bg-[url('/home/Ellipse.png')] bg-contain bg-top bg-no-repeat pt-[30px] md:pt-[60px]"
      >
        <Header />

        <h1
          ref="titleRef"
          class="products px-4 pt-[137px] pb-[30px] text-center text-[40px] font-normal leading-[100%] tracking-normal text-[#FFFFFF] md:pt-[127px] md:pb-[60px] md:text-[50px] md:leading-[100%]"
        >
          {{ $t("aboutPage.title") }}
        </h1>
      </div>
    </div>

    <div>
      <div class="relative top-10">
        <BigPhoto />
      </div>

      <div class="relative bottom-7">
        <TwoFlex />
      </div>

      <ThreePic />
    </div>

    <h1
      class="px-4 pt-[100px] pb-[30px] text-center text-[40px] font-normal uppercase leading-[100%] tracking-[0] text-white md:pt-[130px] md:pb-20 md:text-[62px]"
    >
      {{ $t("home.freshProjects") }}
    </h1>

    <ThreeLayer />

    <Footer />
  </div>
</template>

<style scoped></style>
