<script setup lang="ts">
import { computed } from "vue";
import type { LandingPageContent } from "~/types/landingPayload";

const localePath = useLocalePath();

const props = defineProps<{
  landingPage?: LandingPageContent | null;
}>();

// CMS heroSlogan fields map onto the three lines of the slogan:
// mutedText -> outlined lead-in, mainText -> big headline, accentText -> tagline.
type HeroCopy = {
  leadText: string;
  mainText: string;
  taglineParts: string[];
};

const page = computed(() => props.landingPage ?? null);

const DEFAULT_HERO_COPY: HeroCopy = {
  leadText: "WE MAKE",
  mainText: "BRANDS",
  taglineParts: ["LOOK BETTER.", "WORK SMARTER.", "GROW STRONGER."],
};

const splitTextLines = (value: string | null | undefined): string[] =>
  (value ?? "")
    .split(/\r?\n|\|/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

// "LOOK BETTER. WORK SMARTER." -> one part per sentence, so the tagline wraps
// between sentences on narrow screens instead of mid-sentence.
const splitTagline = (value: string): string[] =>
  value
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

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
  const leadText = splitTextLines(heroSlogan?.mutedText).join(" ");
  const mainText = heroSlogan?.mainText?.trim();
  const taglineParts = splitTagline(heroSlogan?.accentText?.trim() ?? "");

  if (leadText || mainText || taglineParts.length) {
    return {
      leadText: leadText || DEFAULT_HERO_COPY.leadText,
      mainText: mainText || DEFAULT_HERO_COPY.mainText,
      taglineParts: taglineParts.length ? taglineParts : DEFAULT_HERO_COPY.taglineParts,
    };
  }

  const legacyLines = splitTextLines(mediaText.value);

  if (legacyLines.length >= 3) {
    return {
      leadText: legacyLines.slice(0, -2).join(" "),
      mainText: legacyLines[legacyLines.length - 2] || DEFAULT_HERO_COPY.mainText,
      taglineParts: splitTagline(legacyLines[legacyLines.length - 1] ?? ""),
    };
  }

  return DEFAULT_HERO_COPY;
});
</script>

<template>
  <div class="leading-page-shell overflow-hidden">
    <div class="leading-copy-position relative">
      <div class="flex justify-center intro-slide-in">
        <h1 class="hero-slogan">
          <!-- The design has no visible keyword line; it stays in the heading for
               search engines and screen readers. The interpolated trailing spaces
               keep the lines apart in the heading's text (the template compiler
               drops plain whitespace between tags); visually they collapse. -->
          <span class="sr-only">{{ `${$t("seo.heroEyebrow")}. ` }}</span>
          <span class="hero-slogan__lead">
            <span class="hero-slogan__dash" aria-hidden="true" />{{ `${heroCopy.leadText} ` }}
          </span>

          <span class="hero-slogan__main">{{ `${heroCopy.mainText} ` }}</span>

          <span class="hero-slogan__tagline">
            <span v-for="part in heroCopy.taglineParts" :key="part">{{ `${part} ` }}</span>
          </span>
        </h1>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <NuxtLink
      :to="localePath('/ContactPage')"
      :aria-label="$t('nav.contacts')"
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

/* As in the design, the logo wall fills the first screen and the slogan starts
   near its bottom edge; scrolling reveals the rest of it (HeroClientsReveal lets
   the hero scroll until its end is in view). The padding is measured from the
   page top: the header row above this shell is 30px tall (2.5rem from md). On
   phones the slogan sits higher so the fixed contact button does not cover it.
   The bottom padding lets the green light of the next section start right under
   the tagline. */
.leading-page-shell {
  padding-top: calc(64vh - 30px);
  padding-top: calc(64svh - 30px);
  padding-bottom: 8vh;
  padding-bottom: 8svh;
}

/* z-index makes the slogan a layer above the logo wall, so its ::before can dim
   the tiles right behind the text while the rest of the wall stays bright. */
