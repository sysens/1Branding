<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

type Segment = { key: string; accent?: boolean };

// Three statements, one screen of scroll each (jsoft.vercel.app pattern): the
// section is three screens tall and its inner screen is sticky, so scrolling
// through it swaps the statements in place while a bar at the bottom fills up.
// The last one ("we build brands that…") settles in the middle. `hold` keeps
// the screen pinned for that many more screens of scroll, over which it
// slowly dissolves: the statement blurs and the whole screen, its white too,
// turns transparent, showing what is pinned behind it
// (SatisfiedClientsSection), between DISSOLVE's two points of that scroll.
// Each line is one gradient box, so a green word takes the colour of its
// position in the line, as in the design.
const props = withDefaults(defineProps<{ hold?: number }>(), { hold: 0 });
const MESSAGES: Segment[][][] = [
  [[{ key: "m1Line1" }], [{ key: "m1Line2" }, { key: "m1Line2Accent", accent: true }]],
  [[{ key: "m2Line1" }], [{ key: "m2Line2", accent: true }]],
  [[{ key: "m3Line1", accent: true }], [{ key: "m3Line2" }]],
];

// Share of a statement's slice of the scroll spent fading in (and out again),
// its blur at the edges of that slice and how far it travels across it (% of
// the screen height): the reference's values.
const FADE = 0.3;
const BLUR_PX = 10;
const SHIFT_PERCENT = 14;
// The bar fades out near the end of the scroll: it is gone before the tilted
// collage below (whose raised corner shows a little early) comes into view.
const BAR_FADE: [number, number] = [0.85, 0.95];
// Shares of the held scroll over which the screen dissolves (eased); the
// collage behind comes forward over the same stretch.
const DISSOLVE: [number, number] = [0.05, 0.85];

const root = ref<HTMLElement | null>(null);
const screen = ref<HTMLElement | null>(null);
const bar = ref<HTMLElement | null>(null);
const track = ref<HTMLElement | null>(null);
let messages: HTMLElement[] = [];
let frame = 0;
let stop: (() => void) | undefined;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const ramp = (value: number, from: number, to: number) => clamp01((value - from) / (to - from));

const render = () => {
  frame = 0;
  const section = root.value;
  if (!section) return;
  // The statements play over the scroll before the held screens.
  const distance = section.offsetHeight - window.innerHeight * (1 + props.hold);
  const scrolled = -section.getBoundingClientRect().top;
  const progress = distance > 0 ? clamp01(scrolled / distance) : 0;
  const held = props.hold > 0 ? clamp01((scrolled - distance) / (window.innerHeight * props.hold)) : 0;
  const t = ramp(held, ...DISSOLVE);
  const gone = t * t * (3 - 2 * t);
  messages.forEach((message, index) => {
    const local = progress * MESSAGES.length - index;
    const last = index === MESSAGES.length - 1;
    // The last statement fades in and rises to the middle, then stays.
    const shown = last ? ramp(local, 0, FADE) : Math.min(ramp(local, 0, FADE), 1 - ramp(local, 1 - FADE, 1));
    const travel = last ? Math.min(clamp01(local), 0.5) : clamp01(local);
    const blur = (1 - shown) * BLUR_PX + (last ? gone * BLUR_PX : 0);
    message.style.opacity = String(shown);
    message.style.filter = blur > 0 ? `blur(${blur.toFixed(2)}px)` : "none";
    message.style.transform = `translate3d(0, ${(SHIFT_PERCENT - travel * 2 * SHIFT_PERCENT).toFixed(2)}%, 0)`;
  });
  if (bar.value) bar.value.style.transform = `scaleX(${progress.toFixed(4)})`;
  if (track.value) track.value.style.opacity = (1 - ramp(progress, ...BAR_FADE)).toFixed(3);
  if (screen.value) {
    screen.value.style.opacity = gone > 0 ? (1 - gone).toFixed(3) : "";
    // Dissolving, it lets clicks through to what it uncovers.
    screen.value.style.pointerEvents = gone > 0 ? "none" : "";
  }
};

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(render);
};

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  messages = Array.from(root.value?.querySelectorAll<HTMLElement>(".manifesto__message") ?? []);
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
  <section
    ref="root"
    class="manifesto"
    :class="{ 'manifesto--hold': hold > 0 }"
    aria-label="OneBranding"
    :style="{ '--hold': hold }"
  >
    <div ref="screen" class="manifesto__screen">
      <p
        v-for="(lines, index) in MESSAGES"
        :key="index"
        class="manifesto__message"
      >
        <span v-for="(line, lineIndex) in lines" :key="lineIndex" class="manifesto__line">
          <template v-for="(segment, segmentIndex) in line" :key="segment.key">
            {{ segmentIndex ? " " : "" }}<span :class="{ 'manifesto__ink': !segment.accent }">{{ $t(`home.manifesto.${segment.key}`) }}</span>
          </template>
        </span>
      </p>

      <div ref="track" class="manifesto__progress" aria-hidden="true">
        <div ref="bar" class="manifesto__progress-fill" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.manifesto {
  position: relative;
  height: calc((3 + var(--hold, 0)) * 100vh);
  background: #fff;
}

/* Held, the white is the screen's own, so it dissolves with the screen and
   the section around it lets what lies behind show. */
.manifesto--hold {
  background: transparent;
}

.manifesto__screen {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
  overflow: hidden;
  background: #fff;
}

/* Before the script runs only the first statement shows; the script then sets
   every statement's opacity, blur and offset from the scroll position. The
   statements are the h1 step. */
.manifesto__message {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding-inline: 1.5rem;
  color: #000;
  font-family: var(--app-font-display);
  font-size: var(--type-h1-size);
  font-weight: 600;
  line-height: var(--type-h1-lh);
  letter-spacing: var(--type-h1-ls);
  text-align: center;
  will-change: opacity, filter, transform;
}

.manifesto__message + .manifesto__message {
  opacity: 0;
}

.manifesto__line {
  display: block;
  width: fit-content;
  max-width: 100%;
  text-wrap: balance;
  /* A block's background covers its line box only: with this tight
     line-height the descenders (g, y, q) fall outside it and, clipped to the
     text, go unpainted. Pad the paint box down to them; the negative margin
     keeps the layout. */
  padding-bottom: 0.15em;
  margin-bottom: -0.15em;
  background: linear-gradient(90deg, #009c30, #00d82a);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.manifesto__ink {
  -webkit-text-fill-color: #000;
  color: #000;
}

.manifesto__progress {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  width: 10rem;
  height: 1px;
  overflow: hidden;
  background: rgb(0 0 0 / 0.08);
  transform: translateX(-50%);
}

.manifesto__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #009c30, #00d82a);
  transform: scaleX(0);
  transform-origin: left;
}

/* No scroll-driven motion: the statements simply follow one another. */
@media (prefers-reduced-motion: reduce) {
  .manifesto {
    height: auto;
    padding-block: 6rem;
  }

  .manifesto__screen {
    position: static;
    height: auto;
    display: grid;
    gap: 4rem;
  }

  .manifesto__message,
  .manifesto__message + .manifesto__message {
    position: static;
    opacity: 1;
    will-change: auto;
  }

  .manifesto__progress {
    display: none;
  }
}
</style>
