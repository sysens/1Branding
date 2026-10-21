<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { splitIdentityTitle } from "~/utils/identityTitle";

type Card = { src: string; alt: string; ratio: number };

const props = withDefaults(
  defineProps<{
    title?: string | null;
    description?: string | null;
  }>(),
  { title: null, description: null },
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
// left while the bar fills.
const root = ref<HTMLElement | null>(null);
const track = ref<HTMLElement | null>(null);
const bar = ref<HTMLElement | null>(null);
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
  const distance = section.offsetHeight - window.innerHeight;
  const progress = distance > 0 ? Math.min(1, Math.max(0, -section.getBoundingClientRect().top / distance)) : 0;
  row.style.transform = `translate3d(${(-travel * progress).toFixed(1)}px, 0, 0)`;
  if (bar.value) bar.value.style.transform = `scaleX(${progress.toFixed(4)})`;
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
  <section ref="root" class="gallery" :style="{ '--track-units': trackUnits.toFixed(3) }">
    <div class="gallery__screen">
      <h2 class="gallery__heading">
        <span v-blur-reveal class="gallery__heading-line">{{ heading.lead }}</span>
        <span v-if="heading.accent" v-blur-reveal="0.12" class="gallery__heading-line gallery__heading-line--accent">{{ ` ${heading.accent}` }}</span>
      </h2>

      <div ref="track" class="gallery__track">
        <figure
          v-for="card in cards"
          :key="card.src"
          class="gallery__card"
          :style="{ '--ratio': card.ratio }"
        >
          <OptImage
            :src="card.src"
            :alt="card.alt"
            :sizes="`(max-width: 767px) ${Math.ceil(70 * card.ratio)}vw, ${Math.ceil(34 * card.ratio)}vw`"
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        </figure>
        <div class="gallery__spacer" aria-hidden="true" />
      </div>

      <p class="gallery__description">{{ description }}</p>

      <div class="gallery__progress" aria-hidden="true">
        <div class="gallery__progress-line"><div ref="bar" class="gallery__progress-fill" /></div>
        <span class="gallery__progress-hint">{{ $t("home.gallery.hint") }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Card height drives everything: the row is --track-units card heights long plus
   its side paddings, and the section is one screen plus that overflow (x1.1 of
   scroll per pixel of travel, as in the reference). */
.gallery {
  --card-h: min(34vw, 42vh);
  --start-padding: max(1.5rem, 27vw);
  /* The description's type size and the width of its text (also set on it
     below): the row's travel ends with the last card's right edge on the
     text's right edge, so the end padding is the text's side margin. */
  --description-font: clamp(0.95rem, min(1.2vw, 2.1vh), 1.75rem);
  --description-width: min(100vw - 3rem, 58 * var(--description-font));
  --end-padding: calc((100vw - var(--description-width)) / 2);
  --travel: max(0px, calc(var(--card-h) * var(--track-units) + var(--start-padding) + var(--end-padding) - 100vw));
  position: relative;
  height: calc(100vh + var(--travel) * 1.1);
  background: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
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

.gallery__heading {
  margin: 0 auto;
  padding-inline: 1.5rem;
  color: #000;
  font-size: var(--section-title-size);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
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
  margin-top: clamp(1.5rem, 3vw, 3.5rem);
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

/* Design: 24px on its 2000px frame (1.2vw), three lines ~58em wide, set below
   the cards; the height cap keeps the whole screen within short windows. */
.gallery__description {
  box-sizing: content-box;
  max-width: var(--description-width);
  margin: clamp(1.25rem, min(4vw, 6vh), 5rem) auto 0;
  padding-inline: 1.5rem;
  color: #606060;
  font-size: var(--description-font);
  line-height: 1.27;
  letter-spacing: -0.005em;
  text-align: center;
}

.gallery__progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: min(100% - 3rem, 48rem);
  margin: clamp(1rem, 2vw, 1.75rem) auto 0;
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

.gallery__progress-hint {
  flex-shrink: 0;
  color: #8a8f8b;
  font-size: 0.75rem;
}

@media (max-width: 767px) {
  .gallery {
    --card-h: min(70vw, 42svh);
    --start-padding: 1.25rem;
    --end-padding: 1.25rem;
  }

  .gallery__screen {
    padding-top: 5.75rem;
  }
}

/* No scroll-driven motion: an ordinary section whose row scrolls sideways. */
@media (prefers-reduced-motion: reduce) {
  .gallery {
    height: auto;
    padding-block: 5rem;
  }

  .gallery__screen {
    position: static;
    height: auto;
    overflow: visible;
  }

  .gallery__track {
    overflow-x: auto;
  }

  .gallery__progress {
    display: none;
  }
}
</style>
