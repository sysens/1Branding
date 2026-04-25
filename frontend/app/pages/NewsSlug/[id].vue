buni xam
<script setup lang="ts">
import NewsHero from "~/components/Newsslug/NewsHero.vue";
import NewsSlider from "~/components/Newsslug/NewsSlider.vue";
import { onMounted, onBeforeUnmount, nextTick } from "vue";
let ctx: any = null;

onMounted(async () => {
  await nextTick();

  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
    const main = document.querySelector<HTMLElement>(".products");
    if (!main) return;

    gsap.fromTo(
      main,
      { x: -160, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1,
        delay: 1,
        ease: "power3.out",
      }
    );
  });
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});

import { computed } from "vue";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

const documentId = "pxathabsmxdg5x8k3w53mbke";

type ImageType = { url: string | null };

type NewsItem = {
  title?: string;
  image?: ImageType | null;
  text1?: string;
  images?: ImageType[] | null;
};

type GqlRes = {
  data?: { newsPage?: NewsItem | NewsItem[] | null };
  errors?: Array<{ message: string }>;
};

const query = `
  query NewsPage($documentId: ID!) {
    newsPage(documentId: $documentId) {
      title
      image { url }
      text1
      images { url }
    }
  }
`;

const { data, error } = await useFetch<GqlRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: { query, variables: { documentId } },
  server: false,
  key: "news-page",
});

const newsRaw = computed(() => data.value?.data?.newsPage ?? null);

const news = computed<NewsItem | null>(() => {
  const v: any = newsRaw.value;
  if (!v) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
});

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveImage = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = apiBase.value;
  if (url.startsWith("/")) return base + url;
  return base + "/" + url;
};

const title = computed(() => news.value?.title || "");
const text1 = computed(() => news.value?.text1 || "");
const heroImageSrc = computed(() => resolveImage(news.value?.image?.url));

const images = computed(() => news.value?.images ?? []);
const imagesWithSrc = computed(() =>
  images.value.map((img) => ({
    ...img,
    src: resolveImage(img.url),
  }))
);

const gqlErrors = computed(
  () => data.value?.errors?.map((e) => e.message).join(" | ") || ""
);
</script>

<template>
  <div class="bg-black relative overflow-x-hidden">
    <div class="edge-gradient edge-gradient-left edge-gradient-strong"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-strong"></div>
    <div class="relative z-10">
      <div
        class="bg bg-[url('/home/Ellipse.png')] md:pt-[60px] pt-[30px] bg-contain bg-top bg-no-repeat m]"
      >
        <Header />

        <div class="containerr">
          <NewsHero />
        </div>
      </div>

      <div class="md:containerr">
        <NewsSlider />
      </div>
    </div>
    <Footer />
  </div>
</template>
