<script setup lang="ts">
import { computed } from "vue";
import type { LandingPageContent } from "~/types/landingPayload";

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
</template>

<style scoped>
/* As in the design, the logo wall fills the first screen and the whole slogan
   (lead-in, headline, tagline) sits at its bottom edge, fully visible when the
   page opens. The shell is as tall as the first screen minus the header row above
   it (30px, 2.5rem from md) and pushes the slogan to the bottom, so the hero is
   exactly one screen tall. The type sizes below also follow the screen height, so
   short and wide windows (a 2000x429 browser strip, an ultrawide) keep the whole
   slogan in view instead of cutting it off. */
.leading-page-shell {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-sizing: border-box;
  min-height: calc(100vh - 30px);
  min-height: calc(100svh - 30px);
  padding-bottom: 3.5vh;
  padding-bottom: 3.5svh;
}

/* z-index makes the slogan a layer above the logo wall, so its ::before can dim
   the tiles right behind the text while the rest of the wall stays bright. */
.leading-copy-position {
  /* Fluid with the width, but never taller than the design's share of the screen
     height (a 209px headline on a 1337px-high frame = 15.65%), so the slogan fits
     the first screen on short, wide windows as well as on tall ones. */
  --hero-main-size: min(clamp(4.3rem, 2.4rem + 9.6vw, max(13.5rem, 20vh)), 15.65vh);
  z-index: 0;
}

@supports (height: 1svh) {
  .leading-copy-position {
    --hero-main-size: min(clamp(4.3rem, 2.4rem + 9.6vw, max(13.5rem, 20svh)), 15.65svh);
  }
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
  /* Less hang on phones, where the lead-in would otherwise touch the screen edge. */
  .hero-slogan__lead {
    transform: translateX(calc(var(--hero-main-size) * -0.1));
  }

  .leading-copy-position::before {
    background:
      radial-gradient(ellipse 62% 60% at 50% 62%, rgb(0 0 0 / 0.95) 0%, rgb(0 0 0 / 0.9) 65%, rgb(0 0 0 / 0) 100%),
      linear-gradient(to bottom, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 0.55) 25%, rgb(0 0 0 / 0.65) 100%);
  }
}

@media (min-width: 768px) {
  .leading-page-shell {
    min-height: calc(100vh - 2.5rem);
    min-height: calc(100svh - 2.5rem);
  }
}

/* Sizes follow the design (2000px-wide mockup): the lead-in is 0.74x and the
   tagline 0.215x the headline (--hero-main-size, set on .leading-copy-position),
   so the three lines keep the design's proportions at every screen size. The
   tagline never drops below a readable 0.875rem. */
.hero-slogan {
  --hero-lead-size: calc(var(--hero-main-size) * 0.74);
  --hero-tagline-size: max(0.875rem, calc(var(--hero-main-size) * 0.215));
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
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.085em;
  white-space: nowrap;
  /* In the design the lead-in hangs to the left of the headline's centre. */
  transform: translateX(calc(var(--hero-main-size) * -0.32));
  color: transparent;
  -webkit-text-stroke: max(1px, 0.024em) #20e848;
  /* The outline fades out where it meets the headline. */
  -webkit-mask-image: linear-gradient(to bottom, #000 56%, rgb(0 0 0 / 0.04) 90%);
  mask-image: linear-gradient(to bottom, #000 56%, rgb(0 0 0 / 0.04) 90%);
}

/* The design's dash is a wide outlined bar, heavier than a dash glyph. */
.hero-slogan__dash {
  display: inline-block;
  width: 0.48em;
  height: 0.2em;
  margin-right: 0.05em;
  vertical-align: 0.2em;
  border: max(1px, 0.024em) solid #20e848;
}

.hero-slogan__main {
  display: block;
  margin-top: -0.21em;
  font-size: var(--hero-main-size);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: #e4e4e4;
}

@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .hero-slogan__main {
    color: transparent;
    background-image: linear-gradient(178deg, #ffffff 18%, #9c9c9c 82%);
    -webkit-background-clip: text;
    background-clip: text;
  }
}

.hero-slogan__tagline {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  column-gap: 0.42em;
  margin-top: 0.17em;
  color: #00f830;
  font-size: var(--hero-tagline-size);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.008em;
}

.hero-slogan__tagline > span {
  white-space: nowrap;
}
</style>
