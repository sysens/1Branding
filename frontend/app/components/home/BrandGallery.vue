<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { splitIdentityTitle } from "~/utils/identityTitle";
import { largeViewportHeight } from "~/utils/viewportUnits";

type Card = { src: string; alt: string; ratio: number };

const props = withDefaults(
  defineProps<{
    title?: string | null;
    description?: string | null;
    /** The section waits under the last screen of the one before it, which
     *  scrolls up off it (that one must lie above, see InfoOnPicture.css):
     *  for that screen of scroll it stands still and is uncovered from the
     *  bottom up, out of a dark veil, like the footer; then the row moves. */
    under?: boolean;
  }>(),
  { title: null, description: null, under: false },
);

const { t } = useI18n();

const heading = computed(() => splitIdentityTitle(props.title?.trim() || t("home.gallery.title")));
const description = computed(() => props.description?.trim() || t("home.gallery.description"));

// Packaging shots, in the design's order; each card's width follows its image.
const WORK: Array<[string, number]> = [
  ["chocoton", 1.22], ["lilbucks", 0.75], ["calliope", 1.22], ["puremagic", 0.79], ["mlinotest", 0.75],
  ["mms", 0.75], ["knight", 0.79], ["barbican", 0.63], ["lollys", 1.22],
];
const RATIOS = WORK.map(([, ratio]) => ratio);
const IMAGES = WORK.map(([name]) => `/home/identity/${name}.webp`);
const cards = computed<Card[]>(() =>
  IMAGES.map((src, index) => ({
    src,
    alt: `${heading.value.lead} ${heading.value.accent}`.trim(),
    ratio: RATIOS[index % RATIOS.length]!,
  })),
);
// Track length in card heights (cards + 1.5% gaps), so the CSS can size the
// section's scroll length before any script runs.
const GAP_RATIO = 0.015;
const trackUnits = computed(() =>
  cards.value.reduce((sum, card) => sum + card.ratio, 0) + GAP_RATIO * (cards.value.length - 1),
);

// jsoft.vercel.app's "Selected work": the section is as tall as the horizontal
// travel needs, its screen is sticky, and scrolling down slides the row to the
// left while the bar fills. Under the section before it (`under`), the first
// screen of that scroll is the one in which it is uncovered: the row waits,
// and the veil (VEIL at first) clears as the screen above lifts off.
const VEIL = 0.5;
const root = ref<HTMLElement | null>(null);
const screen = ref<HTMLElement | null>(null);
const track = ref<HTMLElement | null>(null);
const bar = ref<HTMLElement | null>(null);
const veil = ref<HTMLElement | null>(null);
let frame = 0;
let stop: (() => void) | undefined;

const render = () => {
  frame = 0;
  const section = root.value;
  const row = track.value;
  if (!section || !row) return;
  // The row ends with a spacer as wide as the end padding.
  const end = row.lastElementChild as HTMLElement | null;
  const travel = end ? Math.max(0, end.offsetLeft + end.offsetWidth - row.clientWidth) : 0;
  // The screen of scroll in which it is uncovered is the 100vh the CSS starts
  // it early by, and it stays pinned for the section's height less its
  // screen's (on a phone the screen is longer than the window: the description
  // lies below the row). window.innerHeight is neither on a phone, where it
  // changes as the browser's bars come and go.
  const uncover = props.under ? largeViewportHeight() : 0;
  const scrolled = -section.getBoundingClientRect().top;
  const distance = section.offsetHeight - (screen.value?.offsetHeight ?? window.innerHeight) - uncover;
  const progress = distance > 0 ? Math.min(1, Math.max(0, (scrolled - uncover) / distance)) : 0;
  row.style.transform = `translate3d(${(-travel * progress).toFixed(1)}px, 0, 0)`;
  if (bar.value) bar.value.style.transform = `scaleX(${progress.toFixed(4)})`;
  if (veil.value && uncover) {
    const lifted = Math.min(1, Math.max(0, scrolled / uncover));
    veil.value.style.opacity = (VEIL * (1 - lifted) * (1 - lifted)).toFixed(3);
  }
};

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(render);
};

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  stop = () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  };
  render();
});

