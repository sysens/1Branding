<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

// "Business audit & strategy — From problem to progress." A path from the
// current state (A) through Audit, Analysis, Strategy and Action to the target
// state (B). While the path crosses the screen each step lights up green in
// turn and the connector after it fills toward the next one, a spark riding
// its tip. Coordinates are the design's (2000px frame), scaled by --u.

type Step = { key: "audit" | "analysis" | "strategy" | "action"; x: number; y: number };
const STEPS: Step[] = [
  { key: "audit", x: 550, y: 895 },
  { key: "analysis", x: 806, y: 900 },
  { key: "strategy", x: 1062, y: 894 },
  { key: "action", x: 1320, y: 891 },
];
// Connectors: A → Audit → Analysis → Strategy → Action → B.
const LINKS = [
  "M408 982 C 468 982, 482 952, 545 952",
  "M703 972 L 802 972",
  "M958 982 C 1012 982, 1004 952, 1057 952",
  "M1214 980 C 1268 980, 1262 952, 1314 952",
  "M1474 963 L 1578 963",
];
const DOTS: Array<[number, number, number]> = [
  // [x, y, link index whose start (0) or end (1) it marks]
  [408, 982, 0], [545, 952, 1], [802, 972, 2], [1057, 952, 3], [1314, 952, 4],
];
const ROW_TOP = 870;
const ROW_LEFT = 250;

const { t } = useI18n();
const localePath = useLocalePath();

const row = ref<HTMLElement | null>(null);
// 0..6 nodes lit (A, the four steps, B) and how far each link has filled.
const lit = ref(0);
const fills = ref<number[]>(LINKS.map(() => 0));
const spark = ref<{ x: number; y: number; on: boolean }>({ x: 0, y: 0, on: false });
const paths = ref<SVGPathElement[]>([]);
let frame = 0;
let stop: (() => void) | undefined;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => value * value * (3 - 2 * value);

// The row lights from when its middle is 85% down the screen until it is 35%
// down: node i at progress i/5 (A first, B last), link i fills in between.
const render = () => {
  frame = 0;
  const box = row.value;
  if (!box) return;
  const rect = box.getBoundingClientRect();
  // Phones stack the path vertically: it lights as the reading line (70% down
  // the screen) passes down the list.
  const progress = window.innerWidth < 768
    ? clamp01((window.innerHeight * 0.7 - rect.top) / rect.height)
    : clamp01((window.innerHeight * 0.85 - (rect.top + rect.height / 2)) / (window.innerHeight * 0.5));
  box.style.setProperty("--progress", progress.toFixed(4));
  const step = progress * LINKS.length;
  lit.value = progress <= 0 ? 0 : Math.min(LINKS.length + 1, Math.floor(step + 0.12) + 1);
  fills.value = LINKS.map((_, index) => ease(clamp01((step - index - 0.12) / 0.76)));
  const active = fills.value.findIndex((fill) => fill > 0 && fill < 1);
  const path = paths.value[active];
  if (active >= 0 && path) {
    const point = path.getPointAtLength(path.getTotalLength() * fills.value[active]!);
    spark.value = { x: point.x, y: point.y, on: true };
  } else {
    spark.value = { ...spark.value, on: false };
  }
};

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(render);
};

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    lit.value = LINKS.length + 1;
    fills.value = LINKS.map(() => 1);
    return;
  }
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

const at = (x: number, y: number) => ({ left: `calc(${x - ROW_LEFT} * var(--u))`, top: `calc(${y - ROW_TOP} * var(--u))` });
</script>

