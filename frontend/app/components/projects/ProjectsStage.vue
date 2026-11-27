<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import OptImage from "~/components/ui/OptImage.vue";
import type { ProjectWallItem } from "~/composables/useProjectsWallData";
import { useProjectOpen } from "~/composables/useProjectOpen";
import { darkenTo } from "~/utils/cmsStory";
import { createTrack, headAt, TRACK_PERSPECTIVE } from "~/utils/ribbonTrack";
import { pageWasRestored } from "~/utils/viewTransition";

/**
 * /projects' first screen. It opens with a short film (about 4.7s): "WE MAKE"
 * comes in from the left and "BRANDS" from the right, they slow down as they
 * pass each other in the middle and go on out the other side; meanwhile a
 * ribbon of the studio's work runs one turn of a rising spiral (in at the
 * bottom left on the far side, round towards the camera and back along the
 * near side, round again and out at the top right; utils/ribbonTrack.ts);
 * then the projects on the first screen slide into their places, each from
 * the edge of the screen nearest its place (see gridEntry). A click, a key or
 * a scroll skips to the grid; it does not play for visitors who ask for less
 * motion, nor when the page is reopened further down.
 * The grid is worldbranddesign.com's, with cards at the covers' own 16:9:
 * four to a row (fewer on smaller screens), 20px apart; at a card's foot a
 * white plate with the project's logo, and, while the pointer is on it, a
 * second picture over the first and a white bar rising beside the plate with
 * the project's title and its category in the project's colour. A click opens
 * the project inside a disc that springs up in the middle of the card and
 * grows over the screen, as askphill.com opens its cases
 * (composables/useProjectOpen.ts).
 * Every tile is a project. (A last tile, "Showcase", led to the Branding &
 * rebranding service page: a service, not a project.)
 * Arriving from another page, it starts once the page transition is over (it
 * played half hidden under it before). Whether the page was reopened further
 * down is what the scroll's settling recorded, not where the page is by then:
 * the momentum of a scroll on the page before (a touchpad's) went on moving
 * the new page and the film took it for one reopened lower. The page is set
 * at the top and its scroll held while the film plays (the momentum goes
 * nowhere), and input in its first second is not taken as a skip.
 */
const props = defineProps<{ projects: ProjectWallItem[]; category: string }>();

// Taken now: the app context is gone by the time the film runs.
const lenis = useNuxtApp().$lenis as { start?: () => void; stop?: () => void; scrollTo?: (target: number, options?: object) => void } | undefined;
let holding = false;
const holdScroll = () => {
  lenis?.scrollTo?.(0, { immediate: true, force: true });
  lenis?.stop?.();
  holding = true;
};
const releaseScroll = () => {
  if (!holding) return;
  holding = false;
  lenis?.start?.();
};

const { t } = useI18n();

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

// A tile's category line is in the project's colour, dark enough to read on
// the white bar.
const shown = computed(() =>
  (props.category ? props.projects.filter((project) => project.category === props.category) : props.projects).map((project) => ({
    ...project,
    ink: darkenTo(project.color, 4.5),
  }))
);

// A click on a tile: the project opens with the disc (useProjectOpen). It is
// caught on the way down (capture), before the link navigates by itself.
const openProject = useProjectOpen();

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
onBeforeUnmount(() => {
  stopListening();
  releaseScroll();
});

