<template>
  <div class="relative h-full overflow-hidden">
    <div
      class="pb-[1.125rem] pt-[4.375rem] min-[950px]:pb-[3.375rem] min-[950px]:pt-[9.625rem] min-[1100px]:pb-[3.625rem] min-[1100px]:pt-[9.875rem] min-[1200px]:pb-[4rem] min-[1200px]:pt-[7rem]"
    ></div>

    <ClientOnly>
      <div
        class="flex flex-col gap-[0.625rem] min-[950px]:gap-[0.75rem] min-[1100px]:gap-[0.8125rem] min-[1200px]:gap-[0.875rem]"
      >
        <div
          v-for="(category, categoryIndex) in priceCategories"
          :key="`${category.title}-${categoryIndex}`"
          class="pricingBorderSync relative w-full px-[0.75rem] min-[950px]:px-[2rem] min-[1100px]:px-[2.8rem] min-[1200px]:px-[3.5rem]"
        >
          <h2
            class="relative z-10 text-center md:top-10 text-[2.25rem] pb-[30px] md:pb-0 font-normal pt-[50px] leading-[100%] text-white min-[950px]:text-[2.3rem] min-[1100px]:text-[2.7rem] min-[1200px]:text-[3.125rem]"
          >
            {{ category.title }}
          </h2>

          <button
            :ref="(el) => setPrevRef(categoryIndex, el)"
            class="absolute left-[0.25rem] top-1/2 z-30 flex h-[3rem] w-[3rem] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[url('/home/Component3.png')] bg-[length:440%] bg-right bg-no-repeat transition-[background-size,box-shadow] duration-700 ease-out hover:bg-[length:420%] hover:shadow-[0_0_1.875rem_rgba(3,203,0,0.9)] min-[950px]:left-[0.4rem] min-[950px]:h-[3.3rem] min-[950px]:w-[3.3rem] min-[1100px]:left-[0.6rem] min-[1100px]:h-[4rem] min-[1100px]:w-[4rem] min-[1200px]:left-[0.75rem] min-[1200px]:h-[4.5rem] min-[1200px]:w-[4.5rem]"
            aria-label="Prev"
            type="button"
          >
            <img
              class="h-[1rem] w-[1rem] min-[950px]:h-[1.0625rem] min-[950px]:w-[1.0625rem] min-[1100px]:h-[1.125rem] min-[1100px]:w-[1.125rem] min-[1200px]:h-[1.25rem] min-[1200px]:w-[1.25rem]"
              src="/News/Vector (10).png"
              alt=""
            />
          </button>

          <button
            :ref="(el) => setNextRef(categoryIndex, el)"
            class="absolute right-[0.25rem] top-1/2 z-30 flex h-[3rem] w-[3rem] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[url('/home/Component3.png')] bg-[length:440%] bg-right bg-no-repeat transition-[background-size,box-shadow] duration-700 ease-out hover:bg-[length:420%] hover:shadow-[0_0_1.875rem_rgba(3,203,0,0.9)] min-[950px]:right-[0.4rem] min-[950px]:h-[3.3rem] min-[950px]:w-[3.3rem] min-[1100px]:right-[0.6rem] min-[1100px]:h-[4rem] min-[1100px]:w-[4rem] min-[1200px]:right-[0.75rem] min-[1200px]:h-[4.5rem] min-[1200px]:w-[4.5rem]"
            aria-label="Next"
            type="button"
          >
            <img
              class="h-[1rem] w-[1rem] min-[950px]:h-[1.0625rem] min-[950px]:w-[1.0625rem] min-[1100px]:h-[1.125rem] min-[1100px]:w-[1.125rem] min-[1200px]:h-[1.25rem] min-[1200px]:w-[1.25rem]"
              src="/News/Vector (11).png"
              alt=""
            />
          </button>

          <Swiper
            effect="coverflow"
            :centered-slides="true"
            :grab-cursor="true"
            :loop="false"
            :initial-slide="getInitialSlide(category.pricing)"
            :slides-per-view="3"
            :space-between="20"
            :observer="true"
            :observe-parents="true"
            :update-on-window-resize="true"
            :watch-slides-progress="true"
            :keyboard="{ enabled: true }"
            :navigation="false"
            :pagination="false"
            :modules="modules"
            :coverflow-effect="{
              rotate: 0,
              stretch: 0,
              depth: 260,
              modifier: 0,
              slideShadows: false,
            }"
            :breakpoints="{
              0: {
                slidesPerView: 1,
                spaceBetween: 14,
                centeredSlides: true,
                coverflowEffect: {
                  rotate: 0,
                  stretch: 0,
                  depth: 160,
                  modifier: 0,
                  slideShadows: false,
                },
              },
              950: {
                slidesPerView: 3,
                spaceBetween: 6,
                centeredSlides: true,
                coverflowEffect: {
                  rotate: 0,
                  stretch: 0,
                  depth: 260,
                  modifier: 0,
                  slideShadows: false,
                },
              },
              1100: {
                slidesPerView: 3,
                spaceBetween: 10,
                centeredSlides: true,
                coverflowEffect: {
                  rotate: 0,
                  stretch: 0,
                  depth: 420,
                  modifier: 0,
                  slideShadows: false,
                },
              },
              1200: {
                slidesPerView: 3,
                spaceBetween: 12,
                centeredSlides: true,
                coverflowEffect: {
                  rotate: 0,
                  stretch: 0,
                  depth: 660,
                  modifier: 0,
                  slideShadows: false,
                },
              },
            }"
            class="pricingSwiper w-full pb-[3.25rem] pt-[1.75rem] min-[950px]:pb-[3.375rem] min-[950px]:pt-[1.875rem] min-[1100px]:pb-[3.625rem] min-[1100px]:pt-[2rem] min-[1200px]:pb-[4rem]"
            @swiper="(s) => onSwiper(categoryIndex, s, category.pricing)"
            @slideChange="() => onSlideChange(categoryIndex)"
            @transitionEnd="() => onSlideChange(categoryIndex)"
          >
            <SwiperSlide
              v-for="(item, index) in category.pricing"
              :key="`${category.title}-${item.title}-${index}`"
              class="pricingSlide"
            >
              <div
                class="pricingCard flex flex-col rounded-[2rem] bg-cover bg-no-repeat px-[1rem] py-[1.75rem] text-white backdrop-blur-md min-[950px]:rounded-[2.125rem] min-[950px]:px-[1.1rem] min-[950px]:py-[1.75rem] min-[1100px]:rounded-[2.25rem] min-[1100px]:px-[1.3rem] min-[1100px]:py-[1.9rem] min-[1200px]:rounded-[2.5rem] min-[1200px]:px-[1.5rem] min-[1200px]:py-[2rem]"
              >
                <video
                  data-pricing-video
                  class="absolute inset-0 z-[-1] h-full w-full object-cover"
                  :src="videoSrc"
                  :poster="videoPoster"
                  muted
                  loop
                  playsinline
                  preload="none"
                ></video>

                <div
                  class="flex items-center justify-between gap-[0.625rem] pb-[1.25rem] min-[950px]:pb-[1.375rem] min-[1100px]:pb-[1.5rem] min-[1200px]:pb-[1.75rem]"
                >
                  <div class="flex">
                    <p
                      class="font-['Oswald'] text-[1.5rem] font-medium leading-[1.08] tracking-normal text-[#9CDE9F] min-[950px]:text-[1.7rem] min-[1100px]:text-[2rem] min-[1200px]:text-[2.25rem]"
                    >
                      {{ getFirstWord(item.title) }}
                      <span class="text-white">{{ getRemainingWords(item.title) }}</span>
                    </p>
                  </div>

                  <div
                    class="flex items-center justify-center rounded-[0.875rem] border border-white/10 bg-white/10"
                  >
                    <img
                      class="h-[2.25rem] w-[2.25rem] shrink-0 min-[950px]:h-[2.9rem] min-[950px]:w-[2.9rem] min-[1100px]:h-[3.4rem] min-[1100px]:w-[3.4rem] min-[1200px]:h-[4rem] min-[1200px]:w-[4rem]"
                      src="/Costs/image 94 (1).png"
                      alt=""
                    />
                  </div>
                </div>

                <div
                  class="flex items-end gap-[0.375rem] pb-[0.875rem] pt-[1rem] min-[950px]:gap-[0.375rem] min-[950px]:pb-[0.9375rem] min-[950px]:pt-[0.875rem] min-[1100px]:gap-[0.4375rem] min-[1100px]:pb-[1rem] min-[1200px]:gap-[0.5rem] min-[1200px]:pb-[1.25rem]"
                >
                  <p
                    class="relative bottom-[1rem] truncate pb-[0.125rem] text-center font-['Poppins','Inter',sans-serif] text-[0.875rem] font-normal leading-[1.2] tracking-normal min-[950px]:bottom-[1.35rem] min-[950px]:text-[0.95rem] min-[1100px]:bottom-[1.75rem] min-[1100px]:text-[1.05rem] min-[1200px]:bottom-[2rem] min-[1200px]:text-[1.25rem]"
                  >
                    от
                  </p>

                  <span
                    class="font-['Oswald'] text-[3rem] font-medium leading-[100%] tracking-normal min-[950px]:text-[3.4rem] min-[1100px]:text-[4rem] min-[1200px]:text-[4.75rem]"
                  >
                    {{ splitPrice(item.price).main }}
                  </span>

                  <span
                    class="text-center font-['Poppins','Inter',sans-serif] text-[0.875rem] font-normal leading-[1.2] tracking-normal min-[950px]:text-[0.95rem] min-[1100px]:text-[1.05rem] min-[1200px]:text-[1.25rem]"
                  >
                    {{ splitPrice(item.price).decimal }}
                  </span>
                </div>

                <p
                  class="font-['Poppins','Inter',sans-serif] text-[0.875rem] font-medium leading-[120%] tracking-normal min-[950px]:text-[0.95rem] min-[1100px]:text-[1rem] min-[1200px]:text-[1.125rem]"
                >
                  {{ item.priceText }}
                </p>

                <div
                  class="my-[1.25rem] h-[0.09375rem] bg-white min-[950px]:my-[1.3125rem] min-[1100px]:my-[1.375rem] min-[1200px]:my-[1.5rem]"
                ></div>

                <p
                  class="mt-auto flex justify-end pt-[1.25rem] font-['Poppins','Inter',sans-serif] text-[0.6875rem] font-light leading-[120%] tracking-normal min-[950px]:pt-[1.25rem] min-[950px]:text-[0.75rem] min-[1100px]:pt-[1.375rem] min-[1100px]:text-[0.8125rem] min-[1200px]:pt-[1.5rem] min-[1200px]:text-[0.9375rem]"
                >
                  {{ item.description }}
                </p>
              </div>
            </SwiperSlide>
            <div
              class="pb-[1.125rem] pt-[4.375rem] min-[950px]:pb-[3.375rem] min-[950px]:pt-[9.625rem] min-[1100px]:pb-[3.625rem] min-[1100px]:pt-[9.875rem] min-[1200px]:pb-[4rem] min-[1200px]:pt-[7rem]"
            ></div>
          </Swiper>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import type { Swiper as SwiperInstance } from "swiper/types";
