<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import OptImage from "~/components/ui/OptImage.vue";

// The grid view's packaging wall, after the marquee, on black: rows of a wide
// picture beside a tall one, the sides swapping row to row, with a full-width
// picture between them, as in the design; then the way back to the slider
// ("Projects"). The pictures are the landing's identity shots (public/home/
// identity, with build-time AVIF/WebP copies). Each card flies in from its
// own side as it scrolls into view: the left card of a row from the left,
// the top or the bottom, the right one from the right, the top or the
// bottom, the full-width one growing up from below.
type From = "left" | "right" | "top" | "bottom" | "zoom";
type Shot = { src: string; name: string };
type Row = { kind: "pair"; wideFirst: boolean; shots: [Shot, Shot]; from: [From, From] } | { kind: "full"; shot: Shot; from: From };

const emit = defineEmits<{ slider: [] }>();
const { t } = useI18n();
const localePath = useLocalePath();

const shot = (file: string, name: string): Shot => ({ src: `/home/identity/${file}.webp`, name });
const CHOCOTO = shot("chocoton", "Chocotó");
const LIL_BUCKS = shot("lilbucks", "Lil Bucks");
const PURE_MAGIC = shot("puremagic", "Pure Magic");
const CALLIOPE = shot("calliope", "Calliope");
// Modeno's ice cream picture is not in yet; Lolly's stands in for it.
const MODENO = shot("lollys", "Lolly's");

// The design's order: the two pairs, the full-width shot, the two pairs again.
const ROWS: Row[] = [
  { kind: "pair", wideFirst: true, shots: [CHOCOTO, LIL_BUCKS], from: ["left", "top"] },
  { kind: "pair", wideFirst: false, shots: [PURE_MAGIC, MODENO], from: ["bottom", "right"] },
  { kind: "full", shot: CALLIOPE, from: "zoom" },
  { kind: "pair", wideFirst: true, shots: [CHOCOTO, LIL_BUCKS], from: ["top", "right"] },
  { kind: "pair", wideFirst: false, shots: [PURE_MAGIC, MODENO], from: ["left", "bottom"] },
];

// The wide card takes 62% of the row, the tall one 38% (the design's
// 871 : 537), drawn at about 71% of the screen.
const sizesFor = (wide: boolean) => `(max-width: 767px) ${wide ? 62 : 38}vw, ${wide ? 44 : 27}vw`;

// The entrance: armed once the page's script runs (without it, or with
// reduced motion, the cards simply stand there), each card let in when a
// sixth of it is on screen, and left in after.
const root = ref<HTMLElement | null>(null);
const armed = ref(false);
let observer: IntersectionObserver | undefined;
onMounted(() => {
  if (!root.value || window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      observer?.unobserve(entry.target);
    }
  }, { threshold: 0.16, rootMargin: "0px 0px -6% 0px" });
  root.value.querySelectorAll(".showcase-gallery__card").forEach((card) => observer!.observe(card));
  armed.value = true;
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <section ref="root" class="showcase-gallery" :class="{ 'is-armed': armed }" :aria-label="$t('projectsPage.gallery.label')">
    <div class="showcase-gallery__column">
      <template v-for="(row, rowIndex) in ROWS" :key="rowIndex">
        <div v-if="row.kind === 'pair'" class="showcase-gallery__row" :class="{ 'showcase-gallery__row--tall-first': !row.wideFirst }">
          <figure
            v-for="(item, itemIndex) in row.shots"
            :key="item.src"
            class="showcase-gallery__card"
            :data-from="row.from[itemIndex]"
            :style="{ '--delay': `${itemIndex * 0.12}s` }"
          >
            <OptImage
              :src="item.src"
              :alt="$t('projectsPage.gallery.alt', { name: item.name })"
              :sizes="sizesFor(row.wideFirst === (itemIndex === 0))"
              loading="lazy"
              decoding="async"
              draggable="false"
            />
          </figure>
        </div>
        <figure v-else class="showcase-gallery__card showcase-gallery__card--full" :data-from="row.from">
          <OptImage
            :src="row.shot.src"
            :alt="$t('projectsPage.gallery.alt', { name: row.shot.name })"
            sizes="(max-width: 767px) 100vw, 71vw"
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        </figure>
      </template>
    </div>

    <div class="showcase-gallery__foot">
      <a :href="localePath('/projects')" class="ob-button showcase-gallery__cta" @click.prevent="emit('slider')">{{ t("projectsPage.gallery.cta") }}</a>
      <p>{{ t("projectsPage.gallery.caption") }}</p>
    </div>
  </section>
