<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";
import { onBeforeUnmount, onMounted, ref } from "vue";

// "Great products need more than quality." and a three-row slide gallery
// (after slidor.agency/presentations-evenementielles, "Memorable artistic
// directions"): rows of mixed-width slides that drift sideways while the
// gallery crosses the screen, the outer rows to the right and the middle one
// to the left, 10 of slidor's rem each.

type Slide = { src: string; ratio: number };

const { t } = useI18n();
const localePath = useLocalePath();

const wide = 2.6; // 16:9 project shots cropped to a banner
const ROWS: Slide[][] = [
  [{ src: "16", ratio: 16 / 9 }, { src: "14", ratio: 16 / 9 }, { src: "/home/frenk.webp", ratio: 2560 / 828 }, { src: "19", ratio: 16 / 9 }, { src: "22", ratio: 16 / 9 }, { src: "35", ratio: 16 / 9 }],
  [{ src: "11", ratio: 16 / 9 }, { src: "32", ratio: wide }, { src: "34", ratio: 16 / 9 }, { src: "28", ratio: 16 / 9 }, { src: "21", ratio: 16 / 9 }, { src: "26", ratio: 16 / 9 }],
  [{ src: "33", ratio: 16 / 9 }, { src: "37", ratio: 16 / 9 }, { src: "23", ratio: 16 / 9 }, { src: "38", ratio: wide }, { src: "31", ratio: 16 / 9 }, { src: "12", ratio: 16 / 9 }],
].map((row) => row.map((slide) => ({ ...slide, src: slide.src.startsWith("/") ? slide.src : `/home/threeLayerLocal/${slide.src}.webp` })));

// Slides are 15 "rem" tall (7rem on phones), so their width is that times the
// ratio. No slide is narrower than its photo's shape, so object-fit: cover
// draws the photo at the slide's width (cropping top and bottom of the banner
// ones) and that width is what `sizes` gives.
const slideSizes = ({ ratio }: Slide) =>
  `(max-width: 991px) ${Math.round(112 * ratio)}px, (max-width: 1440px) ${Math.round(240 * ratio)}px, calc((150px + 6.25vw) * ${ratio.toFixed(3)})`;

const grid = ref<HTMLElement | null>(null);
let frame = 0;
let stop: (() => void) | undefined;

// 0 when the gallery's top meets the bottom of the screen, 1 when its bottom
// leaves the top; CSS turns it into each row's offset.
const render = () => {
  frame = 0;
  const box = grid.value;
  if (!box) return;
  const rect = box.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
  box.style.setProperty("--progress", progress.toFixed(4));
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
  <!-- The copy is English in both locales. -->
  <section class="pgallery" lang="en" aria-labelledby="pgallery-title">
    <header class="pgallery__header">
      <h2 id="pgallery-title" class="pgallery__title">
        {{ t("home.presentations.titleLead") }}<span class="pgallery__accent">{{ t("home.presentations.titleAccent") }}</span>
      </h2>
      <p class="pgallery__text">{{ t("home.presentations.text") }}</p>
    </header>
    <div class="pgallery__frame">
      <div ref="grid" class="pgallery__grid" aria-hidden="true">
        <div v-for="(row, rowIndex) in ROWS" :key="rowIndex" class="pgallery__line" :class="rowIndex % 2 ? 'pgallery__line--odd' : 'pgallery__line--even'">
          <div v-for="slide in row" :key="slide.src" class="pgallery__slide" :style="{ aspectRatio: slide.ratio }">
            <OptImage
              :src="slide.src"
              :sizes="slideSizes(slide)"
              alt=""
              loading="lazy"
              decoding="async"
              draggable="false"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- No presentations page yet: the button leads to the projects. -->
    <div class="pgallery__cta">
      <NuxtLink :to="localePath('/projects')" class="pgallery__button">{{ t("home.presentations.cta") }}</NuxtLink>
      <p class="pgallery__more">{{ t("home.presentations.more") }}</p>
    </div>
    <div class="pgallery__rule" aria-hidden="true" />
  </section>
</template>

<style scoped>
/* --g is slidor's rem: 16px up to 1440px wide, then growing with the screen. */
.pgallery {
  /* The viewport unit this section scales with, frozen once its content
     reaches the site container (1450px = 82.5vw at a 1758px wide screen), so
     on wider screens it stays as wide as the container. */
  --vw: min(1vw, 17.58px);
  --g: 16px;
  padding: clamp(2rem, 3.5vw, 4.5rem) 0 clamp(1.5rem, 2.5vw, 3rem);
  background: #000;
  color: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

.pgallery__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.75rem, calc(1.2 * var(--vw)), 1.5rem);
  margin: 0 auto clamp(2.5rem, calc(4.5 * var(--vw)), 5.5rem);
  padding-inline: 1.25rem;
  text-align: center;
}

