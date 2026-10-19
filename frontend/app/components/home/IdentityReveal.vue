<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

type Tone = "ink" | "accent" | "muted" | "strong";
type Word = { text: string; tone: Tone; index: number };

const { t } = useI18n();

// Copy runs, in reading order. Every word of the heading and the paragraph gets
// one global index, so the whole block reveals as one stream while scrolling.
const runs = computed(() => ({
  heading: [
    [
      { key: "headingLead", tone: "ink" as Tone },
      { key: "headingAccent", tone: "accent" as Tone },
      { key: "headingRest", tone: "ink" as Tone },
    ],
    [
      { key: "headingSecond", tone: "ink" as Tone },
      { key: "headingSecondAccent", tone: "accent" as Tone },
    ],
  ],
  paragraph: [
    { key: "body", tone: "muted" as Tone },
    { key: "bodyStrong", tone: "strong" as Tone },
    { key: "bodyRest", tone: "muted" as Tone },
  ],
}));

const layout = computed(() => {
  let index = 0;
  const split = (items: { key: string; tone: Tone }[]): Word[] =>
    items.flatMap(({ key, tone }) =>
      t(`home.identity.${key}`)
        .split(/\s+/)
        .filter(Boolean)
        .map((text) => ({ text, tone, index: index++ })),
    );
  const heading = runs.value.heading.map(split);
  const paragraph = split(runs.value.paragraph);
  return { heading, paragraph, total: index };
});

const headingText = computed(() =>
  layout.value.heading.map((line) => line.map((word) => word.text).join(" ")).join(" "),
);

// jsoft.vercel.app's reveal: the section is ~4 screens tall with a sticky
// screen; scrolling through it drives --progress from 0 to 1 and the CSS turns
// each word from blurred and lowered to sharp, one after another.
const root = ref<HTMLElement | null>(null);
const screen = ref<HTMLElement | null>(null);
let frame = 0;
let stop: (() => void) | undefined;

const render = () => {
  frame = 0;
  const section = root.value;
  if (!section || !screen.value) return;
  const distance = section.offsetHeight - window.innerHeight;
  const progress = distance > 0 ? -section.getBoundingClientRect().top / distance : 1;
  screen.value.style.setProperty("--progress", Math.min(1, Math.max(0, progress)).toFixed(4));
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
  <section ref="root" class="identity">
    <div ref="screen" class="identity__screen" :style="{ '--word-total': layout.total }">
      <!-- The OneBranding wordmark drawn on its 125px grid: outlined O, I and E
           around the solid green 1, fading out towards the heading. -->
      <svg class="identity__logo" viewBox="0 0 1233 420" aria-hidden="true" focusable="false">
        <g class="identity__logo-outline">
          <path d="M0 0H375V700H0Z M125 103H250V700H125Z" />
          <path d="M438 0H563V700H438Z" />
          <path d="M857 0H1232V208H1107V103H982V262H1107V365H982V700H857Z" />
        </g>
        <path class="identity__logo-one" d="M669 0H794V700H669V103H563Z" />
      </svg>

      <h2 class="identity__heading" :aria-label="headingText">
        <span v-for="(line, lineIndex) in layout.heading" :key="lineIndex" class="identity__line" aria-hidden="true">
          <span
            v-for="(word, wordIndex) in line"
            :key="word.index"
            class="identity__word"
            :class="`identity__word--${word.tone}`"
            :style="{ '--word-index': word.index }"
          >{{ wordIndex < line.length - 1 ? `${word.text} ` : word.text }}</span>
        </span>
      </h2>

      <p class="identity__paragraph">
        <span
          v-for="(word, wordIndex) in layout.paragraph"
          :key="word.index"
          class="identity__word"
          :class="`identity__word--${word.tone}`"
          :style="{ '--word-index': word.index }"
        >{{ wordIndex < layout.paragraph.length - 1 ? `${word.text} ` : word.text }}</span>
      </p>
    </div>
  </section>
</template>

<style scoped>
/* Sizes follow the design (2000px wide): --u is one design pixel, scaled to
   the viewport width but never so large that the block (~1005 design px tall)
   outgrows the screen under the fixed header. */
.identity {
  --u: min(0.05vw, calc((100svh - 10rem) / 1005));
  position: relative;
  height: 400vh;
  background: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

.identity__screen {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  height: 100svh;
  padding: 5rem 1.5rem 2rem;
  overflow: hidden;
}

.identity__logo {
  display: block;
  flex-shrink: 0;
  width: calc(1233 * var(--u));
  height: auto;
  overflow: visible;
  -webkit-mask-image: linear-gradient(#000 25%, transparent 100%);
  mask-image: linear-gradient(#000 25%, transparent 100%);
}

.identity__logo-outline {
  fill: none;
  stroke: #bdbdbd;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.identity__logo-one {
  fill: #00eb3a;
}

.identity__heading {
  margin: calc(-20 * var(--u)) 0 0;
  color: #000;
  font-size: var(--section-title-size);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.02em;
  text-align: center;
}

.identity__line {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.identity__paragraph {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  width: min(100%, calc(1500 * var(--u)));
  margin: calc(55 * var(--u)) 0 0;
  color: #646464;
  font-size: calc(37 * var(--u));
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: -0.005em;
}

/* jsoft.vercel.app's .tw-word: word i starts at i / (total - 1) of the way
   (less one step) and takes 13% of the progress to come in. Without the script
   (no --progress) the calc is invalid and every word simply shows. Each word
   keeps its trailing space (white-space: pre) so the text reads normally. */
.identity__word {
  --word-step: 0.13;
  --word-turn: calc(var(--word-index) / (var(--word-total) - 1) * (1 - var(--word-step)));
  --word-progress: clamp(0, calc((var(--progress) - var(--word-turn)) / var(--word-step)), 1);
  display: inline-flex;
  white-space: pre;
  opacity: var(--word-progress);
  filter: blur(calc((1 - var(--word-progress)) * 10px));
  transform: translate3d(0, calc((1 - var(--word-progress)) * 0.22em), 0);
  will-change: opacity, filter, transform;
}

.identity__word--accent {
  color: #0ccc3c;
}

.identity__word--strong {
  color: #000;
  font-weight: 600;
}

@media (max-width: 767px) {
  .identity {
    height: 360vh;
  }

  .identity__screen {
    padding-inline: 1.25rem;
  }

  .identity__logo {
    width: min(78vw, 22rem);
  }

  .identity__heading {
    margin-top: -0.5rem;
    font-size: var(--section-title-size);
    line-height: 1.04;
  }

  .identity__paragraph {
    width: 100%;
    margin-top: 1.5rem;
    font-size: 0.95rem;
    line-height: 1.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .identity {
    height: auto;
  }

  .identity__screen {
    position: static;
    height: auto;
    padding-block: 4rem;
  }

  .identity__word {
    opacity: 1;
    filter: none;
    transform: none;
    will-change: auto;
  }
}
</style>
