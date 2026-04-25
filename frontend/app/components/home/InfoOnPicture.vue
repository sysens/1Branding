<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";

type AppLocale = "ru" | "en";

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";

const { locale } = useI18n<{ message: any }, AppLocale>();

type Media = { url?: string | null };

type LandingRes = {
  data?: {
    landingPage?: {
      section10?: Array<{
        title?: string | null;
        description?: string | null;
        image?: Media | null;
      }> | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

const query = `
  query LandingPage($locale: I18NLocaleCode) {
    landingPage(locale: $locale) {
      section10 {
        title
        description
        image { url }
      }
    }
  }
`;

const { data } = await useFetch<LandingRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: computed(() => ({
    query,
    variables: { locale: gqlLocale.value },
  })),
  server: false,
  key: "landing-section10",
  watch: [gqlLocale],
});

const page = computed(() => data.value?.data?.landingPage ?? null);
const s10 = computed(() => page.value?.section10 ?? []);

const firstBlock = computed(() => s10.value[0] ?? null);
const secondBlock = computed(() => s10.value[1] ?? null);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveMedia = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

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
    const leftCols = el.querySelectorAll<HTMLElement>(".left-col");
    const rightCols = el.querySelectorAll<HTMLElement>(".right-col");

    leftCols.forEach((item) => {
      gsap.set(item, { x: -160, opacity: 0 });
    });

    rightCols.forEach((item) => {
      gsap.set(item, { x: 160, opacity: 0 });
    });

    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        leftCols.forEach((item, index) => {
          tl.to(
            item,
            {
              x: 0,
              opacity: 1,
              duration: 0.9,
            },
            index * 0.12
          );
        });

        rightCols.forEach((item, index) => {
          tl.to(
            item,
            {
              x: 0,
              opacity: 1,
              duration: 0.9,
            },
            index * 0.12 + 0.14
          );
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

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) initGsap();
    },
    {
      threshold: 0,
      rootMargin: "250px 0px 250px 0px",
    }
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
  <div ref="root" class="relative">
    <img
      src="/General/Ellipse (3).png"
      alt=""
      class="absolute left-1/2 bottom-[250px] -translate-x-1/2 w-[900px] h-[900px] object-contain pointer-events-none select-none -z-10"
    />

    <img
      src="/General/Ellipse (3).png"
      alt=""
      class="absolute right-[1200px] top-[280px] w-[900px] h-[900px] object-contain pointer-events-none select-none -z-10"
    />

    <div class="mt-10 md:pb-[2.5rem]">
      <div
        class="main containerr block md:flex md:items-center md:justify-center gap-[150px]"
      >
        <div class="left-col div item flex-1 max-w-[587px] will-change-transform">
          <h1 class="text-[#FFFFFF] font-normal text-[48px] leading-[120%] tracking-[0%]">
            {{ firstBlock?.title }}
          </h1>

          <p
            class="md:pt-[3.125rem] pt-[30px] md:pb-[5.4375rem] pb-[30px] font-['Poppins','Inter',sans-serif] font-normal text-[15px] leading-[120%] text-[#808080] tracking-[0%]"
          >
            {{ firstBlock?.description }}
          </p>
        </div>

        <div class="right-col will-change-transform">
          <img
            class="md:w-[587px] md:h-[430px] h-[264px] object-cover rounded-[30px] opacity-100"
            :src="resolveMedia(firstBlock?.image?.url)"
            alt=""
          />
        </div>
      </div>

      <div
        class="main containerr flex-row-reverse block md:flex md:items-center md:justify-center gap-[150px]"
      >
        <div class="left-col div item flex-1 max-w-[587px] will-change-transform">
          <h1
            class="text-[#FFFFFF] font-normal md:pt-0 pt-[30px] text-[48px] leading-[120%] tracking-[0%]"
          >
            {{ secondBlock?.title }}
          </h1>

          <p
            class="md:pt-[3.125rem] pt-[30px] md:pb-[5.4375rem] pb-[30px] font-['Poppins','Inter',sans-serif] font-normal text-[15px] leading-[120%] text-[#808080] tracking-[0%]"
          >
            {{ secondBlock?.description }}
          </p>
        </div>

        <div class="right-col will-change-transform">
          <img
            class="md:w-[587px] md:h-[430px] h-[264px] object-cover rounded-[30px] opacity-100"
            :src="resolveMedia(secondBlock?.image?.url)"
            alt=""
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
