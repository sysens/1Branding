<template>
  <div>
    <div
      class="pb-5 md:pt-[150px] pt-[60px] mt-[117px] bg-gradient-to-t from-[#000000] to-[#0c0c0d] px-[20px]"
    >
      <footer class="containerr">
        <div class="flex justify-between mx-auto max-w-[1172px] items-center">
          <div class="md:flex w-[66%] justify-between">
            <div class="upsItems flex pb-[60px] md:pb-0 justify-between">
              <NuxtLink
                :to="localePath('/')"
                @click="onInternalLinkClick($event, localePath('/'))"
              >
                <img class="w-[98px] h-[60px]" src="/home/logoNewwwwwwwwww.png" alt="" />
              </NuxtLink>
            </div>

            <div class="upsItems flex flex-col gap-[30] text-white">
              <NuxtLink
                class="pb-[30px] font-['Inter'] font-light text-[20px] leading-[1.2] tracking-normal transition-colors duration-300 hover:text-[#03CB00]"
                :to="localePath('/')"
                @click="onInternalLinkClick($event, localePath('/'))"
              >
                {{ $t("nav.home") }}
              </NuxtLink>

              <NuxtLink
                class="pb-[30px] font-['Inter'] font-light text-[20px] leading-[1.2] tracking-normal transition-colors duration-300 hover:text-[#03CB00]"
                :to="localePath('/About')"
                @click="onInternalLinkClick($event, localePath('/About'))"
              >
                {{ $t("nav.about") }}
              </NuxtLink>

              <NuxtLink
                class="pb-[30px] font-['Inter'] font-light text-[20px] leading-[1.2] tracking-normal transition-colors duration-300 hover:text-[#03CB00]"
                :to="localePath('/Costs')"
                @click="onInternalLinkClick($event, localePath('/Costs'))"
              >
                {{ $t("nav.prices") }}
              </NuxtLink>

              <NuxtLink
                class="pb-[30px] font-['Inter'] font-light text-[20px] leading-[1.2] tracking-normal transition-colors duration-300 hover:text-[#03CB00]"
                :to="localePath('/ContactPage')"
                @click="onInternalLinkClick($event, localePath('/ContactPage'))"
              >
                {{ $t("nav.contacts") }}
              </NuxtLink>
            </div>

            <div class="upsItems flex flex-col text-white">
              <NuxtLink
                v-for="c in lastPageCats"
                :key="c.documentId"
                class="pb-[30px] font-['Inter'] font-light text-[20px] leading-[1.2] tracking-normal transition-colors duration-300 hover:text-[#03CB00]"
                :to="localePath(`/ProductSlug/${c.documentId}`)"
                @click="
                  onInternalLinkClick($event, localePath(`/ProductSlug/${c.documentId}`))
                "
              >
                {{ c.categoryName }}
              </NuxtLink>
            </div>
          </div>

          <div class="upsItems flex flex-col text-white">
            <NuxtLink
              class="pb-[30px] font-['Inter'] font-light text-[20px] leading-[1.2] tracking-normal transition-colors duration-300 hover:text-[#03CB00]"
              :to="localePath('/Oneguarantee')"
              @click="onInternalLinkClick($event, localePath('/Oneguarantee'))"
            >
              {{ $t("brand.one") }}{{ $t("brand.oneGuaranteeSuffix") }}
            </NuxtLink>

            <NuxtLink
              class="pb-[30px] font-['Inter'] font-light text-[20px] leading-[1.2] tracking-normal transition-colors duration-300 hover:text-[#03CB00]"
              :to="{ path: localePath('/Projects') }"
              @click="onInternalLinkClick($event, localePath('/Projects'))"
            >
              {{ $t("nav.projects") }}
            </NuxtLink>

            <NuxtLink
              class="pb-[30px] font-['Inter'] font-light text-[20px] leading-[1.2] tracking-normal transition-colors duration-300 hover:text-[#03CB00]"
              :to="localePath('/News')"
              @click="onInternalLinkClick($event, localePath('/News'))"
            >
              {{ $t("nav.news") }}
            </NuxtLink>

            <NuxtLink
              class="pb-[30px] font-['Inter'] font-light text-[20px] leading-[1.2] tracking-normal transition-colors duration-300 hover:text-[#03CB00]"
              :to="localePath('/Costs')"
              @click="onInternalLinkClick($event, localePath('/Costs'))"
            >
              {{ $t("footer.services") }}
            </NuxtLink>
          </div>
        </div>

        <div
          class="down pt-[100px] flex flex-col-reverse md:flex-row md:justify-between md:items-center"
        >
          <div>
            <h1
              class="left font-['Inter'] font-light text-[16px] leading-[1.2] pb-[10px] tracking-normal text-[#FFFFFF] md:pb-0"
            >
              @ {{ currentYear }} {{ $t("footer.copyright") }}
            </h1>
          </div>

          <div class="socialMedia flex gap-[18px] mb-[20px] md:mb-0">
            <a
              :href="telegramLink"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex"
              @click="onExternalLinkClick($event, telegramLink)"
            >
              <img src="/footer/Vector(7).png" alt="" />
            </a>

            <a
              :href="instagramLink"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex"
              @click="onExternalLinkClick($event, instagramLink)"
            >
              <img src="/footer/Vector(8).png" alt="" />
            </a>

            <a
              :href="behanceLink"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex"
              @click="onExternalLinkClick($event, behanceLink)"
            >
              <img src="/footer/Vector(9).png" alt="" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";

