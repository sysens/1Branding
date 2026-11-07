<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import OptImage from "~/components/ui/OptImage.vue";
import { toSiteLocale } from "~/utils/locales";
import { servicePath, type ServiceKey } from "~/utils/servicePages";

// "The ONE approach" in the grid view: cards riding a very large circle whose
// centre sits below the section, the focused one upright at the top of the
// arc and the others tilted along the curve. Each card is the same box turned
// about that centre (its transform-origin, far below it) by its distance from
// the focus, so where it sits and how it leans are one rotation. Drag the arc
// (it follows the pointer, a flick carries it on, and it settles on the
// nearest card), use the arrows or the arrow keys, or click a card to bring
// it up; the button opens the focused card's service. The list does not loop.

type CardId = "social" | "identity" | "brandbook" | "packaging" | "website" | "presentation" | "motion";
type Card = { id: CardId; page: ServiceKey; src: string };

// The design's mock-ups are not in yet; the services' own pictures stand in.
const CARDS: readonly Card[] = [
  { id: "social", page: "social", src: "/home/threeLayerLocal/33.webp" },
  { id: "identity", page: "identity", src: "/home/threeLayerLocal/14.webp" },
  { id: "brandbook", page: "brandbook", src: "/home/threeLayerLocal/15.webp" },
  { id: "packaging", page: "packaging", src: "/home/w1280/Quaker.webp" },
  { id: "website", page: "web", src: "/home/threeLayerLocal/28.webp" },
  { id: "presentation", page: "presentation", src: "/home/threeLayerLocal/19.webp" },
  { id: "motion", page: "motion", src: "/home/threeLayerLocal/12.webp" },
];
const LAST = CARDS.length - 1;
// Packaging is up first, as in the design ("04 / 07").
const START = 3;
// The cards stand 22deg apart on the circle (its radius is set in the CSS:
// --radius, 41.5em), so the third card out sits low in the corner, as in the
// design at 1440px, and the focused card clears its neighbours.
const STEP = 22;
const RADIUS_EM = 41.5;

const { t, locale } = useI18n();
const siteLocale = computed(() => toSiteLocale(locale.value));

const clamp = (value: number) => Math.min(LAST, Math.max(0, value));
const pad = (value: number) => String(value).padStart(2, "0");
const label = (card: Card) => t(`projectsPage.approach.items.${card.id}`);

// Where the arc stands, in cards (fractional while it moves), and where it is going.
const offset = ref(START);
const target = ref(START);
const active = computed(() => clamp(Math.round(offset.value)));
const activeCard = computed(() => CARDS[active.value]!);
const ctaPath = computed(() => servicePath(activeCard.value.page, siteLocale.value));

// One rotation about the circle's centre places and tilts a card; it grows
// and lights up as it reaches the top, and fades out past three cards away.
// The nearer a card is to the top, the higher it stacks, so the focused one
// is always in front of its neighbours, also while the arc turns.
const cardStyle = (index: number) => {
  const distance = index - offset.value;
  const focus = Math.max(0, 1 - Math.abs(distance));
  const shown = Math.min(1, Math.max(0, 4 - Math.abs(distance)));
  return {
    transform: `rotate(${(distance * STEP).toFixed(3)}deg)`,
    opacity: shown.toFixed(3),
    visibility: shown > 0 ? undefined : ("hidden" as const),
    zIndex: 100 - Math.round(Math.abs(distance) * 10),
    "--focus": focus.toFixed(3),
  };
};

// --- Motion: the arc eases toward its target --------------------------------

const reducedMotion = import.meta.client && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let frame = 0;
let last = 0;
const tick = (now: number) => {
  const frames = last ? Math.min(64, now - last) / 16.67 : 1;
  last = now;
  const remaining = target.value - offset.value;
  if (Math.abs(remaining) < 0.0008) {
    offset.value = target.value;
    frame = 0;
    last = 0;
    return;
  }
  offset.value += remaining * (1 - Math.pow(0.84, frames));
  frame = requestAnimationFrame(tick);
};
const settle = () => {
  if (reducedMotion) {
    offset.value = target.value;
    return;
  }
  if (!frame) frame = requestAnimationFrame(tick);
};
const go = (index: number) => {
  target.value = clamp(index);
  settle();
};
const stop = () => {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  last = 0;
};
onBeforeUnmount(stop);

