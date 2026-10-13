<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import type { OneGuaranteeSection4 } from "~/types/landingPayload";

type AppLocale = "ru" | "en";
type GsapContext = { revert: () => void };

const root = ref<HTMLElement | null>(null);
const earthDivesVideo = ref<HTMLVideoElement | null>(null);
const shouldLoadVideo = ref(false);
const earthDivesVideoPoster = "/home/earth.webp";
const earthDivesVideoSrc = "/home/earth-dives.mp4";

let observer: IntersectionObserver | null = null;
let videoObserver: IntersectionObserver | null = null;
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
    const el = root.value!;

    const titleEl = el.querySelector("h2");
    const leftImg = el.querySelector(".left-earth");
    const items = el.querySelectorAll(".row-item");

    if (titleEl) {
      gsap.set(titleEl, { y: 36, opacity: 0 });
    }

    if (leftImg) {
      gsap.set(leftImg, { x: -160, opacity: 0, scale: 0.94 });
    }

    if (items.length) {
      gsap.set(items, { x: 160, opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        if (titleEl) {
          tl.to(
            titleEl,
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
            },
            0
          );
        }

        if (leftImg) {
          tl.to(
            leftImg,
            {
              x: 0,
              opacity: 1,
              scale: 1,
              duration: 0.95,
            },
            0.08
          );
        }

        if (items.length) {
          tl.to(
            items,
            {
              x: 0,
              opacity: 1,
              duration: 0.75,
              stagger: 0.12,
            },
            0.16
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
    { threshold: 0, rootMargin: "300px 0px 300px 0px" }
  );

  observer.observe(root.value);

  const video = earthDivesVideo.value;
  if (!video) return;

  videoObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        shouldLoadVideo.value = true;
        void nextTick(async () => {
          try {
            await video.play();
          } catch {
            // Browser autoplay policy may require the first user interaction.
          }
        });
        return;
      }

      video.pause();
    },
    { threshold: 0, rootMargin: "600px 0px 600px 0px" }
  );

  videoObserver.observe(video);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;

  videoObserver?.disconnect();
  videoObserver = null;
  earthDivesVideo.value?.pause();

  ctx?.revert();
  ctx = null;

  inited = false;
});

const { t, locale } = useI18n();

const props = withDefaults(
  defineProps<{
    section?: OneGuaranteeSection4 | null;
  }>(),
  {
    section: null,
  }
);

type Media = { url: string | null };

type Card = {
  title: string;
  description: string;
  icon: Media | null;
};

type Section4 = {
  title?: string;
  cards?: Card[];
};

const { own: guarantee, fallback: fallbackGuarantee } = await useOneGuaranteePage();

const section4 = computed(
  () => props.section ?? guarantee.value?.section4 ?? null
);
const fallbackSection4 = computed(() => fallbackGuarantee.value?.section4 ?? null);

// The heading keeps its i18n copy; only the cards come from the English entry.
const sectionTitle = computed(() => section4.value?.title || t("home.earthDives.title"));

const cards = computed<Card[]>(() =>
  ((section4.value?.cards?.length ? section4.value.cards : fallbackSection4.value?.cards) ?? []).map((card) => ({
    title: card.title ?? "",
    description: card.description ?? "",
    icon: card.icon?.url ? { url: card.icon.url } : null,
  }))
);

const fallbackCards = computed<Card[]>(() =>
  Array.from({ length: 3 }, () => ({
    title: t("home.earthDives.fallbackTitle"),
    description: t("home.earthDives.fallbackDesc"),
    icon: null,
  }))
);

const displayCards = computed<Card[]>(() => {
  const cmsCards = cards.value
    .filter((card) => Boolean(card?.title || card?.description || card?.icon?.url))
    .slice(0, 3);

  return [...cmsCards, ...fallbackCards.value].slice(0, 3);
});

const resolveMedia = useCmsMedia();
</script>

<template>
  <div ref="root" class="relative md:pb-[7.5rem] md:pt-[3.75rem]">
    <img
      src="/General/Ellipse (5).png"
      alt=""
      class="absolute right-1 md:top-9 top-[35%] w-[900px] md:w-[37.5rem] h-[900px] md:object-contain oject-fit pointer-events-none select-none -z-10"
    />

    <div class="containerr relative z-1">
      <h2
        class="font-normal md:text-[3.875rem] text-white md:leading-[7.5rem] text-center md:tracking-normal text-[40px] leading-[68px] tracking-[0%]"
      >
        {{ sectionTitle }}
      </h2>

      <div class="md:flex inline-block md:gap-7 gap-2 place-items-center">
        <div class="main flex-1 flex justify-center md:py-0 py-[40px]">
          <video
            ref="earthDivesVideo"
            class="left-earth-video left-earth w-[252px] h-[270px] md:w-[39.3125rem] md:h-[42.0625rem] object-cover"
            muted
            loop
            playsinline
            :preload="shouldLoadVideo ? 'metadata' : 'none'"
            :poster="earthDivesVideoPoster"
            :src="shouldLoadVideo ? earthDivesVideoSrc : undefined"
          >
          </video>
        </div>

        <div class="main flex-1">
          <div class="rowSection flex flex-col md:gap-[1.875rem] gap-[16px]">
            <div
              v-for="(card, i) in displayCards"
              :key="i"
              class="row-item item md:h-[10rem] h-[130px] border-[1px] border-[#FFFFFF1F] flex items-center md:gap-[1.875rem] gap-[20px] md:rounded-[1.875rem] rounded-[20px] bg-[#0D0D0D] md:p-[1.875rem] md:px-[1.875rem] px-[10px] md:py-[2.25rem] py-[20px] bg-gradient-to-r from-[#0D0D0D] to-[#1f1e1e]"
            >
              <div class="shrink-0">
                <img
                  class="md:w-[4.375rem] md:h-[4.375rem] w-[40px] h-[40px] object-contain"
                  :src="resolveMedia(card.icon?.url) || '/home/rowthree.jpg'"
                  alt=""
                />
              </div>

              <div>
                <h2
                  class="text-[#FFFFFF] font-semibold md:text-[1.25rem] leading-[100%] md:tracking-wider text-[16px] tracking-[0%]"
                >
                  {{ card.title }}
                </h2>
                <p
                  class="text-[#808080] font-normal line-clamp-4 md:pt-[1.875rem] pt-[10px] md:text-[0.9375rem] leading-[120%] md:tracking-normal text-[13px] tracking-[0%]"
                >
                  {{ card.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
