<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";

// "One vision. Every solution." — the Awwwards 2026 card: copy on the left, a
// chrome-and-green numeral "1" on the right. The numeral is a picture of its
// three.js model (utils/award/numeralModel.js) drawn once by
// scripts/render-award-numeral.mjs: building the model in the visitor's
// browser held the page for about a second as the sections above it
// animated, and showed nothing where WebGL is off.

const { t } = useI18n();
const localePath = useLocalePath();
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
      <div v-rise class="vision__numeral">
        <OptImage
          src="/home/award/numeral.webp"
          alt=""
          sizes="(max-width: 767px) min(100vw, 26rem), 40vw"
          width="1600"
          height="1920"
          :preview="false"
          loading="lazy"
          decoding="async"
        />
      </div>
      <NuxtLink v-rise data-pill :to="localePath('/about')" class="vision__button ob-button ob-button--dark">{{ t("home.vision.cta") }}</NuxtLink>
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
  /* The floor reflection fades out before the picture's edge. */
  -webkit-mask-image: linear-gradient(#000 88%, transparent);
  mask-image: linear-gradient(#000 88%, transparent);
}

/* :deep: the <img> is inside OptImage's <picture>. */
.vision__numeral :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
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

/* The shared .ob-button, placed on the frame. */
.vision__button {
  position: absolute;
  left: calc(798 * var(--u));
  top: calc(996 * var(--u));
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
  .vision__numeral {
    position: static;
  }

  .vision__title {
    margin-top: 1.5rem;
  }

  .vision__label {
    margin-top: 1.4rem;
    white-space: normal;
  }

  /* Back in the flow (relative: the button's blob is placed in it). */
  .vision__button {
    position: relative;
    left: auto;
    top: auto;
    align-self: center;
    margin-top: 1.5rem;
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
}

/* "Barcha yechimlar." does not fit a phone under 390px at display-s. */
@media (max-width: 389px) {
  .vision__title:lang(uz) {
    --title-lh: var(--type-h1-lh);
    font-size: var(--type-h1-size);
    letter-spacing: var(--type-h1-ls);
  }
}

</style>