useGsapContext(root, ({ gsap, el }) => {
  waiting.value = false;
  const cards = [...el.querySelectorAll<HTMLElement>(".work-card")];
  // Reopened further down the page (a reload or back/forward keeps the
  // place): no film.
  if (pageWasRestored()) {
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
    releaseScroll();
    playing.value = false;
    intro.value = false;
  };
  // On a first visit the site's loader (components/PageLoader.vue) is still on
  // screen: the film is set up behind it, paused, and starts once it has gone,
  // so it is seen and not played out behind the loader.
  const loading = document.documentElement.classList.contains("ob-loading");
  let started = !loading;
  // The loader holds the scroll itself until it has gone.
  if (!loading) holdScroll();
  const timeline = gsap.timeline({ onComplete: finish, paused: loading });
  if (loading) {
    window.addEventListener("ob:loader-complete", () => {
      started = true;
      holdScroll();
      timeline.play();
    }, { once: true });
  }
  // The first card's slide ends at 4.36s, as in the video; it starts about
  // 0.7s before (the skip goes to just before that).
  const GRID_END = 4.363;
  const GRID_AT = 3.64;

  // The words: in fast, to a stop in the middle of the screen (one over the
  // other, the small line between them), out fast.
  if (first && second) {
    timeline
      .fromTo(first, { x: -0.78 * vw }, { x: 0, duration: 1.6, ease: "power3.out" }, 0)
      .to(first, { x: 0.82 * vw, duration: 2.02, ease: "power3.in" }, 1.6)
      .fromTo(second, { x: 0.78 * vw }, { x: 0, duration: 1.6, ease: "power3.out" }, 0)
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
    // Where the ribbon waits for the film to reach it: the last moment its head
    // picture is wholly clear of the screen's left edge (8px to spare, its lean
    // and the far side's perspective counted). At 1.1s, the video's frame with
    // all of it off the screen, the head is still some px inside the edge on a
    // screen not as wide as 16:9 of its height (or just wider), and, the ribbon
    // standing still until then, a corner of a picture showed at the bottom
    // left while the words came in. It runs on the same clock, so from 1.1s
    // on it is where the video has it. (On a very wide screen the head is
    // still in view at 0: the ribbon then starts at 0.)
    const near = TRACK_PERSPECTIVE * track.unit;
    const reach = Math.hypot(w, h) / 2;
    const clear = (time: number) => {
      const head = track.place(headAt(time, track.unit));
      return vw / 2 + (head.x + reach) * (near / (near - head.z)) <= -8;
    };
    let from = 1.1;
    if (!clear(from)) {
      let early = 0;
      let late = from;
      // The last clear moment, by halving (the head only ever moves right).
      if (clear(early)) {
        for (let step = 0; step < 24; step++) {
          const middle = (early + late) / 2;
          if (clear(middle)) early = middle;
          else late = middle;
        }
      }
      from = early;
    }
    const clock = { time: from };
    const place = () => {
      const head = headAt(clock.time, track.unit);
      tiles.forEach((tile, index) => {
        const p = track.place(head - index * gap);
        tile.style.transform = `translate3d(${(p.x - w / 2).toFixed(1)}px, ${(p.y - h / 2).toFixed(1)}px, ${p.z.toFixed(1)}px) rotateY(${p.turn.toFixed(4)}rad) rotateZ(${p.lean.toFixed(4)}rad)`;
      });
    };
    place();
    // From where it waits (all of it off the screen at the left) to 4s (all of it gone at the right).
    timeline.to(clock, { time: 4, duration: 4 - from, ease: "none", onUpdate: place }, from);
  }

  // The grid: in reading order, each card on the first screen sliding in a
  // straight line from off the screen into its place (gridEntry) on one cubic
  // ease-out (GSAP's power2.out; its power3 is a quartic), the slides ending
  // 0.0616s apart. Its lean eases out with it; the slight 3D turn of a card
  // coming from the side is gone in its first 0.3s. Cards below the first
  // screen are simply in place. (A card's place is set with top, not with a
  // transform: the slide owns its transform and clears it at the end.)
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
    releaseScroll();
  };
  SKIP_EVENTS.forEach((name) => window.addEventListener(name, skip!, { passive: true }));
}, { afterPageSettles: true });
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
        <li
          v-for="(project, index) in shown"
          :key="project.id"
          class="work-card"
          @click.capture="openProject($event, project.to)"
        >
          <NuxtLink :to="project.to" class="work-card__link" :aria-label="project.title">
            <OptImage
              class="work-card__image"
              :src="project.image"
              :alt="project.title"
              sizes="(max-width: 559px) 94vw, (max-width: 899px) 48vw, (max-width: 1279px) 32vw, 24vw"
              :loading="index < 8 ? 'eager' : 'lazy'"
              decoding="async"
              draggable="false"
            />
            <!-- Over the picture when the pointer comes: its name, its category and the way in. -->
            <span class="work-card__over" aria-hidden="true">
              <span class="work-card__title">{{ project.title }}</span>
              <span v-if="project.category" class="work-card__category">{{ project.category }}</span>
              <span class="work-card__view">{{ t("projectsPage.view") }}</span>
            </span>
            <span class="work-card__badge" aria-hidden="true">
              <img v-if="project.logo" :src="project.logo.src" alt="" :width="project.logo.width" :height="project.logo.height" decoding="async" >
              <span v-else class="work-card__initial" :style="{ color: project.ink }">{{ project.title.trim().charAt(0) }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
      </div>
    </Transition>
    <p v-if="!projects.length" class="work-empty">{{ t("projectsPage.unavailable") }}</p>
  </section>
</template>

<style scoped>
/* Under the site header: the grid, 20px from the screen's sides (12px on
   phones), up to the content frame. */
.work-stage {
  --side: 20px;
  --gap: 20px;
  position: relative;
  min-height: 100svh;
  padding: clamp(7.25rem, 8vw, 8rem) 0 clamp(2.5rem, 5vw, 4rem);
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

/* A word is a row as wide as the screen with its letters in the middle; the
   script moves the row sideways (x), so x = 0 is the middle of the screen.
   (Not left: 50% with translate: -50%: GSAP folds a CSS translate into its own
   transform in pixels, and the half-width was lost for words whose width is an
   odd number of pixels — they stopped off the middle.) */
.work-word {
  position: absolute;
  left: 0;
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0;
  color: #ece9e2;
  font-family: var(--app-font-display);
  font-size: max(2.75rem, min(7.5vw, 13svh));
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  white-space: nowrap;
  will-change: transform;
}

/* The words stop one over the other with the small line (.work-tagline)
   between them, clear of it: a capital reaches 0.37em from the word's middle
   (the row is 1em tall, its middle 0.5em under its top), the line is up to
   three rows tall in the longer languages (1.5rem from its middle), and 1rem
   stays between them. */
.work-word--first {
  top: calc(50% - 0.87em - 2.5rem);
}

.work-word--second {
  top: calc(50% - 0.13em + 2.5rem);
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--gap);
  box-sizing: border-box;
  width: 100%;
  max-width: var(--frame-max);
  margin: 0 auto;
  padding: 0 var(--side);
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

/* The card: the covers' own 16:9, square-cornered, the pictures filling it.
   (While it opens it gives a little under the press.) */
.work-card__link {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #161616;
  color: #000;
  text-decoration: none;
  transition: scale 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.work-card.is-opening .work-card__link {
  scale: 0.97;
}

/* :deep: the <img> sits inside OptImage, past this component's scope. */
.work-card__link :deep(.work-card__image) {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.4s cubic-bezier(0.4, 0, 0.2, 1), scale 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

/* The white plate with the project's logo in the card's lower left corner
   (30px tall, 10px around it, as wide as the logo is, up to 60% of the
   card). It leaves when the pointer comes: the card then shows its text. */
.work-card__badge {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  max-width: 60%;
  height: 50px;
  padding: 10px;
  background: #fff;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.work-card__badge img {
  display: block;
  width: auto;
  max-width: 100%;
  height: 100%;
  object-fit: contain;
}

.work-card__initial {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-family: var(--app-font-display);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
}

/* The card's text, over the picture when the pointer comes. The picture
   itself stays (no second picture takes its place): it goes out of focus and
   a little darker under the text. The project's name large, its category
   under it, the way in at the foot. */
.work-card__over {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: clamp(1rem, 7%, 1.75rem);
  background: linear-gradient(180deg, rgb(0 0 0 / 0.42) 0%, rgb(0 0 0 / 0.28) 45%, rgb(0 0 0 / 0.5) 100%);
  color: #fff;
  opacity: 0;
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.work-card__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  font-family: var(--app-font-display);
  font-size: clamp(1.05rem, 1.45 * var(--fvw), 1.6rem);
  font-weight: 600;
  line-height: 1.12;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.work-card__category {
  margin-top: 0.4em;
  color: rgb(255 255 255 / 0.78);
  font-family: var(--app-font-sans);
  font-size: clamp(0.8rem, 0.95 * var(--fvw), 1rem);
  line-height: 1.3;
}

.work-card__view {
  margin-top: auto;
  padding: 0.55em 1.1em;
  border-radius: 0.5em;
  background: rgb(255 255 255 / 0.9);
  color: #0b0b0b;
  font-family: var(--app-font-sans);
  font-size: clamp(0.75rem, 0.85 * var(--fvw), 0.9rem);
  font-weight: 600;
  line-height: 1.2;
}

/* The text rises a little into place. */
.work-card__title,
.work-card__category,
.work-card__view {
  translate: 0 0.5rem;
  transition: translate 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@media (hover: hover) {
  .work-card__link:hover :deep(.work-card__image) {
    filter: blur(10px);
    scale: 1.08;
  }

  .work-card__link:hover .work-card__over {
    opacity: 1;
  }

  .work-card__link:hover .work-card__over > * {
    translate: 0 0;
  }

  .work-card__link:hover .work-card__badge {
    opacity: 0;
  }
}

.work-card__link:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.work-card__link:focus-visible :deep(.work-card__image) {
  filter: blur(10px);
  scale: 1.08;
}

.work-card__link:focus-visible .work-card__over {
  opacity: 1;
}

.work-card__link:focus-visible .work-card__over > * {
  translate: 0 0;
}

.work-card__link:focus-visible .work-card__badge {
  opacity: 0;
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

/* Smaller screens: three to a row, then two, then one; 12px apart on phones. */
@media (max-width: 1279px) {
  .work-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 899px) {
  .work-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 559px) {
  .work-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 639px) {
  .work-stage {
    --side: 12px;
    --gap: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .work-card__link,
  .work-card__link :deep(.work-card__image),
  .work-card__over,
  .work-card__over > *,
  .work-card__badge,
  .work-swap-enter-active,
  .work-swap-leave-active {
    transition: none;
  }
}
</style>
