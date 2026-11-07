<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
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

// The lead-in and the headline come in letter by letter (the dash first), then
// the tagline. Each letter starts barely visible rather than hidden, so the
// headline is painted with the first frame and stays the page's LCP. The
// letters are visual only; screen readers and search engines get the words
// from the sr-only copy in the heading.
const letters = (text: string) => [...text].map((char) => (char === " " ? " " : char));
const leadLetters = computed(() => letters(heroCopy.value.leadText));
const mainLetters = computed(() => letters(heroCopy.value.mainText));

// "Scroll" hint at the hero's foot; it leaves once the page has moved.
const scrolled = ref(false);
const onScroll = () => { scrolled.value = window.scrollY > 40; };
onMounted(() => {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <div class="leading-page-shell overflow-hidden">
    <div class="leading-copy-position relative">
      <div class="flex justify-center">
        <h1 class="hero-slogan">
          <!-- What the page is about, in its language, kept for screen readers
               and search engines only (it is not drawn above the slogan). The
               slogan is the brand's own English line on every language's page
               (marked lang="en" for screen readers and search engines). The
               interpolated trailing spaces keep the lines apart in the
               heading's text (the template compiler drops plain whitespace
               between tags); visually they collapse. -->
          <span class="sr-only">{{ `${$t("seo.heroEyebrow")} ` }}</span>
          <!-- The lead-in and the headline as words; the letters below are
               visual only. -->
          <span class="sr-only" lang="en">{{ `${heroCopy.leadText} ${heroCopy.mainText} ` }}</span>
          <span class="hero-slogan__lead" lang="en" aria-hidden="true">
            <span class="hero-slogan__dash hero-letter" style="--i: 0" /><span
              v-for="(char, index) in leadLetters"
              :key="`lead-${index}`"
              class="hero-letter"
              :style="{ '--i': index + 1 }"
            >{{ char }}</span>{{ " " }}
          </span>

          <span class="hero-slogan__main" lang="en" aria-hidden="true"><span
            v-for="(char, index) in mainLetters"
            :key="`main-${index}`"
            class="hero-letter"
            :style="{ '--i': index }"
          >{{ char }}</span>{{ " " }}</span>

          <span class="hero-slogan__tagline" lang="en">
            <span v-for="(part, index) in heroCopy.taglineParts" :key="part" class="hero-slogan__part" :style="{ '--i': index }">{{ `${part} ` }}</span>
          </span>
        </h1>
      </div>
    </div>

    <div class="hero-scroll" :class="{ 'is-hidden': scrolled }" aria-hidden="true">
      <span class="hero-scroll__line" />
      <span class="hero-scroll__label">{{ $t("home.scrollHint") }}</span>
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
  top: calc(var(--hero-main-size) * -1.6);
  bottom: calc(var(--hero-main-size) * -1.6);
  transform: translateX(-50%);
  /* Near-black under the text, tiles still faintly visible at the sides. The
     ellipse is centred in the box and fades to nothing exactly at its edges
     (50% = half the box), through many eased stops (a bell curve), so there
     is no visible rim or egg outline anywhere. Its half-width is 50% of the
     screen at most (the box is 100vw wide; Chrome takes no % inside min() for
     a gradient size), but no more than 5.8 slogan sizes: the slogan is capped
     by the screen's height, so on a 32:9 screen the band would otherwise be
     far wider than the slogan. */
  background: radial-gradient(
    ellipse min(50vw, calc(var(--hero-main-size) * 5.8)) 50% at 50% 50%,
    rgb(0 0 0 / 0.92) 0%,
    rgb(0 0 0 / 0.88) 25%,
    rgb(0 0 0 / 0.76) 40%,
    rgb(0 0 0 / 0.58) 55%,
    rgb(0 0 0 / 0.38) 68%,
    rgb(0 0 0 / 0.2) 80%,
    rgb(0 0 0 / 0.08) 90%,
    rgb(0 0 0 / 0.02) 96%,
    rgb(0 0 0 / 0) 100%
  );
  pointer-events: none;
}