import { Swiper, SwiperSlide } from "swiper/vue";
import { EffectCoverflow, Keyboard, Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";

type AppLocale = "ru" | "en";

type PricingItem = {
  title: string;
  price: string;
  priceText: string;
  description: string;
};

type PriceCategory = {
  title: string;
  pricing: PricingItem[];
};

type PriceCategoriesResponse = {
  data?: {
    priceCategories?: PriceCategory[];
  };
  errors?: Array<{ message: string }>;
};

const { locale } = useI18n();

const modules = [EffectCoverflow, Keyboard, Navigation, Pagination];

const swiperInstances = ref<Record<number, SwiperInstance | null>>({});
const prevRefs = ref<Record<number, HTMLElement | null>>({});
const nextRefs = ref<Record<number, HTMLElement | null>>({});

const runtimeConfig = useRuntimeConfig();
const GRAPHQL_URL = runtimeConfig.public.graphqlUrl as string;

const videoSrc = "/Costs/New.mp4";
const videoPoster = "/Costs/image_2026-01-22_17-02-52.jpg";

const gqlLocale = computed<AppLocale>(() =>
  (locale.value as AppLocale) === "en" ? "en" : "ru"
);

const query = `
  query PriceCategories($locale: I18NLocaleCode!) {
    priceCategories(locale: $locale) {
      title
      pricing {
        title
        price
        priceText
        description
      }
    }
  }
`;

const { data: priceRes } = await useFetch<PriceCategoriesResponse>(GRAPHQL_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: {
    query,
    variables: {
      locale: gqlLocale.value,
    },
  },
});

