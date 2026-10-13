<script setup lang="ts">
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
const formatDate = formatNewsDate;
const pickDate = newsDate;

const pageSize = 4;
const page = ref(1);
const items = ref<NewsNode[]>([]);
const pageInfo = ref<NewsPageInfo>(null);
const loadingMore = ref(false);

// The language the list is shown in: the page's own, or English when the CMS
// has no news in it. Later pages keep that language, so the list never mixes.
const listLocale = ref<CmsLocale>(locale.value);

const fetchFirstPage = async () => {
  try {
    const current = await fetchNewsPage(1, pageSize, locale.value);
    if (current.nodes.length || locale.value === "en") return { ...current, locale: locale.value };
    return { ...(await fetchNewsPage(1, pageSize, "en")), locale: "en" as CmsLocale };
  } catch {
    // CMS down: an empty list rather than a 500 for the whole page.
    return { nodes: [] as NewsNode[], pageInfo: null as NewsPageInfo, locale: locale.value };
  }
};

// Rendered on the server and reused by the browser (no second request).
const { data: firstPage } = await useAsyncData(() => `news-main-${locale.value}`, fetchFirstPage);

watch(
  firstPage,
  (value) => {
    page.value = 1;
    items.value = value?.nodes ?? [];
    pageInfo.value = value?.pageInfo ?? null;
    listLocale.value = value?.locale ?? locale.value;
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
