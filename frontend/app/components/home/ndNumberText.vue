<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref, computed, watch } from "vue";
import BlurText from "~/components/ui/BlurText.vue";
import type { LandingSection5Item } from "~/types/landingPayload";

type GsapContext = { revert: () => void };

type Panel = {
  titleGreen: string;
  text: string;
};

type ScrollProgressState = {
  progress: number;
};

const props = withDefaults(
  defineProps<{
    section?: Array<LandingSection5Item | null> | null;
  }>(),
  {
    section: null,
  }
);

const capitalizeText = (value: string) =>
  value
    .toLocaleLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_, prefix: string, char: string) => {
      return prefix + char.toLocaleUpperCase();
    });

const panels = computed<Panel[]>(() => {
  const raw = (props.section ?? []).filter(
    (item): item is LandingSection5Item => item !== null
  );

  const mapped = raw
    .map((x) => ({
      titleGreen: capitalizeText((x.title ?? "").toString()),
      text: capitalizeText((x.subTitle ?? "").toString()),
    }))
    .filter((x) => x.titleGreen.length || x.text.length);

  return mapped;
});

const root = ref<HTMLElement | null>(null);
const scrollProgress = ref(0);
const PIN_HEADER_OFFSET_PX = 118;
const TALL_VIEWPORT_HEIGHT_PX = 1400;
const EXTRA_TALL_VIEWPORT_HEIGHT_PX = 2200;

const getPinSegmentDistance = () => {
  const viewport = window.innerHeight || 800;

  if (viewport >= EXTRA_TALL_VIEWPORT_HEIGHT_PX) {
    return 300;
  }

  if (viewport >= TALL_VIEWPORT_HEIGHT_PX) {
    return 360;
  }

  return Math.min(Math.max(viewport * 0.42, 360), 560);
};

let ctx: GsapContext | null = null;
let ready = false;

const clampProgress = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
};

const activePanelIndex = computed(() => {
  const count = panels.value.length;

  if (count <= 1) {
    return 0;
  }

  return Math.min(count - 1, Math.round(clampProgress(scrollProgress.value) * (count - 1)));
});

const activeDescription = computed(() => {
  const panel = panels.value[activePanelIndex.value];

  return panel?.text ?? "";
});

const activeTitle = computed(() => {
  const panel = panels.value[activePanelIndex.value];

  return panel?.titleGreen || panel?.text || "";
});

const setScrollProgress = (state: ScrollProgressState) => {
  scrollProgress.value = clampProgress(state.progress);
};

const initGsap = async () => {
  await nextTick();
  await nextTick();
  if (!root.value || ready) return;

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");

  gsap.registerPlugin(ScrollTrigger);

  ctx?.revert();
  ctx = null;
  scrollProgress.value = 0;

  ctx = gsap.context(() => {
    const host = root.value!;
    const pinWrap = host.querySelector<HTMLElement>(".pin-wrap");

    if (!pinWrap) return;

    const leftBlock = host.querySelector<HTMLElement>(".left-block");
    const rightBlock = host.querySelector<HTMLElement>(".right-block");
    const panelCount = Math.max(panels.value.length, 2);

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

    ScrollTrigger.create({
      trigger: pinWrap,
      start: () =>
        window.innerWidth >= 768 ? `top ${PIN_HEADER_OFFSET_PX}px` : "top top",
      end: () => `+=${panelCount * getPinSegmentDistance()}`,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: setScrollProgress,
      onRefresh: setScrollProgress,
    });

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

watch(
  () => panels.value.length,
  async () => {
    if (!process.client) return;

    ready = false;
    await initGsap();
  }
);

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
  ready = false;
  scrollProgress.value = 0;
});
</script>

<template>
  <div ref="root" class="relative overflow-hidden z-[2]">
    <div class="containerr bg-transparent">
      <div
        class="pin-wrap flex flex-col md:flex-row items-center md:items-center xl:items-center justify-center md:justify-between xl:justify-center gap-y-6 md:gap-y-0 md:gap-x-6 lg:gap-x-8 xl:gap-x-16 px-[18px] md:px-[30px] lg:px-[40px] xl:px-0 py-7 md:py-10 lg:py-12 xl:py-10 overflow-hidden"
      >
        <div
          class="main left-block flex-1 flex justify-center md:justify-center relative left-0 md:left-0 lg:left-4 xl:left-[3.5rem] w-full max-w-[320px] md:max-w-[350px] lg:max-w-[420px] xl:max-w-[32rem] z-0"
        >
          <video
            class="electric-one-number relative z-[1] top-[-24px] md:top-[-32px] lg:top-[-40px] xl:top-[-36px] w-[220px] h-[310px] md:w-[260px] md:h-[370px] lg:w-[330px] lg:h-[500px] xl:w-[22rem] xl:h-[34rem] scale-[1] md:scale-[1.02] lg:scale-[1.04] xl:scale-100 object-contain"
            autoplay
            loop
            muted
            playsinline
            preload="auto"
            aria-hidden="true"
          >
            <source src="/home/1Number.mp4" type="video/mp4" />
          </video>
        </div>

        <div
          class="main right-block flex-1 relative w-full z-10 right-0 md:right-0 lg:right-4 xl:right-[4rem] 2xl:right-[5rem] xl:self-center xl:max-w-[52rem] min-h-[260px] h-[32vh] md:h-[360px] lg:h-[420px] xl:h-full xl:min-h-[320px] flex items-center"
        >
          <div class="relative w-full h-full overflow-visible">
            <div
              class="panel absolute inset-0 h-full flex flex-col items-center justify-center will-change-transform z-10"
            >
              <BlurText
                :key="`title-${activePanelIndex}`"
                :text="activeTitle"
                :delay="85"
                :step-duration="0.28"
                animate-by="words"
                direction="top"
                tag="h2"
                class="nd-gooey-title"
              />

              <BlurText
                :key="`description-${activePanelIndex}`"
                :text="activeDescription"
                :delay="18"
                :step-duration="0.24"
                animate-by="words"
                direction="bottom"
                tag="p"
                class="nd-gooey-description"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./ndNumberText.css"></style>
