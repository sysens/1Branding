<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import type { LandingPageContent } from "~/types/landingPayload";

const localePath = useLocalePath();

const props = defineProps<{
  landingPage?: LandingPageContent | null;
}>();

type GsapContext = { revert: () => void };

type HeroCopy = {
  mutedLines: string[];
  mainText: string;
  accentText: string;
};

const page = computed(() => props.landingPage ?? null);

const DEFAULT_HERO_COPY: HeroCopy = {
  mutedLines: ["DESIGN IS NOT", "JUST WHAT", "IT LOOKS LIKE", "AND FEELS LIKE."],
  mainText: "DESIGN IS",
  accentText: "HOW IT WORKS",
};

const splitTextLines = (value: string | null | undefined): string[] =>
  (value ?? "")
    .split(/\r?\n|\|/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const firstTextValue = (values: Array<string | null | undefined>): string => {
  for (const value of values) {
    const trimmed = value?.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return "";
};

const mediaText = computed(() =>
  firstTextValue([
    page.value?.slogan?.caption,
    page.value?.slogan?.alternativeText,
    page.value?.sloganMobile?.caption,
    page.value?.sloganMobile?.alternativeText,
  ])
);

const heroCopy = computed<HeroCopy>(() => {
  const heroSlogan = page.value?.heroSlogan;
  const mutedLines = splitTextLines(heroSlogan?.mutedText);
  const mainText = heroSlogan?.mainText?.trim();
  const accentText = heroSlogan?.accentText?.trim();

  if (mutedLines.length || mainText || accentText) {
    return {
      mutedLines: mutedLines.length ? mutedLines : DEFAULT_HERO_COPY.mutedLines,
      mainText: mainText || DEFAULT_HERO_COPY.mainText,
      accentText: accentText || DEFAULT_HERO_COPY.accentText,
    };
  }

  const legacyLines = splitTextLines(mediaText.value);

  if (legacyLines.length >= 3) {
    return {
      mutedLines: legacyLines.slice(0, -2),
      mainText: legacyLines[legacyLines.length - 2] || DEFAULT_HERO_COPY.mainText,
      accentText: legacyLines[legacyLines.length - 1] || DEFAULT_HERO_COPY.accentText,
    };
  }

  return DEFAULT_HERO_COPY;
});

const heroAriaLabel = computed(() =>
  [...heroCopy.value.mutedLines, heroCopy.value.mainText, heroCopy.value.accentText].join(" ")
);

let ctx: GsapContext | null = null;

onMounted(async () => {
  await nextTick();

  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
    const main = document.querySelector<HTMLElement>(".products");
    if (!main) return;

    gsap.fromTo(
      main,
      { x: -160, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
    );
  });
});

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div class="leading-page-shell overflow-hidden">
    <div class="pt-[41px]"></div>

    <div class="leading-copy-position relative">
      <div class="flex max-w-[1500px] mx-auto justify-center md:justify-start products">
        <div
          class="mainImg hero-slogan md:w-[41.5625rem] md:h-[19.5625rem] w-[363px] h-[187px]"
          :aria-label="heroAriaLabel"
        >
          <div class="hero-slogan__muted" aria-hidden="true">
            <span v-for="line in heroCopy.mutedLines" :key="line">
              {{ line }}
            </span>
          </div>

          <div class="hero-slogan__main" aria-hidden="true">
            {{ heroCopy.mainText }}
          </div>

          <div class="hero-slogan__accent-shell" aria-hidden="true">
            <div class="hero-slogan__accent">
              {{ heroCopy.accentText }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <NuxtLink
      :to="localePath('/ContactPage')"
      class="contact-fab fixed right-[40px] md:bottom-[6.25rem] bottom-[65px] z-[9000] group"
    >
      <img
        src="/home/Frame 2147223311.png"
        alt=""
        class="transition-all duration-500 ease-out md:h-[5rem] md:w-[5rem] w-[64px] h-[64px] group-hover:scale-110 group-hover:drop-shadow-[0_0_48px_#03CB00] group-hover:brightness-110"
      />
    </NuxtLink>
  </Teleport>
</template>

<style scoped>
.contact-fab {
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

.leading-page-shell {
  height: clamp(40rem, 108svh, 56rem);
}

.leading-copy-position {
  top: 30%;
}

@media (min-width: 768px) {
  .leading-page-shell {
    height: clamp(42rem, 112svh, 58rem);
  }

  .leading-copy-position {
    top: 22%;
  }

  .contact-fab {
    right: max(6.25rem, calc((100vw - 1728px) / 2 + 6.25rem));
  }
}

.hero-slogan {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  color: #ffffff;
  font-family: var(--app-font-display, "SF Pro Display", "SF Pro Text", sans-serif);
  text-transform: uppercase;
  letter-spacing: 0;
  box-sizing: border-box;
  padding-left: 2.4rem;
  transform: translate3d(0, 0, 0);
}

.hero-slogan__muted {
  display: flex;
  flex-direction: column;
  color: rgba(255, 255, 255, 0.62);
  font-size: 1.875rem;
  font-weight: 300;
  line-height: 0.94;
}

.hero-slogan__main {
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.92);
  font-size: 4.4rem;
  font-weight: 300;
  line-height: 0.88;
  white-space: nowrap;
}

.hero-slogan__accent-shell {
  width: min(100%, 41.25rem);
  transform: rotate(-2.2deg);
  transform-origin: left center;
}

.hero-slogan__accent {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 4.1rem;
  border: 0.19rem solid #03cb00;
  border-radius: 1.6rem;
  color: #03cb00;
  font-size: 3.3rem;
  font-weight: 700;
  line-height: 0.95;
  text-align: center;
  text-shadow: 0 0 1.15rem rgba(3, 203, 0, 0.48);
  white-space: nowrap;
}

@media (max-width: 767px) {
  .hero-slogan {
    padding-left: 0.4rem;
  }

  .hero-slogan__muted {
    font-size: 1.6rem;
  }

  .hero-slogan__main {
    font-size: 3.35rem;
  }

  .hero-slogan__accent {
    min-height: 3.25rem;
    border-radius: 1.15rem;
    font-size: 2.55rem;
  }
}
</style>
