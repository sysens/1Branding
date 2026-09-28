<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";

type AppLocale = "ru" | "en";

const root = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let ctx: any = null;
let inited = false;

const initGsap = async () => {
  if (inited || !root.value) return;
  inited = true;

  await nextTick();

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  ctx = gsap.context(() => {
    const el = root.value!;
    const blocks = Array.from(el.querySelectorAll<HTMLElement>(".mission-block"));

    blocks.forEach((block, idx) => {
      const text = block.querySelector<HTMLElement>(".mission-text");
      const img = block.querySelector<HTMLElement>(".mission-img");

      const isEven = idx % 2 === 0;

      if (text) {
        gsap.set(text, {
          x: isEven ? -160 : 160,
          opacity: 0,
        });
      }

      if (img) {
        gsap.set(img, {
          x: isEven ? 160 : -160,
          opacity: 0,
        });
      }

      ScrollTrigger.create({
        trigger: block,
        start: "top 80%",
        once: true,
        onEnter: () => {
          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
          });

          if (text) {
            tl.to(
              text,
              {
                x: 0,
                opacity: 1,
                duration: 0.85,
              },
              0
            );
          }

          if (img) {
            tl.to(
              img,
              {
                x: 0,
                opacity: 1,
                duration: 0.9,
              },
              0.12
            );
          }
        },
      });
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
  const inViewNow = rect.top < window.innerHeight * 1.2 && rect.bottom > 0;
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

const runtimeConfig = useRuntimeConfig();

const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

const { locale } = useI18n<{ message: any }, AppLocale>();
const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

type ImageType = {
  url: string | null;
  alternativeText?: string | null;
};

type Section1 = {
  id: string;
  title: string;
  image: ImageType | null;
};

type Section2Item = {
  title: string;
  text: string;
  image: ImageType | null;
};

type Section3 = {
  title: string;
  subTitle: string;
};

type AboutPage = {
  documentId: string;
  section1: Section1 | null;
  section2: Section2Item[] | null;
  section3: Section3 | null;
};

type GqlRes = {
  data?: {
    aboutPage?: AboutPage | null;
    fallbackAboutPage?: AboutPage | null;
  };
  errors?: Array<{ message: string }>;
};

const query = `
  query AboutPage($locale: I18NLocaleCode) {
    aboutPage(locale: $locale) {
      documentId
      section2 {
        title
        text
        image { url alternativeText }
      }
    }
    # The CMS has no Russian entry yet: fall back to English so the section is not empty.
    fallbackAboutPage: aboutPage(locale: "en") {
      documentId
      section2 {
        title
        text
        image { url alternativeText }
      }
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
  key: computed(() => `about-core-ideas-${gqlLocale.value}`),
  watch: [gqlLocale],
});

const aboutPage = computed(() => data.value?.data?.aboutPage ?? data.value?.data?.fallbackAboutPage ?? null);

const section2 = computed(() => aboutPage.value?.section2 ?? []);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveImage = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

const section2WithImages = computed(() =>
  section2.value.map((item) => ({
    ...item,
    imageSrc: resolveImage(item.image?.url),
  }))
);
</script>

<template>
  <div ref="root" class="section-root">
    <div class="mt-[190px]">
      <div class="containerr bg-[#2A2A2A]/25 rounded-[30px]">
        <div
          v-for="(item, i) in section2WithImages"
          :key="i"
          class="mission-block flex flex-col-reverse items-center md:p-10 py-5 md:gap-[80px] gap-[30px]"
          :class="i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'"
        >
          <div class="mission-text flex-1 will-change-transform">
            <h2
              class="text-[#FFFFFF] font-normal md:pb-[60px] pb-[30px] text-[40px] leading-[100%] tracking-[0]"
            >
              {{ item.title }}
            </h2>
            <p
              class="text-[#FFFFFF] pb-[80px] md:pb-0 font-normal text-[15px] leading-[28px] tracking-[0] font-['Poppins','Inter',sans-serif]"
            >
              {{ item.text }}
            </p>
          </div>

          <NuxtImg
            v-if="item.imageSrc"
            :src="item.imageSrc"
            :alt="item.image?.alternativeText?.trim() || item.title"
            class="mission-img flex-1 md:w-[50%] md:h-[500px] h-[234px] w-full rounded-[30px] will-change-transform"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
