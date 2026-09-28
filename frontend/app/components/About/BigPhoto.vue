<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";

type AppLocale = "ru" | "en";

const root = ref<HTMLElement | null>(null);
let ctx: any = null;

onMounted(async () => {
  if (!root.value) return;

  await nextTick();

  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
    const img = root.value!.querySelector(".mission-img");

    if (!img) return;

    gsap.fromTo(
      img,
      {
        y: 80,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 0.5,
        ease: "power3.out",
      }
    );
  }, root.value);
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

const { locale } = useI18n<{ message: any }, AppLocale>();
const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

type AboutPage = {
  documentId: string;
  section1: { id: string; title: string; image: { url: string | null; alternativeText?: string | null } | null } | null;
  section3: { title: string; subTitle: string } | null;
};

type GqlRes = {
  data?: { aboutPage?: AboutPage | null };
  errors?: Array<{ message: string }>;
};

const query = `
  query AboutPage($locale: I18NLocaleCode) {
    aboutPage(locale: $locale) {
      documentId
      section1 { id title image { url alternativeText } }
      section3 { title subTitle }
    }
  }
`;

const { data } = await useFetch<GqlRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: computed(() => ({
    query,
    variables: { locale: gqlLocale.value },
  })),
  key: computed(() => `about-team-photo-${gqlLocale.value}`),
  watch: [gqlLocale],
});

const aboutPage = computed(() => data.value?.data?.aboutPage ?? null);
const section1 = computed(() => aboutPage.value?.section1 ?? null);
const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const imageSrc = computed(() => {
  const url = section1.value?.image?.url;
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
});
</script>

<template>
  <div class="mt-10px">
    <div ref="root" class="containerr">
      <div class="flex items-center">
        <NuxtImg
          v-if="imageSrc"
          :src="imageSrc"
          :alt="section1?.image?.alternativeText?.trim() || section1?.title || ''"
          class="mission-img w-full md:h-[700px] h-[366px] object-cover md:rounded-[30px] rounded-[20px]"
        />
      </div>
    </div>
  </div>
</template>