const priceCategories = computed<PriceCategory[]>(() => {
  return priceRes.value?.data?.priceCategories || [];
});

const setPrevRef = (index: number, el: Element | null) => {
  prevRefs.value[index] = el as HTMLElement | null;
};

const setNextRef = (index: number, el: Element | null) => {
  nextRefs.value[index] = el as HTMLElement | null;
};

const getInitialSlide = (items: PricingItem[]) => {
  if (!items.length) return 0;
  if (items.length === 1) return 0;
  return 1;
};

const splitPrice = (value: string) => {
  const cleaned = String(value || "").trim();
  const match = cleaned.match(/^([^0-9]*\d[\d\s.,]*?)(\.\d+)?$/);

  if (!match) {
    return {
      main: cleaned,
      decimal: "",
    };
  }

  return {
    main: match[1] || cleaned,
    decimal: match[2] || "",
  };
};

const getFirstWord = (value: string) => {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.split(" ")[0] || "";
};

const getRemainingWords = (value: string) => {
  const text = String(value || "").trim();
  if (!text) return "";
  const parts = text.split(" ");
  return parts.slice(1).join(" ");
};

const applyVideoState = async (categoryIndex: number) => {
  await nextTick();

  const swiper = swiperInstances.value[categoryIndex];
  if (!swiper?.el) return;

  const allVideos = swiper.el.querySelectorAll("video[data-pricing-video]");
  allVideos.forEach((v: HTMLVideoElement) => {
    try {
      v.pause();
      v.currentTime = 0;
      v.load();
    } catch {}
  });

  const activeSlide = swiper.slides?.[swiper.activeIndex];
  const activeVideo = activeSlide?.querySelector?.(
    "video[data-pricing-video]"
  ) as HTMLVideoElement | null;

  if (!activeVideo) return;

  try {
    const p = activeVideo.play();
    if (p?.catch) p.catch(() => {});
  } catch {}
};

