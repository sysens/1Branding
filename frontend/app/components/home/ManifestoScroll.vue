<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

type Segment = { key: string; accent?: boolean };

// Three statements, one screen of scroll each (jsoft.vercel.app pattern): the
// section is three screens tall and its inner screen is sticky, so scrolling
// through it swaps the statements in place while a bar at the bottom fills up.
// Each line is one gradient box, so a green word takes the colour of its
// position in the line, as in the design.
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

const root = ref<HTMLElement | null>(null);
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
  const distance = section.offsetHeight - window.innerHeight;
  const progress = distance > 0 ? clamp01(-section.getBoundingClientRect().top / distance) : 0;
  messages.forEach((message, index) => {
    const local = progress * MESSAGES.length - index;
    const shown = Math.min(ramp(local, 0, FADE), 1 - ramp(local, 1 - FADE, 1));
    message.style.opacity = String(shown);
    message.style.filter = shown >= 1 ? "none" : `blur(${((1 - shown) * BLUR_PX).toFixed(2)}px)`;
    message.style.transform = `translate3d(0, ${(SHIFT_PERCENT - clamp01(local) * 2 * SHIFT_PERCENT).toFixed(2)}%, 0)`;
  });
  if (bar.value) bar.value.style.transform = `scaleX(${progress.toFixed(4)})`;
  if (track.value) track.value.style.opacity = (1 - ramp(progress, ...BAR_FADE)).toFixed(3);
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
  <section ref="root" class="manifesto" aria-label="OneBranding">
    <div class="manifesto__screen">
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
  height: 300vh;
  background: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

.manifesto__screen {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
  overflow: hidden;
}

/* Before the script runs only the first statement shows; the script then sets
   every statement's opacity, blur and offset from the scroll position. */
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
  font-size: clamp(2rem, 1rem + 4.4 * var(--fvw), max(5rem, 9vh));
  font-weight: 600;
  line-height: 1.07;
  letter-spacing: -0.015em;
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
