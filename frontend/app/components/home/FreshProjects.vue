<script setup lang="ts">
import OptImage from "~/components/ui/OptImage.vue";

// "Fresh projects": two endless rows of project cards, the top row running to
// the right and the bottom one to the left. Each row holds its cards twice and
// slides by exactly one set, so the loop has no seam. Hovering a row slows it.

const TOP = [21, 16, 22, 33, 12, 28, 37, 19];
const BOTTOM = [34, 36, 13, 23, 31, 17, 39, 25];
const rows = [
  { id: "top", direction: "right", cards: TOP },
  { id: "bottom", direction: "left", cards: BOTTOM },
].map((row) => ({ ...row, cards: row.cards.map((id) => `/home/threeLayerLocal/${id}.webp`) }));

const { t } = useI18n();
const localePath = useLocalePath();
</script>

<template>
  <!-- The copy is English in both locales. -->
  <section class="fresh" lang="en" aria-labelledby="fresh-title">
    <h2 id="fresh-title" class="fresh__title">
      <span class="fresh__green">{{ t("home.fresh.accent") }}</span> {{ t("home.fresh.rest") }}
    </h2>

    <div class="fresh__rows" aria-hidden="true">
      <div v-for="row in rows" :key="row.id" class="fresh__row" :class="`fresh__row--${row.direction}`">
        <div class="fresh__track">
          <div v-for="copy in 2" :key="copy" class="fresh__set">
            <div v-for="src in row.cards" :key="`${copy}-${src}`" class="fresh__card">
              <OptImage :src="src" sizes="(max-width: 767px) 70vw, 25.25vw" alt="" width="505" height="285" loading="lazy" decoding="async" draggable="false" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <NuxtLink :to="localePath('/projects')" class="fresh__more">
      <span class="fresh__blob" aria-hidden="true" />
      <span class="fresh__more-label">{{ t("home.fresh.more") }}</span>
    </NuxtLink>
  </section>
</template>

<style scoped>
/* --u is one pixel of the 2000px design frame. */
.fresh {
  --u: 0.05vw;
  --card-w: calc(505 * var(--u));
  --card-h: calc(285 * var(--u));
  --gap: calc(13 * var(--u));
  position: relative;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: clip;
  padding: calc(165 * var(--u)) 0 calc(85 * var(--u));
  background: #000;
  color: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

.fresh__title {
  margin: 0;
  font-size: var(--section-title-size);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  /* The gap between "Fresh" and "projects" is the design's: tighter than a plain space. */
  word-spacing: -0.07em;
}

.fresh__green {
  background: linear-gradient(180deg, #19ef3a, #0fc32f);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.fresh__rows {
  display: flex;
  flex-direction: column;
  gap: calc(31 * var(--u));
  width: 100%;
  margin-top: calc(48 * var(--u));
  /* The rows fade into the black at both ends. */
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 12%, #000 88%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0, #000 12%, #000 88%, transparent 100%);
}

.fresh__row {
  overflow: hidden;
}

.fresh__track {
  display: flex;
  width: max-content;
  animation: fresh-left 70s linear infinite;
  will-change: transform;
}

.fresh__row--right .fresh__track {
  animation-name: fresh-right;
}

.fresh__row:hover .fresh__track {
  animation-play-state: paused;
}

.fresh__set {
  display: flex;
  gap: var(--gap);
  padding-right: var(--gap);
}

.fresh__card {
  flex: 0 0 auto;
  width: var(--card-w);
  height: var(--card-h);
  overflow: hidden;
  border-radius: calc(26 * var(--u));
  background: #111;
}

/* The <img> sits inside OptImage, out of reach of a plain scoped selector;
   cover trims the 16:9 copies to the 505:285 card. */
.fresh__card :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
  user-select: none;
}

.fresh__card:hover :deep(img) {
  transform: scale(1.05);
}

/* One set is exactly half the track, so -50% lands on an identical frame. */
@keyframes fresh-left {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}

@keyframes fresh-right {
  from { transform: translate3d(-50%, 0, 0); }
  to { transform: translate3d(0, 0, 0); }
}

/* "More": a green pill with a dark blob drifting through it. */
.fresh__more {
  position: relative;
  display: grid;
  place-items: center;
  width: calc(263 * var(--u));
  height: calc(62 * var(--u));
  margin-top: calc(84 * var(--u));
  overflow: hidden;
  isolation: isolate;
  border-radius: 999px;
  background: linear-gradient(100deg, #26b830 0%, #3fe24a 45%, #63ff5c 100%);
  color: #eaffea;
  font-size: calc(26 * var(--u));
  font-weight: 500;
  text-decoration: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.fresh__blob {
  position: absolute;
  inset: -40% -10%;
  z-index: -1;
  background:
    radial-gradient(closest-side at 28% 60%, rgb(4 40 12 / 0.9), rgb(4 40 12 / 0) 100%),
    radial-gradient(closest-side at 62% 35%, rgb(20 120 30 / 0.7), rgb(20 120 30 / 0) 100%);
  filter: blur(calc(6 * var(--u)));
  animation: fresh-blob 6s ease-in-out infinite alternate;
}

@keyframes fresh-blob {
  0% { transform: translate3d(-18%, 4%, 0) scale(0.9) rotate(-8deg); }
  50% { transform: translate3d(8%, -6%, 0) scale(1.1) rotate(6deg); }
  100% { transform: translate3d(22%, 6%, 0) scale(0.95) rotate(-4deg); }
}

.fresh__more-label {
  position: relative;
  text-shadow: 0 0 calc(8 * var(--u)) rgb(0 0 0 / 0.25);
}

.fresh__more:hover,
.fresh__more:focus-visible {
  transform: scale(1.05);
  box-shadow: 0 0 calc(40 * var(--u)) rgb(63 226 74 / 0.45);
}

.fresh__more:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 4px;
}

@media (max-width: 767px) {
  .fresh {
    --card-w: 70vw;
    --card-h: calc(70vw * 285 / 505);
    --gap: 0.6rem;
    padding: 4.5rem 0 3.5rem;
  }

  .fresh__title {
    font-size: var(--section-title-size);
  }

  .fresh__rows {
    gap: 0.75rem;
    margin-top: 2rem;
  }

  .fresh__card {
    border-radius: 0.9rem;
  }

  .fresh__track {
    animation-duration: 45s;
  }

  .fresh__more {
    width: 10.5rem;
    height: 3rem;
    margin-top: 2.25rem;
    font-size: 1.1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fresh__track,
  .fresh__blob {
    animation: none;
  }
}
</style>
