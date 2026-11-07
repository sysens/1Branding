<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";
import { onBeforeUnmount, onMounted, ref } from "vue";

// "ONE BRAND. VISUAL LANGUAGE." with a wall of BRRGRR social posts, animated
// like slidor.agency's "Expertise in all graphic styles" grid: while the wall
// leaves the screen it zooms from 1 to 1.5 and its five columns glide up or
// down by their own amounts (ease-in-out).

type Post = "mazali-cap" | "mazali-burger" | "burger-bite" | "tishlaaa" | "fresh" | "bag";

const { t } = useI18n();

const COLUMNS: Post[][] = [
  ["bag", "mazali-burger", "fresh", "tishlaaa"],
  ["mazali-cap", "fresh", "burger-bite", "bag"],
  ["mazali-burger", "tishlaaa", "mazali-cap", "burger-bite"],
  ["burger-bite", "bag", "tishlaaa", "mazali-cap"],
  ["tishlaaa", "mazali-cap", "bag", "mazali-burger"],
];
// Column travel over the scroll, in % of the column's height: slidor's
// -10→3, 0→-5, -7→1, 0→-7, -3→3, applied as deltas so the wall starts out
// staggered as in the design.
const START = [-10, 0, -7, 0, -3];
const END = [3, -5, 1, -7, 3];
const postSrc = (post: Post) => `/home/social/brrgrr-${post}.webp`;
// Posts are --col wide (27.2vw, 44vw on phones) and zoom up to 1.5x while the
// wall scrolls out, so the copy is picked for the zoomed size.
const POST_SIZES = "(max-width: 767px) 66vw, 41vw";

const grid = ref<HTMLElement | null>(null);
let frame = 0;
let stop: (() => void) | undefined;

const easeInOutQuart = (value: number) =>
  value < 0.5 ? 8 * value ** 4 : 1 - (-2 * value + 2) ** 4 / 2;

