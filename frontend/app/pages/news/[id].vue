<script setup lang="ts">
import { articlePlainText } from "~/utils/articleText";
import { computed, ref } from "vue";
import NewsHero from "~/components/news/NewsHero.vue";
import NewsSlider from "~/components/news/NewsSlider.vue";
import { toMetaDescription } from "~/utils/seo";
import { isSiteLocale, toSiteLocale } from "~/utils/locales";

type Media = { url?: string | null };
type NewsItem = {
  documentId?: string | null;
  slug?: string | null;
  locale?: string | null;
  localizations?: Array<{ locale?: string | null } | null> | null;
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
const graphqlUrl = useGraphqlUrl();
const cmsMedia = useCmsMedia();
// The address carries the article's slug (or, on old links, its documentId).
const routeKey = computed(() => String(route.params.id || "").trim());
const documentId = await useCmsDocumentId("newsPages", routeKey);

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
      documentId slug locale title text createdAt publishedAt updatedAt
      localizations { locale }
      image { url }
      images_connection { nodes { url } }
    }
    fallbackNewsPage: newsPage(documentId: $documentId, locale: $fallbackLocale) {
      documentId slug locale title text createdAt publishedAt updatedAt
      localizations { locale }
      image { url }
      images_connection { nodes { url } }
    }
  }
`;

// One SSR request supplies both the rendered article and its metadata.
const { data, error } = await useCmsQuery<NonNullable<NewsResponse["data"]>>(
  () => `news-page-${documentId.value}`,
  query,
  { variables: () => ({ documentId: documentId.value }) }
);
const news = computed(() => data.value?.data?.newsPage ?? data.value?.data?.fallbackNewsPage ?? null);

if (error.value || (!news.value && (data.value?.errors?.length || !data.value?.data))) {
  throw createError({ statusCode: 502, statusMessage: "Unable to load news article" });
}
if (!news.value) {
  throw createError({ statusCode: 404, statusMessage: "News article not found" });
}

// An old link by documentId moves for good to the readable address.
const slug = computed(() => news.value?.slug?.trim() || "");
if (slug.value && routeKey.value !== slug.value) {
  await navigateTo(useLocalePath()(`/news/${slug.value}`), { redirectCode: 301 });
}

const seoTitle = computed(() => news.value?.title?.trim() || t("seo.news.title"));
const seoDescription = computed(() => toMetaDescription(articlePlainText(news.value?.text ?? "")) || t("seo.news.description"));
// The languages this article is written in (its hreflang alternates).
const articleLocales = computed(() => {
  const own = data.value?.data?.newsPage;
  if (!own) return [];
  return [own.locale, ...(own.localizations ?? []).map((entry) => entry?.locale)].filter(isSiteLocale);
});
const seoImage = computed(() => cmsMedia(news.value?.image?.url));
const origin = useSiteOrigin();
const localePath = useLocalePath();
const canonical = computed(() => `${origin}${route.path}`);
const validDate = (value?: string | null) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : undefined;
const structuredData = computed(() => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: seoTitle.value,
  description: seoDescription.value,
  ...(seoImage.value ? { image: [seoImage.value] } : {}),
  ...(validDate(news.value?.publishedAt || news.value?.createdAt) ? { datePublished: validDate(news.value?.publishedAt || news.value?.createdAt) } : {}),
  ...(validDate(news.value?.updatedAt) ? { dateModified: validDate(news.value?.updatedAt) } : {}),
  ...(canonical.value ? { mainEntityOfPage: canonical.value } : {}),
  inLanguage: news.value?.locale || toSiteLocale(locale.value),
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
    { name: t("nav.news"), path: localePath("/news") },
    { name: seoTitle.value, path: route.path },
  ]),
  indexable: computed(() =>
    !("preview" in route.query || "draft" in route.query) &&
    !!data.value?.data?.newsPage
  ),
  alternates: articleLocales,
});

const pageRoot = ref<HTMLElement | null>(null);

useGsapContext(pageRoot, ({ gsap }) => {
    const main = pageRoot.value?.querySelector<HTMLElement>(".products");
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

</script>

<template>
  <div ref="pageRoot" class="bg-black relative overflow-x-hidden">
    <div class="edge-gradient edge-gradient-left edge-gradient-strong"/>
    <div class="edge-gradient edge-gradient-right edge-gradient-strong"/>
    <div class="relative z-10">
      <div
        class="page-glow md:pt-[3.75rem] pt-[1.875rem]"
      >

        <div class="containerr">
          <NewsHero :news="news" />
        </div>
      </div>

      <div class="md:containerr">
        <NewsSlider />
      </div>
    </div>
  </div>
</template>
