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
      <div class="flex justify-center">
        <h1 class="hero-slogan">
          <!-- What the page is about, in its language, above the slogan. The
               slogan is the brand's own English line on every language's page
               (marked lang="en" for screen readers and search engines). The
               interpolated trailing spaces keep the lines apart in the
               heading's text (the template compiler drops plain whitespace
               between tags); visually they collapse. -->
          <span class="hero-slogan__eyebrow">{{ `${$t("seo.heroEyebrow")} ` }}</span>
          <span class="hero-slogan__lead" lang="en">
            <span class="hero-slogan__dash" aria-hidden="true" />{{ `${heroCopy.leadText} ` }}
          </span>

          <span class="hero-slogan__main" lang="en">{{ `${heroCopy.mainText} ` }}</span>

          <span class="hero-slogan__tagline" lang="en">
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
  min-height: calc(100vh - 1.875rem);
  min-height: calc(100svh - 1.875rem);
  padding-bottom: 3.5vh;
  padding-bottom: 3.5svh;
}

/* z-index makes the slogan a layer above the logo wall, so its ::before can dim
   the tiles right behind the text while the rest of the wall stays bright. */
.leading-copy-position {
  /* Fluid with the width, but never taller than the design's share of the screen
     height (a 209px headline on a 1337px-high frame = 15.65%), so the slogan fits
     the first screen on short, wide windows as well as on tall ones. */
  --hero-main-size: min(clamp(4.3rem, 2.4rem + 9.6 * var(--fvw), max(13.5rem, 20vh)), 15.65vh);
  z-index: 0;
}