<template>
  <!-- The copy is English in both locales. -->
  <section class="audit" lang="en" aria-labelledby="audit-title">
    <p class="audit__title">{{ t("home.audit.eyebrow") }}</p>

    <div class="audit__frame">
      <p class="audit__eyebrow">{{ t("home.audit.eyebrow") }}</p>
      <div class="audit__hero">
        <h2 id="audit-title" class="audit__heading">
          <span>{{ t("home.audit.lineFirst") }}</span>
          <span class="audit__green">{{ t("home.audit.lineSecond") }}</span>
        </h2>
        <p class="audit__aside">
          <span>{{ t("home.audit.asideFirst") }}</span>
          <span>{{ t("home.audit.asideSecond") }}</span>
        </p>
      </div>

      <div class="audit__scroller">
        <div ref="row" class="audit__row">
          <span class="audit__track" aria-hidden="true" />
          <svg class="audit__links" :viewBox="`${ROW_LEFT} ${ROW_TOP} 1500 200`" aria-hidden="true" focusable="false">
            <defs>
              <marker id="audit-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M1 1 L9 5 L1 9" fill="none" stroke="#00f562" stroke-width="1.6" />
              </marker>
              <filter id="audit-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            <path v-for="(d, index) in LINKS" :key="`base-${index}`" class="audit__link-base" :d="d" />
            <path
              v-for="(d, index) in LINKS"
              :key="`fill-${index}`"
              ref="paths"
              class="audit__link-fill"
              :d="d"
              pathLength="1"
              :marker-end="index === LINKS.length - 1 && fills[index]! > 0.97 ? 'url(#audit-arrow)' : undefined"
              :style="{ strokeDashoffset: 1 - fills[index]! }"
            />
            <circle
              v-for="([x, y, link], index) in DOTS"
              :key="`dot-${index}`"
              class="audit__dot"
              :class="{ 'is-lit': index === 0 ? lit >= 1 : fills[link - 1]! >= 1 }"
              :cx="x"
              :cy="y"
              r="8"
            />
            <g v-if="spark.on" class="audit__spark">
              <circle :cx="spark.x" :cy="spark.y" r="11" filter="url(#audit-glow)" />
              <circle :cx="spark.x" :cy="spark.y" r="5" />
            </g>
          </svg>

          <div class="audit__end audit__end--start" :class="{ 'is-lit': lit >= 1 }" :style="at(259, 925)">
            <span class="audit__letter" aria-hidden="true">A</span>
            <span class="audit__label">{{ t("home.audit.current") }}</span>
          </div>

          <div
            v-for="(item, index) in STEPS"
            :key="item.key"
            class="audit__step"
            :class="{ 'is-lit': lit >= index + 2 }"
            :style="at(item.x, item.y)"
          >
            <svg class="audit__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <template v-if="item.key === 'audit'">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M15.4 15.4 20.5 20.5" />
              </template>
              <template v-else-if="item.key === 'analysis'">
                <path d="M6.5 18v-4M12 18v-7.5M17.5 18V5" />
              </template>
              <template v-else-if="item.key === 'strategy'">
                <circle cx="12" cy="12" r="8.6" />
                <circle class="audit__core" cx="12" cy="12" r="3.8" />
              </template>
              <template v-else>
                <path d="M6.5 17.5 17.5 6.5M9 6.5h8.5V15" />
              </template>
            </svg>
            <span class="audit__label">{{ t(`home.audit.steps.${item.key}`) }}</span>
          </div>

          <div class="audit__end audit__end--target" :class="{ 'is-lit': lit >= 6 }" :style="at(1595, 894)">
            <span class="audit__ring"><span class="audit__letter audit__letter--b" aria-hidden="true">B</span></span>
            <span class="audit__label">{{ t("home.audit.target") }}</span>
          </div>
        </div>
      </div>
    </div>

    <p class="audit__plan">
      <span class="audit__green">{{ t("home.audit.planAccent") }}</span> {{ t("home.audit.planRest") }}
    </p>
    <p class="audit__text">{{ t("home.audit.text") }}</p>
    <NuxtLink :to="localePath('/ContactPage')" class="audit__button">
      {{ t("home.audit.cta") }}
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8" /></svg>
    </NuxtLink>
  </section>
</template>

