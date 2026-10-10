<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

// "Every part. Working as ONE." — the design's own render, cut into layers
// (public/home/parts, made by scripts/parts-layers.py): the chrome tubes, the
// six service cards and the segmented ONE. Put back together at rest they are
// the render pixel for pixel. The section is pinned while scrolling: ONE starts
// alone in the middle and slides right, the tubes grow out of the O, CRM & ERP
// appears, and each other card slides out from behind its neighbour as the
// tubes reach it (Websites … Naming); then the headline and taglines come in.

type Rect = readonly [x: number, y: number, w: number, h: number];
type CardKey = "naming" | "branding" | "design" | "photography" | "websites" | "crm";

// Layer boxes in pixels of the 1844×620 render.
const ART_W = 1844;
const ART_H = 620;
const TUBES: Rect = [3, 22, 1127, 588];
const ONE: Rect = [941, 117, 850, 491];
const CARDS: Array<{ key: CardKey; rect: Rect }> = [
  { key: "naming", rect: [26, 22, 197, 419] },
  { key: "branding", rect: [179, 48, 177, 402] },
  { key: "design", rect: [311, 56, 171, 397] },
  { key: "photography", rect: [441, 65, 166, 386] },
  { key: "websites", rect: [574, 74, 162, 377] },
  { key: "crm", rect: [708, 82, 148, 370] },
];
const LAST = CARDS.length - 1;

// The render sits in the design's 2000px frame at x 208, y 288 (the stage
// starts at frame y 40), scaled 0.8975.
const ART_SCALE = 0.8975;
const ART_LEFT = 208;
const frameX = (x: number) => ART_LEFT + x * ART_SCALE;

// ONE grows from where the tubes plug into the O; alone, it is centred.
const JOINT: readonly [number, number] = [1017, 300];
const ONE_CENTER_X = 1377.5;
const ONE_SCALE = 1.08;
const ONE_SHIFT = 1000 - (frameX(JOINT[0]) + ONE_SCALE * (frameX(ONE_CENTER_X) - frameX(JOINT[0])));

// Scroll windows (fractions of the pinned scroll).
const ONE_MOVE = [0.02, 0.22] as const;
// Where the tubes' growing tip is (render x): out of the O to the CRM card,
// then along the floor under the cards.
const FRONT: Array<readonly [number, number]> = [[0.14, 1180], [0.3, 850], [0.84, -40]];
const SOFT = 60;
const frontAt = (progress: number) => lerpKeys(FRONT, progress, false);
const progressAt = (x: number) => {
  const [p0, x0] = FRONT[1]!;
  const [p1, x1] = FRONT[2]!;
  return p0 + ((x0 - x) / (x0 - x1)) * (p1 - p0);
};
// CRM & ERP appears as the tubes reach it; every other card slides out from
// behind its right-hand neighbour while the tip passes under it.
const cardWindows = CARDS.map(({ rect: [x, , w] }, index) =>
  index === LAST ? ([0.27, 0.36] as const) : ([progressAt(x + w), progressAt(x + w * 0.25)] as const),
);
const HEADLINE = [0.78, 0.87] as const;
const TAGLINES = [0.8, 0.89] as const;

// Screens narrower than the stage: where the camera looks (frame x), and at the
// end it pulls back until the whole render fits.
const ART_CENTER = frameX(ART_W / 2);
const ZOOM_OUT = [0.86, 0.97] as const;
const focusAt = (progress: number, oneKey: number) => {
  if (progress <= 0.3) return lerpKeys([[ONE_MOVE[0], 1000], [0.22, oneKey], [0.3, frameX(FRONT[1]![1]) + 90]], progress);
  if (progress <= ZOOM_OUT[0]) return frameX(frontAt(progress)) + 90;
  return lerpKeys([[ZOOM_OUT[0], frameX(FRONT[2]![1]) + 90], [ZOOM_OUT[1], ART_CENTER]], progress);
};

const { t } = useI18n();
const services = computed(() => CARDS.map((card) => t(`home.parts.cards.${card.key}`)));

const percent = (value: number) => `${(value * 100).toFixed(4)}%`;
const box = ([x, y, w, h]: Rect) => ({
  left: percent(x / ART_W),
  top: percent(y / ART_H),
  width: percent(w / ART_W),
  height: percent(h / ART_H),
});
const oneOrigin = `${percent((JOINT[0] - ONE[0]) / ONE[2])} ${percent((JOINT[1] - ONE[1]) / ONE[3])}`;

