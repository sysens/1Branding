<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import OptImage from "~/components/ui/OptImage.vue";
import type { ProjectWallItem } from "~/composables/useProjectsWallData";
import { toSiteLocale } from "~/utils/locales";
import { createTrack, headAt, TRACK_PERSPECTIVE } from "~/utils/ribbonTrack";
import { servicePath } from "~/utils/servicePages";

/**
 * /projects' first screen. It opens with a short film (about 4.7s): "WE MAKE"
 * comes in from the left and "BRANDS" from the right, they slow down as they
 * pass each other in the middle and go on out the other side; meanwhile a
 * ribbon of the studio's work runs one turn of a rising spiral (in at the
 * bottom left on the far side, round towards the camera and back along the
 * near side, round again and out at the top right; utils/ribbonTrack.ts);
 * then the projects
 * slide into the grid, three to a row, close together, each from
 * the edge of the screen nearest its place (see gridEntry). A click, a key or a scroll skips to the grid; it does not
 * play for visitors who ask for less motion, nor when the page is reopened
 * further down. The last tile leads to the showcase.
 * Arriving from another page, it starts once the page transition is over (it
 * played half hidden under it before), and input in its first second is not
 * taken as a skip: the momentum of a scroll on the page before (a touchpad's)
 * went on sending wheel events and skipped it the moment it began.
 */
const props = defineProps<{ projects: ProjectWallItem[]; category: string }>();

const { t, locale } = useI18n();

// The landing's line ("WE MAKE BRANDS"), in English in every language, as there.
const WORDS = ["WE MAKE", "BRANDS"] as const;

// The ribbon: the studio's work (public/home/threeLayerLocal).
const RIBBON = ["11", "13", "14", "19", "22", "23", "26", "38"].map((name) => `/home/threeLayerLocal/${name}.webp`);

/**
 * Where each card of the grid comes in from, measured on the reference video:
 * a card in the left column from the left edge of the screen, in the right
 * column from the right edge, a little away from the grid vertically too
 * (0.25 of the way across: up for the upper rows, down for the lower ones);
 * a card in a middle column straight down from above the screen (upper rows)
 * or up from below it. It starts just clear of the screen. It leans along its
 * way (about 0.17deg per 1% of the screen's width it has to go, 0.12 for the
 * middle ones) and the side ones are turned a little in 3D, their outer side
 * further away. The pace is the video's: on a cubic ease-out the distance
 * still to go is A (T - t)^3, A being 1.25 screen widths per s^3 for the side
 * cards and 0.89 for the middle ones; a card starts 0.72s out (further, and
 * so a little earlier, if that does not clear the screen). Cards whose place
 * is not on the first screen come in without moving (null).
 */
const gridEntry = (cards: HTMLElement[], vw: number, vh: number) => {
  const boxes = cards.map((card) => card.getBoundingClientRect());
  const lefts = [...new Set(boxes.map((box) => Math.round(box.left)))].sort((a, b) => a - b);
  const tops = [...new Set(boxes.map((box) => Math.round(box.top)))].sort((a, b) => a - b);
  const visibleRows = tops.filter((top) => top < vh);
  const margin = 24;
  // The distance and the time a card takes, at the video's pace.
  const slide = (needed: number, pace: number) => {
    const a = pace * vw;
    const distance = Math.max(needed, a * 0.72 ** 3);
    return { distance, duration: Math.cbrt(distance / a) };
  };
  return boxes.map((box, index) => {
    if (box.top >= vh) return null;
    const column = lefts.indexOf(Math.round(box.left));
    const row = visibleRows.indexOf(Math.round(box.top));
    const lower = row >= visibleRows.length / 2;
    const columns = lefts.length;
    // One column (phones): alternate sides.
    const side = columns === 1 ? (index % 2 ? 1 : -1) : column === 0 ? -1 : column === columns - 1 ? 1 : 0;
    if (side) {
      const { distance, duration } = slide(side < 0 ? box.right + margin : vw - box.left + margin, 1.25);
      const tilt = Math.min(9, (0.168 * distance * 100) / vw);
      return {
        duration,
        x: side * distance,
        y: (lower ? 1 : -1) * 0.25 * distance,
        // top-left and bottom-right lean clockwise, the other two counter-clockwise
        tilt: side * (lower ? 1 : -1) * tilt,
        turn: side < 0 ? -11 : 22,
      };
    }
    const { distance, duration } = slide(lower ? vh - box.top + margin : box.bottom + margin, 0.89);
    const tilt = Math.min(4, (0.116 * distance * 100) / vw);
    return { duration, x: 0, y: (lower ? 1 : -1) * distance, tilt: (lower ? 1 : -1) * tilt, turn: 0 };
  });
};

const shown = computed(() => (props.category ? props.projects.filter((project) => project.category === props.category) : props.projects));

