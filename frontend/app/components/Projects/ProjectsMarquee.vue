<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type AppLocale = "ru" | "en";

type Props = {
  rows?: number;
  durationSeconds?: number;
  pageSize?: number;
};

const props = withDefaults(defineProps<Props>(), {
  rows: 2,
  durationSeconds: 60,
  pageSize: 5,
});

gsap.registerPlugin(ScrollTrigger);

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

const { locale } = useI18n<{ message: any }, AppLocale>();
const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveMedia = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

type Media = { url: string | null };

type ProjectNode = {
  documentId: string;
  section1: { images: Media[] | null } | null;
} | null;

type CategoryNode = {
  documentId: string;
  categoryName: string;
  projects_connection: { nodes: ProjectNode[] } | null;
} | null;

type GqlRes = {
  data?: { categories_connection?: { nodes?: CategoryNode[] } | null };
  errors?: Array<{ message: string }>;
};

const localePath = useLocalePath();
const router = useRouter();

const toCategorySlug = (id: string) => localePath({ path: `/ProductSlug/${id}` });
const toProjectSlug = (id: string) => localePath({ path: `/ProjectSlug/${id}` });

const isIOSWebKit = () => {
  if (!process.client) return false;

  const ua = window.navigator.userAgent || "";
  const isIOS = /iP(ad|hone|od)/i.test(ua);
  const isWebKit = /WebKit/i.test(ua);
  const isCriOS = /CriOS/i.test(ua);
  const isFxiOS = /FxiOS/i.test(ua);

  return isIOS && isWebKit && !isCriOS && !isFxiOS;
};

const navigateSafely = async (to: string) => {
  if (!process.client || !to) return;

  try {
    if (isIOSWebKit()) {
      window.location.assign(to);
      return;
    }

    await router.push(to);

    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  } catch {
    window.location.assign(to);
  }
};

const page = ref(1);
const pageSize = computed(() => Math.max(1, Number(props.pageSize) || 5));
const isLoading = ref(false);
const hasMore = ref(true);
const fallbackLocale: AppLocale = "en";

const allCategories = ref<CategoryNode[]>([]);

const makeQuery = (p: number, ps: number) => `
  query CategoriesConnection($locale: I18NLocaleCode) {
    categories_connection(pagination: { page: ${p}, pageSize: ${ps} }, locale: $locale) {
      nodes {
        documentId
        categoryName
        projects_connection {
          nodes {
            documentId
            section1 {
              images { url }
            }
          }
        }
      }
    }
  }
`;

const fetchCategoriesPage = async (p: number, localeValue: AppLocale) => {
  const query = makeQuery(p, pageSize.value);

  const { data } = await $fetch<GqlRes>(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { query, variables: { locale: localeValue } },
  });

  const nodes = data?.categories_connection?.nodes ?? [];
  return nodes.filter(Boolean) as CategoryNode[];
};

const fetchPage = async (p: number) => {
  if (!GRAPHQL_URL) return;
  if (isLoading.value) return;
  if (!hasMore.value && p !== 1) return;

  isLoading.value = true;
  try {
    let clean = await fetchCategoriesPage(p, gqlLocale.value);
    if (!clean.length && gqlLocale.value !== fallbackLocale) {
      clean = await fetchCategoriesPage(p, fallbackLocale);
    }

    if (p === 1) {
      allCategories.value = clean;
      hasMore.value = true;
    } else {
      allCategories.value = [...allCategories.value, ...clean];
    }

    if (clean.length < pageSize.value) hasMore.value = false;
    page.value = p;
  } finally {
    isLoading.value = false;
  }
};

await fetchPage(1);

const loadMore = async () => {
  if (!hasMore.value) return;
  await fetchPage(page.value + 1);
};

type MarqueeItem = {
  key: string;
  title: string;
  src: string;
  to: string;
};

type CategoryView = {
  key: string;
  title: string;
  to: string;
  items: MarqueeItem[];
};

