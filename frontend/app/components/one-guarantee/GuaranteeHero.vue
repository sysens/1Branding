<script setup lang="ts">
// The first screen of /one-guarantee, after the design: the wordmark and its
// line on the left, the brand's "1" as a tall upright stroke of light
// standing on the lit edge of a panel, and in the panel the page's claim
// ("There are many companies ...").
//
// The light is React Bits' Laser Flow (LaserFlow.vue), in the brand's green,
// with the panel as its surface and its beam drawn as the "1" (oneHeight,
// oneLift): the mark's head, set upright, with its stem carried straight
// down to the panel's top edge, where the light runs out along the edge (a
// thin lit line: edge, and a small foot: flare) and pours over the corner;
// and it keeps running (flow): fine dust streaming down beside the stroke,
// in a halo that stays smooth. Its frame is the top of the section and a strip of the
// panel below the edge, where the light runs down the sides. Where WebGL 2
// is missing a still "1" stands in.
import { onBeforeUnmount, onMounted, ref } from "vue";
import LaserFlow from "~/components/one-guarantee/LaserFlow.vue";

const { t } = useI18n();

const section = ref<HTMLElement | null>(null);
const frame = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const failed = ref(false);
// On phones the beam comes down the middle, and fewer pixels are shaded.
const narrow = ref(false);
// Where the "1" stands (the middle of its stem), across the whole section
// (the light's own frame): 60% across the content frame (50% on phones),
// which is narrower than the section on screens wider than the frame.
const beamPosition = ref(0.6);
// The "1": the scale of the mark's head (the mark's own height), and how far
// its stem is carried on below the mark's foot. The whole figure takes FIGURE
// of the room over the panel's edge (on phones: what is left under the
// wordmark and its line), and its stem is about a third of the mark's height
// wide, so MARK of the room keeps it a slender stroke.
const oneHeight = ref(0);
const oneLift = ref(0);
const FIGURE = 0.62;
const MARK = 0.15;

let query: MediaQueryList | null = null;
let sizes: ResizeObserver | null = null;
const place = () => {
  narrow.value = Boolean(query?.matches);
  const across = narrow.value ? 0.5 : 0.6;
  const whole = section.value?.getBoundingClientRect();
  const inner = frame.value?.getBoundingClientRect();
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  // On phones the figure starts where the mask in the CSS lets the light show
  // (18.5rem down).
  const room = inner?.height ?? 0;
  const figure = Math.max(0, narrow.value ? room - 18.5 * rem : FIGURE * room);
  const mark = Math.min(MARK * room, 0.36 * figure);
  oneHeight.value = mark;
  oneLift.value = figure - mark;
  beamPosition.value = whole && inner && whole.width > 0 ? (inner.left - whole.left + across * inner.width) / whole.width : across;
};

onMounted(() => {
  query = matchMedia("(max-width: 767px)");
  place();
  query.addEventListener("change", place);
  if (section.value) {
    sizes = new ResizeObserver(place);
    sizes.observe(section.value);
  }
});

onBeforeUnmount(() => {
  query?.removeEventListener("change", place);
  sizes?.disconnect();
});
</script>

<template>
  <section ref="section" class="og-hero" :style="{ '--one-h': `${oneHeight}px`, '--one-lift': `${oneLift}px` }">
    <div class="og-hero__laser" aria-hidden="true">
      <LaserFlow
        :surface="panel"
        :beam-position="beamPosition"
        color="#3fff38"
        :intensity="1.8"
        :flare="0.85"
        :spread="1.5"
        :spill="1"
        :fog="0.2"
        :dust="1.6"
        :beam-width="1.5"
        :streaks="1.5"
        :dots="1"
        :pulse="1.5"
        :speed="1.5"
        :seed="3"
        :dpr="narrow ? 1.5 : undefined"
        :one-height="oneHeight"
        :one-lift="oneLift"
        :flow="1"
        :edge="0.4"
        mouse-interaction
        intro
        @unsupported="failed = true"
      />
      <span v-if="failed" class="og-hero__beam-still" />
    </div>

    <div ref="frame" class="og-hero__top">
      <div class="og-hero__copy">
        <h1 class="og-hero__title type-display-s">
          <span class="sr-only">{{ t("seo.oneGuarantee.h1") }}</span>
          <span aria-hidden="true">One<span class="og-grad ob-green">Guarantee</span></span>
        </h1>
        <p v-rise class="og-hero__lead type-intro">{{ t("oneGuarantee.hero.lead") }}</p>
      </div>
    </div>

    <div ref="panel" class="og-hero__panel">
      <span class="og-hero__edge" aria-hidden="true" />
      <span class="og-hero__dots" aria-hidden="true" />
      <h2 v-blur-reveal class="og-hero__claim type-display-s">
        <span>{{ t("oneGuarantee.problem.line1") }}</span>
        {{ " " }}
        <span>{{ t("oneGuarantee.problem.line2") }} <span class="og-grad ob-green">{{ t("oneGuarantee.problem.accent") }}</span></span>
      </h2>
      <p v-rise class="og-hero__text type-intro">
        {{ t("oneGuarantee.problem.text") }}
        <span class="og-hero__text-accent ob-green">{{ t("oneGuarantee.problem.textAccent") }}</span>
      </p>
    </div>
  </section>
</template>

<style scoped>
/* The design at 1440px: the panel's edge 678px down (the header is over the
   top), the beam 60% across. Type is the site's scale (the .type-* classes in
   the template), not the design's own sizes: the wordmark and the claim are
   display-s, their texts the intro step. */
