<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

// The loader shown once, when the site is first opened (app.vue mounts once;
// moving between pages never shows it again). White page, the brand mark drawn
// in code (no image file): its outline is drawn,
// the outline fills with green, then the mark zooms in until its "1" cut-out
// is the whole screen and the page appears through it.
//
// It is in the server HTML, so the visitor never sees the page before it.
// `html.ob-loading` (set on the server, removed here) also keeps the page from
// scrolling and holds the hero's entrance animations until the loader is gone.

// The mark in a box exactly as big as the disc (so the square frame drawn
// around it touches the disc on every side): a green disc with a slanted "1"
// cut out of it. The disc's rim is open where the stem of the "1" leaves it,
// so one closed path draws both the outline and the fill. (The arc's centre,
// worked out from its end points and radius, is 1000.5, 613.7.)
const MARK_PATH = "M919 811A213.5 213.5 0 1 1 1009 827L1095 499L1006 500L904 588L1060 590L974 613Z";
const VIEW = { x: 787, y: 400.2, size: 427 };
const DISC = { cx: 1000.5, cy: 613.7, r: 213.5 };
// The "1" cut-out, as a polygon in the same units (the open bottom is a chord).
const HOLE: Array<[number, number]> = [
  [1009, 827], [1095, 499], [1006, 500], [904, 588], [1060, 590], [974, 613], [919, 811],
];
// The zoom is centred on a point inside the stem of the "1", so the cut-out grows to fill the screen.
const ORIGIN = { x: 996, y: 700 };

const TAGLINE = ["Look better", "Work smarter", "Grow stronger"];

// Timeline in ms.
const PLUS_FLY = 1100;
const BORDER = [250, 2500] as const;
const OUTLINE = [450, 2500] as const;
const WORDS_AT = [1000, 1250, 1500] as const;
const FILL = [2750, 3300] as const;
const CHROME_OUT = [3300, 3650] as const;
const ZOOM = [3500, 5300] as const;
// Once the green covers the screen, the white veil over the page thins out and
// loses its blur over this long, so the page comes into focus instead of popping in.
const REVEAL_MS = 1100;
const REVEAL_BLUR = 28;
const FAILSAFE_MS = 14000;

const active = ref(true);
const root = ref<HTMLElement | null>(null);
const bg = ref<HTMLElement | null>(null);
const frame = ref<HTMLElement | null>(null);
const chrome = ref<HTMLElement | null>(null);
const mark = ref<SVGSVGElement | null>(null);
const markFill = ref<SVGPathElement | null>(null);
const markLine = ref<SVGPathElement | null>(null);
const border = ref<SVGRectElement | null>(null);
const pluses = ref<HTMLElement[]>([]);
const wordsShown = ref(0);

if (import.meta.server) {
  useServerHead({ htmlAttrs: { class: "ob-loading" } });
}

// Taken now: the app context is gone by the time the animation finishes.
const lenis = useNuxtApp().$lenis as { start?: () => void; stop?: () => void } | undefined;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const progress = (t: number, [from, to]: readonly [number, number]) => clamp01((t - from) / (to - from));
const easeOutQuint = (p: number) => 1 - Math.pow(1 - p, 5);
const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeInOutQuad = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