const root = ref<HTMLElement | null>(null);
const screen = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const one = ref<HTMLElement | null>(null);
const tubes = ref<HTMLElement | null>(null);
let frame = 0;
let stop: (() => void) | undefined;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}
function span(value: number, [from, to]: readonly [number, number]) {
  return clamp01((value - from) / (to - from));
}
function ease(value: number) {
  return 1 - (1 - value) ** 3;
}
function lerpKeys(keys: Array<readonly [number, number]>, value: number, eased = true) {
  if (value <= keys[0]![0]) return keys[0]![1];
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1] = keys[i]!;
    const [p0, v0] = keys[i - 1]!;
    if (value <= p1) {
      const step = clamp01((value - p0) / (p1 - p0));
      return v0 + (v1 - v0) * (eased ? ease(step) : step);
    }
  }
  return keys[keys.length - 1]![1];
}

const render = () => {
  frame = 0;
  const section = root.value;
  const stageBox = stage.value;
  const view = screen.value;
  if (!section || !stageBox || !view) return;
  // The sticky range; unlike innerHeight it does not change when a phone's
  // toolbar shows or hides.
  const distance = section.offsetHeight - view.offsetHeight;
  const progress = distance > 0 ? clamp01(-section.getBoundingClientRect().top / distance) : 1;

  // Stage placement: centred when the render fits, otherwise panned with the
  // action and finally zoomed out to the whole render.
  const u = stageBox.offsetWidth / 2000;
  const artWidth = ART_W * ART_SCALE * u;
  let zoom = 1;
  let left = (view.clientWidth - stageBox.offsetWidth) / 2;
  if (artWidth + 24 > view.clientWidth) {
    const fit = Math.min(1, (view.clientWidth - 24) / artWidth);
    zoom = 1 + (fit - 1) * ease(span(progress, ZOOM_OUT));
    const scale = u * zoom;
    // Keep ONE's far end in view while it lands on narrow screens.
    const oneKey = Math.max(1330, frameX(ONE[0] + ONE[2]) - (view.clientWidth / 2 - 12) / scale);
    // Never pan past the ends of the render (12px margin); once it fits, centre it.
    const artLeft = frameX(CARDS[0]!.rect[0]) * scale;
    const artRight = frameX(ONE[0] + ONE[2]) * scale;
    const minLeft = view.clientWidth - 12 - artRight;
    const maxLeft = 12 - artLeft;
    const want = view.clientWidth / 2 - focusAt(progress, oneKey) * scale;
    left = minLeft <= maxLeft ? Math.min(maxLeft, Math.max(minLeft, want)) : (minLeft + maxLeft) / 2;
  }
  stageBox.style.left = "0px";
  stageBox.style.transform = `translate3d(${left.toFixed(1)}px, -50%, 0) scale(${zoom.toFixed(4)})`;

  // ONE slides from the middle to its place; the tubes ride along with it.
  // Ease in and out: a plain ease-out throws ONE off at full speed.
  const step = span(progress, ONE_MOVE);
  const move = step * step * (3 - 2 * step);
  const shift = `translate3d(${(ONE_SHIFT * (1 - move) * u).toFixed(1)}px, 0, 0)`;
  if (one.value) one.value.style.transform = `${shift} scale(${(ONE_SCALE - (ONE_SCALE - 1) * move).toFixed(4)})`;

  if (tubes.value) {
    const reach = TUBES[0] + TUBES[2] - frontAt(progress);
    tubes.value.style.transform = shift;
    tubes.value.style.setProperty("--reveal-from", percent((reach - SOFT / 2) / TUBES[2]));
    tubes.value.style.setProperty("--reveal-to", percent((reach + SOFT / 2) / TUBES[2]));
    tubes.value.style.visibility = reach + SOFT / 2 > 0 ? "visible" : "hidden";
  }

  stageBox.querySelectorAll<HTMLElement>("[data-card]").forEach((card) => {
    const index = Number(card.dataset.card);
    const steps = cardWindows[index]!;
    const shown = ease(span(progress, steps));
    card.style.opacity = ease(span(progress, [steps[0], steps[0] + (steps[1] - steps[0]) * 0.45])).toFixed(3);
    card.style.transform = index === LAST
      ? `translate3d(${(6 * (1 - shown)).toFixed(2)}%, 0, 0) scale(${(0.94 + 0.06 * shown).toFixed(4)})`
      : `translate3d(${(72 * (1 - shown)).toFixed(2)}%, 0, 0)`;
    card.style.filter = shown >= 1 ? "none" : `blur(${((1 - shown) * 6 * u).toFixed(2)}px)`;
  });

  const reveal = (selector: string, range: readonly [number, number]) => {
    const shown = ease(span(progress, range));
    view.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      element.style.opacity = shown.toFixed(3);
      element.style.transform = `translate3d(0, ${(24 * (1 - shown) * u).toFixed(1)}px, 0)`;
    });
  };
  reveal("[data-headline]", HEADLINE);
  reveal("[data-tagline]", TAGLINES);
  hideContactButtonOver(view, progress);
};