const bindNavigation = async (categoryIndex: number) => {
  await nextTick();

  const swiper = swiperInstances.value[categoryIndex];
  const prevEl = prevRefs.value[categoryIndex];
  const nextEl = nextRefs.value[categoryIndex];

  if (!swiper || !prevEl || !nextEl) return;

  if (!swiper.params.navigation || typeof swiper.params.navigation === "boolean") {
    swiper.params.navigation = {};
  }

  swiper.params.navigation.prevEl = prevEl;
  swiper.params.navigation.nextEl = nextEl;

  if (swiper.navigation) {
    swiper.navigation.destroy();
    swiper.navigation.init();
    swiper.navigation.update();
  }

  swiper.update();
};

const onSwiper = async (
  categoryIndex: number,
  s: SwiperInstance,
  items: PricingItem[]
) => {
  swiperInstances.value[categoryIndex] = s;

  await bindNavigation(categoryIndex);

  nextTick(() => {
    s.update();
    s.slideTo(getInitialSlide(items), 0, false);
    applyVideoState(categoryIndex);
  });
};

const onSlideChange = (categoryIndex: number) => {
  applyVideoState(categoryIndex);
};
</script>

<style>
.pricingSwiper .swiper-wrapper {
  align-items: center;
}

.pricingSlide {
  display: flex;
  height: 31rem;
  align-items: center;
  justify-content: center;
  padding-left: 2.75rem;
  padding-right: 2.75rem;
  box-sizing: border-box;
}

.pricingCard {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: auto;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 2rem;
  --main-bg: conic-gradient(
    from var(--border-angle),
    rgba(0, 0, 0, 0.65),
    rgba(0, 0, 0, 0.85) 5%,
    rgba(0, 0, 0, 0.85) 60%,
    rgba(0, 0, 0, 0.65) 95%
  );
  --gradient-border: conic-gradient(
    from var(--border-angle),
    transparent 0%,
    rgba(3, 203, 0, 0) 0%,
    rgba(3, 203, 0, 0) calc(100% - var(--trail-stop)),
    rgba(3, 203, 0, 0.25) calc(100% - (var(--trail-stop) * 0.8)),
    #03cb00 calc(100% - (var(--trail-stop) * 0.55)),
    #ffffff calc(100% - (var(--trail-stop) * 0.2)),
    rgba(3, 203, 0, 0.15) calc(100% - (var(--trail-stop) * 0.05)),
    rgba(3, 203, 0, 0) 100%
  );
  border: solid 0.3125rem transparent;
  background: var(--main-bg) padding-box, var(--gradient-border) border-box,
    var(--main-bg) border-box;
  background-position: center center;
}

.pricingSwiper .swiper-slide {
  transform: scale(0.9);
  opacity: 0.45;
  filter: blur(0.0125rem);
  transform-origin: center;
  transition: transform 500ms ease, opacity 500ms ease, filter 500ms ease;
}