// --- Input -------------------------------------------------------------------

const root = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const dragging = ref(false);
let press: { id: number; x: number; from: number; perCard: number } | null = null;
let sample = { x: 0, t: 0, velocity: 0 };
// A drag ends in a click on the card under the pointer; that one is ignored.
let swallowClick = false;

const onPointerDown = (event: PointerEvent) => {
  if (event.button !== 0) return;
  // The arc travels one card per arc length between two cards.
  const em = parseFloat(getComputedStyle(root.value!).fontSize) || 16;
  press = { id: event.pointerId, x: event.clientX, from: offset.value, perCard: RADIUS_EM * em * (STEP * Math.PI / 180) };
  sample = { x: event.clientX, t: event.timeStamp, velocity: 0 };
};
const onPointerMove = (event: PointerEvent) => {
  if (!press || event.pointerId !== press.id) return;
  const dx = event.clientX - press.x;
  if (!dragging.value) {
    if (Math.abs(dx) < 6) return;
    dragging.value = true;
    stop();
    stage.value?.setPointerCapture(event.pointerId);
  }
  // Past either end the arc gives a little, as on a rubber band.
  let next = press.from - dx / press.perCard;
  if (next < 0) next *= 0.3;
  else if (next > LAST) next = LAST + (next - LAST) * 0.3;
  const elapsed = Math.max(1, event.timeStamp - sample.t);
  const velocity = -(event.clientX - sample.x) / press.perCard / elapsed;
  sample = { x: event.clientX, t: event.timeStamp, velocity: sample.velocity * 0.4 + velocity * 0.6 };
  offset.value = next;
  target.value = next;
};
const endPress = (event: PointerEvent, cancelled: boolean) => {
  if (!press || event.pointerId !== press.id) return;
  press = null;
  if (!dragging.value) return;
  dragging.value = false;
  if (stage.value?.hasPointerCapture(event.pointerId)) stage.value.releasePointerCapture(event.pointerId);
  swallowClick = !cancelled;
  setTimeout(() => { swallowClick = false; }, 0);
  // A flick carries the arc on for about a fifth of a second.
  const still = event.timeStamp - sample.t > 80;
  go(Math.round(offset.value + (still ? 0 : sample.velocity * 200)));
};
const onPointerUp = (event: PointerEvent) => endPress(event, false);
const onPointerCancel = (event: PointerEvent) => endPress(event, true);

const onCardClick = (index: number) => {
  if (swallowClick) return;
  go(index);
};

const onKeydown = (event: KeyboardEvent) => {
  const moves: Record<string, number> = { ArrowLeft: target.value - 1, ArrowRight: target.value + 1, Home: 0, End: LAST };
  const next = moves[event.key];
  if (next === undefined || event.metaKey || event.ctrlKey || event.altKey) return;
  event.preventDefault();
  go(next);
};
</script>