.og-hero {
  --top-h: clamp(27rem, 47 * var(--fvw), 80svh);
  /* 60% across the content frame (which is centred in the section). */
  --beam-x: calc(50% + 0.1 * min(100%, var(--frame-max)));
  --panel-radius: clamp(1rem, 1.6vw, 1.6rem);
  position: relative;
  background: radial-gradient(ellipse 80% 50% at 50% 0, #0b0d0b 0%, #000 100%);
}

/* The beam's frame: down to the panel's edge and a strip beyond it, for the
   light that pours over the panel's corners and runs down its sides. The
   strip's foot fades out, so that light never ends on the frame's edge. */
.og-hero__laser {
  position: absolute;
  inset: 0 0 auto;
  height: calc(var(--top-h) + 18rem);
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 8rem), transparent 100%);
  mask-image: linear-gradient(to bottom, #000 calc(100% - 8rem), transparent 100%);
  pointer-events: none;
}

/* Without WebGL 2: a still "1" and its glow on the edge. */
.og-hero__beam-still {
  position: absolute;
  inset: 0 0 auto;
  height: var(--top-h);
  background:
    radial-gradient(ellipse 34% 5% at var(--beam-x) 100%, rgb(235 255 240 / 0.9), transparent),
    radial-gradient(ellipse 42% 34% at var(--beam-x) 100%, rgb(60 230 110 / 0.22), transparent);
}

/* The figure of LaserFlow's shader: the upright mark (ONE there) in its box,
   0.588 of its height wide with the middle of its stem 0.426 of the height
   from the left, --one-lift over the edge; and under it the stem carried on. */
.og-hero__beam-still::before,
.og-hero__beam-still::after {
  position: absolute;
  background: #f0fff4;
  content: "";
  filter: drop-shadow(0 0 0.75rem rgb(60 240 110 / 0.7));
}

.og-hero__beam-still::before {
  bottom: var(--one-lift);
  left: calc(var(--beam-x) - 0.4256 * var(--one-h));
  width: calc(0.5879 * var(--one-h));
  height: var(--one-h);
  clip-path: polygon(47.2% 0, 98.7% 0, 100% 100%, 44.8% 100%, 45.6% 39.5%, 91.3% 31.2%, 0 31.2%);
}

.og-hero__beam-still::after {
  bottom: 0;
  left: calc(var(--beam-x) - 0.1623 * var(--one-h));
  width: calc(0.3246 * var(--one-h));
  height: calc(var(--one-lift) + 1px);
}

/* The content frame, as on the landing: as wide as the screen up to 1920px,
   centred on wider ones (--frame-max). The beam's light runs on past it to the
   screen's edges. */
.og-hero__top {
  position: relative;
  max-width: var(--frame-max);
  height: var(--top-h);
  margin-inline: auto;
}

.og-hero__copy {
  position: absolute;
  top: 53%;
  left: max(1.25rem, 11.6 * var(--fvw));
  z-index: 1;
  max-width: min(100% - 2.5rem, 44rem);
}

.og-hero__title {
  margin: 0;
}

.og-hero__lead {
  max-width: 21em;
  margin: 0.45em 0 0 0.1em;
  color: rgb(255 255 255 / 0.74);
}

/* The beam's surface. The radius is read by the beam (it follows the corners);
   the panel itself has no fill, the light stays outside its box. */
.og-hero__panel {
  position: relative;
  width: min(100% - 2.5rem, 87 * var(--fvw));
  margin-inline: auto;
  padding: clamp(4.5rem, 8.2 * var(--fvw), 9.5rem) clamp(0.5rem, 3vw, 4rem) clamp(4rem, 8 * var(--fvw), 9rem);
  border-radius: var(--panel-radius) var(--panel-radius) 0 0;
  text-align: center;
}

/* The panel's outline: its top edge and the sides, fading out downwards. Faint:
   the beam draws the lit part of the edge itself. */
.og-hero__edge {
  position: absolute;
  inset: 0 0 auto;
  height: min(100%, 15rem);
  border: 1px solid rgb(188 255 205 / 0.4);
  border-bottom: 0;
  border-radius: var(--panel-radius) var(--panel-radius) 0 0;
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
  pointer-events: none;
}

.og-hero__dots {
  position: absolute;
  inset: 0.75rem 0.75rem auto;
  height: min(100%, 22rem);
  background-image: radial-gradient(rgb(255 255 255 / 0.16) 1px, transparent 1.4px);
  background-size: 1.75rem 1.75rem;
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
  pointer-events: none;
}

.og-hero__claim {
  position: relative;
  margin: 0;
}

.og-hero__claim > span {
  display: block;
}

.og-hero__text {
  position: relative;
  max-width: var(--type-measure-intro);
  margin: clamp(1.25rem, 2.4 * var(--fvw), 3rem) auto 0;
  text-wrap: balance;
}

.og-hero__text-accent {
  display: block;
  color: #1fd13f;
}

/* Phones: the wordmark centred under the header, the beam behind it down the middle. */
@media (max-width: 767px) {
  .og-hero {
    --top-h: min(31rem, 78svh);
    --beam-x: 50%;
  }

  /* The light would run through the wordmark and its line (white on white):
     here it shows only from under them, where the "1" is. */
  .og-hero__laser {
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, transparent 14rem, #000 18.5rem, #000 calc(100% - 8rem), transparent 100%);
    mask-image: linear-gradient(to bottom, transparent 0, transparent 14rem, #000 18.5rem, #000 calc(100% - 8rem), transparent 100%);
  }

  .og-hero__copy {
    top: 7.75rem;
    right: 1.25rem;
    left: 1.25rem;
    max-width: none;
    text-align: center;
  }

  .og-hero__lead {
    margin-inline: auto;
  }
}
</style>
