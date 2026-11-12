<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { revealTo } from "~/utils/reveal";

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
// screen, and scrolling through it brings the words in one after another. The
// scroll only cues each word (word i between FIRST_CUE and LAST_CUE); the word
// then comes in on its own, timed animation (utils/reveal.ts), so it is smooth
// however fast or slow the page is scrolled, and goes again when scrolled back.
// The first word waits for the pinned scroll to begin: at 0 it showed alone
// all the while the section was still coming up the screen.
const FIRST_CUE = 0.015;
const LAST_CUE = 0.85;
const root = ref<HTMLElement | null>(null);
const screen = ref<HTMLElement | null>(null);
let words: HTMLElement[] = [];
let frame = 0;
let stop: (() => void) | undefined;

const render = () => {
  frame = 0;
  const section = root.value;
  if (!section || !words.length) return;
  // Pinned for the section's height less the screen's own (100svh), not less
  // window.innerHeight: on a phone that one changes as the browser's bars come
  // and go, and the cues moved with it.
  const distance = section.offsetHeight - (screen.value?.offsetHeight ?? window.innerHeight);
  const progress = distance > 0 ? Math.min(1, Math.max(0, -section.getBoundingClientRect().top / distance)) : 1;
  const last = Math.max(1, words.length - 1);
  // Words cued in the same frame (a fast scroll) still follow one another.
  let batch = 0;
  words.forEach((word, index) => {
    const shown = progress >= FIRST_CUE + (index / last) * (LAST_CUE - FIRST_CUE);
    const was = word.hasAttribute("data-revealed");
    revealTo(word, shown, shown && !was ? Math.min(batch++, 15) * 40 : 0, { sweep: false });
  });
};

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(render);
};

// A phone's browser leaves 550-750px of height, and the wordmark, the heading
// and some eighty words do not always fit that under the header: the block was
// centred up behind the header and its last lines were cut off at the bottom.
// On a phone it is fitted to the screen instead: the wordmark, which is
// decoration, gives way first (smaller by --logo-fit, then gone); then the
// type steps down until the text fits (the CSS scales it by --fit). The
// screen is 100svh, so the browser's bars coming and going do not change the
// answer.
const LOGO_STEPS = [0.85, 0.7];
const FIT_STEPS = [1, 0.96, 0.92, 0.88, 0.84, 0.8, 0.76];
let fitted = "";
const fit = () => {
  const element = screen.value;
  if (!element) return;
  const key = `${element.clientWidth}x${element.clientHeight}`;
  if (key === fitted) return;
  fitted = key;
  element.classList.remove("identity__screen--bare");
  element.style.removeProperty("--fit");
  element.style.removeProperty("--logo-fit");
  if (!window.matchMedia("(max-width: 767px)").matches) return;
  const fits = () => element.scrollHeight <= element.clientHeight + 1;
  if (fits()) return;
  for (const step of LOGO_STEPS) {
    element.style.setProperty("--logo-fit", String(step));
    if (fits()) return;
  }
  element.style.removeProperty("--logo-fit");
  element.classList.add("identity__screen--bare");
  for (const step of FIT_STEPS) {
    element.style.setProperty("--fit", String(step));
    if (fits()) return;
  }
};
const refit = () => {
  fit();
  schedule();
};

onMounted(() => {
  words = Array.from(screen.value?.querySelectorAll<HTMLElement>(".identity__word") ?? []);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  fit();
  // The web font's lines break differently from the fallback's.
  void document.fonts?.ready.then(() => {
    fitted = "";
    fit();
  });
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", refit, { passive: true });
  stop = () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", refit);
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
    <div ref="screen" class="identity__screen">
      <!-- The OneBranding wordmark drawn on its 125px grid: outlined O, I and E
           around the solid green 1, fading out towards the heading. -->
      <svg v-rise class="identity__logo" viewBox="0 0 1233 420" aria-hidden="true" focusable="false">
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
            data-blur-reveal="manual"
          >{{ wordIndex < line.length - 1 ? `${word.text} ` : word.text }}</span>
        </span>
      </h2>

      <p class="identity__paragraph">
        <span
          v-for="(word, wordIndex) in layout.paragraph"
          :key="word.index"
          class="identity__word"
          :class="`identity__word--${word.tone}`"
          data-blur-reveal="manual"
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
  --u: min(calc(0.05 * var(--fvw)), calc((100svh - 10rem) / 1005));
  position: relative;
  height: 400vh;
  background: #fff;
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

/* The section heading: the h1 step (the landing's --section-title-size). */
.identity__heading {
  margin: calc(-20 * var(--u)) 0 0;
  color: #000;
  font-family: var(--app-font-display);
  font-size: var(--section-title-size);
  font-weight: 600;
  line-height: var(--type-h1-lh);
  letter-spacing: var(--type-h1-ls);
  text-align: center;
}

.identity__line {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

/* Running text (~500 characters): the intro step, centred in a column of its
   measure (1500 design px) that stays centred under the heading. The words are
   flex items (each rises into place on its own), so the lines are centred with
   justify-content rather than text-align. */
.identity__paragraph {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  width: min(100%, var(--type-measure-intro));
  margin: calc(55 * var(--u)) 0 0;
  color: #646464;
  font-family: var(--type-intro-family);
  font-size: var(--type-description-size);
  font-weight: 400;
  line-height: var(--type-intro-lh);
  letter-spacing: var(--type-intro-ls);
}

/* A word is its own box (inline-flex) so it can rise into place; it keeps its
   trailing space (white-space: pre) so the text reads normally. Its hidden
   state and reveal are the shared ones ([data-blur-reveal], utils/reveal.ts). */
.identity__word {
  display: inline-flex;
  white-space: pre;
}

/* The brand green of the design. */
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

  /* Under the header (6.75rem), never centred up behind it; the script fits
     the block to what is left (see fit). */
  .identity__screen {
    justify-content: safe center;
    padding: 6.75rem 1.25rem 1.5rem;
  }

  .identity__logo {
    width: calc(min(78vw, 22rem) * var(--logo-fit, 1));
  }

  .identity__heading {
    margin-top: -0.5rem;
    font-size: calc(var(--section-title-size) * var(--fit, 1));
  }

  .identity__paragraph {
    width: 100%;
    margin-top: calc(1.5rem * var(--fit, 1));
    font-size: calc(var(--type-description-size) * var(--fit, 1));
  }

  /* Too short for the wordmark: the text takes the room. */
  .identity__screen--bare .identity__logo {
    display: none;
  }

  .identity__screen--bare .identity__heading {
    margin-top: 0;
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