<template>
  <section
    ref="root"
    class="approach"
    role="region"
    aria-roledescription="carousel"
    :aria-label="t('projectsPage.approach.label')"
    @keydown="onKeydown"
  >
    <div
      ref="stage"
      class="approach__stage"
      :class="{ 'is-dragging': dragging }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
    >
      <button
        v-for="(card, index) in CARDS"
        :key="card.id"
        type="button"
        class="approach-card"
        :class="{ 'is-active': index === active }"
        :style="cardStyle(index)"
        :tabindex="index === active ? 0 : -1"
        :aria-label="label(card)"
        :aria-current="index === active ? 'true' : undefined"
        @click="onCardClick(index)"
      >
        <span class="approach-card__body">
          <span class="approach-card__picture">
            <OptImage :src="card.src" alt="" sizes="(max-width: 767px) 42vw, (min-aspect-ratio: 5/3) 30vh, 19vw" loading="lazy" decoding="async" draggable="false" />
          </span>
          <span class="approach-card__label" aria-hidden="true">{{ label(card) }}</span>
        </span>
      </button>
    </div>

    <div class="approach__copy">
      <p class="approach__eyebrow">{{ t("projectsPage.approach.eyebrow") }}</p>
      <div class="approach__headline">
        <button
          type="button"
          class="approach__arrow approach__arrow--prev"
          :aria-label="t('projectsPage.approach.prev')"
          :disabled="target <= 0"
          @click="go(target - 1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m15 4-8 8 8 8" /></svg>
        </button>
        <h2>
          <span>{{ t("projectsPage.approach.line1") }}</span>
          {{ " " }}
          <span class="approach__accent">{{ t("projectsPage.approach.line2") }}</span>
        </h2>
        <button
          type="button"
          class="approach__arrow approach__arrow--next"
          :aria-label="t('projectsPage.approach.next')"
          :disabled="target >= LAST"
          @click="go(target + 1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 4 8 8-8 8" /></svg>
        </button>
      </div>
      <p class="approach__text">{{ t("projectsPage.approach.text") }}</p>
      <NuxtLink :to="ctaPath" class="ob-button approach__cta">
        {{ t("projectsPage.approach.cta") }}
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" /></svg>
      </NuxtLink>
    </div>

    <div class="approach__foot" aria-hidden="true">
      <span class="approach__current"><span class="approach__dot" />{{ label(activeCard) }}</span>
      <span>{{ pad(active + 1) }} / {{ pad(CARDS.length) }}</span>
    </div>
    <p class="sr-only" aria-live="polite">
      {{ t("projectsPage.approach.position", { label: label(activeCard), current: active + 1, total: CARDS.length }) }}
    </p>
  </section>
</template>

<style scoped>
/* The design at 1440px, in em (16px there, 10px at the least): cards
   16.1 x 20em, the focused one's top 6.2em down, the circle's centre 41.5em
   below a card's centre. The em grows with the screen's width, but no more
   than the screen's height allows: the section (53em) always fits one
   screen, arc, words, button and foot together (on a 1080p screen it was
   1131px tall, on a 5K ultrawide 3200px). */
.approach {
  --radius: 41.5em;
  --card-w: 16.1em;
  --card-h: 20em;
  --green: #20e848;
  position: relative;
  height: 53em;
  overflow: hidden;
  background: #000;
  color: #fff;
  font-size: max(0.625rem, min(100vw / 90, 100svh / 54));
}

/* Its own stacking context: the cards' z-index orders them among themselves,
   under the words. */
.approach__stage {
  position: absolute;
  inset: 0;
  z-index: 0;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
}

.approach__stage.is-dragging {
  cursor: grabbing;
}

.approach-card {
  position: absolute;
  top: 6.2em;
  left: 50%;
  width: var(--card-w);
  height: var(--card-h);
  margin: 0 0 0 calc(var(--card-w) / -2);
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: inherit;
  transform-origin: 50% calc(var(--card-h) / 2 + var(--radius));
  will-change: transform;
  -webkit-tap-highlight-color: transparent;
}

/* It grows toward the top of the arc (--focus: 0 to 1), from 82% to its full
   size, so it stands out in front with a gap to the cards beside it; the
   green frame and glow come up with it. */
.approach-card__body {
  position: absolute;
  inset: 0;
  border-radius: 1.4em;
  background: #0b0b0b;
  box-shadow:
    0 1.5em 3em rgb(0 0 0 / 0.6),
    0 0 2.6em rgb(32 232 72 / calc(0.42 * var(--focus)));
  transform: scale(calc(0.82 + 0.18 * var(--focus)));
}

.approach-card__body::after {
  position: absolute;
  inset: 0;
  border: 2px solid var(--green);
  border-radius: inherit;
  box-shadow: inset 0 0 1.4em rgb(32 232 72 / 0.22);
  content: "";
  opacity: var(--focus);
  pointer-events: none;
}

.approach-card__picture {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: inherit;
}

.approach-card__picture::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgb(0 0 0 / 0.92) 0%, rgb(0 0 0 / 0.6) 17%, transparent 40%);
  content: "";
}

.approach-card__picture :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}

