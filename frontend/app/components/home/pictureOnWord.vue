<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";

type AppLocale = "ru" | "en";
type GsapContext = { revert: () => void };
type TranslationFunction = (key: string) => string;

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const i18n = useI18n();
const locale = i18n.locale;
const translate: TranslationFunction = (key) => i18n.t(key);

type Media = { url?: string | null };

type LandingRes = {
  data?: {
    landingPage?: {
      section6?: {
        text1?: string | null;
        text2?: string | null;
        image?: Media | null;
      } | null;
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
      section6 {
        text1
        text2
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
  key: "landing-section6",
  watch: [gqlLocale],
});

const s6 = computed(() => data.value?.data?.landingPage?.section6 ?? null);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveMedia = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

const imageSrc = computed(
  () => resolveMedia(s6.value?.image?.url ?? null) || "/home/aaaa.png"
);

const topText = computed(() => s6.value?.text1 || translate("home.pictureOnWord.top"));

const bottomText = computed(() => s6.value?.text2 || translate("home.pictureOnWord.bottom"));

const splitText = (s: string) => {
  const text = (s || "").trim();
  if (!text) return { green: "", white: "" };
  const idx = text.indexOf(" ");
  if (idx === -1) return { green: text, white: "" };
  return { green: text.slice(0, idx), white: text.slice(idx) };
};

const topParts = computed(() => splitText(topText.value));
const bottomParts = computed(() => splitText(bottomText.value));

const root = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;
let ctx: GsapContext | null = null;
let inited = false;

const initGsap = async () => {
  if (inited || !root.value) return;
  inited = true;

  await nextTick();

  const gsapModule = await import("gsap");
  const stModule = await import("gsap/ScrollTrigger");

  const gsap = gsapModule.gsap;
  const ScrollTrigger = stModule.ScrollTrigger;

  gsap.registerPlugin(ScrollTrigger);

  ctx = gsap.context(() => {
    const topTextEl = root.value!.querySelector(".top-text");
    const bottomTextEl = root.value!.querySelector(".bottom-text");
    const centerImg = root.value!.querySelector(".center-image");

    if (topTextEl) {
      gsap.set(topTextEl, { x: -180, opacity: 0 });
    }

    if (bottomTextEl) {
      gsap.set(bottomTextEl, { x: 180, opacity: 0 });
    }

    if (centerImg) {
      gsap.set(centerImg, { opacity: 0, scale: 0.92, y: 24 });
    }

    ScrollTrigger.create({
      trigger: root.value,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        if (centerImg) {
          tl.to(
            centerImg,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.9,
            },
            0
          );
        }

        if (topTextEl) {
          tl.to(
            topTextEl,
            {
              x: 0,
              opacity: 1,
              duration: 0.85,
            },
            0.08
          );
        }

        if (bottomTextEl) {
          tl.to(
            bottomTextEl,
            {
              x: 0,
              opacity: 1,
              duration: 0.85,
            },
            0.18
          );
        }
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
  <div class="relative">
    <img
      src="/General/Ellipse (5).png"
      alt=""
      class="absolute left-20 top-0 w-[900px] h-[900px] md:object-contain object-fit pointer-events-none select-none -z-10"
    />
    <img
      src="/General/Ellipse (3).png"
      alt=""
      class="absolute right-20 bottom-0 w-[900px] h-[900px] md:object-contain object-fit ointer-events-none select-none -z-10"
    />

    <section
      ref="root"
      class="relative z-[1] containerr min-h-[520px] w-full h-[700px] overflow-hidden"
    >
      <div
        class="top-text absolute z-[5] w-full text-center"
      >
        <h2
          class="font-normal tracking-[0%] text-[30px] leading-[100%] md:text-[46px] md:leading-[120%]"
        >
          <span
            class="text-[#19ff00] font-normal tracking-[0%] text-[30px] leading-[120%] md:text-[46px] md:leading-normal"
          >
            {{ topParts.green }}
          </span>
          <span class="text-white">{{ topParts.white }}</span>
        </h2>
      </div>

      <div
        class="center-image absolute left-1/2 md:top-[43%] top-[50%] z-[2] w-[300px] h-[360px] md:w-[38rem] md:h-full -translate-x-1/2 -translate-y-1/2 rounded-[80px]"
      >
        <img
          class="rounded-[30px] absolute w-full h-full md:object-contain"
          :src="imageSrc"
          alt=""
        />
      </div>

      <div
        class="bottom-text flex justify-center items-center text-center absolute z-[5] bottom-[23%] md:bottom-[18%] w-full"
      >
        <h1
          class="font-normal tracking-[0%] text-[30px] leading-[120%] md:text-[45px] md:leading-[120%] w-[80%] md:w-[60%]"
        >
          <span class="text-[#19ff00]">{{ bottomParts.green }}</span>
          <span class="text-white break-words">{{ bottomParts.white }}</span>
        </h1>
      </div>
    </section>
  </div>
</template>