@supports (height: 1svh) {
  .leading-copy-position {
    --hero-main-size: min(clamp(4.3rem, 2.4rem + 9.6 * var(--fvw), max(13.5rem, 20svh)), 15.65svh);
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

/* The slogan is the one type exception on the site: its three lines are a
   single poster composition fitted to the screen height, so they stay off the
   type scale. Sizes follow the design (2000px-wide mockup): the lead-in is
   0.74x and the tagline 0.215x the headline (--hero-main-size, set on
   .leading-copy-position), so the three lines keep the design's proportions
   at every screen size. The tagline never drops below a readable 0.875rem.
   Their tight line heights (1 and 1.2) stack the lines into one block, as
   designed. Only the eyebrow above them is ordinary text: the label step. */
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

/* The keyword line: small, muted, centred over the slogan (the label step). */
.hero-slogan__eyebrow {
  display: block;
  margin-bottom: 0.9em;
  color: #a3a6aa;
  font-family: var(--app-font-sans);
  font-size: var(--type-label-size);
  font-weight: 600;
  line-height: var(--type-label-lh);
  letter-spacing: var(--type-label-ls);
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

/* The headline's white-to-grey shading as an alpha mask over white text: on
   the slogan's black backdrop it reads as the design's #fff -> #9c9c9c
   gradient. (The gradient used to be clipped to the text, background-clip:
   text; under the reveal animation such text counts as painted only once the
   animation ends, and this word is the page's Largest Contentful Paint:
   2.4 s instead of 0.85 s in the lab.) */
.hero-slogan__main {
  color: #fff;
  -webkit-mask-image: linear-gradient(178deg, #000 18%, rgb(0 0 0 / 0.61) 82%);
  mask-image: linear-gradient(178deg, #000 18%, rgb(0 0 0 / 0.61) 82%);
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
  letter-spacing: var(--type-caps-ls);
}

/* The tagline is 0.215x the headline, so it falls under 20px on phones and on
   short windows (headline under ~93px): there it takes SF Pro Text, the
   optical size drawn for small type. */
@media (max-width: 569px), (max-height: 594px) {
  .hero-slogan__tagline {
    font-family: var(--app-font-sans);
  }
}

/* The landing's heading reveal (utils/reveal.ts) in CSS, so the hero comes
   in at first paint without waiting for the app: each line out of a blur,
   rising a little, while a soft edge sweeps it in from left
   to right (apple.com's animated headline), the lines 0.15s apart. The
   sweep is a mask three times the line's width slid across it; the lead-in
   keeps its own fade-out mask under the sweep, so nothing jumps when the
   sweep ends. */
@media (prefers-reduced-motion: no-preference) {
  .hero-slogan__eyebrow,
  .hero-slogan__lead,
  .hero-slogan__main,
  .hero-slogan__tagline {
    animation:
      hero-line-in 1.3s cubic-bezier(0.22, 0.61, 0.36, 1) var(--hero-line-delay) backwards,
      hero-line-sweep 1.1s cubic-bezier(0.45, 0, 0.25, 1) var(--hero-line-delay) backwards;
  }

  .hero-slogan__eyebrow {
    --hero-line-delay: 0.05s;
  }

  .hero-slogan__lead {
    --hero-line-delay: 0.2s;
    animation-name: hero-line-in, hero-lead-sweep;
  }

  .hero-slogan__main {
    --hero-line-delay: 0.35s;
    animation-name: hero-line-in, hero-main-sweep;
  }

  .hero-slogan__tagline {
    --hero-line-delay: 0.5s;
  }
}

/* No fade: the sweep's mask already hides each line until its edge passes,
   and text that starts at opacity 0 is not counted as painted, which made the
   headline (the page's Largest Contentful Paint) wait for the animation. */
@keyframes hero-line-in {
  from {
    filter: blur(1rem);
    translate: 0 0.28em;
  }
}

@keyframes hero-line-sweep {
  from {
    -webkit-mask: linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 300% 100% no-repeat;
    mask: linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 300% 100% no-repeat;
  }

  to {
    -webkit-mask: linear-gradient(90deg, #000 40%, transparent 60%) 0% 0 / 300% 100% no-repeat;
    mask: linear-gradient(90deg, #000 40%, transparent 60%) 0% 0 / 300% 100% no-repeat;
  }
}

@keyframes hero-lead-sweep {
  from {
    -webkit-mask:
      linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 300% 100% no-repeat,
      linear-gradient(to bottom, #000 56%, rgb(0 0 0 / 0.04) 90%);
    -webkit-mask-composite: source-in;
    mask:
      linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 300% 100% no-repeat intersect,
      linear-gradient(to bottom, #000 56%, rgb(0 0 0 / 0.04) 90%);
  }

  to {
    -webkit-mask:
      linear-gradient(90deg, #000 40%, transparent 60%) 0% 0 / 300% 100% no-repeat,
      linear-gradient(to bottom, #000 56%, rgb(0 0 0 / 0.04) 90%);
    -webkit-mask-composite: source-in;
    mask:
      linear-gradient(90deg, #000 40%, transparent 60%) 0% 0 / 300% 100% no-repeat intersect,
      linear-gradient(to bottom, #000 56%, rgb(0 0 0 / 0.04) 90%);
  }
}

/* The headline's sweep over its own shading mask, as the lead-in's. */
@keyframes hero-main-sweep {
  from {
    -webkit-mask:
      linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 300% 100% no-repeat,
      linear-gradient(178deg, #000 18%, rgb(0 0 0 / 0.61) 82%);
    -webkit-mask-composite: source-in;
    mask:
      linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 300% 100% no-repeat intersect,
      linear-gradient(178deg, #000 18%, rgb(0 0 0 / 0.61) 82%);
  }

  to {
    -webkit-mask:
      linear-gradient(90deg, #000 40%, transparent 60%) 0% 0 / 300% 100% no-repeat,
      linear-gradient(178deg, #000 18%, rgb(0 0 0 / 0.61) 82%);
    -webkit-mask-composite: source-in;
    mask:
      linear-gradient(90deg, #000 40%, transparent 60%) 0% 0 / 300% 100% no-repeat intersect,
      linear-gradient(178deg, #000 18%, rgb(0 0 0 / 0.61) 82%);
  }
}

.hero-slogan__tagline > span {
  white-space: nowrap;
}
</style>
