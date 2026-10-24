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
const pin = ref<HTMLElement | null>(null);
const screen = ref<HTMLElement | null>(null);
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
  // Desktop: the block is pinned (sticky at the top) and the path lights up as
  // the page scrolls through the pin, finishing a little before it lets go.
  // Phones stack the path vertically and do not pin: it lights as the reading
  // line (70% down the screen) passes down the list.
  const pinned = pin.value && screen.value && getComputedStyle(screen.value).position === "sticky";
  let progress: number;
  if (pinned) {
    const distance = pin.value!.offsetHeight - screen.value!.offsetHeight;
    progress = distance > 0 ? clamp01(-pin.value!.getBoundingClientRect().top / distance / 0.85) : 1;
  } else {
    progress = clamp01((window.innerHeight * 0.7 - rect.top) / rect.height);
  }
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
  <section id="audit" class="audit" aria-labelledby="audit-title">
    <p class="audit__title">{{ t("home.audit.eyebrow") }}</p>

    <!-- The path lights up while this block is pinned to the screen. -->
    <div ref="pin" class="audit__pin">
    <div ref="screen" class="audit__screen">
    <div class="audit__frame">
      <p v-rise class="audit__eyebrow">{{ t("home.audit.eyebrow") }}</p>
      <div class="audit__hero">
        <h2 id="audit-title" class="audit__heading">
          <span v-blur-reveal>{{ `${t("home.audit.lineFirst")} ` }}</span>
          <span v-blur-reveal class="audit__green">{{ t("home.audit.lineSecond") }}</span>
        </h2>
        <p v-rise class="audit__aside">
          <span>{{ `${t("home.audit.asideFirst")} ` }}</span>
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

    <p v-blur-reveal class="audit__plan">
      <span class="audit__green">{{ t("home.audit.planAccent") }}</span> {{ t("home.audit.planRest") }}
    </p>
    <p v-rise class="audit__text">{{ t("home.audit.text") }}</p>
    <NuxtLink v-rise :to="localePath('/contact')" class="audit__button ob-button">
      {{ t("home.audit.cta") }}
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8" /></svg>
    </NuxtLink>
    </div>
    </div>
  </section>
</template>

<style scoped src="./AuditStrategy.css"></style>
