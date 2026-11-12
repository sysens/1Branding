<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

// The figures under the globe (2500+ / 10+ / 25+ / Everything - OneSystem.),
// pinned and taken one after another with jsoft.vercel.app's "Biz kelajakni
// kodlaymiz" letter wave: each character comes in from double size, blurred and
// transparent, holds, then leaves the same way, the wave running left to right.
// JS only moves one number per statement (--slice); the letters work out their
// own state in CSS, as on jsoft.

type Segment = { text: string; accent?: boolean };
type Line = { kind: "value" | "label" | "closing"; segments: Segment[] };
type Char = { char: string; index: number; accent: boolean };
type Word = { key: string; chars: Char[] };

const { t } = useI18n();

const statements = computed(() => {
  const source: Line[][] = [
    [{ kind: "value", segments: [{ text: t("home.stats.brandsValue"), accent: true }] }, { kind: "label", segments: [{ text: t("home.stats.brandsLabel") }] }],
    [{ kind: "value", segments: [{ text: t("home.stats.yearsValue"), accent: true }] }, { kind: "label", segments: [{ text: t("home.stats.yearsLabel") }] }],
    [{ kind: "value", segments: [{ text: t("home.stats.servicesValue"), accent: true }] }, { kind: "label", segments: [{ text: t("home.stats.servicesLabel") }] }],
    [{ kind: "closing", segments: [
      { text: t("home.stats.closingBefore") },
      { text: t("home.stats.closingAccent"), accent: true },
      { text: t("home.stats.closingAfter") },
    ] }],
  ];
  // Characters are numbered across the whole statement, spaces and line
  // breaks included, like jsoft's --char-index.
  return source.map((lines) => {
    let index = 0;
    const built = lines.map((line, lineIndex) => {
      if (lineIndex > 0) index++;
      const words: Word[] = [];
      let word: Char[] = [];
      line.segments.forEach((segment) => {
        for (const char of segment.text) {
          if (char === " ") {
            if (word.length) words.push({ key: `${lineIndex}-${index}`, chars: word });
            word = [];
          } else {
            word.push({ char, index, accent: Boolean(segment.accent) });
          }
          index++;
        }
      });
      if (word.length) words.push({ key: `${lineIndex}-${index}`, chars: word });
      return { kind: line.kind, words };
    });
    const text = lines.map((line) => line.segments.map((segment) => segment.text).join("")).join(" ");
    // The closing line is the brand's English slogan in every language.
    const lang = lines[0]?.kind === "closing" ? "en" : undefined;
    return { lines: built, total: index, text, lang };
  });
});
const LAST = 3;

// Scroll timeline (fractions of the section's scroll): each statement builds,
// holds and leaves; the last one builds and stays.
const STARTS = [0, 0.23, 0.46, 0.69];
const BUILD = 0.085;
const HOLD = 0.07;
const LEAVE = 0.085;
// The wave starts once the screen pins, so the first figure builds in place
// like the others instead of while it is still scrolling up into view.
const LEAD = 0;

const sliceAt = (progress: number, index: number) => {
  const time = progress - STARTS[index]!;
  if (time <= 0) return 0;
  if (time < BUILD) return time / BUILD / 3;
  if (index === LAST || time < BUILD + HOLD) return 1 / 3;
  return Math.min(2 / 3, 1 / 3 + (time - BUILD - HOLD) / LEAVE / 3);
};

const root = ref<HTMLElement | null>(null);
const screen = ref<HTMLElement | null>(null);
let frame = 0;
let stop: (() => void) | undefined;

