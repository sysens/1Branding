<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref, computed } from "vue";
import type { Swiper as SwiperInstance } from "swiper/types";

type AppLocale = "ru" | "en";
type GsapContext = { revert: () => void };
type LenisController = {
  scrollTo: (
    target: number,
    options?: {
      duration?: number;
      easing?: (value: number) => number;
      immediate?: boolean;
      lock?: boolean;
    }
  ) => void;
};
type LenisAwareNuxtApp = ReturnType<typeof useNuxtApp> & {
  $lenis?: LenisController;
};
type ScrollTriggerController = {
  update: () => void;
};

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
let detachInteractions: (() => void) | null = null;

const isCoarsePointer = () =>
  process.client && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

const isTouchInside = (target: EventTarget | null, host: HTMLElement) =>
  target instanceof Node ? host.contains(target) : false;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const smoothTo = (to: number, ms = 650) => {
  const nuxtApp = useNuxtApp() as LenisAwareNuxtApp;
  const lenis = nuxtApp.$lenis;

  if (lenis?.scrollTo) {
    lenis.scrollTo(to, {
      duration: ms / 1000,
      easing: easeInOutCubic,
      immediate: false,
      lock: true,
    });
    return;
  }

  const start = window.scrollY || document.documentElement.scrollTop || 0;
  const diff = to - start;
  if (Math.abs(diff) < 2) return;

  const startTime = performance.now();

  const tick = (now: number) => {
    const p = Math.min(1, (now - startTime) / ms);
    const y = start + diff * easeInOutCubic(p);
    window.scrollTo(0, y);
    if (p < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

const getTop = (el: HTMLElement) => {
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  const rect = el.getBoundingClientRect();
  return rect.top + y;
};

const tickSt = (scrollTrigger: ScrollTriggerController, frames = 14) => {
  let n = 0;
  const f = () => {
    scrollTrigger.update();
    n += 1;
    if (n < frames) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
};

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
    const brandsTarget = root.value!.querySelector<HTMLElement>(".brands-target");

    if (!pinWrap || items.length === 0) return;

    const clampIndex = (n: number) => Math.max(0, Math.min(items.length - 1, n));

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
          gsap.to(leftBlock, {
            x: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
          });
        }

        if (rightBlock) {
          gsap.to(rightBlock, {
            x: 0,
            opacity: 1,
            duration: 0.9,
            delay: 0.12,
            ease: "power3.out",
          });
        }
      },
    });

    gsap.set(items, { opacity: 0, yPercent: 12, pointerEvents: "none" });
    gsap.set(items[0], { opacity: 1, yPercent: 0, pointerEvents: "auto" });

    let active = 0;
    let animating = false;

    const goTo = (index: number) => {
      const i = clampIndex(index);
      if (i === active) return;
      if (animating) return;

      const prev = items[active];
      const next = items[i];
      if (!prev || !next) return;

      animating = true;

      const dir = i > active ? 1 : -1;

      gsap.set(prev, { pointerEvents: "none" });
      gsap.set(next, { pointerEvents: "none" });

      gsap
        .timeline({
          defaults: { ease: "power2.out", duration: 0.42 },
          onComplete: () => {
            active = i;
            gsap.set(items, { pointerEvents: "none" });
            const cur = items[active];
            if (cur) gsap.set(cur, { pointerEvents: "auto" });
            animating = false;
          },
        })
        .to(prev, { opacity: 0, yPercent: -12 * dir }, 0)
        .fromTo(
          next,
          { opacity: 0, yPercent: 12 * dir },
          { opacity: 1, yPercent: 0 },
          0.02
        );
    };

    const stepPx = 260;
    const extraPx = 180;
    const total = Math.max(0, items.length - 1) * stepPx + extraPx;

    const st = ScrollTrigger.create({
      trigger: pinWrap,
      start: "top top",
      end: `+=${total}`,
      pin: true,
      scrub: false,
      anticipatePin: 1,
      onUpdate: (self) => {
        const idx = Math.round(self.progress * (items.length - 1));
        goTo(idx);
      },
      onLeave: () => {
        if (!brandsTarget) return;
        const y = getTop(brandsTarget);
        smoothTo(y, 650);
      },
    });

    const getEdge = (edge: "start" | "end") => {
      const value = st[edge];
      return typeof value === "number" ? value : 0;
    };

    const jumpOutDown = () => {
      const end = getEdge("end");
      window.scrollTo(0, end + 2);
      ScrollTrigger.update();
    };

    const jumpOutUp = () => {
      const start = getEdge("start");
      window.scrollTo(0, Math.max(0, start - 2));
      ScrollTrigger.update();
    };

    const getSnapY = (targetIndex: number) => {
      const last = Math.max(1, items.length - 1);
      const idx = clampIndex(targetIndex);
      const p = idx / last;

      const start = getEdge("start");
      const end = getEdge("end");

      return start + p * (end - start);
    };

    let wheelAcc = 0;
    let wheelResetTimer: number | null = null;
    const WHEEL_THRESHOLD = 120;
    let lastY = 0;
    let touchActive = false;
    let touchAcc = 0;
    const TOUCH_THRESHOLD = 70;

    const onWheel = (e: WheelEvent) => {
      if (!st.isActive) return;

      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      if (d > 0 && active >= items.length - 1) {
        e.preventDefault();
        jumpOutDown();
        return;
      }

      if (d < 0 && active <= 0) {
        e.preventDefault();
        jumpOutUp();
        return;
      }

      e.preventDefault();

      wheelAcc += d;

      if (wheelResetTimer) window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelAcc = 0;
        wheelResetTimer = null;
      }, 120);

      if (Math.abs(wheelAcc) < WHEEL_THRESHOLD) return;
      if (animating) return;

      const nextIndex = clampIndex(wheelAcc > 0 ? active + 1 : active - 1);
      wheelAcc = 0;

      goTo(nextIndex);

      const y = getSnapY(nextIndex);
      smoothTo(y, 520);
      tickSt(ScrollTrigger, 16);
    };

    const enableCustomWheel = !isCoarsePointer();
    const enableCustomTouch = isCoarsePointer();

    const onTouchStart = (e: TouchEvent) => {
      if (!enableCustomTouch || !st.isActive) return;
      if (!isTouchInside(e.target, host)) return;
      if (!e.touches || e.touches.length === 0) return;

      touchActive = true;
      lastY = e.touches[0].clientY;
      touchAcc = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!enableCustomTouch || !st.isActive || !touchActive) return;
      if (!isTouchInside(e.target, host)) return;
      if (!e.touches || e.touches.length === 0) return;

      const y = e.touches[0].clientY;
      const dy = lastY - y;
      if (Math.abs(dy) < 4) return;

      if (dy > 18 && active >= items.length - 1) {
        e.preventDefault();
        jumpOutDown();
        touchActive = false;
        touchAcc = 0;
        return;
      }

      if (dy < -18 && active <= 0) {
        e.preventDefault();
        jumpOutUp();
        touchActive = false;
        touchAcc = 0;
        return;
      }

      e.preventDefault();

      touchAcc += dy;
      lastY = y;

      if (Math.abs(touchAcc) < TOUCH_THRESHOLD) return;
      if (animating) return;

      const nextIndex = clampIndex(touchAcc > 0 ? active + 1 : active - 1);
      touchAcc = 0;

      goTo(nextIndex);

      const snapY = getSnapY(nextIndex);
      smoothTo(snapY, 560);
      tickSt(ScrollTrigger, 16);
    };

    const onTouchEnd = () => {
      touchActive = false;
      touchAcc = 0;
    };

    if (enableCustomWheel) {
      window.addEventListener("wheel", onWheel, { passive: false });
    }

    if (enableCustomTouch) {
      host.addEventListener("touchstart", onTouchStart, { passive: true });
      host.addEventListener("touchmove", onTouchMove, { passive: false });
      host.addEventListener("touchend", onTouchEnd, { passive: true });
      host.addEventListener("touchcancel", onTouchEnd, { passive: true });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });

    detachInteractions = () => {
      if (enableCustomWheel) {
        window.removeEventListener("wheel", onWheel);
      }
      if (enableCustomTouch) {
        host.removeEventListener("touchstart", onTouchStart);
        host.removeEventListener("touchmove", onTouchMove);
        host.removeEventListener("touchend", onTouchEnd);
        host.removeEventListener("touchcancel", onTouchEnd);
      }
      if (wheelResetTimer) window.clearTimeout(wheelResetTimer);
      st.kill();
      detachInteractions = null;
    };
  }, root.value);

  ready = true;
};

onMounted(async () => {
  await nextTick();
  await initGsap();
});

onBeforeUnmount(() => {
  detachInteractions?.();
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
            class="relative z-[1] top-0 md:top-[20px] lg:top-[0px] xl:top-[0px] w-[281px] h-[383px] md:w-[310px] md:h-[430px] lg:w-[460px] lg:h-[800px] xl:w-[29.5625rem] xl:h-[50.8125rem] object-cover scale-[1] md:scale-[1] lg:scale-[1.08] xl:scale-150"
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
          class="main right-block flex-1 relative w-full z-10 right-0 md:right-0 lg:right-4 xl:right-[8.75rem] min-h-[260px] h-[32vh] md:h-[360px] lg:h-[420px] xl:h-full xl:min-h-[320px] flex items-center"
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