</template>

<style scoped>
/* The design at 1440px: the wall is 1020px wide (71% of the screen), its
   rows 515px tall with 6px between cards, the corners 22px round. */
.showcase-gallery {
  overflow-x: clip;
  padding-block: clamp(5rem, 13.5vw, 12.25rem) clamp(2.5rem, 4vw, 3.5rem);
  background: #000;
  color: #fff;
}

.showcase-gallery__column {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: min(100% - 2.5rem, 71 * var(--fvw));
  margin-inline: auto;
}

.showcase-gallery__row {
  display: grid;
  grid-template-columns: 1.62fr 1fr;
  gap: 0.375rem;
  aspect-ratio: 1418 / 715;
}

.showcase-gallery__row--tall-first {
  grid-template-columns: 1fr 1.62fr;
}

.showcase-gallery__card {
  position: relative;
  min-width: 0;
  height: 100%;
  margin: 0;
  overflow: hidden;
  border-radius: 1.375rem;
  background: #111;
}

/* The entrance: out of its side, a little turned and small, settling in
   1.3 s (the second card of a row 0.12 s later). */
.showcase-gallery.is-armed .showcase-gallery__card {
  transition:
    transform 1.3s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0s),
    opacity 0.9s ease var(--delay, 0s);
  will-change: transform, opacity;
}

.showcase-gallery.is-armed .showcase-gallery__card:not(.is-in) {
  opacity: 0;
}

.showcase-gallery.is-armed .showcase-gallery__card[data-from="left"]:not(.is-in) {
  transform: translate3d(-22vw, 6vh, 0) rotate(-5deg) scale(0.9);
}

.showcase-gallery.is-armed .showcase-gallery__card[data-from="right"]:not(.is-in) {
  transform: translate3d(22vw, 6vh, 0) rotate(5deg) scale(0.9);
}

.showcase-gallery.is-armed .showcase-gallery__card[data-from="top"]:not(.is-in) {
  transform: translate3d(0, -18vh, 0) rotate(3deg) scale(0.92);
}

.showcase-gallery.is-armed .showcase-gallery__card[data-from="bottom"]:not(.is-in) {
  transform: translate3d(0, 20vh, 0) rotate(-3deg) scale(0.92);
}

.showcase-gallery.is-armed .showcase-gallery__card[data-from="zoom"]:not(.is-in) {
  transform: translate3d(0, 12vh, 0) scale(0.72);
}

.showcase-gallery.is-armed .showcase-gallery__card.is-in {
  will-change: auto;
}

.showcase-gallery__card--full {
  aspect-ratio: 2 / 1;
}

/* :deep: the <img> sits inside OptImage, past this component's scope. */
.showcase-gallery__card :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

/* "Projects" and the line under it. */
.showcase-gallery__foot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin-top: clamp(2.5rem, 3.6vw, 3.25rem);
  padding-inline: 1.25rem;
  text-align: center;
}

/* The design's button: bright green with black type. */
.showcase-gallery__cta {
  --button-h: clamp(3.25rem, 4.4vw, 3.95rem);
  --button-pad: clamp(1.75rem, 2.6vw, 2.4rem);
  --button-font: clamp(1.25rem, 2vw, 1.8rem);
  background: linear-gradient(100deg, #11b237 0%, #1fd544 55%, #20e848 100%);
  color: #000;
  text-shadow: none;
}

/* The shared button's drifting dark light would sit under the black type. */
.showcase-gallery__cta::before {
  display: none;
}

.showcase-gallery__foot p {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(1.125rem, 1.7vw, 1.55rem);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

@media (max-width: 767px) {
  .showcase-gallery__column {
    width: calc(100% - 2.5rem);
  }

  .showcase-gallery__card {
    border-radius: 0.875rem;
  }
}
</style>