const render = () => {
  frame = 0;
  const section = root.value;
  if (!section) return;
  // The pinned screen's own height (100svh), not window.innerHeight: on a
  // phone that one changes as the browser's bars come and go, and the wave
  // jumped with it.
  const view = screen.value?.offsetHeight ?? window.innerHeight;
  const lead = view * LEAD;
  const distance = section.offsetHeight - view + lead;
  const progress = Math.min(1, Math.max(0, (lead - section.getBoundingClientRect().top) / distance));
  section.querySelectorAll<HTMLElement>("[data-statement]").forEach((statement) => {
    const slice = sliceAt(progress, Number(statement.dataset.statement));
    statement.style.setProperty("--slice", slice.toFixed(4));
    statement.style.visibility = slice > 0 && slice < 2 / 3 ? "visible" : "hidden";
  });
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
  <section ref="root" class="stats">
    <div ref="screen" class="stats__screen">
      <p
        v-for="(statement, index) in statements"
        :key="index"
        class="stats__statement"
        :data-statement="index"
        :style="{ '--n': statement.total }"
      >
        <span class="sr-only" :lang="statement.lang">{{ statement.text }}</span>
        <span
          v-for="(line, lineIndex) in statement.lines"
          :key="lineIndex"
          class="stats__line"
          :class="`stats__line--${line.kind}`"
          aria-hidden="true"
        >
          <template v-for="(word, wordIndex) in line.words" :key="word.key">
            <span class="stats__word"><span
              v-for="char in word.chars"
              :key="char.index"
              class="stats__char"
              :class="{ 'stats__char--accent': char.accent }"
              :style="{ '--i': char.index }"
            >{{ char.char }}</span></span>{{ wordIndex < line.words.length - 1 ? " " : "" }}
          </template>
        </span>
      </p>
    </div>
  </section>
</template>

<style scoped>
.stats {
  position: relative;
  height: 440vh;
  background: #000;
  color: #fff;
}

.stats__screen {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
  overflow: hidden;
}

/* All statements share the middle of the screen; only one is on at a time. */
.stats__statement {
  --slice: 0;
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 4.5rem 1.25rem 0;
  text-align: center;
  visibility: hidden;
}

/* Without JS the closing line is what shows. */
.stats__statement[data-statement="3"] {
  --slice: 0.3333;
  visibility: visible;
}

.stats__line {
  display: block;
  max-width: 100%;
  font-family: var(--app-font-display);
  text-wrap: balance;
}

/* A fitted composition, sized as designed (value 180, label 50, closing 65
   cap heights on the 2000px frame) and capped by the screen's height so a
   statement fits one screen; its faces and tracking are those of the
   display-xl, h2 and h1 steps. Each letter of the wave (.stats__char) takes
   its line's size, tracking and the blur in em, so the animation scales. */
.stats__line--value {
  font-size: min(max(calc(14.7 * var(--fvw)), 5.5rem), 30vh);
  font-weight: 700;
  line-height: var(--type-display-xl-lh);
  letter-spacing: var(--type-display-xl-ls);
}

.stats__line--label {
  margin-top: 0.12em;
  font-size: min(max(calc(4.1 * var(--fvw)), 1.45rem), 8.3vh);
  font-weight: 600;
  line-height: var(--type-h2-lh);
  letter-spacing: var(--type-h2-ls);
}

.stats__line--closing {
  font-size: min(max(calc(5.3 * var(--fvw)), 2rem), 10.8vh);
  font-weight: 600;
  line-height: var(--type-h1-lh);
  letter-spacing: var(--type-h1-ls);
}

.stats__word {
  display: inline-flex;
  white-space: nowrap;
}

/* jsoft's letter: --i of --n along the statement, --slice from 0 to 2/3. */
.stats__char {
  --local: calc(2 * var(--slice) - var(--i) / (3 * var(--n)));
  --wave: min(calc(var(--local) * 3), calc((1 - var(--local)) * 3));
  display: inline-block;
  opacity: clamp(0, var(--wave), 1);
  filter: blur(clamp(0px, calc((1 - var(--wave)) * 0.15em), 0.5em));
  scale: calc(2 - clamp(0, var(--wave), 1));
  will-change: opacity, filter, scale;
}

.stats__char--accent {
  background: linear-gradient(180deg, #00e429 18%, #00b92f 55%, #009a32 88%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .stats {
    height: auto;
    padding-block: 6rem;
  }

  .stats__screen {
    position: static;
    height: auto;
    display: flex;
    flex-direction: column;
    gap: 5rem;
  }

  .stats__statement,
  .stats__statement[data-statement="3"] {
    --slice: 0.3333;
    position: static;
    padding: 0 1.25rem;
    visibility: visible;
  }

  .stats__char {
    will-change: auto;
  }
}
</style>