type AppLocale = "ru" | "en";

type CategoryNode = { documentId: string; categoryName: string } | null;

type GqlRes = {
  data?: { categories_connection?: { nodes?: CategoryNode[] } | null };
  errors?: Array<{ message: string }>;
};

type FooterSocialsRes = {
  data?: {
    footer?: {
      socialMedia?: {
        instagramLink?: string | null;
        behanceLink?: string | null;
        telegramLink?: string | null;
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();
const nuxtApp = useNuxtApp();

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

const { locale } = useI18n<{ message: any }, any>();
const gqlLocale = computed<AppLocale>(() =>
  String(locale.value) === "en" ? "en" : "ru"
);

const lastPageCats = ref<{ documentId: string; categoryName: string }[]>([]);

const makeQuery = (p: number, ps: number) => `
  query CategoriesConnection($locale: I18NLocaleCode) {
    categories_connection(pagination: { page: ${p}, pageSize: ${ps} }, locale: $locale) {
      nodes {
        documentId
        categoryName
      }
    }
  }
`;

const fetchFirstPage = async (ps: number) => {
  if (!GRAPHQL_URL) return;

  const query = makeQuery(1, ps);

  const res = await $fetch<GqlRes>(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { query, variables: { locale: gqlLocale.value } },
  });

  const nodes = (res?.data?.categories_connection?.nodes ?? []).filter(Boolean) as {
    documentId: string;
    categoryName: string;
  }[];

  lastPageCats.value = nodes.slice(0, ps);
};

await fetchFirstPage(4);

watch(
  gqlLocale,
  async () => {
    await fetchFirstPage(4);
  },
  { immediate: false }
);

const FOOTER_SOCIALS_QUERY = `
  query FooterSocials($locale: I18NLocaleCode) {
    footer(locale: $locale) {
      socialMedia {
        instagramLink
        behanceLink
        telegramLink
      }
    }
  }
`;

const { data: footerGql } = await useAsyncData<FooterSocialsRes>(
  () => `footer-socials-${gqlLocale.value}`,
  async () => {
    if (!GRAPHQL_URL) return {};
    return await $fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { query: FOOTER_SOCIALS_QUERY, variables: { locale: gqlLocale.value } },
    });
  },
  { watch: [gqlLocale] }
);

const instagramLink = computed(
  () =>
    footerGql.value?.data?.footer?.socialMedia?.instagramLink ||
    "https://www.instagram.com/"
);

const behanceLink = computed(
  () =>
    footerGql.value?.data?.footer?.socialMedia?.behanceLink || "https://www.behance.net"
);

const telegramLink = computed(
  () =>
    footerGql.value?.data?.footer?.socialMedia?.telegramLink || "https://web.telegram.org"
);

const currentYear = new Date().getFullYear();

const getLenis = () => {
  return (nuxtApp as any).$lenis as
    | {
        scrollTo?: (to: number | string | HTMLElement, opts?: any) => void;
        stop?: () => void;
        start?: () => void;
      }
    | undefined;
};

const getTop = (el: HTMLElement) => {
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  const rect = el.getBoundingClientRect();
  return rect.top + y;
};

const HASH_OFFSET = 120;

const scrollToHash = async () => {
  if (!process.client) return;
  if (!route.hash) return;

  const id = route.hash.replace("#", "");
  if (!id) return;

  await nextTick();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;

      const lenis = getLenis();
      const top = Math.max(0, getTop(el) - HASH_OFFSET);

      if (lenis?.scrollTo) {
        lenis.scrollTo(top, {
          duration: 0.9,
          immediate: false,
          force: true,
        });
        return;
      }

      window.scrollTo({
        top,
        behavior: "auto",
      });
    });
  });
};

const isModifiedEvent = (event: MouseEvent) => {
  return !!(
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
};

const normalizeTo = (to: string) => {
  if (!to) return "/";
  return to;
};

const onInternalLinkClick = async (event: MouseEvent, to: string) => {
  if (!process.client) return;
  if (isModifiedEvent(event)) return;

  event.preventDefault();
  event.stopPropagation();

  const target = normalizeTo(to);
  const currentFullPath = router.currentRoute.value.fullPath;

  if (currentFullPath === target) {
    if (target.includes("#")) {
      await scrollToHash();
    }
    return;
  }

  try {
    await navigateTo(target);
    return;
  } catch {
    try {
      await router.push(target);
      return;
    } catch {
      window.location.href = target;
    }
  }
};

const onExternalLinkClick = (event: MouseEvent, url: string) => {
  if (!process.client) return;
  if (!url) return;
  if (isModifiedEvent(event)) return;

  event.preventDefault();
  event.stopPropagation();

  try {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = url;
    }
  } catch {
    window.location.href = url;
  }
};

watch(
  () => route.hash,
  async () => {
    await scrollToHash();
  }
);

watch(
  () => route.fullPath,
  async () => {
    await nextTick();
    await scrollToHash();
  }
);

onMounted(async () => {
  await nextTick();
  await scrollToHash();
});
</script>
