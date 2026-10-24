<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { AwardNumeral } from "~/utils/awardNumeral";

// "One vision. Every solution." — the Awwwards 2026 card: copy on the left, a
// chrome-and-black numeral "1" on the right. The numeral is modelled and lit
// in three.js (utils/awardNumeral.ts), not an image; it is set up once the
// section comes near and drawn again only when its box changes size.

const { t } = useI18n();
const localePath = useLocalePath();

const box = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);
let numeral: AwardNumeral | null = null;
let cleanup: (() => void) | undefined;
let disposed = false;

const draw = () => {
  if (!numeral || !box.value) return;
  numeral.resize(box.value.clientWidth, box.value.clientHeight);
  numeral.render();
};

const start = async () => {
  if (numeral || !canvas.value) return;
  try {
    const { createAwardNumeral } = await import("~/utils/awardNumeral");
    if (disposed || !canvas.value) return;
    numeral = createAwardNumeral(canvas.value);
    draw();
    ready.value = true;
  } catch (error) {
    console.warn("Award numeral:", error instanceof Error ? error.message : "WebGL unavailable");
  }
};

onMounted(() => {
  const element = box.value;
  if (!element) return;
  const near = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) void start();
  }, { rootMargin: "800px 0px" });
  const sized = new ResizeObserver(draw);
  near.observe(element);
  sized.observe(element);
  cleanup = () => {
    near.disconnect();
    sized.disconnect();
  };
});

onBeforeUnmount(() => {
  disposed = true;
  cleanup?.();
  numeral?.dispose();
  numeral = null;
});
</script>

<template>
  <section class="vision" aria-labelledby="vision-title">
    <div class="vision__frame">
      <p v-blur-reveal class="vision__brand">{{ t("home.vision.brand") }}</p>
      <h2 id="vision-title" class="vision__title">
        <span v-blur-reveal>{{ `${t("home.vision.lineFirst")} ` }}</span>
        <span v-blur-reveal>{{ t("home.vision.lineSecond") }}</span>
      </h2>
      <p v-blur-reveal class="vision__label">{{ t("home.vision.label") }}</p>
      <p v-blur-reveal class="vision__year">{{ t("home.vision.year") }}</p>
      <div ref="box" class="vision__numeral" :class="{ 'is-ready': ready }" role="img" aria-label="A chrome and black numeral one">
        <canvas ref="canvas" class="vision__canvas" aria-hidden="true" />
      </div>
      <NuxtLink v-rise :to="localePath('/about')" class="vision__button">{{ t("home.vision.cta") }}</NuxtLink>
    </div>
  </section>
</template>

<style scoped>
/* --u is one pixel of the 2000x1141 design frame; the frame fits one screen. */
.vision {
  --u: min(calc(0.05 * var(--fvw)), calc(100svh / 1141));
  position: relative;
  /* Same layer as the dark sections' black edge fades (z-index 30) but later
     in the page, so they do not dirty this white card; the fixed header (31)
     stays on top. */
  z-index: 30;
  overflow: clip;
  /* Room above the card, so it does not sit right under the previous section. */
  padding-top: calc(120 * var(--u));
  background: #fff;
  color: #0a0a0a;
}

.vision__frame {
  position: relative;
  width: calc(2000 * var(--u));
  height: calc(1141 * var(--u));
  margin-inline: auto;
}

.vision__brand,
.vision__title,
.vision__label,
.vision__year {
  position: absolute;
  left: calc(194 * var(--u));
  margin: 0;
  white-space: nowrap;
}

/* The frame is placed in design units, the type is on the site's scale, so
   each line is placed by its cap top at the design's point, with the step's
   own half-leading taken off in em (SF Pro: cap height 0.705em, a line box
   adds (line-height - 0.705) / 2 above it). The big lines also start a side
   bearing (~0.04em) left of the column, as their glyphs sit inside the box. */
.vision__brand {
  top: calc(45 * var(--u) - (var(--type-h4-lh) - 0.705) / 2 * 1em);
  font-family: var(--app-font-display);
  font-size: var(--type-h4-size);
  font-weight: 600;
  line-height: var(--type-h4-lh);
  letter-spacing: var(--type-h4-ls);
}

/* The title is centred where the design's was (its two lines' caps spanned
   design y 200..463): its cap top sits (lh + 0.705) / 2 em above that centre
   and its box another (lh - 0.705) / 2 em higher, lh em in all. The gaps to
   the brand above and the label below so stay even whichever step it takes.
   It is display-s, not the design's larger size: a step up would run into
   the numeral. */