/* "PACKAGING", tracked out at the card's foot. */
.approach-card__label {
  position: absolute;
  right: 0;
  bottom: 1.2em;
  left: 0;
  z-index: 1;
  font-family: var(--app-font-sans);
  font-size: 0.95em;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.32em;
  text-align: center;
  text-indent: 0.32em;
  text-transform: uppercase;
}

.approach-card:focus-visible {
  outline: none;
}

.approach-card:focus-visible .approach-card__body {
  outline: 2px solid #fff;
  outline-offset: 0.3em;
}

/* The words under the arc. */
.approach__copy {
  position: absolute;
  top: 30.6em;
  right: 0;
  left: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-inline: 1.25rem;
  text-align: center;
  pointer-events: none;
}

.approach__copy a,
.approach__copy button {
  pointer-events: auto;
}

.approach__eyebrow {
  margin: 0 0 1.35em;
  color: rgb(255 255 255 / 0.55);
  font-family: var(--app-font-sans);
  font-size: 0.875em;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  text-transform: uppercase;
}

.approach__headline {
  position: relative;
  width: 100%;
}

.approach__headline h2 {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: 4.45em;
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.approach__headline h2 > span {
  display: block;
}

.approach__accent {
  color: var(--green);
}

/* The arrows sit either side of the first line, 18.6em from the middle. */
.approach__arrow {
  position: absolute;
  top: 0.9em;
  display: grid;
  width: 2.75em;
  height: 2.75em;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: rgb(255 255 255 / 0.8);
  cursor: pointer;
  transition: color 0.2s ease, opacity 0.2s ease;
}

.approach__arrow--prev {
  left: calc(50% - 18.6em - 1.375em);
}

.approach__arrow--next {
  left: calc(50% + 18.6em - 1.375em);
}

.approach__arrow:hover {
  color: var(--green);
}

.approach__arrow:disabled {
  cursor: default;
  opacity: 0.25;
}

.approach__arrow:disabled:hover {
  color: rgb(255 255 255 / 0.8);
}

.approach__arrow:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 0.15em;
}

.approach__arrow svg {
  width: 1.6em;
  height: 1.6em;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.approach__text {
  margin: 1em 0 0;
  color: rgb(255 255 255 / 0.62);
  font-family: var(--app-font-sans);
  font-size: 1.2em;
  line-height: 1.35;
  text-wrap: balance;
}

/* The design's button: bright green, black type, an arrow off its corner. */
.approach__cta {
  --button-h: 2.5em;
  --button-pad: 1.4em;
  --button-font: 0.95em;
  margin-top: 1.6em;
  background: linear-gradient(100deg, #11b237 0%, #1fd544 55%, var(--green) 100%);
  color: #000;
  text-shadow: none;
}

/* The shared button's drifting dark light would sit under the black type. */
.approach__cta::before {
  display: none;
}

.approach__cta svg {
  width: 1.05em;
  height: 1.05em;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

/* The focused card's name and its number, at the section's foot. */
.approach__foot {
  position: absolute;
  bottom: 1.7em;
  left: 50%;
  display: flex;
  justify-content: space-between;
  width: min(25em, calc(100% - 2.5rem));
  color: rgb(255 255 255 / 0.55);
  font-family: var(--app-font-sans);
  font-size: 0.75em;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  transform: translateX(-50%);
}

.approach__current {
  display: inline-flex;
  align-items: center;
  gap: 0.9em;
}

.approach__dot {
  width: 0.55em;
  height: 0.55em;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0.6em var(--green);
}

/* Phones: the arc starts lower, clear of the floating header, and the
   headline and the arrows come in to fit the screen. */
@media (max-width: 767px) {
  .approach {
    height: 56em;
  }

  .approach-card {
    top: 9em;
  }

  .approach__copy {
    top: 33.4em;
  }

  .approach__headline h2 {
    font-size: 3.2em;
  }

  .approach__arrow {
    top: 0.4em;
  }

  .approach__arrow--prev {
    left: 0;
  }

  .approach__arrow--next {
    right: 0;
    left: auto;
  }

  .approach__headline {
    padding-inline: 2.5em;
  }
}
</style>