// The floating contact button (teleported to body) can sit on the closing
// lines on some screens; fade it out while it does.
const hideContactButtonOver = (view: HTMLElement, progress: number) => {
  const button = progress >= TAGLINES[0] ? document.querySelector<HTMLElement>(".contact-fab") : null;
  const area = button?.getBoundingClientRect();
  const covers = !!area && [...view.querySelectorAll<HTMLElement>("[data-tagline]")].some((line) => {
    const rect = line.getBoundingClientRect();
    return rect.right > area.left && rect.left < area.right && rect.bottom > area.top && rect.top < area.bottom;
  });
  document.documentElement.classList.toggle("parts-fab-off", covers);
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
  document.documentElement.classList.remove("parts-fab-off");
});
</script>

<template>
  <!-- The copy is English in both locales. -->
  <section ref="root" class="parts" lang="en">
    <div ref="screen" class="parts__screen">
      <!-- Texts sit on the screen rather than the stage, so on phones (where the
           stage pans) they stay in view; on wider screens they line up with the
           design frame through the same --u maths. -->
      <p class="parts__brand" data-headline>OneBranding</p>
      <h2 class="parts__headline" data-headline>
        <span>{{ t("home.parts.headlineFirst") }}</span>
        <span>{{ t("home.parts.headlineSecond") }}</span>
      </h2>
      <ul class="sr-only">
        <li v-for="service in services" :key="service">{{ service }}</li>
      </ul>
      <p class="parts__lead" data-tagline>{{ t("home.parts.lead") }}</p>
      <p class="parts__tagline" data-tagline>{{ t("home.parts.tagline") }}</p>

      <div ref="stage" class="parts__stage" aria-hidden="true">
        <div class="parts__art">
          <div ref="tubes" class="parts__layer parts__tubes" :style="box(TUBES)">
            <img src="/home/parts/tubes.webp" alt="" :width="TUBES[2]" :height="TUBES[3]" loading="lazy" decoding="async" draggable="false">
          </div>
          <div
            v-for="(card, index) in CARDS"
            :key="card.key"
            class="parts__layer parts__card"
            :data-card="index"
            :style="{ ...box(card.rect), zIndex: 2 + index }"
          >
            <img :src="`/home/parts/${card.key}.webp`" alt="" :width="card.rect[2]" :height="card.rect[3]" loading="lazy" decoding="async" draggable="false">
          </div>
          <div ref="one" class="parts__layer parts__one" :style="{ ...box(ONE), transformOrigin: oneOrigin }">
            <img src="/home/parts/one.webp" alt="" :width="ONE[2]" :height="ONE[3]" loading="lazy" decoding="async" draggable="false">
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* --u is one pixel of the 2000px design frame; the 880px tall stage must fit
   under the fixed header. */
