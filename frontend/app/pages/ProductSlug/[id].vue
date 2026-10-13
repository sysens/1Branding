<script setup lang="ts">
import Spinner from "~/components/Spinner.vue";
import ProductsMain from "~/components/Products/Productsmain.vue";
import { onMounted, nextTick, computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

type AppLocale = "ru" | "en";

const route = useRoute();
const { t, locale } = useI18n();

const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

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

const GRAPHQL_URL = useGraphqlUrl();
const cmsMedia = useCmsMedia();

type Media = { url: string | null };

type ProjectNode = {
  documentId: string;
  createdAt: string;
  section1: {
    projectTitle: string;
    images: Media[] | null;
  } | null;
} | null;

type CategoryNode = {
  documentId: string;
  categoryName: string;
  description: string;
  projects_connection: { nodes: ProjectNode[] } | null;
} | null;

type GqlRes = {
  data?: {
    category?: CategoryNode | null;
    fallbackCategory?: CategoryNode | null;
  };
  errors?: Array<{ message: string }>;
};

const categoryId = computed(() => String(route.params.id || "").trim());
definePageMeta({ key: (route) => route.fullPath });
if (!categoryId.value) {
  throw createError({ statusCode: 404, statusMessage: "Category not found" });
}
if (!GRAPHQL_URL) {
  throw createError({ statusCode: 503, statusMessage: "Category content is unavailable" });
}

const query = `
  query CategoryById($documentId: ID!, $locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode) {
    category(documentId: $documentId, locale: $locale) {
      documentId
      categoryName
      description
      projects_connection(pagination: { page: 1, pageSize: 100 }) {
        nodes {
          documentId
          createdAt
          section1 {
            projectTitle
            images { url }
          }
        }
      }
    }
    fallbackCategory: category(documentId: $documentId, locale: $fallbackLocale) {
      documentId
      categoryName
      description
      projects_connection(pagination: { page: 1, pageSize: 100 }) {
        nodes {
          documentId
          createdAt
          section1 {
            projectTitle
            images { url }
          }
        }
      }
    }

  }
`;

const { data: gqlData, error, pending } = await useCmsQuery<NonNullable<GqlRes["data"]>>(
  () => `category-${categoryId.value}`,
  query,
  { variables: () => ({ documentId: categoryId.value }) }
);

const gqlErrors = computed(
  () => gqlData.value?.errors?.map((e) => e.message).join(" | ") || ""
);

const resolveMedia = cmsMedia;

const category = computed(
  () => gqlData.value?.data?.category ?? gqlData.value?.data?.fallbackCategory ?? null
);

if (error.value || (!category.value && (gqlData.value?.errors?.length || !gqlData.value?.data))) {
  throw createError({ statusCode: 502, statusMessage: "Unable to load category" });
}
if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: "Category not found" });
}

const pageTitle = computed(
  () => category.value?.categoryName || t("productSlug.titleFallback")
);

const pageDesc = computed(
  () => category.value?.description || t("productSlug.descFallback")
);

const seoImage = computed(() => cmsMedia(
  category.value?.projects_connection?.nodes?.find(
    (project) => project?.section1?.images?.some((media) => !!media?.url)
  )?.section1?.images?.find((media) => !!media?.url)?.url
));

const localePath = useLocalePath();
usePageSeo({
  title: computed(() => `${pageTitle.value} — ${t("seo.category")}`),
  description: computed(() => pageDesc.value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)),
  type: "website",
  image: seoImage,
  breadcrumbs: computed(() => [
    { name: t("nav.projects"), path: localePath("/Projects") },
    { name: pageTitle.value, path: route.path },
  ]),
  indexable: computed(() =>
    !("preview" in route.query || "draft" in route.query) &&
    !!gqlData.value?.data?.category
  ),
});

const projectsFromApi = computed(() => {
  const nodes = category.value?.projects_connection?.nodes ?? [];
  return nodes
    .filter((p) => p?.documentId && p?.section1?.projectTitle)
    .map((p) => {
      const imgs = (p?.section1?.images || []).map((m) => ({
        url: resolveMedia(m?.url ?? null),
      }));

      return {
        documentId: p!.documentId,
        createdAt: p!.createdAt,
        section1: p!.section1
          ? {
              projectTitle: p!.section1.projectTitle,
              images: imgs,
            }
          : null,
      };
    });
});

const pageRoot = ref<HTMLElement | null>(null);

// A partial GraphQL error must not keep the full-screen spinner up forever.
const loading = computed(() => pending.value || !gqlData.value);

useGsapContext(pageRoot, ({ gsap }) => {
    const main = pageRoot.value?.querySelector<HTMLElement>(".products");
    const second = pageRoot.value?.querySelector<HTMLElement>(".second");
    if (!main) return;

    gsap.fromTo(
      main,
      { x: -160, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
    );

    if (second) gsap.fromTo(
      second,
      { x: 160, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
    );
  });

onMounted(async () => {
  await refreshLenis();
  await stabilizeAfterAssets();
});

watch(
  () => loading.value,
  async (v) => {
    if (!v) {
      await refreshLenis();
      await stabilizeAfterAssets();
    }
  }
);

watch(
  () => route.fullPath,
  async () => {
    await refreshLenis();
    await stabilizeAfterAssets();
  }
);

</script>

<template>
  <div ref="pageRoot" class="bg-black relative overflow-x-hidden">
    <Spinner
      v-if="loading"
      :size="542"
      class="fixed inset-0 z-[9999]"
    />

    <div class="edge-gradient edge-gradient-left edge-gradient-strong"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-strong"></div>

    <div>
      <div class="relative z-10">
        <div class="bg-[url('/home/Ellipse.png')] bg-contain bg-top bg-no-repeat">
          <div class="md:pt-[60px] pt-[30px]">
          </div>

          <div class="px-[20px] md:px-0 containerr">
            <div class="-ml-[20px] md:ml-0">
              <h1
                class="font-normal text-center md:pt-[115px] mt-[80px] pt-[60px] text-[#FFFFFF] md:text-[62px] text-[40px] leading-[100%] tracking-[0] products"
              >
                {{ pageTitle }}
              </h1>

              <h2
                class="pb-[30px] text-[#FFFFFF] pt-[29px] text-center font-light text-[16px] leading-[28px] tracking-[0] second font-['Poppins','Inter',sans-serif]"
              >
                {{ pageDesc }}
              </h2>
            </div>
          </div>
        </div>

        <div class="second containerr">
          <ProductsMain v-if="!loading" :projects="projectsFromApi" />
        </div>
      </div>
    </div>

    <div v-if="!GRAPHQL_URL || error || gqlErrors" class="hidden">
      {{ !GRAPHQL_URL ? $t("common.graphqlUrlEmpty") : "" }}
      {{ (error as any)?.message || "" }}
      {{ gqlErrors }}
    </div>

  </div>
</template>
