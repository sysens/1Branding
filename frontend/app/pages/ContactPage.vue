<script setup lang="ts">
import Spinner from "~/components/Spinner.vue";

import Form from "~/components/Contacts/Form.vue";
import Locations from "~/components/Contacts/Locations.vue";

import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const { t } = useI18n();

const loading = ref(true);

type SeoRes = {
  data?: {
    seo?: {
      contactsPage?: {
        title?: string | null;
        description?: string | null;
      } | null;
    } | null;
  };
};

const seoQuery = `
  query ContactsSeo {
    seo {
      contactsPage {
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
      key: "seo-contacts-page",
    })
  : { data: ref<SeoRes | null>(null) as any };

const contactsSeo = computed(() => seoData.value?.data?.seo?.contactsPage ?? null);

const seoTitle = computed(() => contactsSeo.value?.title?.trim() || t("seo.contacts"));
const seoDescription = computed(() => contactsSeo.value?.description?.trim() || "");

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

let ctx: any = null;

const rootRef = ref<HTMLElement | null>(null);
const titleRef = ref<HTMLElement | null>(null);

const getLenis = () => {
  const nuxtApp = useNuxtApp();
  return (nuxtApp as any).$lenis as
    | {
        start?: () => void;
        stop?: () => void;
        resize?: () => void;
        scrollTo?: (to: number | string | HTMLElement, opts?: any) => void;
      }
    | undefined;
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
    "fonts" in document
      ? (document as any).fonts.ready.catch(() => null)
      : Promise.resolve(null);

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

  const { gsap } = await import("gsap");

  if (!rootRef.value) {
    loading.value = false;
    await nextTick();
    await raf2();
    await refreshLenis();
    await stabilizeAfterAssets();
    return;
  }

  ctx = gsap.context(() => {
    if (!titleRef.value) return;

    gsap.fromTo(
      titleRef.value,
      { x: -160, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1,
        delay: 0.6,
        ease: "power3.out",
      }
    );
  }, rootRef);

  loading.value = false;

  await nextTick();
  await raf2();
  await refreshLenis();
  await stabilizeAfterAssets();
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div ref="rootRef" class="relative overflow-x-hidden overscroll-y-none">
    <Spinner
      v-if="loading"
      :size="542"
      class="fixed inset-0 z-[9999] pointer-events-none"
    />

    <div class="edge-gradient edge-gradient-left edge-gradient-soft"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-soft"></div>

    <div class="bg-black relative z-10">
      <div>
        <div
          class="bg bg md:pt-[60px] pt-[30px] bg-[url('/home/Ellipse.png')] bg-contain bg-top bg-no-repeat m]"
        >
          <Header />

          <h1
            ref="titleRef"
            class="products font-normal text-[#FFFFFF] md:text-[62px] md:pt-[105px] pt-[118px] md:pb-[83px] pb-[54px] md:leading-[1] md:tracking-normal text-center text-[40px] leading-[100%] tracking-[0%]"
          >
            {{ $t("contacts.title") }}
          </h1>
        </div>

        <div class="md:px-30px px-[40px] containerr">
          <Locations />
          <Form />
        </div>
      </div>

      <Footer />
    </div>
  </div>
</template>
