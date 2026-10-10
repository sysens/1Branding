<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

// A diagonal wall of project slides (after slidor.agency's home intro): five
// rows of five 16:9 slides on black, the whole block tilted -5°. While the wall
// crosses the screen, odd rows slide right and even rows left, 10vw each way.
const ROWS = [
  [22, 13, 23, 19, 34],
  [35, 21, 25, 38, 24],
  [12, 33, 26, 299, 28],
  [31, 29, 37, 32, 15],
  [36, 39, 17, 40, 199],
].map((row) => row.map((id) => `/home/threeLayerLocal/${id}.webp`));

// A slide is 26vw wide (32vw on phones), so 400-1280px covers phones to 4K.
const img = useImage();
const slideUrl = (src: string, width: number) =>
  img(src, { width, height: Math.round((width * 9) / 16), format: "webp", quality: 80 });
const slideSrcset = (src: string) => [400, 640, 960, 1280].map((width) => `${slideUrl(src, width)} ${width}w`).join(", ");

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
      <div v-for="(row, rowIndex) in ROWS" :key="rowIndex" class="slide-wall__line">
        <div v-for="src in row" :key="src" class="slide-wall__slide">
          <img
            :src="slideUrl(src, 640)"
            :srcset="slideSrcset(src)"
            sizes="(max-width: 479px) 32vw, 26vw"
            alt=""
            width="1600"
            height="900"
            loading="lazy"
            decoding="async"
            draggable="false"
          >
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.slide-wall {
  /* Slidor's gutter: 0.625 of a root size that grows past 1440px. */
  --wall-gap: 10px;
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

.slide-wall__slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

@media (min-width: 1441px) {
  .slide-wall {
    --wall-gap: calc(0.625 * (10px + 0.416667vw));
  }
}

@media (max-width: 991px) {
  .slide-wall {
    --wall-gap: 4.8px;
  }
}

@media (max-width: 479px) {
  .slide-wall {
    height: 90vw;
  }

  .slide-wall__lines {
    width: 160vw;
  }
}
</style>