@media (max-width: 767px) {
  /* Less hang on phones, where the lead-in would otherwise touch the screen edge. */
  .hero-slogan__lead {
    transform: translateX(calc(var(--hero-main-size) * -0.1));
  }

  .leading-copy-position::before {
    background: radial-gradient(
      ellipse 50% 50% at 50% 50%,
      rgb(0 0 0 / 0.92) 0%,
      rgb(0 0 0 / 0.88) 25%,
      rgb(0 0 0 / 0.76) 40%,
      rgb(0 0 0 / 0.58) 55%,
      rgb(0 0 0 / 0.38) 68%,
      rgb(0 0 0 / 0.2) 80%,
      rgb(0 0 0 / 0.08) 90%,
      rgb(0 0 0 / 0.02) 96%,
      rgb(0 0 0 / 0) 100%
    );
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

/* A mask clips everything outside its box, and the letters come in out of a
   glow that reaches past the text: the box gets 0.3em of room on every side
   (taken back by negative margins, so nothing moves), and the shading's stops
   sit where 18% and 82% fell on the text alone. */
@media (prefers-reduced-motion: no-preference) {
  .hero-slogan__main {
    padding: 0.3em;
    margin: calc(-0.21em - 0.3em) -0.3em -0.3em;
    -webkit-mask-image: linear-gradient(178deg, #000 29%, rgb(0 0 0 / 0.61) 71%);
    mask-image: linear-gradient(178deg, #000 29%, rgb(0 0 0 / 0.61) 71%);
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

/* The hero comes in in CSS, at first paint, without waiting for the app: the
   eyebrow rises in, then the lead-in and the headline letter by letter (the
   dash first), each letter brightening out of its own soft glow while its
   line rises a little, then the tagline's sentences one after another.
   The letters change only paint (colour, outline colour, text-shadow), never
   opacity, filter, position or transform: any of those gives a letter a
   paint layer of its own, and then every letter is a separate Largest
   Contentful Paint candidate, too small to win, and a logo tile becomes the
   page's LCP instead of the headline. Every piece starts barely visible
   (0.04), not hidden, so the headline is painted with the first frame. Its
   shading is the mask on .hero-slogan__main (white letters under it), not a
   gradient clipped to the text, which Chrome would count as painted only
   once the animation ended. */
.hero-slogan__lead {
  --letter-start: 0.15s;
  --letter-step: 0.05s;
}

.hero-slogan__main {
  --letter-start: 0.55s;
  --letter-step: 0.075s;
}

@media (prefers-reduced-motion: no-preference) {
  .hero-slogan__lead,
  .hero-slogan__main {
    animation: hero-line-rise 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) var(--letter-start) both;
  }

  .hero-letter {
    animation: hero-letter-in 0.85s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    animation-delay: calc(var(--letter-start) + var(--i) * var(--letter-step));
  }

  .hero-slogan__lead .hero-letter {
    animation-name: hero-outline-in;
  }

  .hero-slogan__dash.hero-letter {
    animation-name: hero-dash-in;
  }

  .hero-slogan__part {
    animation: hero-part-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    animation-delay: calc(1.15s + var(--i) * 0.12s);
  }
}

@keyframes hero-line-rise {
  from { translate: 0 0.3em; }
}

/* Headline letters: white out of a white glow. */
@keyframes hero-letter-in {
  from {
    color: rgb(255 255 255 / 0.04);
    text-shadow: 0 0 0.3em rgb(255 255 255 / 0.85);
  }
}

/* Lead-in letters are an outline: the outline brightens out of a green glow. */
@keyframes hero-outline-in {
  from {
    -webkit-text-stroke-color: rgb(32 232 72 / 0.04);
    text-shadow: 0 0 0.25em rgb(32 232 72 / 0.8);
  }
}

@keyframes hero-dash-in {
  from {
    border-color: rgb(32 232 72 / 0.04);
    box-shadow: 0 0 0.3em rgb(32 232 72 / 0.8);
  }
}

@keyframes hero-part-in {
  from {
    opacity: 0.04;
    transform: translate3d(0, 0.6em, 0);
  }
}

/* "Scroll": a thin line with a light running down it, beside the slogan's
   bottom right; it fades in after the slogan and away once the page moves. */
.leading-page-shell {
  position: relative;
}

.hero-scroll {
  position: absolute;
  /* At the content frame's right edge on screens wider than it. */
  right: calc(clamp(1.25rem, calc(2.4 * var(--fvw)), 3rem) + var(--frame-side));
  bottom: calc(3.5svh + 0.375rem);
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  color: rgb(255 255 255 / 0.6);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.hero-scroll.is-hidden {
  opacity: 0;
  transform: translateY(0.5rem);
}

.hero-scroll__line {
  position: relative;
  width: 1px;
  height: 3.5rem;
  overflow: hidden;
  background: rgb(255 255 255 / 0.18);
}

.hero-scroll__line::after {
  position: absolute;
  left: 0;
  width: 100%;
  height: 40%;
  background: linear-gradient(to bottom, transparent, #20e848);
  box-shadow: 0 0 0.375rem #20e848;
  content: "";
  transform: translateY(-100%);
}

/* The label step, set vertically. */
.hero-scroll__label {
  font-family: var(--app-font-sans);
  font-size: var(--type-label-size);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  writing-mode: vertical-rl;
}

/* The entrance is on the parts, so the container's own opacity transition
   (hiding on scroll) is not held by a finished animation. */
@media (prefers-reduced-motion: no-preference) {
  .hero-scroll > * {
    animation: hero-scroll-in 0.8s ease 1.8s both;
  }

  .hero-scroll__line::after {
    animation: hero-scroll-run 1.8s cubic-bezier(0.6, 0, 0.3, 1) 2.2s infinite;
  }
}

@keyframes hero-scroll-in {
  from { opacity: 0; transform: translateY(-0.5rem); }
}

@keyframes hero-scroll-run {
  0% { transform: translateY(-100%); }
  70%, 100% { transform: translateY(260%); }
}

@media (max-width: 767px) {
  .hero-scroll {
    display: none;
  }
}

.hero-slogan__tagline > span {
  white-space: nowrap;
}
</style>