const insidePolygon = (x: number, y: number) => {
  let inside = false;
  for (let i = 0, j = HOLE.length - 1; i < HOLE.length; j = i++) {
    const [xi, yi] = HOLE[i]!;
    const [xj, yj] = HOLE[j]!;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

let raf = 0;
let failsafe = 0;
let finished = false;

const finish = () => {
  if (finished) return;
  finished = true;
  cancelAnimationFrame(raf);
  clearTimeout(failsafe);
  const html = document.documentElement;
  html.classList.remove("ob-loading");
  lenis?.start?.();
  active.value = false;
  window.dispatchEvent(new CustomEvent("ob:loader-complete"));
};

onMounted(() => {
  lenis?.stop?.();
  document.documentElement.classList.add("ob-loading");
  failsafe = window.setTimeout(finish, FAILSAFE_MS);

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rootEl = root.value;
  const bgEl = bg.value;
  const markEl = mark.value;
  if (reduced || !rootEl || !bgEl || !markEl || !markFill.value || !markLine.value || !border.value) {
    // No motion: a short fade out and done.
    if (rootEl) {
      rootEl.style.transition = "opacity 0.25s ease";
      requestAnimationFrame(() => { rootEl.style.opacity = "0"; });
    }
    window.setTimeout(finish, reduced ? 280 : 0);
    return;
  }

  // Where each "+" ends up (a corner of the frame) and where it starts (a screen corner).
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const inset = 60;
  const starts = [[inset, inset], [vw - inset, inset], [inset, vh - inset], [vw - inset, vh - inset]];
  const flights = pluses.value.map((el, i) => {
    const rect = el.getBoundingClientRect();
    return {
      el,
      dx: starts[i]![0]! - (rect.left + rect.width / 2),
      dy: starts[i]![1]! - (rect.top + rect.height / 2),
      spin: i === 1 || i === 2 ? -720 : 720,
    };
  });

  // Zoom: the scale at which the disc covers the screen, then the scale at
  // which the cut-out does (every screen corner inside the "1" or outside the disc).
  const markRect = markEl.getBoundingClientRect();
  const perUnit = markRect.width / VIEW.size;
  const ox = markRect.left + ((ORIGIN.x - VIEW.x) / VIEW.size) * markRect.width;
  const oy = markRect.top + ((ORIGIN.y - VIEW.y) / VIEW.size) * markRect.height;
  const corners = [[0, 0], [vw, 0], [0, vh], [vw, vh]].map(([x, y]) => [x! - ox, y! - oy] as const);
  const cx = (DISC.cx - ORIGIN.x) * perUnit;
  const cy = (DISC.cy - ORIGIN.y) * perUnit;
  const radius = DISC.r * perUnit;
  const cover = (s: number) => corners.every(([px, py]) => Math.hypot(px - cx * s, py - cy * s) <= radius * s);
  const open = (s: number) => corners.every(([px, py]) => {
    const ux = ORIGIN.x + px / (perUnit * s);
    const uy = ORIGIN.y + py / (perUnit * s);
    return insidePolygon(ux, uy) || Math.hypot(ux - DISC.cx, uy - DISC.cy) > DISC.r;
  });
  let coverScale = 1;
  while (!cover(coverScale) && coverScale < 400) coverScale *= 1.04;
  let zoomMax = coverScale;
  while (!open(zoomMax) && zoomMax < 600) zoomMax *= 1.05;
  zoomMax *= 1.08;

  const lineEl = markLine.value;
  const fillEl = markFill.value;
  const borderEl = border.value;
  markEl.style.transformOrigin = `${((ORIGIN.x - VIEW.x) / VIEW.size) * 100}% ${((ORIGIN.y - VIEW.y) / VIEW.size) * 100}%`;
  let revealStart = -1;
  const startedAt = performance.now();

  const frameTick = (now: number) => {
    const t = now - startedAt;

    // "+" marks fly in from the screen corners, spinning, onto the frame's corners.
    const fly = easeOutQuint(clamp01(t / PLUS_FLY));
    flights.forEach(({ el, dx, dy, spin }) => {
      el.style.opacity = "1";
      el.style.transform = `translate(${dx * (1 - fly)}px, ${dy * (1 - fly)}px) rotate(${spin * (1 - fly)}deg)`;
    });

    borderEl.style.strokeDashoffset = String(1 - easeInOutCubic(progress(t, BORDER)));
    borderEl.style.opacity = t > BORDER[0] ? "1" : "0";
    lineEl.style.strokeDashoffset = String(1 - easeInOutCubic(progress(t, OUTLINE)));
    lineEl.style.opacity = t > OUTLINE[0] ? "1" : "0";

    const due = WORDS_AT.filter((at) => t >= at).length;
    if (due !== wordsShown.value) wordsShown.value = due;

    fillEl.style.opacity = String(easeOutCubic(progress(t, FILL)));

    const out = 1 - progress(t, CHROME_OUT);
    if (chrome.value) chrome.value.style.opacity = String(out);

    // The zoom: geometric (steady to the eye), slow at the start.
    const z = easeInOutCubic(progress(t, ZOOM));
    const scale = Math.pow(zoomMax, z);
    markEl.style.transform = `scale(${scale})`;
    // Once the disc covers the screen the page shows through the "1": the white
    // veil over it thins out on its own clock, blurred at first and sharpening.
    if (revealStart < 0 && scale >= coverScale * 1.02) revealStart = t;
    const reveal = revealStart < 0 ? 0 : clamp01((t - revealStart) / REVEAL_MS);
    bgEl.style.opacity = String(1 - easeInOutQuad(reveal));
    const blur = reveal > 0 ? `blur(${(REVEAL_BLUR * Math.pow(1 - reveal, 1.5)).toFixed(2)}px)` : "";
    bgEl.style.backdropFilter = blur;
    bgEl.style.setProperty("-webkit-backdrop-filter", blur);

    const end = revealStart < 0 ? ZOOM[1] : Math.max(ZOOM[1], revealStart + REVEAL_MS);
    if (t < end) raf = requestAnimationFrame(frameTick);
    else finish();
  };
  raf = requestAnimationFrame(frameTick);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  clearTimeout(failsafe);
});
</script>

<template>
  <div v-if="active" ref="root" class="ob-loader" aria-hidden="true">
    <div ref="bg" class="ob-loader__bg" />

    <div ref="chrome" class="ob-loader__chrome">
      <div ref="frame" class="ob-loader__frame">
        <svg class="ob-loader__border" aria-hidden="true">
          <rect ref="border" x="0" y="0" width="100%" height="100%" pathLength="1" />
        </svg>
        <span
          v-for="corner in ['tl', 'tr', 'bl', 'br']"
          :key="corner"
          ref="pluses"
          class="ob-loader__plus"
          :class="`is-${corner}`"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <line x1="6.5" y1="0" x2="6.5" y2="13" stroke="currentColor" />
            <line x1="0" y1="6.5" x2="13" y2="6.5" stroke="currentColor" />
          </svg>
        </span>
      </div>

      <p class="ob-loader__tagline">
        <template v-for="(word, i) in TAGLINE" :key="word">
          <span class="ob-loader__word" :class="{ 'is-in': wordsShown > i }">{{ word }}</span>
          <span v-if="i < TAGLINE.length - 1" class="ob-loader__dot" :class="{ 'is-in': wordsShown > i + 1 }">·</span>
        </template>
      </p>
    </div>

    <!-- Same box as the frame; sits on top of it so the zoom is not clipped. -->
    <div class="ob-loader__stage">
      <svg
        ref="mark"
        class="ob-loader__mark"
        :viewBox="`${VIEW.x} ${VIEW.y} ${VIEW.size} ${VIEW.size}`"
        aria-hidden="true"
      >
        <path ref="markFill" class="ob-loader__fill" :d="MARK_PATH" />
        <path ref="markLine" class="ob-loader__line" :d="MARK_PATH" pathLength="1" />
      </svg>
    </div>
  </div>
</template>

<style>
/* Global on purpose: the first rules act on the page and the <html> element. */
html.ob-loading {
  overflow: hidden;
}

/* The hero's entrance (letters, tagline, scroll hint) waits for the loader. */
html.ob-loading .hero-letter,
html.ob-loading .hero-slogan__part,
html.ob-loading .hero-scroll,
html.ob-loading .hero-scroll * {
  animation-play-state: paused !important;
}

/* A reload with a saved scroll position hides the body (nuxt.config.ts); the loader stays visible. */
html.ob-restoring .ob-loader {
  visibility: visible;
}
</style>

<style scoped>
.ob-loader {
  --ob-green: #00e600;
  --ob-size: clamp(10rem, 22vw, 17.5rem);
  /* The tagline under the frame (2.5rem gap + 0.75rem line): the stage lifts by half of it. */
  --ob-tagline-h: 3.25rem;
  position: fixed;
  inset: 0;
  z-index: 99999;
  pointer-events: all;
  /* If the script never runs, the loader still leaves. */
  animation: ob-loader-failsafe 0.01s linear 15s forwards;
}

.ob-loader__bg {
  position: absolute;
  inset: 0;
  background: #fff;
}

.ob-loader__chrome,
.ob-loader__stage {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.ob-loader__frame,
.ob-loader__mark {
  width: var(--ob-size);
  height: var(--ob-size);
}

.ob-loader__frame {
  position: relative;
}

.ob-loader__border {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.ob-loader__border rect {
  fill: none;
  stroke: #d6d6d6;
  stroke-width: 1.5;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0;
}

.ob-loader__plus {
  position: absolute;
  width: 13px;
  height: 13px;
  color: #444;
  opacity: 0;
  will-change: transform;
}

.ob-loader__plus svg {
  display: block;
}

.ob-loader__plus.is-tl { top: -6.5px; left: -6.5px; }
.ob-loader__plus.is-tr { top: -6.5px; right: -6.5px; }
.ob-loader__plus.is-bl { bottom: -6.5px; left: -6.5px; }
.ob-loader__plus.is-br { bottom: -6.5px; right: -6.5px; }

/* The stage holds the mark exactly over the frame: the chrome is centred as
   [frame + tagline], so the stage shifts up by the tagline's height. */
.ob-loader__stage {
  transform: translateY(calc(var(--ob-tagline-h, 3.25rem) / -2));
}

.ob-loader__mark {
  display: block;
  overflow: visible;
  will-change: transform;
}

.ob-loader__fill {
  fill: var(--ob-green);
  opacity: 0;
}

.ob-loader__line {
  fill: none;
  stroke: var(--ob-green);
  stroke-width: 2.4;
  stroke-linejoin: miter;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0;
}

.ob-loader__tagline {
  margin: 2.5rem 0 0;
  height: 0.75rem;
  display: flex;
  align-items: center;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  white-space: nowrap;
  color: #111;
}

.ob-loader__word {
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.ob-loader__word.is-in {
  opacity: 1;
  transform: translateY(0);
}

.ob-loader__dot {
  margin: 0 0.75rem;
  color: rgb(0 0 0 / 0.3);
  opacity: 0;
  transition: opacity 0.4s 0.15s;
}

.ob-loader__dot.is-in {
  opacity: 1;
}

@keyframes ob-loader-failsafe {
  to {
    opacity: 0;
    visibility: hidden;
  }
}
</style>