.leading-copy-position {
  /* The upper bound also follows the screen height, so on very large screens
     (4K, zoomed-out windows) the slogan keeps the design's share of the view. */
  --hero-main-size: clamp(4.3rem, 2.4rem + 9.6vw, max(13.5rem, 20vh));
  z-index: 0;
}

.leading-copy-position::before {
  content: "";
  position: absolute;
  z-index: -1;
  left: 50%;
  width: 100vw;
  top: calc(var(--hero-main-size) * -0.9);
  bottom: calc(var(--hero-main-size) * -0.5);
  transform: translateX(-50%);
  /* Near-black under the text, tiles still faintly visible at the sides. The
     ellipse ends inside the box so its top edge does not show as a line. */
  background:
    radial-gradient(ellipse 42% 60% at 50% 62%, rgb(0 0 0 / 0.95) 0%, rgb(0 0 0 / 0.9) 65%, rgb(0 0 0 / 0) 100%),
    linear-gradient(to bottom, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 0.55) 25%, rgb(0 0 0 / 0.65) 100%);
  pointer-events: none;
}

@media (max-width: 767px) {
  .leading-copy-position::before {
    background:
      radial-gradient(ellipse 62% 60% at 50% 62%, rgb(0 0 0 / 0.95) 0%, rgb(0 0 0 / 0.9) 65%, rgb(0 0 0 / 0) 100%),
      linear-gradient(to bottom, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 0.55) 25%, rgb(0 0 0 / 0.65) 100%);
  }
}

@media (min-width: 768px) {
  .leading-page-shell {
    padding-top: calc(84vh - 2.5rem);
    padding-top: calc(84svh - 2.5rem);
  }

  .contact-fab {
    right: max(6.25rem, calc((100vw - 1728px) / 2 + 6.25rem));
  }
}

/* Sizes follow the design (2000px-wide mockup): the lead-in is 0.7x and the
   tagline 0.2x the headline (--hero-main-size, set on .leading-copy-position);
   each grows fluidly with the viewport. */
.hero-slogan {
  --hero-lead-size: clamp(3rem, 1.7rem + 6.7vw, max(9.5rem, 14vh));
  --hero-tagline-size: clamp(0.875rem, 0.5rem + 1.9vw, max(2.75rem, 4vh));
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  padding-inline: 1rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0;
  transform: translate3d(0, 0, 0);
}

.hero-slogan__lead {
  display: block;
  font-size: var(--hero-lead-size);
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;
  color: transparent;
  -webkit-text-stroke: max(1px, 0.02em) #20e848;
  /* The outline fades out where it meets the headline. */
  -webkit-mask-image: linear-gradient(to bottom, #000 55%, rgb(0 0 0 / 0.35) 100%);
  mask-image: linear-gradient(to bottom, #000 55%, rgb(0 0 0 / 0.35) 100%);
}

/* The design's dash is a wide outlined bar, heavier than a dash glyph. */
.hero-slogan__dash {
  display: inline-block;
  width: 0.48em;
  height: 0.2em;
  margin-right: 0.05em;
  vertical-align: 0.2em;
  border: max(1px, 0.02em) solid #20e848;
}

.hero-slogan__main {
  display: block;
  margin-top: -0.18em;
  font-size: var(--hero-main-size);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  color: #e4e4e4;
}

@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .hero-slogan__main {
    color: transparent;
    background-image: linear-gradient(172deg, #ffffff 10%, #dcdcdc 45%, #8f8f8f 100%);
    -webkit-background-clip: text;
    background-clip: text;
  }
}

.hero-slogan__tagline {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  column-gap: 0.6em;
  margin-top: 0.1em;
  color: #00f830;
  font-size: var(--hero-tagline-size);
  font-weight: 700;
  line-height: 1.2;
}

.hero-slogan__tagline > span {
  white-space: nowrap;
}
</style>
