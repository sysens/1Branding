<script setup lang="ts">
import { articlePlainText } from "~/utils/articleText";
import { computed, ref, watch } from "vue";

const root = ref<HTMLElement | null>(null);

useGsapContext(root, ({ gsap }) => {
    const main = root.value?.querySelector<HTMLElement>(".main");
    if (!main) return;

    gsap.fromTo(
      main,
      { x: -160, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
    );
  });

const locale = useCmsLocale();
const fetchNewsPage = useNewsPages();
const resolveImage = useCmsMedia();

const pageSize = 4;
const page = ref(1);
const items = ref<NewsNode[]>([]);
const pageInfo = ref<NewsPageInfo>(null);
const loadingMore = ref(false);

// The language the list is shown in: the page's own, or English when the CMS
// has no news in it. Later pages keep that language, so the list never mixes.
const listLocale = ref<CmsLocale>(locale.value);

// "Show more" is a link to ?page=N, so crawlers reach every article: the
// server renders the first N pages, the browser loads the next one in place.
const route = useRoute();
const requestedPages = computed(() => Math.min(25, Math.max(1, Number.parseInt(String(route.query.page ?? "1"), 10) || 1)));

const fetchFirstPage = async () => {
  const size = pageSize * requestedPages.value;
  try {
    const current = await fetchNewsPage(1, size, locale.value);
    if (current.nodes.length || locale.value === "en") return { ...current, locale: locale.value };
    return { ...(await fetchNewsPage(1, size, "en")), locale: "en" as CmsLocale };
  } catch {
    // CMS down: an empty list rather than a 500 for the whole page.
    return { nodes: [] as NewsNode[], pageInfo: null as NewsPageInfo, locale: locale.value };
  }
};

// Rendered on the server and reused by the browser (no second request).
const { data: firstPage } = await useAsyncData(() => `news-main-${locale.value}-${requestedPages.value}`, fetchFirstPage);

watch(
  firstPage,
  (value) => {
    page.value = requestedPages.value;
    items.value = value?.nodes ?? [];
    pageInfo.value = value?.pageInfo ?? null;
    listLocale.value = value?.locale ?? locale.value;
  },
  { immediate: true }
);

const canLoadMore = computed(() => {
  const total = Number(pageInfo.value?.total);
  if (Number.isFinite(total)) return items.value.length < total;
  const pi = pageInfo.value;
  if (!pi) return true;
  const current = Number(pi.page ?? page.value);
  const max = Number(pi.pageCount ?? 0);
  if (!max) return true;
  return current < max;
});

const localePath = useLocalePath();
const nextPageHref = computed(() => `${localePath("/news")}?page=${page.value + 1}`);

const loadMore = async () => {
  if (loadingMore.value) return;
  if (!canLoadMore.value) return;

  loadingMore.value = true;
  try {
    const next = page.value + 1;
    const { nodes, pageInfo: pi } = await fetchNewsPage(next, pageSize, listLocale.value);
    items.value = [...items.value, ...nodes];
    pageInfo.value = pi;
    page.value = next;
  } catch {
    // Keep the list as it is; the button stays usable for another try.
  } finally {
    loadingMore.value = false;
  }
};

const toNewsSlug = (id: string) => localePath({ path: `/news/${id}` });
</script>

<template>
  <div ref="root">
    <div class="containerr bg-black">
      <div class="main flex flex-col md:gap-[7.8125rem] gap-[3.125rem]">
        <NuxtLink
          v-for="item in items"
          :key="item.documentId"
          :to="toNewsSlug(item.slug || item.documentId)"
          class="block"
        >
          <!-- On phones the text sits under the picture, at the full width:
               beside a 148px thumbnail its column held only ~25 characters. -->
          <div class="Item flex flex-col md:flex-row md:items-center md:gap-[5.375rem] gap-[0.9375rem]">
            <div class="w-full h-[12.5rem] md:shrink md:w-[41.75rem] md:h-[22.5rem]">
              <img
                v-if="item.image?.url"
                class="w-full md:w-[41.75rem] object-cover h-full"
                :src="resolveImage(item.image.url)"
                alt=""
              >
            </div>

            <!-- min-w-0 lets the column shrink beside the picture; the right padding
                 keeps the title clear of the page's dark edge gradient. -->
            <div class="w-full min-w-0 md:pr-[clamp(2rem,9vw,9rem)]">
              <h2
                class="type-h3 md:pb-[2rem] text-white py-[0.5rem]"
              >
                {{ item.title }}
              </h2>

              <p
                class="type-body type-measure text-white line-clamp-5"
              >
                {{ articlePlainText(item.text || "") }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <a
      v-if="canLoadMore"
      :href="nextPageHref"
      :aria-busy="loadingMore"
      class="ob-button flex w-fit mx-auto mt-[3.125rem] mb-[6.25rem] md:my-[6.25rem]"
      @click.prevent="loadMore"
    >
      {{ $t("common.showMore") }}
    </a>
    <div v-else class="mt-[3.125rem] mb-[6.25rem] md:my-[6.25rem]" />

    <div class="md:containerr">
      <NewsSlider />
    </div>
  </div>
</template>
