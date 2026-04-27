<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref, computed } from "vue";

type AppLocale = "ru" | "en";
type GsapContext = { revert: () => void };

type Panel = {
  titleGreen: string;
  text: string;
};

type LandingPageRes = {
  data?: {
    landingPage?: {
      section5?: Array<{
        title?: string | null;
        subTitle?: string | null;
      } | null> | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const config = useRuntimeConfig();
const GRAPHQL_URL = (config.public.graphqlUrl as string) || "";
const numberTextVideoPoster = "/home/Rectangle42027.png";
const numberTextVideoSrc = "/home/1Number.mp4";

const { locale } = useI18n();

const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

const LANDING_QUERY = `
query LandingPage($locale: I18NLocaleCode) {
  landingPage(locale: $locale) {
    section5 {
      title
      subTitle
    }
  }
}
`;

const { data: gqlRes } = await useAsyncData<LandingPageRes>(
  "landing-page-section5",
  async () => {
    if (!GRAPHQL_URL) return {};
    return await $fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { query: LANDING_QUERY, variables: { locale: gqlLocale.value } },
    });
  },
  { watch: [gqlLocale] }
);

const panels = computed<Panel[]>(() => {
  const raw = (gqlRes.value?.data?.landingPage?.section5 ?? []).filter(Boolean) as Array<{
    title?: string | null;
    subTitle?: string | null;
  }>;

  const mapped = raw
    .map((x) => ({
      titleGreen: (x.title ?? "").toString(),
      text: (x.subTitle ?? "").toString(),
    }))
    .filter((x) => x.titleGreen.length || x.text.length);

  return mapped;
});

const root = ref<HTMLElement | null>(null);

let ctx: GsapContext | null = null;
let ready = false;

const initGsap = async () => {
  await nextTick();
  await nextTick();
  if (!root.value || ready) return;

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");

  gsap.registerPlugin(ScrollTrigger);

  ctx = gsap.context(() => {
    const host = root.value!;
    const pinWrap = host.querySelector<HTMLElement>(".pin-wrap");
    const items = gsap.utils.toArray<HTMLElement>(host.querySelectorAll(".panel"));

    if (!pinWrap || items.length === 0) return;

    const leftBlock = host.querySelector<HTMLElement>(".left-block");
    const rightBlock = host.querySelector<HTMLElement>(".right-block");

    if (leftBlock) gsap.set(leftBlock, { x: -380, opacity: 0 });
    if (rightBlock) gsap.set(rightBlock, { x: 180, opacity: 0 });

    ScrollTrigger.create({
      trigger: pinWrap,
      start: "top 40%",
      once: true,
      onEnter: () => {
        if (leftBlock) {
          gsap.to(leftBlock, { x: 0, opacity: 1, duration: 0.9, ease: "power3.out" });
        }
        if (rightBlock) {
          gsap.to(rightBlock, { x: 0, opacity: 1, duration: 0.9, delay: 0.12, ease: "power3.out" });
        }
      },
    });

    gsap.set(items, {
      autoAlpha: 0,
      yPercent: 10,
      pointerEvents: "none",
      willChange: "transform, opacity",
    });
    gsap.set(items[0], { autoAlpha: 1, yPercent: 0, pointerEvents: "auto" });

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: pinWrap,
        start: "top top",
        end: () => {
          const viewport = window.innerHeight || 800;
          const segment = Math.min(Math.max(viewport * 0.85, 620), 980);
          return `+=${Math.max(items.length, 2) * segment}`;
        },
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    const holdDuration = 0.9;
    const transitionDuration = 0.65;

    items.forEach((item, i) => {
      if (i > 0) {
        const previousItem = items[i - 1];

        tl.to({}, { duration: holdDuration });
        tl.set(previousItem, { pointerEvents: "none" });
        tl.to(previousItem, {
          autoAlpha: 0,
          yPercent: -10,
          duration: transitionDuration,
        });
        tl.fromTo(
          item,
          { autoAlpha: 0, yPercent: 10, pointerEvents: "none" },
          {
            autoAlpha: 1,
            yPercent: 0,
            pointerEvents: "auto",
            duration: transitionDuration,
          },
          "<"
        );
      }
    });

    tl.to({}, { duration: holdDuration });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });
  }, root.value);

  ready = true;
};