const categoriesView = computed<CategoryView[]>(() => {
  const nodes = allCategories.value ?? [];

  return nodes
    .map((cat, idx) => {
      const title = cat?.categoryName?.trim() || "";
      const catId = cat?.documentId?.trim() || "";
      const projects = cat?.projects_connection?.nodes ?? [];

      if (!title || !catId) return null;

      const items = projects
        .map((p, j) => {
          const id = p?.documentId?.trim() || "";
          const raw = p?.section1?.images?.[0]?.url ?? "";
          const src = resolveMedia(raw);
          if (!id || !src) return null;

          return {
            key: `${idx}-${j}-${id}`,
            title,
            src,
            to: toProjectSlug(id),
          };
        })
        .filter(Boolean) as MarqueeItem[];

      if (!items.length) return null;

      return {
        key: `${idx}-${catId}`,
        title,
        to: toCategorySlug(catId),
        items,
      };
    })
    .filter(Boolean) as CategoryView[];
});

const marqueeDuration = computed(() => `${props.durationSeconds}s`);

const rowsConfig = computed(() => {
  const total = Math.max(0, Number(props.rows) || 0);

  return Array.from({ length: total }, (_, idx) => {
    const isReverse = idx % 2 === 1;
    const opacityClass = isReverse ? "opacity-98" : "opacity-99";

    return {
      key: `row-${idx}`,
      animClass: isReverse ? "animate-marquee-reverse" : "animate-marquee",
      imgOpacityClass: opacityClass,
    };
  });
});

const prevLocale = ref<AppLocale>(gqlLocale.value);
if (process.client) {
  watch(
    gqlLocale,
    async (v) => {
      if (prevLocale.value === v) return;
      prevLocale.value = v;
      page.value = 1;
      hasMore.value = true;
      await fetchPage(1);
      await nextTick();
      await initGsap();
    },
    { immediate: false }
  );
}

const root = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
let ctx: any = null;
let inited = false;

const initGsap = async () => {
  await nextTick();

  ctx?.revert();
  ctx = null;

  if (!root.value) return;

  ctx = gsap.context(() => {
    const el = root.value!;

    gsap.set(el, { opacity: 0 });

    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          duration: 2,
          delay: 1.3,
          ease: "power2.out",
        });
      },
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });
  }, root.value);

  inited = true;
};

onMounted(async () => {
  if (!root.value) return;

  const rect = root.value.getBoundingClientRect();
  const inViewNow = rect.top < window.innerHeight && rect.bottom > 0;
  if (inViewNow) {
    await initGsap();
  }

  observer = new IntersectionObserver(
    async (entries) => {
      if (entries[0]?.isIntersecting && !inited) {
        await initGsap();
      }
    },
    { threshold: 0.01, rootMargin: "200px 0px 200px 0px" }
  );

  observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
  ctx?.revert();
  ctx = null;
  inited = false;
});
</script>

