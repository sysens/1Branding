<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

// "Great products need more than quality." and a three-row slide gallery
// (after slidor.agency/presentations-evenementielles, "Memorable artistic
// directions"): rows of mixed-width slides that drift sideways while the
// gallery crosses the screen, the outer rows to the right and the middle one
// to the left, 10 of slidor's rem each.

type Slide = { src: string; ratio: number };

const { t } = useI18n();

const wide = 2.6; // 16:9 project shots cropped to a banner
const ROWS: Slide[][] = [
  [{ src: "16", ratio: 16 / 9 }, { src: "14", ratio: 16 / 9 }, { src: "/home/frenk.webp", ratio: 2560 / 828 }, { src: "19", ratio: 16 / 9 }, { src: "22", ratio: 16 / 9 }, { src: "35", ratio: 16 / 9 }],
  [{ src: "11", ratio: 16 / 9 }, { src: "32", ratio: wide }, { src: "34", ratio: 16 / 9 }, { src: "28", ratio: 16 / 9 }, { src: "21", ratio: 16 / 9 }, { src: "26", ratio: 16 / 9 }],
  [{ src: "33", ratio: 16 / 9 }, { src: "37", ratio: 16 / 9 }, { src: "23", ratio: 16 / 9 }, { src: "38", ratio: wide }, { src: "31", ratio: 16 / 9 }, { src: "12", ratio: 16 / 9 }],
].map((row) => row.map((slide) => ({ ...slide, src: slide.src.startsWith("/") ? slide.src : `/home/threeLayerLocal/${slide.src}.webp` })));

// Slides are 15 "rem" tall (7rem on phones), so their width is that times the
// ratio; serve 480-1600px crops of the right shape.
const img = useImage();
const slideUrl = ({ src, ratio }: Slide, width: number) =>
  img(src, { width, height: Math.round(width / ratio), fit: "cover", format: "webp", quality: 80 });
const slideSrcset = (slide: Slide) => [480, 800, 1200, 1600].map((width) => `${slideUrl(slide, width)} ${width}w`).join(", ");
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
            <img
              :src="slideUrl(slide, 800)"
              :srcset="slideSrcset(slide)"
              :sizes="slideSizes(slide)"
              alt=""
              loading="lazy"
              decoding="async"
              draggable="false"
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* --g is slidor's rem: 16px up to 1440px wide, then growing with the screen. */
.pgallery {
  --g: 16px;
  padding: clamp(2rem, 3.5vw, 4.5rem) 0 clamp(4rem, 7vw, 8rem);
  background: #000;
  color: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

.pgallery__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.75rem, 1.2vw, 1.5rem);
  margin: 0 auto clamp(2.5rem, 4.5vw, 5.5rem);
  padding-inline: 1.25rem;
  text-align: center;
}

.pgallery__title {
  margin: 0;
  font-size: clamp(1.9rem, 3.4vw, 4.75rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.pgallery__accent {
  background: linear-gradient(180deg, #00e429 20%, #00b02f 95%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.pgallery__text {
  max-width: 50em;
  margin: 0;
  color: #b8b8b8;
  font-size: clamp(1rem, 1.55vw, 2.1rem);
  font-weight: 400;
  line-height: 1.22;
  text-wrap: balance;
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

.pgallery__slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

@media (min-width: 1441px) {
  .pgallery {
    --g: calc(10px + 0.416667vw);
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
