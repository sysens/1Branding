<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

let ctx: any = null;

onMounted(async () => {
  await nextTick();

  const mod: any = await import("gsap");
  const gsap: any = mod.gsap || mod.default || mod;

  ctx = gsap.context(() => {
    const main = document.querySelector<HTMLElement>(".main");
    if (!main) return;

    gsap.fromTo(
      main,
      { x: -160, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
    );
  });
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});

type AppLocale = "ru" | "en";

const { locale } = useI18n();
const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);
const fallbackLocale: AppLocale = "en";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

type ImageType = { url: string | null };
type NewsNode = {
  documentId: string;
  title: string;
  text?: string | null;
  createdAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  image: ImageType | null;
};

type NewsConn = {
  nodes?: NewsNode[];
  pageInfo?: {
    page?: number;
    pageSize?: number;
    pageCount?: number;
    total?: number;
  } | null;
};

type GqlRes = {
  data?: { newsPages_connection?: NewsConn | null };
  errors?: Array<{ message: string }>;
};

const pageSize = 4;
const page = ref(1);
const items = ref<NewsNode[]>([]);
const pageInfo = ref<NewsConn["pageInfo"]>(null);
const loadingMore = ref(false);

const query = `
  query NewsPagesConnection($page: Int!, $pageSize: Int!, $locale: I18NLocaleCode) {
    newsPages_connection(
      locale: $locale
      pagination: { page: $page, pageSize: $pageSize }
    ) {
      nodes {
        documentId
        title
        text
        createdAt
        publishedAt
        updatedAt
        image { url }
      }
      pageInfo {
        page
        pageSize
        pageCount
        total
      }
    }
  }
`;

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveImage = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = apiBase.value;
  if (url.startsWith("/")) return base + url;
  return base + "/" + url;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // UTC, so the server and the browser print the same day (no hydration mismatch).
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const pickDate = (n: NewsNode) => n.createdAt || n.publishedAt || n.updatedAt || "";

const fetchPageByLocale = async (p: number, localeValue: AppLocale) => {
  if (!GRAPHQL_URL) return { nodes: [] as NewsNode[], pi: null as NewsConn["pageInfo"] };

  const res = await $fetch<GqlRes>(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      query,
      variables: { page: p, pageSize, locale: localeValue },
    },
  });

  const nodes = res?.data?.newsPages_connection?.nodes ?? [];
  const pi = res?.data?.newsPages_connection?.pageInfo ?? null;

  return { nodes, pi };
};

// The language the list is shown in: the page's own, or English when the CMS
// has no news in it. Later pages keep that language, so the list never mixes.
const listLocale = ref<AppLocale>(gqlLocale.value);

const fetchFirstPage = async () => {
  try {
    const current = await fetchPageByLocale(1, gqlLocale.value);
    if (current.nodes.length || gqlLocale.value === fallbackLocale) {
      return { ...current, locale: gqlLocale.value };
    }
    return { ...(await fetchPageByLocale(1, fallbackLocale)), locale: fallbackLocale as AppLocale };
  } catch {
    // CMS down: an empty list rather than a 500 for the whole page.
    return { nodes: [] as NewsNode[], pi: null as NewsConn["pageInfo"], locale: gqlLocale.value };
  }
};

// Rendered on the server and reused by the browser (no second request).
const { data: firstPage } = await useAsyncData(
  () => `news-main-${gqlLocale.value}`,
  fetchFirstPage,
  { watch: [gqlLocale] }
);

watch(
  firstPage,
  (value) => {
    page.value = 1;
    items.value = value?.nodes ?? [];
    pageInfo.value = value?.pi ?? null;
    listLocale.value = value?.locale ?? gqlLocale.value;
  },
  { immediate: true }
);

const canLoadMore = computed(() => {
  const pi = pageInfo.value;
  if (!pi) return true;
  const current = Number(pi.page ?? page.value);
  const max = Number(pi.pageCount ?? 0);
  if (!max) return true;
  return current < max;
});

const localePath = useLocalePath();

const loadMore = async () => {
  if (loadingMore.value) return;
  if (!canLoadMore.value) return;

  loadingMore.value = true;
  try {
    const next = page.value + 1;
    const { nodes, pi } = await fetchPageByLocale(next, listLocale.value);
    items.value = [...items.value, ...nodes];
    pageInfo.value = pi;
    page.value = next;
  } catch {
    // Keep the list as it is; the button stays usable for another try.
  } finally {
    loadingMore.value = false;
  }
};

const toNewsSlug = (id: string) => localePath({ path: `/NewsSlug/${id}` });
</script>

<template>
  <div>
    <div class="containerr bg-black">
      <div class="main flex flex-col md:gap-[125px] gap-[50px]">
        <NuxtLink
          v-for="item in items"
          :key="item.documentId"
          :to="toNewsSlug(item.documentId)"
          class="block"
        >
          <div class="Item flex items-center md:gap-[86px] gap-[15px]">
            <div class="shrink-0 w-[148px] h-[127px] md:shrink md:w-[668px] md:h-[360px]">
              <img
                v-if="item.image?.url"
                class="w-[668px] object-cover h-full"
                :src="resolveImage(item.image.url)"
                alt=""
              />
            </div>

            <div class="w-full">
              <h2
                class="md:pb-[50px] text-white md:text-[62px] leading-[120%] font-normal text-[18px] tracking-[0%] py-[8px]"
              >
                {{ item.title }}
              </h2>

              <p
                class="md:text-[16px] text-white line-clamp-5 font-light text-[14px] leading-[120%] tracking-[0%] font-['Poppins','Inter',sans-serif]"
              >
                {{ item.text || "" }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <button
      @click="loadMore"
      :disabled="loadingMore || !canLoadMore"
      class="rounded-full bg-black text-white block md:my-[100px] mt-[50px] mb-[100px] border-2 mx-auto w-[280px] h-[60px] border-[#03CB00] shadow-[0_0_20px_rgba(3,203,0,0.6)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(3,203,0,0.9)] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-[0_0_20px_rgba(3,203,0,0.6)]"
    >
      {{ $t("common.showMore") }}
    </button>

    <div class="md:containerr">
      <NewsSlider />
    </div>
  </div>
</template>