<template>
  <section
    ref="root"
    class="marquee-section relative z-10 bg-black w-full overflow-hidden flex items-center"
  >
    <div class="edge-gradient edge-gradient-left"></div>
    <div class="edge-gradient edge-gradient-right"></div>

    <div class="w-full md:w-[120%] md:-ml-[10%] relative z-[1]">
      <div class="w-full overflow-hidden space-y-2">
        <div class="space-y-10">
          <div v-for="cat in categoriesView" :key="cat.key" class="space-y-2">
            <div
              class="flex justify-center md:justify-start md:left-[12%] relative z-20 pointer-events-auto"
            >
              <a
                :href="cat.to"
                class="inline-block pointer-events-auto relative z-20"
                @click.prevent="navigateSafely(cat.to)"
              >
                <h2
                  class="md:text-white text-[#03CB00] text-center font-oswald font-normal md:text-[62px] md:leading-[100%] tracking-[0%] md:pt-[100px] md:pb-[63px] text-[40px] leading-[120%] pt-[50px] pb-[30px] transition-all duration-500 ease-out md:hover:text-[#03CB00] md:hover:[text-shadow:0_0_5px_#03CB00] md:hover:scale-[1.04] mx-auto"
                >
                  {{ cat.title }}
                </h2>
              </a>
            </div>

            <div
              v-for="row in rowsConfig"
              :key="cat.key + '-' + row.key"
              class="flex w-max will-change-transform"
              :class="row.animClass"
              :style="{ '--marquee-duration': marqueeDuration }"
            >
              <div class="flex items-center gap-2 px-1">
                <a
                  v-for="item in cat.items"
                  :key="cat.key + '-' + row.key + '-a-' + item.key"
                  :href="item.to"
                  class="shrink-0 block"
                  @click.prevent="navigateSafely(item.to)"
                >
                  <img
                    :src="item.src"
                    :alt="item.title"
                    class="md:h-[273px] h-[142px] md:w-[486px] w-[252px] shrink-0 object-cover rounded-[20px] md:rounded-[30px] select-none"
                    :class="row.imgOpacityClass"
                    draggable="false"
                  />
                </a>
              </div>

              <div class="flex items-center gap-2 px-1" aria-hidden="true">
                <a
                  v-for="item in cat.items"
                  :key="cat.key + '-' + row.key + '-b-' + item.key"
                  :href="item.to"
                  class="shrink-0 block"
                  tabindex="-1"
                  @click.prevent="navigateSafely(item.to)"
                >
                  <img
                    :src="item.src"
                    :alt="item.title"
                    class="md:h-[273px] h-[142px] md:w-[486px] w-[252px] shrink-0 object-cover rounded-[20px] md:rounded-[30px] select-none"
                    :class="row.imgOpacityClass"
                    draggable="false"
                  />
                </a>
              </div>
            </div>
          </div>

          <div class="flex justify-center pb-[20px] pt-[40px]">
            <button
              v-if="hasMore"
              type="button"
              :disabled="isLoading"
              @click="loadMore"
              class="text-white bg-[url('/home/Component3.png')] md:w-[260px] w-[219px] md:h-[60px] h-[50px] rounded-[32px] bg-[size:120%] bg-[position:100%_50%] transition-[background-position,background-size,box-shadow] duration-1000 ease-[cubic-bezier(.4,0,.2,1)] hover:bg-[size:140%] hover:bg-[position:0%_50%] hover:shadow-[0_0_30px_rgba(3,203,0,0.9)] disabled:opacity-60 disabled:cursor-not-allowed font-['Poppins','Inter',sans-serif]"
            >
              <span v-if="!isLoading">{{ $t("common.showMore") }}</span>
              <span v-else>{{ $t("common.loading") }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div>
    <Footer />
  </div>
</template>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  animation: marquee var(--marquee-duration) linear infinite;
}

.animate-marquee-reverse {
  animation: marquee var(--marquee-duration) linear infinite reverse;
}

.marquee-section {
  position: relative;
}

.edge-gradient {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 110px;
  z-index: 5;
  pointer-events: none;
}

.edge-gradient-left {
  left: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0.85) 25%,
    rgba(0, 0, 0, 0.45) 65%,
    rgba(0, 0, 0, 0) 100%
  );
}

.edge-gradient-right {
  right: 0;
  background: linear-gradient(
    to left,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0.85) 25%,
    rgba(0, 0, 0, 0.45) 65%,
    rgba(0, 0, 0, 0) 100%
  );
}

@media (max-width: 767px) {
  .edge-gradient {
    width: 60px;
  }

  .edge-gradient-left {
    left: 0;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 1) 0%,
      rgba(0, 0, 0, 0.85) 35%,
      rgba(0, 0, 0, 0.4) 75%,
      rgba(0, 0, 0, 0) 100%
    );
  }

  .edge-gradient-right {
    right: 0;
    background: linear-gradient(
      to left,
      rgba(0, 0, 0, 1) 0%,
      rgba(0, 0, 0, 0.85) 35%,
      rgba(0, 0, 0, 0.4) 75%,
      rgba(0, 0, 0, 0) 100%
    );
  }
}
</style>
