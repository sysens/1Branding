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
    const headWrap = el.querySelector<HTMLElement>(".eff-head");
    const listWrap = el.querySelector<HTMLElement>(".eff-list");

    if (headWrap) {
      gsap.set(headWrap, { x: 260, opacity: 0 });
    }

    if (listWrap) {
      gsap.set(listWrap, { x: -260, opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        if (headWrap) {
          tl.to(
            headWrap,
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
            },
            0
          );
        }

        if (listWrap) {
          tl.to(
            listWrap,
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

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = (runtimeConfig.public.graphqlUrl as string) || "";
const { t, locale } = useI18n<{ message: any }, AppLocale>();

const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

type WhyItem = {
  text: string;
  checkMark?: {
    url?: string | null;
  } | null;
};

type GqlRes = {
  data?: {
    oneGuarantee?: {
      section5?: {
        title?: string;
        whyItWorks?: WhyItem[];
      };
    };
  };
};

const query = `
  query Section5($locale: I18NLocaleCode) {
    oneGuarantee(locale: $locale) {
      section5 {
        title
        whyItWorks {
          text
          checkMark { url }
        }
      }
    }
  }
`;

const { data } = await useFetch<GqlRes>(GRAPHQL_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: computed(() => ({ query, variables: { locale: gqlLocale.value } })),
  key: computed(() => `one-guarantee-section5-${gqlLocale.value}`),
  watch: [gqlLocale],
});

const section5 = computed(() => data.value?.data?.oneGuarantee?.section5);

const title = computed(() => section5.value?.title || t("oneGuarantee.reasonsTitle"));

const items = computed<WhyItem[]>(() => section5.value?.whyItWorks || []);

const apiBase = computed(() => GRAPHQL_URL.replace(/\/graphql\/?$/, ""));

const resolveImg = (url?: string | null) => {
  if (!url) return "/OneGuarantee/subway_tick (1).png";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return apiBase.value + url;
  return apiBase.value + "/" + url;
};
</script>

<template>
  <div
    ref="root"
    class="div max-w-[746px] pt-[100px] md:mb-[377px] mb-[175px] mx-auto md:px-0 md:[40px]"
  >
    <div class="eff-head will-change-transform">
      <h2
        class="font-normal md:text-[62px] md:leading-[100%] md:tracking-tighter text-[#FFFFFF] mb-[80px] text-[40px] leading-[120%] tracking-normal text-center font-['Inter']"
      >
        {{ title }}
      </h2>
    </div>

    <div class="eff-list will-change-transform">
      <div class="flex flex-col mx-[20px] md:gap-[45px] gap-[25px]">
        <div
          v-for="(item, i) in items"
          :key="i"
          class="Item flex shrink-0 items-center gap-[30px]"
        >
          <div class="shrink-0 w-[40px] h-[35px]">
            <img
              class="w-[40px] h-[35px]"
              :src="resolveImg(item.checkMark?.url)"
              alt=""
            />
          </div>

          <div>
            <p
              class="font-light md:text-[24px] md:leading-[28px] tracking-normal text-[#FFFFFF] text-[14px] leading-[120%] font-['Inter']"
            >
              {{ item.text }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