<style scoped>
/* --u is one pixel of the 2000px design frame. */
.audit {
  --u: 0.05vw;
  --green: #00f562;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(157 * var(--u)) 0 calc(150 * var(--u));
  background: #000;
  color: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

.audit p,
.audit h2 {
  margin: 0;
}

.audit__title {
  font-size: calc(85.5 * var(--u));
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.01em;
  text-align: center;
  text-transform: uppercase;
}

.audit__frame {
  width: calc(2000 * var(--u));
  margin-top: calc(300 * var(--u));
  padding-left: calc(277 * var(--u));
}

.audit__eyebrow {
  color: #96979a;
  font-size: calc(17 * var(--u));
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.audit__hero {
  display: flex;
  align-items: flex-end;
  gap: calc(58 * var(--u));
  margin-top: calc(25 * var(--u));
}

.audit__heading {
  display: flex;
  flex-direction: column;
  font-size: calc(126 * var(--u));
  font-weight: 700;
  line-height: 0.81;
  letter-spacing: 0.035em;
  text-transform: uppercase;
  /* The design's face is far heavier and wider than SF Pro Bold. */
  -webkit-text-stroke: calc(4.5 * var(--u)) currentColor;
}

.audit__green {
  color: var(--green);
}

.audit__aside {
  display: flex;
  flex-direction: column;
  padding-bottom: calc(8 * var(--u));
  color: #999ca0;
  font-size: calc(28.5 * var(--u));
  line-height: 1.18;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* The path: absolutely placed in design units inside a 1500x200 strip. */
.audit__scroller {
  margin-top: calc(82 * var(--u));
  margin-left: calc(-27 * var(--u));
}

.audit__row {
  position: relative;
  width: calc(1500 * var(--u));
  height: calc(200 * var(--u));
}

.audit__links {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.audit__link-base,
.audit__link-fill {
  fill: none;
  stroke-width: 4.5;
  stroke-linecap: round;
}

.audit__link-base {
  stroke: #9da3a8;
  opacity: 0.85;
}

.audit__link-fill {
  stroke: var(--green);
  stroke-dasharray: 1 1;
  filter: drop-shadow(0 0 4px rgb(0 245 98 / 0.55));
}

.audit__dot {
  fill: #b8bec3;
  transition: fill 0.35s ease;
}

.audit__dot.is-lit {
  fill: var(--green);
}

.audit__spark circle {
  fill: #c9ffd9;
}

.audit__spark circle:first-child {
  fill: var(--green);
}

.audit__step,
.audit__end {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.audit__step {
  justify-content: center;
  gap: calc(16 * var(--u));
  width: calc(153 * var(--u));
  height: calc(160 * var(--u));
  padding-top: calc(10 * var(--u));
  border: calc(2 * var(--u)) solid #262626;
  border-radius: calc(22 * var(--u));
  background: linear-gradient(160deg, #141414, #0a0a0a);
  box-shadow: inset 0 calc(1 * var(--u)) 0 rgb(255 255 255 / 0.05);
  transition: border-color 0.5s ease, box-shadow 0.5s ease, transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.audit__step.is-lit {
  border-color: rgb(0 245 98 / 0.55);
  box-shadow: 0 0 calc(34 * var(--u)) rgb(0 245 98 / 0.22), inset 0 0 calc(22 * var(--u)) rgb(0 245 98 / 0.08);
  transform: translateY(calc(-4 * var(--u)));
}

.audit__icon {
  width: calc(70 * var(--u));
  height: calc(70 * var(--u));
  fill: none;
  stroke: #f2f2f2;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke 0.5s ease, filter 0.5s ease;
}

.audit__step.is-lit .audit__icon {
  stroke: var(--green);
  filter: drop-shadow(0 0 calc(8 * var(--u)) rgb(0 245 98 / 0.6));
}

.audit__core {
  transition: fill 0.5s ease;
}

.audit__step.is-lit .audit__core {
  fill: rgb(0 245 98 / 0.18);
}

.audit__label {
  color: #ececec;
  font-size: calc(19 * var(--u));
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: color 0.5s ease;
}

.audit__end.is-lit .audit__label,
.audit__step.is-lit .audit__label {
  color: #fff;
}

.audit__end {
  gap: calc(14 * var(--u));
}

.audit__letter {
  font-size: calc(114 * var(--u));
  font-weight: 700;
  line-height: 0.82;
  -webkit-text-stroke: calc(4 * var(--u)) currentColor;
  background: linear-gradient(180deg, #ffffff 0%, #e4e4e4 45%, #9b9b9b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition: filter 0.5s ease;
}

.audit__end--start .audit__letter {
  -webkit-text-stroke-color: transparent;
}

.audit__end--start.is-lit .audit__letter {
  background-image: linear-gradient(180deg, #8dffb6 0%, #00f562 55%, #00b847 100%);
  filter: drop-shadow(0 0 calc(14 * var(--u)) rgb(0 245 98 / 0.45));
}

.audit__ring {
  display: grid;
  place-items: center;
  width: calc(140 * var(--u));
  height: calc(140 * var(--u));
  border: calc(4.5 * var(--u)) solid #3b3b3b;
  border-radius: 50%;
  transition: border-color 0.5s ease, box-shadow 0.5s ease;
}

.audit__letter--b {
  padding-left: calc(6 * var(--u));
  font-size: calc(104 * var(--u));
  background: none;
  color: #3b3b3b;
  -webkit-text-stroke-color: #3b3b3b;
  transition: color 0.5s ease, -webkit-text-stroke-color 0.5s ease;
}

.audit__end--target.is-lit .audit__ring {
  border-color: var(--green);
  box-shadow: 0 0 calc(40 * var(--u)) rgb(0 245 98 / 0.35), inset 0 0 calc(24 * var(--u)) rgb(0 245 98 / 0.15);
  animation: audit-pulse 2.4s ease-in-out 0.5s infinite;
}

.audit__end--target.is-lit .audit__letter--b {
  color: var(--green);
  -webkit-text-stroke-color: var(--green);
}

@keyframes audit-pulse {
  50% { box-shadow: 0 0 calc(64 * var(--u)) rgb(0 245 98 / 0.5), inset 0 0 calc(30 * var(--u)) rgb(0 245 98 / 0.22); }
}

.audit__plan {
  margin-top: calc(110 * var(--u)) !important;
  font-size: calc(57 * var(--u));
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.035em;
  text-align: center;
  -webkit-text-stroke: calc(1.5 * var(--u)) currentColor;
}

.audit__plan .audit__green {
  -webkit-text-stroke-color: var(--green);
}

.audit__text {
  max-width: calc(1310 * var(--u));
  margin-top: calc(24 * var(--u)) !important;
  padding-inline: 1.25rem;
  color: #999ca0;
  font-size: calc(25.5 * var(--u));
  line-height: 1.3;
  text-align: center;
  text-wrap: balance;
}

.audit__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  width: calc(258 * var(--u));
  height: calc(62 * var(--u));
  margin-top: calc(37 * var(--u));
  border-radius: 999px;
  background: var(--green);
  color: #052b12;
  font-size: calc(25 * var(--u));
  font-weight: 700;
  letter-spacing: -0.02em;
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.audit__button svg {
  width: 1em;
  height: 1em;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
}

.audit__button:hover,
.audit__button:focus-visible {
  transform: scale(1.04);
  box-shadow: 0 0 calc(40 * var(--u)) rgb(0 245 98 / 0.45);
}

.audit__button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 4px;
}

.audit__track {
  display: none;
}

/* Phones: the copy stacks and the path becomes a vertical list with a track
   that fills down it. */
@media (max-width: 767px) {
  .audit {
    padding: 4.5rem 0 4.5rem;
  }

  .audit__title {
    padding-inline: 1.25rem;
    font-size: 7.4vw;
  }

  .audit__frame {
    width: 100%;
    margin-top: 3.5rem;
    padding: 0 1.25rem;
  }

  .audit__eyebrow {
    font-size: 0.68rem;
  }

  .audit__hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-top: 0.9rem;
  }

  .audit__heading {
    font-size: 11.6vw;
    -webkit-text-stroke-width: 0.45vw;
  }

  .audit__aside {
    font-size: 1rem;
    white-space: normal;
  }

  .audit__scroller {
    --u: 0.42px;
    margin: 2.75rem 0 0;
  }

  .audit__row {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    width: auto;
    height: auto;
    padding-left: 0.25rem;
  }

  .audit__links {
    display: none;
  }

  /* The track runs behind the nodes' centres (the nodes are 4.5rem wide). */
  .audit__track {
    position: absolute;
    top: 2.25rem;
    bottom: 2.25rem;
    left: calc(0.25rem + 2.25rem - 1.5px);
    display: block;
    width: 3px;
    border-radius: 3px;
    background: linear-gradient(var(--green), var(--green)) top / 100% calc(var(--progress, 0) * 100%) no-repeat, #3a3e42;
    box-shadow: 0 0 10px rgb(0 245 98 / calc(var(--progress, 0) * 0.5));
  }

  .audit__step,
  .audit__end {
    position: relative;
    left: auto !important;
    top: auto !important;
    z-index: 1;
    flex-direction: row;
    gap: 1.1rem;
  }

  .audit__step {
    justify-content: flex-start;
    width: auto;
    height: auto;
    padding: 0;
    border: 0;
    background: none;
    box-shadow: none;
  }

  .audit__step.is-lit {
    box-shadow: none;
    transform: translateX(0.25rem);
  }

  .audit__icon {
    box-sizing: content-box;
    width: 2.1rem;
    height: 2.1rem;
    padding: 1.1rem;
    border: 1.5px solid #262626;
    border-radius: 1rem;
    background: linear-gradient(160deg, #141414, #0a0a0a);
    transition: stroke 0.5s ease, filter 0.5s ease, border-color 0.5s ease;
  }

  .audit__step.is-lit .audit__icon {
    border-color: rgb(0 245 98 / 0.55);
  }

  .audit__label {
    font-size: 0.82rem;
  }

  .audit__end--start .audit__letter {
    width: 4.5rem;
    font-size: 4.2rem;
    text-align: center;
  }

  .audit__ring {
    width: 4.5rem;
    height: 4.5rem;
    border-width: 3px;
    background: #000;
  }

  .audit__letter--b {
    padding-left: 0.2rem;
    font-size: 3rem;
  }

  .audit__plan {
    margin-top: 2.5rem !important;
    padding-inline: 1.25rem;
    font-size: 1.55rem;
  }

  .audit__text {
    margin-top: 0.9rem !important;
    font-size: 0.98rem;
  }

  .audit__button {
    width: 11.5rem;
    height: 3.1rem;
    margin-top: 1.5rem;
    font-size: 1.1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .audit__step,
  .audit__icon,
  .audit__label,
  .audit__ring,
  .audit__letter,
  .audit__dot {
    transition: none;
  }

  .audit__end--target.is-lit .audit__ring {
    animation: none;
  }
}
</style>