.pricingSwiper .swiper-slide-active {
  transform: scale(1) !important;
  opacity: 1 !important;
  filter: none !important;
}

.pricingSwiper .swiper-slide-prev,
.pricingSwiper .swiper-slide-next {
  transform: scale(0.94) !important;
  opacity: 0.7 !important;
  filter: none !important;
}

@property --border-angle {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0turn;
}

.pricingBorderSync {
  --border-angle: 0turn;
  --trail-px: 25rem;
  --trail-stop: 25%;
  animation: border-spin 6.6s linear infinite;
}

@keyframes border-spin {
  to {
    --border-angle: 1turn;
  }
}

.pricingSwiper .swiper-slide-active .pricingCard {
  box-shadow: 0 0 0.125rem rgba(0, 255, 13, 0.15), 0 0 0.3125rem rgba(0, 255, 13, 0.1),
    0 0.1875rem 0.1875rem rgba(0, 0, 0, 0.35);
}

@media (max-width: 59.374rem) {
  .pricingSwiper .swiper-wrapper {
    align-items: stretch;
  }

  .pricingSlide {
    height: auto !important;
    min-height: auto;
    align-items: stretch;
    padding-left: 1.75rem;
    padding-right: 1.75rem;
  }

  .pricingCard {
    height: 100%;
    min-height: 100%;
  }

  .pricingSwiper {
    overflow: visible;
  }

  .pricingSwiper .swiper-slide {
    transform: scale(1);
    opacity: 1;
    filter: none;
  }

  .pricingSwiper .swiper-slide-prev,
  .pricingSwiper .swiper-slide-next,
  .pricingSwiper .swiper-slide-active {
    transform: scale(1) !important;
    opacity: 1 !important;
    filter: none !important;
  }
}

@media (min-width: 59.375rem) and (max-width: 68.75rem) {
  .pricingSlide {
    height: 36rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .pricingCard {
    width: min(100%, 23rem);
    border-radius: 2.125rem;
  }

  .pricingSwiper .swiper-slide {
    transform: scale(0.88);
    opacity: 0.4;
    filter: blur(0.015625rem);
  }

  .pricingSwiper .swiper-slide-prev,
  .pricingSwiper .swiper-slide-next {
    transform: scale(0.92) !important;
    opacity: 0.6 !important;
    filter: none !important;
  }

  .pricingSwiper .swiper-slide-active .pricingCard {
    box-shadow: 0 0 1.25rem rgba(0, 255, 13, 0.14), 0 0 0.75rem rgba(0, 255, 13, 0.08),
      0 0.75rem 2rem rgba(0, 0, 0, 0.38);
  }
}

@media (min-width: 68.75rem) and (max-width: 74.99rem) {
  .pricingSlide {
    height: 39rem;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .pricingCard {
    width: min(100%, 25rem);
    border-radius: 2.25rem;
  }

  .pricingSwiper .swiper-slide {
    transform: scale(0.84);
    opacity: 0.35;
    filter: blur(0.01875rem);
  }

  .pricingSwiper .swiper-slide-prev,
  .pricingSwiper .swiper-slide-next {
    transform: scale(0.9) !important;
    opacity: 0.62 !important;
    filter: none !important;
  }

  .pricingSwiper .swiper-slide-active .pricingCard {
    box-shadow: 0 0 1.75rem rgba(0, 255, 13, 0.18), 0 0 1rem rgba(0, 255, 13, 0.1),
      0 0.875rem 2.5rem rgba(0, 0, 0, 0.42);
  }
}

@media (min-width: 75rem) {
  .pricingSlide {
    height: 48rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .pricingCard {
    width: min(100%, 34rem);
    border-radius: 2.5rem;
  }

  .pricingSwiper .swiper-slide {
    transform: scale(0.78);
    opacity: 0.2;
    filter: blur(0.025rem);
  }

  .pricingSwiper .swiper-slide-prev,
  .pricingSwiper .swiper-slide-next {
    transform: scale(0.86) !important;
    opacity: 0.45 !important;
    filter: none !important;
  }

  .pricingSwiper .swiper-slide-active .pricingCard {
    box-shadow: 0 0 3.75rem rgba(0, 255, 13, 0.22), 0 0 2.1875rem rgba(0, 255, 13, 0.14),
      0 1.5625rem 5rem rgba(0, 0, 0, 0.55);
  }
}
</style>