onMounted(async () => {
  await nextTick();
  await initGsap();
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
  ready = false;
});
</script>

<template>
  <div ref="root" class="relative overflow-hidden z-[2]">
    <img
      src="/General/Ellipse (3).png"
      alt=""
      class="absolute right-[-140px] top-[-80px] w-[520px] h-[520px] md:right-[-120px] md:top-[-50px] md:w-[620px] md:h-[620px] lg:right-[-80px] lg:top-0 lg:w-[760px] lg:h-[760px] xl:right-40 xl:top-0 xl:w-[900px] xl:h-[900px] object-contain pointer-events-none select-none z-[2]"
    />
    <img
      src="/General/Ellipse (5).png"
      alt=""
      class="absolute right-[-140px] bottom-[-120px] w-[520px] h-[520px] md:right-[-120px] md:bottom-[-80px] md:w-[620px] md:h-[620px] lg:right-[-80px] lg:bottom-0 lg:w-[760px] lg:h-[760px] xl:right-40 xl:bottom-0 xl:w-[900px] xl:h-[900px] object-contain pointer-events-none select-none z-[2]"
    />

    <div class="containerr bg-transparent">
      <div
        class="pin-wrap flex flex-col md:flex-row items-center md:items-center xl:items-end justify-center md:justify-between xl:justify-end gap-y-8 md:gap-y-0 md:gap-x-6 lg:gap-x-10 xl:gap-x-0 px-[18px] md:px-[30px] lg:px-[40px] xl:px-0 py-[40px] md:py-[70px] xl:py-[6.25rem] overflow-hidden"
      >
        <div
          class="main left-block flex-1 flex justify-center md:justify-start relative left-0 md:left-0 lg:left-4 xl:left-[8.75rem] w-full max-w-[360px] md:max-w-[380px] lg:max-w-[430px] xl:max-w-none z-0"
        >
          <video
            class="relative z-[1] top-0 md:top-[20px] lg:top-[0px] xl:top-[0px] w-[281px] h-[383px] md:w-[310px] md:h-[430px] lg:w-[460px] lg:h-[800px] xl:w-[29.5625rem] xl:h-[61rem] object-cover scale-[1] md:scale-[1] lg:scale-[1.08] xl:scale-150"
            autoplay
            muted
            loop
            playsinline
            preload="metadata"
            :poster="numberTextVideoPoster"
          >
            <source :src="numberTextVideoSrc" type="video/mp4" />
          </video>
        </div>

        <div
          class="main right-block flex-1 relative w-full z-10 right-0 md:right-0 lg:right-4 xl:right-[8.75rem] xl:self-center xl:-translate-y-20 min-h-[260px] h-[32vh] md:h-[360px] lg:h-[420px] xl:h-full xl:min-h-[320px] flex items-center"
        >
          <div class="relative w-full h-full overflow-visible">
            <div
              v-for="(p, i) in panels"
              :key="i"
              class="panel absolute inset-0 h-full flex flex-col justify-center will-change-transform z-10"
            >
              <h1
                class="font-normal uppercase text-center text-[#03CB00] leading-[100%] tracking-[0] text-[40px] md:text-[46px] lg:text-[56px] xl:text-[4rem]"
              >
                {{ p.titleGreen }}
              </h1>

              <p
                class="font-light font-['Poppins','Inter',sans-serif] text-center text-[#cccccc] leading-[120%] tracking-[0] px-2 md:px-4 lg:px-6 py-6 md:py-8 lg:py-10 text-[14px] md:text-[16px] lg:text-[20px] xl:text-[1.5rem] max-w-[640px] mx-auto"
              >
                {{ p.text }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