.vision__title {
  --title-lh: var(--type-display-s-lh);
  left: calc(194 * var(--u) - 0.04em);
  top: calc(331.5 * var(--u) - var(--title-lh) * 1em);
  display: flex;
  flex-direction: column;
  font-family: var(--app-font-display);
  font-size: var(--type-display-s-size);
  font-weight: 700;
  line-height: var(--title-lh);
  letter-spacing: var(--type-display-s-ls);
}

.vision__label {
  top: calc(554 * var(--u) - (var(--type-lead-lh) - 0.705) / 2 * 1em);
  color: #1a1a1a;
  font-family: var(--app-font-sans);
  font-size: var(--type-lead-size);
  font-weight: 600;
  line-height: var(--type-lead-lh);
  letter-spacing: var(--type-label-ls);
  text-transform: uppercase;
}

.vision__year {
  left: calc(194 * var(--u) - 0.04em);
  top: calc(625 * var(--u) - (var(--type-display-xl-lh) - 0.705) / 2 * 1em);
  font-family: var(--app-font-display);
  font-size: var(--type-display-xl-size);
  font-weight: 700;
  line-height: var(--type-display-xl-lh);
  letter-spacing: var(--type-display-xl-ls);
  background: linear-gradient(22deg, #158030 0%, #0bb338 34%, #04e036 62%, #00ff38 86%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* The render frame the numeral was fitted to: design x 1100..1900, y 0..960. */
.vision__numeral {
  position: absolute;
  left: calc(1100 * var(--u));
  top: 0;
  width: calc(800 * var(--u));
  height: calc(960 * var(--u));
  opacity: 0;
  transition: opacity 0.6s ease;
  /* The floor reflection fades out before the canvas edge. */
  -webkit-mask-image: linear-gradient(#000 88%, transparent);
  mask-image: linear-gradient(#000 88%, transparent);
}

.vision__numeral.is-ready {
  opacity: 1;
}

.vision__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.vision__button {
  position: absolute;
  left: calc(798 * var(--u));
  top: calc(996 * var(--u));
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--button-w);
  height: var(--button-h);
  padding-inline: var(--button-pad);
  white-space: nowrap;
  border-radius: 999px;
  background: #000;
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-lead-size);
  font-weight: 600;
  line-height: var(--type-lead-lh);
  letter-spacing: var(--type-lead-ls);
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.vision__button:hover,
.vision__button:focus-visible {
  transform: scale(1.04);
  box-shadow: 0 calc(10 * var(--u)) calc(30 * var(--u)) rgb(0 0 0 / 0.25);
}

.vision__button:focus-visible {
  outline: 2px solid #00c936;
  outline-offset: 4px;
}

/* The Russian and Uzbek lines are longer than "Every solution.": where the
   frame gets narrow for them (tablets, and wide short screens, where the
   frame follows the height) they take the h1 step to stay clear of the
   numeral. */
@media (min-width: 768px) and (max-width: 1099px), (min-width: 768px) and (min-aspect-ratio: 9/5) {
  .vision__title:lang(ru),
  .vision__title:lang(uz) {
    --title-lh: var(--type-h1-lh);
    font-size: var(--type-h1-size);
    letter-spacing: var(--type-h1-ls);
  }
}

/* Phones (and screens too short for the frame, such as a phone held
   sideways): copy, 2026, the numeral and the button stack. */
@media (max-width: 767px), (max-height: 499px) {
  .vision {
    padding: 4.5rem 1.25rem 4rem;
  }

  .vision__frame {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: auto;
    height: auto;
  }

  .vision__brand,
  .vision__title,
  .vision__label,
  .vision__year,
  .vision__numeral,
  .vision__button {
    position: static;
  }

  .vision__title {
    margin-top: 1.5rem;
  }

  .vision__label {
    margin-top: 1.4rem;
    white-space: normal;
  }

  .vision__year {
    margin-top: 0.4rem;
  }

  .vision__numeral {
    align-self: center;
    width: min(100%, 26rem);
    height: auto;
    aspect-ratio: 800 / 960;
    margin-top: 0.5rem;
  }

  .vision__button {
    align-self: center;
    margin-top: 1.5rem;
  }
}

/* "Barcha yechimlar." does not fit a phone under 390px at display-s. */
@media (max-width: 389px) {
  .vision__title:lang(uz) {
    --title-lh: var(--type-h1-lh);
    font-size: var(--type-h1-size);
    letter-spacing: var(--type-h1-ls);
  }
}

@media (prefers-reduced-motion: reduce) {
  .vision__numeral {
    transition: none;
  }
}
</style>