.parts {
  --u: min(0.05vw, calc((100svh - 8rem) / 880));
  position: relative;
  height: 420vh;
  background: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

.parts__screen {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
  overflow: hidden;
}

.parts__stage {
  position: absolute;
  top: calc(50% + 2.5rem);
  left: 50%;
  width: calc(2000 * var(--u));
  height: calc(880 * var(--u));
  transform: translate3d(-50%, -50%, 0);
  /* JS places it by its left edge, also while zooming out on phones. */
  transform-origin: 0 50%;
}

.parts__brand,
.parts__headline,
.parts__lead,
.parts__tagline {
  position: absolute;
  z-index: 10;
  margin: 0;
  color: #0a0a0a;
  white-space: nowrap;
}

.parts__brand {
  left: calc(50% - 750 * var(--u));
  top: calc(50% + 2.5rem - 430 * var(--u));
  font-size: max(11px, calc(19.5 * var(--u)));
  font-weight: 700;
  letter-spacing: -0.01em;
}

.parts__headline {
  left: calc(50% - 754 * var(--u));
  top: calc(50% + 2.5rem - 393 * var(--u));
  display: flex;
  flex-direction: column;
  font-size: calc(105 * var(--u));
  font-weight: 700;
  line-height: 0.905;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  /* The design's face is heavier and wider than SF Pro Bold. */
  -webkit-text-stroke: calc(1.75 * var(--u)) #0a0a0a;
}

.parts__lead {
  left: calc(50% + 175 * var(--u));
  top: calc(50% + 2.5rem + 264 * var(--u));
  font-size: calc(46 * var(--u));
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  -webkit-text-stroke: calc(1.2 * var(--u)) #0a0a0a;
}

.parts__tagline {
  left: calc(50% + 8 * var(--u));
  top: calc(50% + 2.5rem + 392 * var(--u));
  color: #2a2a2a;
  font-size: max(11px, calc(18 * var(--u)));
  font-weight: 500;
  letter-spacing: 0.07em;
  translate: -50% 0;
}

/* The render inside the design frame (1844×620 px at 0.8975). */
.parts__art {
  position: absolute;
  left: calc(208 * var(--u));
  top: calc(248 * var(--u));
  width: calc(1655 * var(--u));
  height: calc(556.45 * var(--u));
}

.parts__layer {
  position: absolute;
  pointer-events: none;
  will-change: transform, opacity;
}

.parts__layer img {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
}

/* The tubes grow from the right: a soft-edged mask whose stops JS moves. */
.parts__tubes {
  --reveal-from: 200%;
  --reveal-to: 210%;
  z-index: 1;
  -webkit-mask-image: linear-gradient(to left, #000 var(--reveal-from), transparent var(--reveal-to));
  mask-image: linear-gradient(to left, #000 var(--reveal-from), transparent var(--reveal-to));
}

.parts__card {
  will-change: transform, opacity, filter;
}

.parts__one {
  z-index: 8;
}

/* Phones (portrait): the stage is wider than the screen and pans with the
   action; the texts take fixed spots above and below it. Landscape phones keep
   the desktop sizing, which fits their short screens. */
@media (max-width: 767px) and (orientation: portrait) {
  .parts {
    --u: 0.4px;
  }

  .parts__brand {
    left: 1.25rem;
    top: 7rem;
    font-size: 0.75rem;
  }

  .parts__headline {
    left: 1.25rem;
    top: 8rem;
    font-size: 2.1rem;
    letter-spacing: 0.01em;
    -webkit-text-stroke: 0.03rem #0a0a0a;
  }

  .parts__lead {
    left: 50%;
    top: calc(50% + 2.5rem + 9.5rem);
    font-size: 1.15rem;
    -webkit-text-stroke: 0.02rem #0a0a0a;
    translate: -50% 0;
  }

  .parts__tagline {
    left: 50%;
    top: calc(50% + 2.5rem + 12rem);
    font-size: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .parts {
    height: auto;
  }

  .parts__screen {
    position: relative;
    height: calc(880 * var(--u) + 8rem);
  }

  .parts__layer,
  .parts__card {
    will-change: auto;
  }
}

/* Reduced motion on phones: nothing pans, so the whole render is fitted. */
@media (prefers-reduced-motion: reduce) and (max-width: 767px) and (orientation: portrait) {
  .parts {
    --u: calc((100vw - 1.5rem) / 1655);
  }

  .parts__stage {
    left: calc(50% - 1035.5 * var(--u));
    transform: translate3d(0, -50%, 0);
  }

  .parts__screen {
    height: 34rem;
  }
}
</style>

<style>
/* Not scoped: the contact button lives in <body>. */
.contact-fab {
  transition: opacity 0.3s ease;
}

.parts-fab-off .contact-fab {
  opacity: 0;
  pointer-events: none;
}
</style>
