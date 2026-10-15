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
  <!-- The copy is English in both locales. -->
  <section class="vision" lang="en" aria-labelledby="vision-title">
    <div class="vision__frame">
      <p v-blur-reveal class="vision__brand">{{ t("home.vision.brand") }}</p>
      <h2 id="vision-title" class="vision__title">
        <span v-blur-reveal="0.1">{{ t("home.vision.lineFirst") }}</span>
        <span v-blur-reveal="0.22">{{ t("home.vision.lineSecond") }}</span>
      </h2>
      <p v-blur-reveal="0.34" class="vision__label">{{ t("home.vision.label") }}</p>
      <p v-blur-reveal="0.44" class="vision__year">{{ t("home.vision.year") }}</p>
      <div ref="box" class="vision__numeral" :class="{ 'is-ready': ready }" role="img" aria-label="A chrome and black numeral one">
        <canvas ref="canvas" class="vision__canvas" aria-hidden="true" />
      </div>
      <NuxtLink :to="localePath('/about')" class="vision__button">{{ t("home.vision.cta") }}</NuxtLink>
    </div>
  </section>
</template>

<style scoped>
/* --u is one pixel of the 2000x1141 design frame; the frame fits one screen. */
.vision {
  --u: min(0.05vw, 0.725px, calc(100svh / 1141));
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
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
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

/* Text boxes are placed by their cap tops (SF Pro: cap height 0.705em, the
   line box adds (line-height - 0.705)/2 above it at line-height 1). */
.vision__brand {
  top: calc((45 - 0.148 * 49) * var(--u));
  font-size: calc(49 * var(--u));
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.035em;
}

.vision__title {
  /* SF Pro's side bearing: the glyphs start 7 units right of the box. */
  left: calc(187 * var(--u));
  top: calc((200 - 0.06 * 172) * var(--u));
  display: flex;
  flex-direction: column;
  font-size: calc(172 * var(--u));
  font-weight: 700;
  line-height: 0.826;
  letter-spacing: -0.05em;
  /* The design's face is heavier than SF Pro Bold. */
  -webkit-text-stroke: calc(4 * var(--u)) #0a0a0a;
}

.vision__label {
  top: calc((554 - 0.148 * 27) * var(--u));
  color: #1a1a1a;
  font-size: calc(27 * var(--u));
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.215em;
  text-transform: uppercase;
}

.vision__year {
  left: calc(180 * var(--u));
  top: calc(575 * var(--u));
  font-size: calc(338 * var(--u));
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.002em;
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
  width: calc(258 * var(--u));
  height: calc(62 * var(--u));
  border-radius: 999px;
  background: #000;
  color: #fff;
  font-size: calc(25 * var(--u));
  font-weight: 700;
  letter-spacing: -0.01em;
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

/* Phones: copy, 2026, the numeral and the button stack. */
@media (max-width: 767px) {
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

  .vision__brand {
    font-size: 1.15rem;
  }

  .vision__title {
    margin-top: 1.5rem;
    font-size: 12.4vw;
    -webkit-text-stroke: 0.25vw #0a0a0a;
  }

  .vision__label {
    margin-top: 1.4rem;
    font-size: 0.72rem;
  }

  .vision__year {
    margin-top: 0.4rem;
    font-size: 29vw;
    line-height: 0.95;
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
    width: 11.5rem;
    height: 3.1rem;
    margin-top: 1.5rem;
    font-size: 1.1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vision__numeral {
    transition: none;
  }
}
</style>