.pgallery__title {
  margin: 0;
  font-size: var(--section-title-size);
  /* A long line wraps rather than leave the site container. */
  max-width: min(100%, 1450px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.005em;
  text-wrap: balance;
}

.pgallery__accent {
  background: linear-gradient(180deg, #00e429 20%, #00b02f 95%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.pgallery__text {
  /* Never wider than the site container (1450px). */
  max-width: min(100%, 60em, 1450px);
  margin: 0;
  color: #b8b8b8;
  font-size: clamp(1rem, calc(1.55 * var(--vw)), 2.1rem);
  font-weight: 400;
  line-height: 1.22;
  /* Wide lines with a short last one, as in the design (not balanced). */
  text-wrap: pretty;
}

/* A dark panel with the edges fading into the page, as in the design. */
.pgallery__frame {
  position: relative;
  margin-inline: calc(2.5 * var(--g));
  padding-block: calc(1.75 * var(--g));
  border-radius: calc(0.625 * var(--g));
  background: #0b0b0b;
}

.pgallery__frame::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  content: "";
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(90deg, #000 0%, rgb(0 0 0 / 0.55) 3%, rgb(0 0 0 / 0) 9%, rgb(0 0 0 / 0) 91%, rgb(0 0 0 / 0.55) 97%, #000 100%);
}

.pgallery__grid {
  --progress: 0.5;
  display: flex;
  flex-direction: column;
  gap: calc(0.625 * var(--g));
  overflow: hidden;
}

.pgallery__line {
  display: flex;
  flex: 0 0 auto;
  gap: calc(0.625 * var(--g));
  width: 100%;
  height: calc(15 * var(--g));
  will-change: transform;
}

.pgallery__line--even {
  transform: translate3d(calc(-10 * var(--g) * (1 - var(--progress))), 0, 0);
}

.pgallery__line--odd {
  transform: translate3d(calc(-10 * var(--g) * var(--progress)), 0, 0);
}

.pgallery__slide {
  flex: 0 0 auto;
  height: 100%;
  overflow: hidden;
  border-radius: calc(0.3125 * var(--g));
  background: #141414;
}

/* :deep: the <img> is OptImage's, out of reach of a scoped selector. */
.pgallery__slide :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

/* "lets go!" pill, the caption under it and a green rule closing the section. */
.pgallery__cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.85rem, 1.3vw, 1.6rem);
  margin-top: clamp(2.75rem, 4.8vw, 6rem);
  padding-inline: 1.25rem;
  text-align: center;
}

.pgallery__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* The same size as the landing's other buttons (258 x 62 design px). */
  width: 12.9vw;
  height: 3.1vw;
  border-radius: 999px;
  background:
    radial-gradient(ellipse 70% 60% at 70% 10%, rgb(255 255 255 / 0.28), rgb(255 255 255 / 0) 70%),
    linear-gradient(100deg, #00b52b 0%, #00e536 45%, #00f83c 70%, #00cf31 100%);
  box-shadow: inset 0 -0.08em 0.18em rgb(0 60 15 / 0.35);
  color: #062b10;
  font-size: 1.25vw;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.pgallery__button:hover,
.pgallery__button:focus-visible {
  transform: scale(1.04);
  box-shadow: inset 0 -0.08em 0.18em rgb(0 60 15 / 0.35), 0 0 2.2rem rgb(0 240 58 / 0.45);
}

.pgallery__button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 4px;
}

.pgallery__more {
  margin: 0;
  background: linear-gradient(90deg, #8c8c8c 0%, #fff 22%, #fff 78%, #8c8c8c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: clamp(1.15rem, 1.7vw, 2.35rem);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.015em;
}

.pgallery__rule {
  width: 86%;
  height: 3px;
  margin: clamp(2.5rem, 4.4vw, 5.5rem) auto 0;
  background: linear-gradient(90deg, rgb(0 255 42 / 0) 0%, #00ff2a 14%, #00ff2a 86%, rgb(0 255 42 / 0) 100%);
  filter: drop-shadow(0 0 5px rgb(0 255 42 / 0.55));
}

@media (min-width: 1441px) {
  .pgallery {
    --g: calc(10px + 0.416667vw);
  }
}

@media (max-width: 767px) {
  .pgallery__button {
    width: 11.5rem;
    height: 3.1rem;
    font-size: 1.1rem;
  }
}

@media (max-width: 991px) {
  .pgallery__grid,
  .pgallery__line {
    gap: 4.8px;
  }

  .pgallery__line {
    height: 7rem;
  }
}

@media (max-width: 479px) {
  .pgallery__frame {
    margin-inline: 0;
    border-radius: 0;
  }
}
</style>
