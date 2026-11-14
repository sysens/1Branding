<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";
import { onBeforeUnmount, onMounted, ref } from "vue";

// A diagonal wall of project slides (after slidor.agency's home intro): five
// rows of five 16:9 slides on black, the whole block tilted -5°. While the wall
// crosses the screen, odd rows slide right and even rows left, 10vw each way.
// On phones the wall fills the screen: two more rows (PHONE_ROWS, first and
// last), the slides sized so the seven fill its height.
const toSrc = (row: number[]) => row.map((id) => `/home/threeLayerLocal/${id}.webp`);
const ROWS = [
  [22, 13, 23, 19, 34],
  [35, 21, 25, 38, 24],
  [12, 33, 26, 299, 28],
  [31, 29, 37, 32, 15],
  [36, 39, 17, 40, 199],
].map(toSrc);
const PHONE_ROWS = [[11, 14, 16, 18, 27], [26, 38, 13, 31, 17]].map(toSrc);
const LINES = [
  { slides: PHONE_ROWS[0]!, phone: true },
  ...ROWS.map((slides) => ({ slides, phone: false })),
  { slides: PHONE_ROWS[1]!, phone: true },
];

// A slide is 26vw wide (about 52vw on phones): the drawn width that picks its copy.
const SLIDE_SIZES = "(max-width: 479px) 52vw, 26vw";
const portfolioAlt = usePortfolioAlt();

const root = ref<HTMLElement | null>(null);
let frame = 0;
let stop: (() => void) | undefined;

const render = () => {
  frame = 0;
  const wall = root.value;
  if (!wall) return;
  const rect = wall.getBoundingClientRect();
  // 0 when the wall's top meets the bottom of the screen, 1 when its bottom
  // leaves the top.
  const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
  const shift = (progress * 2 - 1) * 10;
  wall.querySelectorAll<HTMLElement>(".slide-wall__line").forEach((line, index) => {
    line.style.transform = `translate3d(${(index % 2 ? -shift : shift).toFixed(3)}vw, 0, 0)`;
  });
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
  <section ref="root" class="slide-wall" aria-hidden="true">
    <div class="slide-wall__lines">
      <div
        v-for="(line, lineIndex) in LINES"
        :key="lineIndex"
        v-rise
        class="slide-wall__line"
        :class="{ 'slide-wall__line--phone': line.phone }"
      >
        <div v-for="src in line.slides" :key="src" class="slide-wall__slide">
          <OptImage
            :src="src"
            :sizes="SLIDE_SIZES"
            :alt="portfolioAlt(src)"
            width="1600"
            height="900"
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.slide-wall {
  /* Slidor's gutter: 0.625 of a root size that grows past 1440px. */
  --wall-gap: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 55vw;
  overflow: hidden;
  background: #000;
}

.slide-wall__lines {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: var(--wall-gap);
  width: 129vw;
  transform: rotate(-5deg);
}

.slide-wall__line {
  display: flex;
  gap: var(--wall-gap);
  width: 100%;
  will-change: transform;
}

.slide-wall__slide {
  flex: 1 1 0;
  min-width: 0;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #111;
}

/* :deep: the <img> is rendered inside OptImage. */
.slide-wall__slide :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

@media (min-width: 1441px) {
  .slide-wall {
    --wall-gap: calc(0.625 * (0.625rem + 0.416667vw));
  }
}

@media (max-width: 991px) {
  .slide-wall {
    --wall-gap: 0.3rem;
  }
}

/* Phones: the wall is one screen tall, its seven rows (with PHONE_ROWS) a
   little taller than it in all, each row five slides of that height. */
@media (max-width: 479px) {
  .slide-wall {
    --slide-h: calc((100svh + 3rem - 6 * var(--wall-gap)) / 7);
    height: 100vh;
    height: 100svh;
  }

  .slide-wall__lines {
    width: calc(5 * var(--slide-h) * 16 / 9 + 4 * var(--wall-gap));
  }
}

@media (min-width: 480px) {
  .slide-wall__line--phone {
    display: none;
  }
}
</style>