onBeforeUnmount(() => {
  stop?.();
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <section
    ref="root"
    class="gallery"
    :class="{ 'gallery--under': under }"
    :style="{ '--track-units': trackUnits.toFixed(3) }"
  >
    <div ref="screen" class="gallery__screen">
      <!-- What stays on screen while the row moves. On a desktop this box
           is not there (display: contents) and the bar comes after the
           description; on a phone it fills the screen and the description
           follows below it. -->
      <div class="gallery__pinned">
        <h2 class="gallery__heading">
          <span v-blur-reveal class="gallery__heading-line">{{ heading.lead }}</span>
          <span v-if="heading.accent" v-blur-reveal class="gallery__heading-line gallery__heading-line--accent">{{ ` ${heading.accent}` }}</span>
        </h2>

        <div ref="track" class="gallery__track">
          <figure
            v-for="card in cards"
            :key="card.src"
            v-rise
            class="gallery__card"
            :style="{ '--ratio': card.ratio }"
          >
            <OptImage
              :src="card.src"
              :alt="card.alt"
              :sizes="`(max-width: 767px) ${Math.ceil(70 * card.ratio)}vw, ${Math.ceil(40 * card.ratio)}vw`"
              loading="lazy"
              decoding="async"
              draggable="false"
            />
          </figure>
          <div class="gallery__spacer" aria-hidden="true" />
        </div>

        <div v-rise class="gallery__progress" aria-hidden="true">
          <div class="gallery__progress-line"><div ref="bar" class="gallery__progress-fill" /></div>
          <span class="gallery__progress-hint">{{ $t("home.gallery.hint") }}</span>
        </div>
      </div>

      <p v-rise class="gallery__description">{{ description }}</p>

      <div v-if="under" ref="veil" class="gallery__veil" aria-hidden="true" />
    </div>
  </section>
</template>

<style scoped>
/* Card height drives everything: the row is --track-units card heights long plus
   its side paddings, and the section is one screen plus that overflow (x1.1 of
   scroll per pixel of travel, as in the reference). */
.gallery {
  /* The heading and the description follow the site's type, which grows with
     the width; here they are also capped by the screen's height (at 1920 x
     1080 and 1366 x 768 the caps change nothing), so a wide, short screen
     (21:9, 32:9) does not spend its height on them. The description is set a
     little smaller than the intro step (0.84 of it), so the pictures get the
     height. */
  --title-size: min(var(--section-title-size), 9.1svh);
  --text-size: var(--type-description-size);
  --track-gap: min(clamp(1.5rem, 3vw, 3.5rem), 5.5svh);
  --text-gap: clamp(1.25rem, min(4vw, 6svh), 5rem);
  --bar-gap: clamp(1rem, 2vw, 1.75rem);
  /* The row takes the height the rest of the screen leaves: the header gap,
     two heading lines, the gaps, four lines of description (plus a fifth's
     worth of slack) and the bar. It was 100svh - 36rem, but past 1920px the
     rem grows with the width, so on a 32:9 screen that left a sliver. Never
     more than 46% of the height or 40% of the width (36% and 34% before: the
     pictures were made larger). */
  --room: calc(100svh - 6.5rem - 2.1 * var(--title-size) - var(--track-gap) - var(--text-gap) - 5.2 * var(--text-size) - var(--bar-gap) - 2.5rem);
  --card-h: max(6rem, min(40vw, 46vh, var(--room)));
  /* Where the row starts: 27% of the content frame (--fvw is 1vw up to the
     1920px frame, then grows with the root size) plus the space beside the
     frame on wider screens. A plain 27vw put the first card up to 600px left of
     the heading on a 32:9 screen, whose heading is centred in the frame; up to
     1920px wide nothing changes. */
  --frame-edge: max(0px, calc((100vw - var(--frame-max)) / 2));
  --start-padding: max(1.5rem, calc(27 * var(--fvw) + var(--frame-edge)));
  /* The width of the description's text (also set on it below): the intro
     measure (--type-measure-intro, 40.5em), written in the step's size
     because it is used here, on other elements. The row's travel ends with
     the last card's right edge on the text's right edge, so the end padding
     is the text's side margin. */
  --description-width: min(100vw - 3rem, 40.5 * var(--text-size));
  --end-padding: calc((100vw - var(--description-width)) / 2);
  --travel: max(0px, calc(var(--card-h) * var(--track-units) + var(--start-padding) + var(--end-padding) - 100vw));
  position: relative;
  height: calc(100vh + var(--travel) * 1.1);
  background: #fff;
}

/* Under the section before it: it starts a screen higher, behind that
   section's last screen, and adds that screen to its own scroll (the one in
   which it stands still and is uncovered). */
.gallery--under {
  z-index: 0;
  height: calc(200vh + var(--travel) * 1.1);
  margin-top: -100vh;
}

/* Darkens the screen while it is still under the section above; the script
   clears it as that section lifts off (none without the script). */
.gallery__veil {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: #000;
  opacity: 0;
  pointer-events: none;
}

.gallery__screen {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  /* safe: on short windows the block starts under the header instead of being
     centred up behind it. */
  justify-content: safe center;
  height: 100vh;
  height: 100svh;
  /* Clears the fixed header (~6rem tall with its top offset). */
  padding-top: 6.5rem;
  overflow: hidden;
}

/* Not a box of its own on a desktop: the heading, the row and the bar are the
   screen's own items there, the bar after the description. */
.gallery__pinned {
  display: contents;
}

/* The section heading: the h1 step (--section-title-size). */
.gallery__heading {
  margin: 0 auto;
  padding-inline: 1.5rem;
  color: #000;
  font-family: var(--app-font-display);
  font-size: var(--title-size);
  font-weight: 600;
  line-height: var(--type-h1-lh);
  letter-spacing: var(--type-h1-ls);
  text-align: center;
  text-wrap: balance;
}

.gallery__heading-line {
  display: block;
}

.gallery__heading-line--accent {
  width: fit-content;
  margin-inline: auto;
  /* A block's background covers its line box only: with this tight
     line-height the descenders (g, y, q) fall outside it and, clipped to the
     text, go unpainted. Pad the paint box down to them; the negative margin
     keeps the layout. */
  padding-bottom: 0.15em;
  margin-bottom: -0.15em;
  background: linear-gradient(90deg, #009c30, #00d82a);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.gallery__track {
  display: flex;
  gap: calc(var(--card-h) * 0.015);
  margin-top: var(--track-gap);
  padding-left: var(--start-padding);
  will-change: transform;
}

.gallery__card {
  flex-shrink: 0;
  width: calc(var(--card-h) * var(--ratio));
  height: var(--card-h);
  margin: 0;
  overflow: hidden;
  border-radius: calc(var(--card-h) * 0.04);
  background: #f2f2f2;
}

.gallery__spacer {
  flex-shrink: 0;
  width: calc(var(--end-padding) - var(--card-h) * 0.015);
}

/* :deep: the <img> sits inside OptImage, past this component's scope. */
.gallery__card :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

/* Running text (~360 characters) below the cards: the intro step, as the
   identity text above, centred in a column of its measure, centred on
   the screen. */
.gallery__description {
  order: 1;
  box-sizing: content-box;
  max-width: var(--description-width);
  margin: var(--text-gap) auto 0;
  padding-inline: 1.5rem;
  color: #606060;
  font-family: var(--type-intro-family);
  font-size: var(--text-size);
  line-height: var(--type-intro-lh);
  letter-spacing: var(--type-intro-ls);
  text-align: center;
  text-wrap: pretty;
}

.gallery__progress {
  order: 2;
  display: flex;
  align-items: center;
  gap: 1rem;
  width: min(100% - 3rem, 48rem);
  margin: var(--bar-gap) auto 0;
}

.gallery__progress-line {
  flex: 1;
  height: 1px;
  overflow: hidden;
  background: rgb(0 0 0 / 0.08);
}

.gallery__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #009c30, #00d82a);
  transform: scaleX(0);
  transform-origin: left;
}

/* The caption step; #6b706c passes 4.5:1 on white (#8a8f8b was 3.3:1). */
.gallery__progress-hint {
  flex-shrink: 0;
  color: #6b706c;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-lh);
  letter-spacing: var(--type-caption-ls);
}

/* Phones. A phone's browser leaves 550-750px of height, and the heading, the
   row, ten lines of description and the bar do not fit that: the description
   was cut off at the bottom of the pinned screen, its last lines never seen.
   There the heading, the row and the bar are what is pinned (they fill the
   screen, under the header), and the description lies below them: it comes
   up, whole, when the row has run and the page scrolls on. The screen is
   therefore longer than the window, and the section longer by the same. */
@media (max-width: 767px) {
  .gallery {
    /* What the header (6.75rem), the heading's three lines, the gaps and the
       bar leave above the line things are revealed at (90% of the screen,
       plugins/blur-reveal.ts: a bar pinned below it would never come in),
       never more than 70% of the width. */
    --card-h: max(8rem, min(70vw, 42svh, 90svh - 10.75rem - 3.2 * var(--title-size)));
    --start-padding: 1.25rem;
    --end-padding: 1.25rem;
    height: calc(100vh + var(--travel) * 1.1 + 20rem);
  }

  .gallery--under {
    height: calc(200vh + var(--travel) * 1.1 + 20rem);
  }

  .gallery__screen {
    justify-content: flex-start;
    height: auto;
    min-height: 100vh;
    min-height: 100svh;
    padding-top: 6.75rem;
    padding-bottom: 3rem;
  }

  .gallery__pinned {
    display: flex;
    flex-direction: column;
    justify-content: safe center;
    min-height: calc(100svh - 6.75rem);
    /* Keeps the bar above the reveal line (see --card-h). */
    padding-bottom: calc(10svh + 0.25rem);
  }

  .gallery__description {
    margin-top: 0.5rem;
  }
}

/* No scroll-driven motion: an ordinary section whose row scrolls sideways. */
@media (prefers-reduced-motion: reduce) {
  .gallery,
  .gallery--under {
    height: auto;
    margin-top: 0;
    padding-block: 5rem;
  }

  .gallery__veil {
    display: none;
  }

  .gallery__screen {
    position: static;
    height: auto;
    min-height: 0;
    padding-bottom: 0;
    overflow: visible;
  }

  .gallery__pinned {
    min-height: 0;
    padding-bottom: 0;
  }

  .gallery__track {
    overflow-x: auto;
  }

  .gallery__progress {
    display: none;
  }
}
</style>
