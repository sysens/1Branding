<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { useI18n } from "vue-i18n";

let ctx: any = null;

onMounted(async () => {
  await nextTick();
  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
    const main = document.querySelector<HTMLElement>(".gsapDiv");
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

const route = useRoute();

const documentId = computed(() => {
  const p: any = route.params;
  const v =
    typeof p?.id === "string"
      ? p.id
      : typeof p?.documentId === "string"
      ? p.documentId
      : "";
  return v || "";
});

type Media = { url: string | null };

type NewsItem = {
  documentId?: string | null;
  title?: string | null;
  createdAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  image?: Media | null;
  text?: string | null;
  images_connection?: { nodes: Media[] } | null;
};

type GqlRes = {
  data?: {
    newsPage?: NewsItem | null;
    fallbackNewsPage?: NewsItem | null;
  };
  errors?: Array<{ message: string }>;
};

const query = `
  query NewsPage($documentId: ID!, $locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode) {
    newsPage(documentId: $documentId, locale: $locale) {
      documentId
      title
      createdAt
      publishedAt
      updatedAt
      image { url }
      text
      images_connection {
        nodes { url }
      }
    }
    fallbackNewsPage: newsPage(documentId: $documentId, locale: $fallbackLocale) {
      documentId
      title
      createdAt
      publishedAt
      updatedAt
      image { url }
      text
      images_connection {
        nodes { url }
      }
    }
  }
`;

const { data, error } = await useFetch<GqlRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: computed(() => ({
    query,
    variables: {
      documentId: documentId.value,
      locale: gqlLocale.value,
      fallbackLocale,
    },
  })),
  key: computed(() => `news-page-${documentId.value}-${String(gqlLocale.value)}`),
  watch: [documentId, gqlLocale],
});

const news = computed(
  () => data.value?.data?.newsPage ?? data.value?.data?.fallbackNewsPage ?? null
);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveImage = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = apiBase.value;
  if (url.startsWith("/")) return base + url;
  return base + "/" + url;
};

const title = computed(() => (news.value?.title ?? "").toString());
const text = computed(() => (news.value?.text ?? "").toString());
const heroImageSrc = computed(() => resolveImage(news.value?.image?.url));

const createdAt = computed(() => {
  const raw =
    news.value?.createdAt || news.value?.publishedAt || news.value?.updatedAt || "";

  if (!raw) return "";

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}.${month}.${year}`;
});

const images = computed(() => news.value?.images_connection?.nodes ?? []);
const leftImg = computed(() => resolveImage(images.value?.[0]?.url));
const rightImg = computed(() => resolveImage(images.value?.[1]?.url));

const gqlErrors = computed(
  () => data.value?.errors?.map((e) => e.message).join(" | ") || ""
);
</script>

<template>
  <div class="mb-[133px]">
    <div>
      <div class="products">
        <div
          class="flex gap-2 justify-center items-center md:pt-[120px] pt-[120px] md:pb-[60px] pb-[37px]"
        >
          <p
            class="font-normal text-[16px] text-white leading-[28px] tracking-normal font-['Poppins','Inter',sans-serif]"
          ></p>
        </div>

        <h1
          class="text-white max-w-[1000px] mx-auto md:font-normal md:mb-[60px] mb-[40px] md:text-[62px] md:leading-[62px] md:tracking-normal font-normal text-[40px] leading-[120%] tracking-[0%] text-center px-[20px] md:px-0"
        >
          {{ title }}
        </h1>
      </div>

      <div>
        <NuxtImg
          v-if="heroImageSrc"
          :src="heroImageSrc"
          :alt="title"
          class="gsapDiv md:h-[700px] h-[542px] object-cover rounded-[30px] w-full"
        />
      </div>

      <p
        class="leftBlock md:font-normal md:columns-2 my-[40px] gap-[100px] md:text-[16px] md:leading-[28px] md:tracking-normal text-[#FFFFFF] font-light text-[14px] leading-[28px] tracking-[0%] font-['Poppins','Inter',sans-serif]"
      >
        {{ text }}
      </p>

      <div class="md:flex justify-between gap-[10px]">
        <div class="md:w-[34%] md:h-[531px] h-[300px] mb-[5px]">
          <img
            v-if="leftImg"
            :src="leftImg"
            class="leftSide leftImg w-full h-full object-cover md:rounded-l-[30px] mb-[5px]"
          />
        </div>

        <div class="md:w-[66%] md:h-[531px] h-[300px]">
          <img
            v-if="rightImg"
            :src="rightImg"
            class="rightSide rightImg w-full h-full object-cover md:rounded-r-[30px] rounded-b-[20px] md:rounded-b-[0px]"
          />
        </div>
      </div>

      <div v-if="!GRAPHQL_URL" class="mt-6 text-white">
        {{ $t("common.graphqlUrlEmpty") }}
      </div>
      <div v-else-if="error" class="mt-6 text-white break-all">
        {{ (error as any)?.message || error }}
      </div>
      <div v-else-if="gqlErrors" class="mt-6 text-white break-all">
        {{ gqlErrors }}
      </div>
    </div>
  </div>
</template>