const root = ref<HTMLElement | null>(null);
// SSR: the grid's cards are hidden until the film takes them (or 4s pass
// without it, in CSS); the film's own parts show only while it plays.
const waiting = ref(true);
const playing = ref(false);
const intro = ref(true);

let skip: (() => void) | null = null;
const SKIP_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
const stopListening = () => {
  if (!skip) return;
  SKIP_EVENTS.forEach((name) => window.removeEventListener(name, skip!));
  skip = null;
};

onMounted(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    intro.value = false;
    waiting.value = false;
  }
});
onBeforeUnmount(stopListening);

useGsapContext(root, ({ gsap, el }) => {
  waiting.value = false;
  const cards = [...el.querySelectorAll<HTMLElement>(".work-card")];
  // Reopened further down the page (a reload keeps the place): no film.
  if (window.scrollY > 40) {
    intro.value = false;
    return;
  }
  playing.value = true;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const [first, second] = [...el.querySelectorAll<HTMLElement>(".work-word")];
  const tagline = el.querySelector<HTMLElement>(".work-tagline");
  const strip = el.querySelector<HTMLElement>(".work-ribbon");
  const tiles = [...el.querySelectorAll<HTMLElement>(".work-ribbon__card")];

  const finish = () => {
    stopListening();
    playing.value = false;
    intro.value = false;
  };
  // On a first visit the site's loader (components/PageLoader.vue) is still on
  // screen: the film is set up behind it, paused, and starts once it has gone,
  // so it is seen and not played out behind the loader.
  const loading = document.documentElement.classList.contains("ob-loading");
  let started = !loading;
  const timeline = gsap.timeline({ onComplete: finish, paused: loading });
  if (loading) {
    window.addEventListener("ob:loader-complete", () => {
      started = true;
      timeline.play();
    }, { once: true });
  }
  // The first card's slide ends at 4.36s, as in the video; it starts about
  // 0.7s before (the skip goes to just before that).
  const GRID_END = 4.363;
  const GRID_AT = 3.64;

  // The words: in fast, slow through the middle, out fast.
  if (first && second) {
    timeline
      .fromTo(first, { x: -0.78 * vw }, { x: -0.07 * vw, duration: 1.6, ease: "power3.out" }, 0)
      .to(first, { x: 0.82 * vw, duration: 2.02, ease: "power3.in" }, 1.6)
      .fromTo(second, { x: 0.78 * vw }, { x: 0.07 * vw, duration: 1.6, ease: "power3.out" }, 0)
      .to(second, { x: -0.82 * vw, duration: 2.02, ease: "power3.in" }, 1.6);
  }
  if (tagline) {
    timeline.fromTo(tagline, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" }, 0.3).to(tagline, { opacity: 0, duration: 0.35 }, 3.35);
  }

  // The ribbon: its pictures run along the spiral track one behind the
  // other, each turned along it and leaning with its rise (both faces carry
  // the picture, so it reads on the near side and on the far side alike).
  if (strip && tiles.length) {
    const track = createTrack(vw, vh);
    // Eight pictures 0.153 U apart (the train 1.07 U long), each 0.126 U wide.
    const w = 0.126 * track.unit;
    const h = w * 0.76;
    const gap = 0.153 * track.unit;
    const scene = strip.parentElement;
    if (scene) scene.style.perspective = `${TRACK_PERSPECTIVE * track.unit}px`;
    tiles.forEach((tile) => { tile.style.width = `${w}px`; tile.style.height = `${h}px`; });
    const clock = { time: 1.1 };
    const place = () => {
      const head = headAt(clock.time, track.unit);
      tiles.forEach((tile, index) => {
        const p = track.place(head - index * gap);
        tile.style.transform = `translate3d(${(p.x - w / 2).toFixed(1)}px, ${(p.y - h / 2).toFixed(1)}px, ${p.z.toFixed(1)}px) rotateY(${p.turn.toFixed(4)}rad) rotateZ(${p.lean.toFixed(4)}rad)`;
      });
    };
    place();
    // From 1.1s (all of it off the screen at the left) to 4s (all of it gone at the right).
    timeline.to(clock, { time: 4, duration: 2.9, ease: "none", onUpdate: place }, 1.1);
  }

  // The grid: in reading order, each card sliding in a straight line from
  // off the screen into its place (gridEntry) on one cubic ease-out (GSAP's
  // power2.out; its power3 is a quartic), the slides
  // ending 0.0616s apart. Its lean eases out with it; the slight 3D turn of a
  // card coming from the side is gone in its first 0.3s. Cards below the
  // first screen are simply in place.
  if (cards.length) {
    gridEntry(cards, vw, vh).forEach((entry, index) => {
      const card = cards[index]!;
      if (!entry) return;
      const end = GRID_END + index * 0.0616;
      const at = end - entry.duration;
      const face = card.firstElementChild as HTMLElement | null;
      gsap.set(card, { x: entry.x, y: entry.y, rotationZ: entry.tilt });
      timeline
        .to(card, { x: 0, y: 0, rotationZ: 0, duration: entry.duration, ease: "power2.out" }, at)
        .set(card, { clearProps: "transform" }, end);
      if (face && entry.turn) {
        // At least 900px away: on a phone 0.625 of its width is so close that the
        // turned face swung out past the card and poked in from the screen's edge.
        gsap.set(face, { rotationY: entry.turn, transformPerspective: Math.max(0.625 * vw, 900) });
        timeline.to(face, { rotationY: 0, duration: 0.3, ease: "power2.out" }, at).set(face, { clearProps: "transform" }, end);
      }
    });
  }

  // A click, a key or a scroll: straight to the grid coming in.
  const SKIP_AFTER = 1;
  skip = () => {
    // Not while the loader is still up: the film has not begun; nor in its
    // first second (the tail of a scroll on the page before).
    if (!started || timeline.time() < SKIP_AFTER) return;
    if (timeline.time() < GRID_AT - 0.05) timeline.seek(GRID_AT - 0.05);
    stopListening();
  };
  SKIP_EVENTS.forEach((name) => window.addEventListener(name, skip!, { passive: true }));
}, { afterViewTransition: true });
</script>

<template>
  <section ref="root" class="work-stage" :class="{ 'is-waiting': waiting, 'is-playing': playing }" aria-labelledby="work-title">
    <!-- The film's parts, over the grid while it plays. -->
    <div v-if="intro" class="work-intro" aria-hidden="true">
      <p class="work-word work-word--first">{{ WORDS[0] }}</p>
      <p class="work-word work-word--second">{{ WORDS[1] }}</p>
      <p class="work-tagline">{{ t("projectsPage.approach.text") }}</p>
      <div class="work-ribbon">
        <div v-for="src in RIBBON" :key="src" class="work-ribbon__card">
          <div v-for="side in ['front', 'back']" :key="side" class="work-ribbon__face" :class="`work-ribbon__face--${side}`">
            <OptImage :src="src" alt="" sizes="(max-width: 767px) 45vw, 20vw" loading="eager" decoding="async" draggable="false" :preview="false" />
          </div>
        </div>
      </div>
    </div>

    <h2 id="work-title" class="sr-only">{{ t("nav.projects") }}</h2>
    <Transition name="work-swap" mode="out-in">
      <div :key="category" class="work-grid-wrap">
      <ul class="work-grid">
        <li v-for="(project, index) in shown" :key="project.id" class="work-card">
          <NuxtLink :to="project.to" class="work-card__link">
            <img
              class="work-card__image"
              :src="project.image"
              :alt="project.title"
              :loading="index < 6 ? 'eager' : 'lazy'"
              decoding="async"
              draggable="false"
            >
            <span class="work-card__caption">
              <span class="work-card__title">{{ project.title }}</span>
              <span v-if="project.category" class="work-card__category">{{ project.category }}</span>
            </span>
          </NuxtLink>
        </li>
        <li class="work-card work-card--more">
          <NuxtLink :to="servicePath('branding', toSiteLocale(locale))" class="work-card__link work-more">
            <span class="work-more__name">{{ t("projectsPage.showcaseName") }}</span>
            <span class="work-more__note">{{ t("projectsPage.showcaseNote") }}</span>
            <svg class="work-more__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </NuxtLink>
        </li>
      </ul>
      </div>
    </Transition>
    <p v-if="!projects.length" class="work-empty">{{ t("projectsPage.unavailable") }}</p>
  </section>
</template>

<style scoped>
/* The first screen: the grid centred between the site header and the bar at
   the foot (pages/projects/index.vue). Cards 16:10, three to a row, as wide
   as 76% of the screen allows and short enough for two rows to fit its
   height. */
.work-stage {
  /* The space between the cards, across and down (it was 2x as much down, with
     a rule in it). */
  --gap: clamp(0.375rem, 0.55vw, 0.6875rem);
  --cols: 3;
  --card-w: min(calc((76vw - 2 * var(--gap)) / 3), calc((100svh - 15rem - var(--gap)) / 1.25));
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100svh;
  padding: 7rem 0 6rem;
}

/* ---------- the film ---------- */
.work-intro {
  position: absolute;
  inset: 0 0 auto;
  z-index: 3;
  height: 100svh;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  /* The track's camera (utils/ribbonTrack.ts): 0.64 U, set by the script. */
  perspective: 64vw;
}

.is-playing .work-intro {
  opacity: 1;
}

/* While the film plays it is above the site header (the header is 8888),
   as in the reference, and takes no clicks (a click skips it). */
.work-stage.is-playing {
  z-index: 9000;
  pointer-events: none;
}

.work-word {
  position: absolute;
  left: 50%;
  margin: 0;
  color: #ece9e2;
  font-family: var(--app-font-display);
  font-size: max(2.75rem, min(7.5vw, 13svh));
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  white-space: nowrap;
  translate: -50% -50%;
  will-change: transform;
}

.work-word--first {
  top: 44.5%;
}

.work-word--second {
  top: 56%;
}

.work-tagline {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(16rem, 70vw);
  margin: 0;
  color: #ece9e2;
  font-family: var(--app-font-sans);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: 0.04em;
  text-align: center;
  text-transform: uppercase;
  translate: -50% -50%;
}

/* The ribbon's origin is the middle of the screen; its pictures are placed
   along the track by the script. */
.work-ribbon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
}

