<!-- app/pages/ProjectSlug/[id].vue -->
<script setup lang="ts">
import Spinner from "~/components/Spinner.vue";

import ColorSection from "~/components/ProjectSlug/ColorSection.vue";
import ProjectBigPic from "~/components/ProjectSlug/ProjectBigPic.vue";
import ProjectGrid from "~/components/ProjectSlug/ProjectGrid.vue";
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { useI18n } from "vue-i18n";

type AppLocale = "ru" | "en";

const { locale } = useI18n<{ message: any }, AppLocale>();
const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

const root = ref<HTMLElement | null>(null);
let ctx: any = null;

onMounted(async () => {
  await nextTick();

  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
    const el = root.value;
    if (!el) return;

    const title = el.querySelector<HTMLElement>(".hero-title");
    const text = el.querySelector<HTMLElement>(".hero-text");

    if (title) {
      gsap.fromTo(
        title,
        { x: -160, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
      );
    }

    if (text) {
      gsap.fromTo(
        text,
        { x: 160, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
      );
    }
  });
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

const route = useRoute();
const documentId = computed(() => String(route.params.id || ""));

type Media = { url: string | null; documentId?: string | null };

type ProjectsPage = {
  projectColor?: string | null;

  section1: {
    projectTitle: string;
    text: string;
    images_connection: { nodes: Media[] } | null;
  } | null;

  section2: {
    title: string;
    text: string;
    id: string;
    image: Media | null;
  } | null;

  section3: {
    id: string;
    title: string;
    text: string;
    colorCard: Array<{ HexColorCode: string; id: string }> | null;
  } | null;
};

type GqlRes = {
  data?: { projectsPage?: ProjectsPage | null };
  errors?: Array<{ message: string }>;
};

const query = `
  query ProjectsPage($documentId: ID!, $locale: I18NLocaleCode) {
    projectsPage(documentId: $documentId, locale: $locale) {
      projectColor
      section1 {
        projectTitle
        text
        images_connection {
          nodes { url }
        }
      }
      section2 {
        title
        text
        id
        image {
          documentId
          url
        }
      }
      section3 {
        id
        title
        text
        colorCard {
          HexColorCode
          id
        }
      }
    }
  }
`;

const { data, error, pending } = await useFetch<GqlRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: computed(() => ({
    query,
    variables: { documentId: documentId.value, locale: gqlLocale.value },
  })),
  key: computed(() => `projects-page-${documentId.value}-${String(gqlLocale.value)}`),
  watch: [documentId, gqlLocale],
  server: false,
});

const page = computed(() => data.value?.data?.projectsPage ?? null);

const section1 = computed(() => page.value?.section1 ?? null);
const section2 = computed(() => page.value?.section2 ?? null);
const section3 = computed(() => page.value?.section3 ?? null);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveMedia = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

const images = computed(() => {
  const nodes = section1.value?.images_connection?.nodes ?? [];
  return nodes.map((m) => resolveMedia(m?.url ?? "")).filter(Boolean);
});

const s2Image = computed(() => resolveMedia(section2.value?.image?.url ?? null));

const gqlErrors = computed(
  () => data.value?.errors?.map((e) => e.message).join(" | ") || ""
);

const topSrc = computed(() => images.value[0] || "");
const bottomLeftSrc = computed(() => images.value[1] || "");
const bottomRightSrc = computed(() => images.value[2] || "");

const projectImages = computed(() => images.value);

const normalizedColor = computed(() => {
  const c = (page.value?.projectColor || "").trim();
  if (!c) return "";
  if (c.startsWith("#")) return c;
  return "#" + c;
});

const headerGlowStyle = computed(() => {
  const c = normalizedColor.value;
  if (!c) return {};
  return {
    background: `radial-gradient(ellipse at center, ${c}70 0%, ${c}35 35%, transparent 70%)`,
    filter: "blur(26px)",
    opacity: "0.9",
  } as Record<string, string>;
});

const loading = computed(() => pending.value || !data.value || !!gqlErrors.value);
</script>

<template>
  <div ref="root" class="relative overflow-x-hidden bg-black">
    <Spinner v-if="loading" src="/General/IMG_5528.mp4" :size="542" />

    <div class="edge-gradient edge-gradient-left edge-gradient-strong"></div>
    <div class="edge-gradient edge-gradient-right edge-gradient-strong"></div>

    <div class="relative z-10">
      <div class="bg bg-cover bg-center bg-no-repeat">
        <div class="relative md:pt-[60px] pt-[30px]">
          <div
            class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 -z-10 h-[140px] w-[92%] max-w-[1400px] rounded-full"
            :style="headerGlowStyle"
          ></div>
          <div class="m">
            <Header />
          </div>

          <div
            class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-1 -z-10 h-[440px] w-[92%] max-w-[1400px] rounded-full"
            :style="headerGlowStyle"
          ></div>
        </div>

        <div class="md:py-[115px] md:pt-[114px] pt-[20px]">
          <div
            v-if="section1"
            class="md:flex nline-block containerr gap-[147px] mt-[120px] items-center justify-between"
          >
            <div class="flex-1">
              <h1
                class="hero-title flex-1 font-normal text-[#FFFFFF] md:text-[62px] leading-[120%] tracking-[0] text-[40px] md:text-start text-center md:pb-0 pb-[40px]"
              >
                {{ section1.projectTitle }}
              </h1>
            </div>

            <div class="flex-1">
              <h2
                class="hero-text font-normal md:text-[16px] text-[#FFFFFF] md:tracking-[0] text-[13px] leading-[120%] tracking-normal md:text-start text-center md:pb-0 pb-[50px] font-['Poppins','Inter',sans-serif]"
              >
                {{ section1.text }}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div
        class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-1 -z-10 h-[440px] w-[92%] max-w-[1400px] rounded-full"
        :style="headerGlowStyle"
      ></div>

      <div>
        <ProjectGrid
          v-if="!loading"
          :images="projectImages"
          :top-src="topSrc"
          :bottom-left-src="bottomLeftSrc"
          :bottom-right-src="bottomRightSrc"
        />

        <ProjectBigPic
          v-if="!loading"
          :title="section2?.title"
          :text="section2?.text"
          :image="s2Image"
        />
      </div>

      <ColorSection
        v-if="!loading"
        :title="section3?.title"
        :text="section3?.text"
        :colors="section3?.colorCard"
      />

      <div v-if="!GRAPHQL_URL || error || gqlErrors" class="hidden">
        {{ !GRAPHQL_URL ? $t("common.graphqlUrlEmpty") : "" }}
        {{ (error as any)?.message || "" }}
        {{ gqlErrors }}
      </div>
    </div>
    <Footer />
  </div>
</template>
