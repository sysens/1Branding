<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type AppLocale = "ru" | "en";

type Props = {
  rows?: number;
  durationSeconds?: number;
};

const props = withDefaults(defineProps<Props>(), {
  rows: 2,
  durationSeconds: 200,
});

gsap.registerPlugin(ScrollTrigger);

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const { locale } = useI18n<{ message: any }, AppLocale>();
const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);
const fallbackLocale: AppLocale = "en";

type Media = { url: string | null };

type ProjectNode = {
  documentId: string;
  createdAt?: string | null;
  section1: {
    projectTitle?: string | null;
    images: Media[] | null;
  } | null;
} | null;

type CategoryNode = {
  categoryName: string;
  projects_connection: {
    nodes: ProjectNode[];
  } | null;
} | null;

type GqlRes = {
  data?: {
    categories_connection?: {
      nodes?: CategoryNode[];
    } | null;
    fallbackCategoriesConnection?: {
      nodes?: CategoryNode[];
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const query = `
  query CategoriesConnection($locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode) {
    categories_connection(locale: $locale) {
      nodes {
        categoryName
        projects_connection(
          pagination: { page: 1, pageSize: 10 }
          sort: "createdAt:desc"
        ) {
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
    fallbackCategoriesConnection: categories_connection(locale: $fallbackLocale) {
      nodes {
        categoryName
        projects_connection(
          pagination: { page: 1, pageSize: 10 }
          sort: "createdAt:desc"
        ) {
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
  }
`;

const { data: gqlData } = await useFetch<GqlRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: computed(() => ({
    query,
    variables: { locale: gqlLocale.value, fallbackLocale },
  })),
  key: computed(() => `categories-connection-marquee-${gqlLocale.value}`),
  watch: [gqlLocale],
});

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveMedia = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

const localePath = useLocalePath();
const router = useRouter();

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

type MarqueeItem = {
  key: string;
  title: string;
  src: string;
  to: string;
};

const marqueeItems = computed<MarqueeItem[]>(() => {
  const current = gqlData.value?.data?.categories_connection?.nodes ?? [];
  const fallback = gqlData.value?.data?.fallbackCategoriesConnection?.nodes ?? [];
  const categories = current.length ? current : fallback;

  const base = categories.flatMap((cat, catIdx) => {
    const projects = cat?.projects_connection?.nodes ?? [];

    return projects
      .map((project, projectIdx) => {
        const id = project?.documentId?.trim() || "";
        const title =
          project?.section1?.projectTitle?.trim() ||
          cat?.categoryName?.trim() ||
          "Project";
        const raw = project?.section1?.images?.[0]?.url ?? "";
        const src = resolveMedia(raw);

        if (!id || !src) return null;

        return {
          key: `${catIdx}-${projectIdx}-${id}`,
          title,
          src,
          to: localePath(`/ProjectSlug/${id}`),
        };
      })
      .filter(Boolean) as MarqueeItem[];
  });

  if (base.length === 0) return [];

  const min = 8;
  const times = Math.max(2, Math.ceil(min / base.length));

  return Array.from({ length: base.length * times }, (_, i) => {
    const item = base[i % base.length];
    return { ...item, key: `${item.key}-x${i}` };
  });
});

const marqueeDuration = computed(() => `${props.durationSeconds}s`);

const rowsConfig = computed(() => {
  const total = Math.max(0, Number(props.rows) || 0);

  return Array.from({ length: total }, (_, idx) => {
    const isReverse = idx % 2 === 1;

    return {
      key: `row-${idx}`,
      animClass: isReverse ? "animate-marquee-reverse" : "animate-marquee",
    };
  });
});

const root = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
let ctx: any = null;
let inited = false;

const initGsap = async () => {
  if (inited || !root.value) return;
  inited = true;

  await nextTick();

  ctx?.revert();
  ctx = null;

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
          duration: 0.9,
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
};

onMounted(() => {
  if (!root.value) return;

  const rect = root.value.getBoundingClientRect();
  const inViewNow = rect.top < window.innerHeight && rect.bottom > 0;
  if (inViewNow) initGsap();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) initGsap();
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
  <div ref="root">
    <section
      class="marquee-section relative bg-black w-full overflow-hidden flex items-center"
    >
      <div class="edge-gradient edge-gradient-left"></div>
      <div class="edge-gradient edge-gradient-right"></div>

      <div class="w-[120%] -ml-[10%] relative z-[1]">
        <div class="w-full overflow-hidden space-y-2">
          <div
            v-for="row in rowsConfig"
            :key="row.key"
            class="flex w-max will-change-transform"
            :class="row.animClass"
            :style="{ '--marquee-duration': marqueeDuration }"
          >
            <div class="flex items-center gap-2 px-1">
              <a
                v-for="item in marqueeItems"
                :key="row.key + '-a-' + item.key"
                :href="item.to"
                class="shrink-0 block"
                @click.prevent="navigateSafely(item.to)"
              >
                <img
                  :src="item.src"
                  :alt="item.title"
                  class="md:h-[17.0625rem] h-[142px] md:w-[30.375rem] w-[252px] shrink-0 object-cover rounded-[20px] md:rounded-[1.875rem] select-none"
                  draggable="false"
                />
              </a>
            </div>

            <div class="flex items-center gap-2 px-1" aria-hidden="true">
              <a
                v-for="item in marqueeItems"
                :key="row.key + '-b-' + item.key"
                :href="item.to"
                class="shrink-0 block"
                tabindex="-1"
                @click.prevent="navigateSafely(item.to)"
              >
                <img
                  :src="item.src"
                  :alt="item.title"
                  class="md:h-[17.0625rem] h-[142px] md:w-[30.375rem] w-[252px] shrink-0 object-cover rounded-[20px] md:rounded-[1.875rem] select-none"
                  draggable="false"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <a
      :href="localePath('/Projects')"
      class="text-white mx-auto mt-[80px] mb-[50px] bg-[url('/home/Component3.png')] md:w-[16.25rem] w-[219px] md:h-[3.75rem] h-[50px] rounded-[32px] bg-[size:120%] bg-[position:100%_50%] transition-[background-position,background-size,box-shadow] duration-1000 ease-[cubic-bezier(.4,0,.2,1)] hover:bg-[size:140%] hover:bg-[position:0%_50%] hover:shadow-[0_0_30px_rgba(3,203,0,0.9)] flex items-center justify-center text-center"
      @click.prevent="navigateSafely(localePath('/Projects'))"
    >
      {{ $t("aboutPage.moreButton") }}
    </a>
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
    width: 50px;
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