.work-ribbon__card {
  position: absolute;
  top: 0;
  left: 0;
  transform-style: preserve-3d;
  will-change: transform;
}

/* Each picture has two faces, the back one turned round, so the picture
   reads the right way from either side. */
.work-ribbon__face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 0.2rem;
  background: #1a1a1a;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.12);
  backface-visibility: hidden;
}

.work-ribbon__face--back {
  transform: rotateY(180deg);
}

.work-ribbon__face :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ---------- the grid ---------- */
.work-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--card-w));
  gap: var(--gap);
  justify-content: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.work-card {
  position: relative;
}

/* Hidden until the film brings them in; shown after 4s whatever happens
   (the film has its own timing once its script runs). */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  .is-waiting .work-card {
    opacity: 0;
    animation: work-failsafe 0.01s linear 4s forwards;
  }
}

@keyframes work-failsafe {
  to { opacity: 1; }
}

.work-grid-wrap {
  position: relative;
}

.work-card__link {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 0.2rem;
  background: #141414;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.14);
  color: #fff;
  text-decoration: none;
}

.work-card__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  user-select: none;
}

/* The project's name and category, coming up from the foot on hover. */
.work-card__caption {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 2.5rem 1rem 0.85rem;
  background: linear-gradient(to top, rgb(0 0 0 / 0.78), rgb(0 0 0 / 0));
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  line-height: 1.3;
  opacity: 0;
  translate: 0 0.5rem;
  transition: opacity 0.35s ease, translate 0.35s ease;
}

