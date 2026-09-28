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

    const heading = el.querySelector<HTMLElement>(".team-heading");
    const text = el.querySelector<HTMLElement>(".team-text");

    const imgLeft = el.querySelector<HTMLElement>(".img-left");
    const imgCenter = el.querySelector<HTMLElement>(".img-center");
    const imgRight = el.querySelector<HTMLElement>(".img-right");

    if (heading) {
      gsap.set(heading, { y: 24, opacity: 0 });
    }

    if (text) {
      gsap.set(text, { y: 24, opacity: 0 });
    }

    if (imgLeft) {
      gsap.set(imgLeft, { x: -160, opacity: 0 });
    }

    if (imgCenter) {
      gsap.set(imgCenter, { y: 160, opacity: 0, scale: 0.94 });
    }

    if (imgRight) {
      gsap.set(imgRight, { x: 160, opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        if (heading) {
          tl.to(
            heading,
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
            },
            0
          );
        }

        if (text) {
          tl.to(
            text,
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
            },
            0.08
          );
        }

        if (imgLeft) {
          tl.to(
            imgLeft,
            {
              x: 0,
              opacity: 1,
              duration: 0.85,
            },
            0.16
          );
        }

        if (imgCenter) {
          tl.to(
            imgCenter,
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.9,
            },
            0.24
          );
        }

        if (imgRight) {
          tl.to(
            imgRight,
            {
              x: 0,
              opacity: 1,
              duration: 0.85,
            },
            0.32
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
    { threshold: 0.15 }
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

type ImageType = { url: string | null; alternativeText?: string | null };

type Section3 = {
  title: string;
  subTitle: string;
  creatorsImages: ImageType[] | null;
};

type GqlRes = {
  data?: {
    aboutPage?: {
      section3?: Section3 | null;
    } | null;
    fallbackAboutPage?: {
      section3?: Section3 | null;
    } | null;
  };
};

const query = `
  query AboutPage($locale: I18NLocaleCode) {
    aboutPage(locale: $locale) {
      section3 {
        title
        subTitle
        creatorsImages { url alternativeText }
      }
    }
    # The CMS has no Russian entry yet: fall back to English so the section is not empty.
    fallbackAboutPage: aboutPage(locale: "en") {
      section3 {
        title
        subTitle
        creatorsImages { url alternativeText }
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
  key: computed(() => `about-creators-${gqlLocale.value}`),
  watch: [gqlLocale],
});

const section3 = computed(() => (data.value?.data?.aboutPage ?? data.value?.data?.fallbackAboutPage)?.section3 ?? null);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveImage = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};

const section3Images = computed(() =>
  (section3.value?.creatorsImages ?? [])
    .map((img) => ({ src: resolveImage(img.url), alt: img.alternativeText?.trim() || section3.value?.title || "" }))
    .filter((img) => Boolean(img.src))
);

const lastThree = computed(() => {
  const last = section3Images.value.slice(-3);
  return {
    left: last[0],
    center: last[1],
    right: last[2],
  };
});
</script>

<template>
  <div ref="root">
    <div class="md:pt-[130px] pt-[80px] md:pb-[60px]">
      <div v-if="section3" class="containerr">
        <div>
          <h2
            class="team-heading text-[#FFFFFF] font-normal md:text-[50px] text-[40px] leading-[100%] tracking-[0] text-center"
          >
            {{ section3.title }}
          </h2>

          <p
            class="team-text font-normal text-[#FFFFFFCC]/80 pt-[20px] pb-[60px] md:text-[20px] md:leading-[31px] text-[14px] leading-[120%] tracking-[0] text-center font-['Poppins','Inter',sans-serif]"
          >
            {{ section3.subTitle }}
          </p>

          <div class="md:h-[531px] h-full md:flex block gap-[10px]">
            <div class="flex-1 h-full">
              <NuxtImg
                v-if="lastThree.left"
                :src="lastThree.left.src"
                :alt="lastThree.left.alt"
                class="img-left w-full md:h-full h-[300px] object-cover pb-[10px] md:pb-0 block md:rounded-l-[30px] rounded-t-[20px] md:rounded-t-[0px] md:rounded-tl-[20px] will-change-transform"
              />
            </div>

            <div class="flex-1 h-full">
              <NuxtImg
                v-if="lastThree.center"
                :src="lastThree.center.src"
                :alt="lastThree.center.alt"
                class="img-center w-full md:h-full h-[300px] pb-[10px] md:pb-0 object-cover block will-change-transform"
              />
            </div>

            <div class="flex-1 h-full">
              <NuxtImg
                v-if="lastThree.right"
                :src="lastThree.right.src"
                :alt="lastThree.right.alt"
                class="img-right w-full md:h-full h-[300px] object-cover block md:rounded-r-[30px] rounded-b-[20px] md:rounded-b-[0px] md:rounded-br-[20px] will-change-transform"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
