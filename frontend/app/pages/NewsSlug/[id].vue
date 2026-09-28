<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import NewsHero from "~/components/Newsslug/NewsHero.vue";
import NewsSlider from "~/components/Newsslug/NewsSlider.vue";
import { resolveStrapiMediaUrl } from "~/utils/strapiMedia";

type AppLocale = "ru" | "en";
type Media = { url?: string | null };
type NewsItem = {
  documentId?: string | null;
  title?: string | null;
  text?: string | null;
  createdAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  image?: Media | null;
  images_connection?: { nodes?: Media[] | null } | null;
};
type NewsResponse = {
  data?: { newsPage?: NewsItem | null; fallbackNewsPage?: NewsItem | null };
  errors?: Array<{ message: string }>;
};

const { t, locale } = useI18n();
const route = useRoute();
const runtimeConfig = useRuntimeConfig();
const graphqlUrl = String(runtimeConfig.public.graphqlUrl || "");
const documentId = computed(() => String(route.params.id || "").trim());
const gqlLocale = computed<AppLocale>(() => locale.value === "en" ? "en" : "ru");

// A new route instance avoids stale content (and stale SEO) on client-side ID changes.
definePageMeta({ key: (route) => route.fullPath });

if (!documentId.value) {
  throw createError({ statusCode: 404, statusMessage: "News article not found" });
}
if (!graphqlUrl) {
  throw createError({ statusCode: 503, statusMessage: "News content is unavailable" });
}

const query = `
  query NewsPage($documentId: ID!, $locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode) {
    newsPage(documentId: $documentId, locale: $locale) {
      documentId title text createdAt publishedAt updatedAt
      image { url }
      images_connection { nodes { url } }
    }
    fallbackNewsPage: newsPage(documentId: $documentId, locale: $fallbackLocale) {
      documentId title text createdAt publishedAt updatedAt
      image { url }
      images_connection { nodes { url } }
    }
  }
`;

// One SSR request supplies both the rendered article and its metadata.
const { data, error } = await useFetch<NewsResponse>(graphqlUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: computed(() => ({
    query,
    variables: { documentId: documentId.value, locale: gqlLocale.value, fallbackLocale: "en" },
  })),
  key: computed(() => `news-page-${documentId.value}-${gqlLocale.value}`),
  watch: [documentId, gqlLocale],
});
const news = computed(() => data.value?.data?.newsPage ?? data.value?.data?.fallbackNewsPage ?? null);

if (error.value || (!news.value && (data.value?.errors?.length || !data.value?.data))) {
  throw createError({ statusCode: 502, statusMessage: "Unable to load news article" });
}
if (!news.value) {
  throw createError({ statusCode: 404, statusMessage: "News article not found" });
}

const seoTitle = computed(() => news.value?.title?.trim() || t("seo.news.title"));
const seoDescription = computed(() =>
  (news.value?.text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) || t("seo.news.description")
);
const seoImage = computed(() => resolveStrapiMediaUrl(news.value?.image?.url, graphqlUrl));
const origin = useSiteOrigin();
const localePath = useLocalePath();
const canonical = computed(() => `${origin}${route.path}`);
const validDate = (value?: string | null) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : undefined;
const structuredData = computed(() => ({
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  headline: seoTitle.value,
  description: seoDescription.value,
  ...(seoImage.value ? { image: [seoImage.value] } : {}),
  ...(validDate(news.value?.publishedAt || news.value?.createdAt) ? { datePublished: validDate(news.value?.publishedAt || news.value?.createdAt) } : {}),
  ...(validDate(news.value?.updatedAt) ? { dateModified: validDate(news.value?.updatedAt) } : {}),
  ...(canonical.value ? { mainEntityOfPage: canonical.value } : {}),
  inLanguage: data.value?.data?.newsPage ? gqlLocale.value : "en",
  author: { "@id": `${origin}/#organization` },
  publisher: { "@id": `${origin}/#organization` },
}));

usePageSeo({
  title: seoTitle,
  description: seoDescription,
  type: "article",
  image: seoImage,
  structuredData,
  breadcrumbs: computed(() => [
    { name: t("nav.news"), path: localePath("/News") },
    { name: seoTitle.value, path: route.path },
  ]),
  indexable: computed(() =>
    !("preview" in route.query || "draft" in route.query) &&
    !!data.value?.data?.newsPage
  ),
});

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
          <NewsHero :news="news" />
        </div>
      </div>

      <div class="md:containerr">
        <NewsSlider />
      </div>
    </div>
    <Footer />
  </div>
</template>