.work-card__title {
  font-weight: 600;
}

.work-card__category {
  flex: none;
  color: rgb(255 255 255 / 0.7);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.work-card__link:hover .work-card__image,
.work-card__link:focus-visible .work-card__image {
  transform: scale(1.04);
}

.work-card__link:hover .work-card__caption,
.work-card__link:focus-visible .work-card__caption {
  opacity: 1;
  translate: 0 0;
}

.work-card__link:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

/* The last tile: the way to the showcase. */
.work-more {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.4rem;
  padding: clamp(1rem, 1.6vw, 1.75rem);
  background: #121212;
  transition: background-color 0.3s ease;
}

.work-more:hover,
.work-more:focus-visible {
  background: #181818;
}

.work-more__name {
  font-family: var(--app-font-display);
  font-size: clamp(1.25rem, 2vw, 2.25rem);
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.work-more__note {
  max-width: 22em;
  color: #9a9a9a;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  line-height: 1.4;
}

.work-more__arrow {
  position: absolute;
  top: clamp(1rem, 1.6vw, 1.75rem);
  right: clamp(1rem, 1.6vw, 1.75rem);
  width: 1.4rem;
  height: 1.4rem;
  fill: none;
  stroke: #03cb00;
  stroke-width: 1.8;
  transition: translate 0.3s ease;
}

.work-more:hover .work-more__arrow {
  translate: 0.15rem -0.15rem;
}

.work-empty {
  margin: 1.5rem 0 0;
  color: #8f8f8f;
  font-size: var(--type-body-size);
  text-align: center;
}

/* A category picked: the grid swaps with a quick fade. */
.work-swap-enter-active,
.work-swap-leave-active {
  transition: opacity 0.25s ease;
}

.work-swap-enter-from,
.work-swap-leave-to {
  opacity: 0;
}

/* Tablets: two to a row; phones: one, the name always shown. */
@media (max-width: 1023px) {
  .work-stage {
    --cols: 2;
    --card-w: calc((92vw - var(--gap)) / 2);
  }
}

@media (max-width: 599px) {
  .work-stage {
    --cols: 1;
    --card-w: calc(100vw - 2.5rem);
    padding: 7.75rem 0 2.5rem;
  }
}

@media (hover: none) {
  .work-card__caption {
    opacity: 1;
    translate: 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .work-card__image,
  .work-card__caption,
  .work-swap-enter-active,
  .work-swap-leave-active {
    transition: none;
  }
}
</style>