// 0 when the wall's top is a quarter down the screen, 1 when its bottom leaves
// the top: scale grows linearly, the columns ease.
const render = () => {
  frame = 0;
  const box = grid.value;
  if (!box) return;
  const rect = box.getBoundingClientRect();
  const lead = window.innerHeight * 0.25;
  const progress = Math.min(1, Math.max(0, (lead - rect.top) / (lead + rect.height)));
  const eased = easeInOutQuart(progress);
  box.style.transform = `scale(${(1 + 0.5 * progress).toFixed(4)})`;
  box.querySelectorAll<HTMLElement>("[data-column]").forEach((column) => {
    const index = Number(column.dataset.column);
    const shift = (END[index]! - START[index]!) * eased;
    column.style.setProperty("--shift", `${shift.toFixed(3)}%`);
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
  <section class="social" aria-labelledby="social-title">
    <h2 id="social-title" class="social__title">
      <span v-blur-reveal class="social__one">{{ `${t("home.social.one")} ` }}</span>
      <span v-blur-reveal class="social__rest">
        <span class="social__brand">{{ `${t("home.social.brand")} ` }}</span>
        <span class="social__language">{{ t("home.social.visual") }} <span class="social__accent">{{ t("home.social.language") }}</span></span>
      </span>
    </h2>
    <div class="social__copy">
      <p v-rise>{{ t("home.social.text") }} <strong>{{ t("home.social.textStrong") }}</strong></p>
      <p v-rise class="social__lead">{{ t("home.social.text2") }}</p>
    </div>
    <div class="social__viewport">
      <div ref="grid" class="social__grid" data-reveal-row aria-hidden="true">
        <div v-for="(column, index) in COLUMNS" :key="index" v-rise class="social__column" :class="{ 'social__column--low': index % 2 === 0 }" :data-column="index">
          <div v-for="(post, row) in column" :key="row" class="social__post">
            <OptImage :src="postSrc(post)" :sizes="POST_SIZES" alt="" width="544" height="680" loading="lazy" decoding="async" draggable="false" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.social {
  /* The viewport unit this section scales with, frozen once its content
     reaches the site container (1450px = 82.5vw at a 1758px wide screen), so
     on wider screens it stays as wide as the container. */
  --vw: min(1vw, 1.09875rem);
  /* Column width and gutter of the design (2000px frame: 544px posts, 8px gaps). */
  --col: calc(27.2 * var(--fvw));
  --gap: calc(0.32 * var(--fvw));
  position: relative;
  overflow: clip;
  padding-top: clamp(5rem, 11vw, 14rem);
  background: #000;
  color: #fff;
}

/* ONE spans both lines; BRAND. on top, VISUAL LANGUAGE. under it. Steps:
   ONE display-l, BRAND. display-s, VISUAL LANGUAGE. h2 (h1 / h4 on phones,
   where the fluid steps would make the right column twice ONE's height).
   Uppercase, so caps tracking on each line. The tight line heights (0.74 /
   0.8) stay: the composition is three lines locked into ONE's height. The
   right column is stretched to ONE's height and its lines pushed to the top
   and bottom, so BRAND. starts at ONE's top and VISUAL LANGUAGE. ends on its
   baseline at every step size. */
.social__title {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 0.035em;
  margin: 0;
  padding-inline: 1.25rem;
  font-family: var(--app-font-display);
  font-size: var(--type-display-l-size);
  font-weight: 700;
  line-height: 0.74;
  letter-spacing: var(--type-caps-ls);
}

.social__one {
  padding-block: 0.02em;
  background: linear-gradient(100deg, #00c92f 0%, #00f83c 30%, #00d634 62%, #009b2c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.social__rest {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.02em;
  padding-top: 0.005em;
}

.social__brand {
  font-size: var(--type-display-s-size);
  line-height: 0.74;
  letter-spacing: var(--type-caps-ls);
}

.social__language {
  font-size: var(--type-h2-size);
  line-height: 0.8;
  letter-spacing: var(--type-caps-ls);
  white-space: nowrap;
}

.social__accent {
  background: linear-gradient(90deg, #00e536, #00b52e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Running text: the intro step, as the landing's other section texts,
   centred in a column of its measure that stays centred under the title
   (also on phones, where it takes the full width). */
.social__copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1rem, calc(1.6 * var(--vw)), 2rem);
  max-width: calc(var(--type-measure-intro) + 2.5rem);
  margin: clamp(3rem, calc(6 * var(--vw)), 7.5rem) auto 0;
  padding-inline: 1.25rem;
  font-family: var(--type-intro-family);
  font-size: var(--type-description-size);
  line-height: var(--type-intro-lh);
  letter-spacing: var(--type-intro-ls);
  text-align: center;
}

.social__copy p {
  margin: 0;
  color: #a3a3a3;
  text-wrap: pretty;
}

.social__copy strong,
.social__copy .social__lead {
  color: #fff;
  font-weight: 400;
}

/* The closing line is narrower than the paragraph above it (0.7 of it, as in
   the design). */
.social__copy .social__lead {
  max-width: 28em;
}

/* The wall: five columns, the middle one centred, the outer two cut by the
   screen edges; the grid scales from its centre while it scrolls out. */
.social__viewport {
  margin-top: clamp(3.5rem, 6.5vw, 8rem);
}

.social__grid {
  display: flex;
  justify-content: center;
  gap: var(--gap);
  height: calc(var(--col) * 2.5);
  overflow: hidden;
  transform-origin: 50% 50%;
  will-change: transform;
}

.social__column {
  --shift: 0%;
  --low: 0px;
  display: flex;
  flex: 0 0 var(--col);
  flex-direction: column;
  /* As tall as its posts (not stretched to the grid), so the posts keep 4:5. */
  align-self: flex-start;
  gap: var(--gap);
  transform: translate3d(0, calc(var(--low) + var(--shift)), 0);
  will-change: transform;
}

/* In the design the 1st, 3rd and 5th columns start about a quarter post lower. */
.social__column--low {
  --low: calc(var(--col) * 1.25 * 0.27);
}

.social__post {
  flex: 0 0 auto;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: #3a0606;
}

/* :deep: the <img> is rendered inside OptImage. */
.social__post :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

@media (max-width: 767px) {
  .social {
    --col: 44vw;
    --gap: 1.6vw;
  }

  .social__language {
    white-space: normal;
  }
}

@media (max-width: 599px) {
  .social__brand {
    font-size: var(--type-h1-size);
  }

  .social__language {
    font-size: var(--type-h4-size);
  }
}
</style>
