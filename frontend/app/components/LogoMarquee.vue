<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useViewportActivity } from "~/composables/useViewportActivity";
import { optPictureHtml } from "~/utils/optImage";

type Props = {
  logos?: string[];
  rows?: number;
  durationSeconds?: number;
  linkTo?: string;
  title?: string;
  button?: string;
  showTitle?: boolean;
  showButton?: boolean;
  asBackground?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  logos: undefined,
  rows: 8,
  durationSeconds: 120,
  showTitle: false,
  showButton: false,
  asBackground: false,
});

// 400x200 thumbnails of /logoss/* (the originals are 1710x962 artwork reused by
// BrandStoriesSection), served from their AVIF/WebP copies (200 and 400 wide).
const staticLogos = [
  "/logoss/thumbs/apexpizza.webp",
  "/logoss/thumbs/artAnor.webp",
  "/logoss/thumbs/asakabank.webp",
  "/logoss/thumbs/barberra.webp",
  "/logoss/thumbs/brono.webp",
  "/logoss/thumbs/burger.webp",
  "/logoss/thumbs/chizzago.webp",
  "/logoss/thumbs/clop.webp",
  "/logoss/thumbs/cybernat.webp",
  "/logoss/thumbs/daniel.webp",
  "/logoss/thumbs/Deco.webp",
  "/logoss/thumbs/delicco.webp",
  "/logoss/thumbs/dodokids.webp",
  "/logoss/thumbs/FmFood.webp",
  "/logoss/thumbs/GlossMaxx.webp",
  "/logoss/thumbs/grechno.webp",
  "/logoss/thumbs/GreenGo.webp",
  "/logoss/thumbs/hayaati.webp",
  "/logoss/thumbs/kebabHouse.webp",
  "/logoss/thumbs/Korean.webp",
  "/logoss/thumbs/Luqmam.webp",
  "/logoss/thumbs/luxion.webp",
  "/logoss/thumbs/Makva.webp",
  "/logoss/thumbs/marinno.webp",
  "/logoss/thumbs/merhaba.webp",
  "/logoss/thumbs/milka.webp",
  "/logoss/thumbs/nescafe.webp",
  "/logoss/thumbs/OMAF.webp",
  "/logoss/thumbs/perfectCandy.webp",
  "/logoss/thumbs/perfectCandy2.webp",
  "/logoss/thumbs/Poyqadam.webp",
  "/logoss/thumbs/Rafting.webp",
  "/logoss/thumbs/Raviosta.webp",
  "/logoss/thumbs/RedBull.webp",
  "/logoss/thumbs/silvera.webp",
  "/logoss/thumbs/streetvibe.webp",
  "/logoss/thumbs/st77.webp",
  "/logoss/thumbs/texnikach.webp",
  "/logoss/thumbs/websiteONEBRANDING.webp",
  "/logoss/thumbs/wok.webp",
  "/logoss/thumbs/yana.webp",
];

const MAX_LOGOS_PER_COLUMN = 16;
const { targetRef, isActive } = useViewportActivity({ rootMargin: "300px 0px" });
// The second (loop) copy of each column is added after hydration, which keeps
// the SSR markup at one copy. A column only starts moving once its copy exists:
// at that moment a reversed column jumps to -50% of its doubled height, which
// shows exactly the tiles it showed at 0, so the hand-over is invisible. Copies
// are added one column per task, from an idle period, and only for columns the
// CSS below shows at this width: all at once was one ~200ms main-thread task.
const loopCopies = ref(0);
let adding = false;
const shownColumns = () => Array.from(targetRef.value?.querySelectorAll<HTMLElement>(".logo-marquee__col") ?? [])
  .filter((col) => getComputedStyle(col).display !== "none").length;
const addCopies = () => {
  if (adding) return;
  adding = true;
  const addNext = () => {
    if (loopCopies.value >= shownColumns()) { adding = false; return; }
    loopCopies.value += 1;
    window.setTimeout(addNext, 0);
  };
  addNext();
};
// Wide screens (1920px+) get bigger tiles over a wider and taller frame than the
// server's markup (props.rows columns of MAX_LOGOS_PER_COLUMN tiles) covers. On
// the client the background first lengthens every column to the frame's height
// (on 4K or zoomed-out windows 16 tiles end mid-screen and leave gaps), then adds
// columns until the last one starts past the right edge of the screen. The loop
// copy later doubles a column downwards, which (tilted 10deg) reaches about 18%
// of the column's height further left, hence the margin.
const WIDE_SCREEN = "(min-width: 1920px)";
const TILE_GAP = 4; // gap-[4px] between tiles
const extraColumns = ref(0);
const tilesPerColumn = ref(MAX_LOGOS_PER_COLUMN);
let filling = false;
const fitColumnLength = async () => {
  const frame = targetRef.value?.querySelector<HTMLElement>(".logo-marquee__frame > div");
  const tile = targetRef.value?.querySelector<HTMLElement>(".logo-marquee__tile");
  if (!frame || !tile) return;
  const needed = Math.ceil(frame.offsetHeight / (tile.offsetHeight + TILE_GAP)) + 2;
  if (needed <= tilesPerColumn.value) return;
  tilesPerColumn.value = needed;
  await nextTick();
};
const fillWideScreen = async () => {
  if (!props.asBackground || filling || !window.matchMedia(WIDE_SCREEN).matches) return;
  filling = true;
  try {
    await fitColumnLength();
    for (let guard = 0; guard < 40; guard++) {
      const columns = targetRef.value?.querySelectorAll<HTMLElement>(".logo-marquee__col");
      const last = columns?.[columns.length - 1];
      if (!last) break;
      const rect = last.getBoundingClientRect();
      if (rect.left > window.innerWidth + rect.height * 0.18) break;
      extraColumns.value += 1;
      await nextTick();
    }
  } finally {
    filling = false;
  }
};
const fillAndLoop = async () => {
  await fillWideScreen();
  addCopies();
};
// A wider window can reveal more columns; they get their copy then.
const onResize = () => { void fillAndLoop(); };
onMounted(() => {
  const start = () => { void fillAndLoop(); };
  if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 1500 });
  else globalThis.setTimeout(start, 200);
  window.addEventListener("resize", onResize, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("resize", onResize));

// Hero background only, with a mouse or trackpad: the wall leans a little
// towards the pointer (the whole tilted track turns in 3D, so the tiles seem
// to tip). The pointer is eased in a rAF loop that runs only while it is
// catching up, and nothing is listened to while the hero is off screen or
// motion is reduced.
const tilt = ref<HTMLElement | null>(null);
let stopPointer: (() => void) | undefined;
onMounted(() => {
  const wall = targetRef.value;
  const layer = tilt.value;
  if (!props.asBackground || !wall || !layer) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const target = { x: 0.5, y: 0.5 };
  const now = { x: 0.5, y: 0.5 };
  let frame = 0;
  const paint = () => {
    frame = 0;
    now.x += (target.x - now.x) * 0.08;
    now.y += (target.y - now.y) * 0.08;
    const dx = now.x - 0.5;
    const dy = now.y - 0.5;
    layer.style.setProperty("--wall-rx", `${(-dy * 5).toFixed(3)}deg`);
    layer.style.setProperty("--wall-ry", `${(dx * 6).toFixed(3)}deg`);
    layer.style.setProperty("--wall-tx", `${(-dx * 1.75).toFixed(3)}rem`);
    layer.style.setProperty("--wall-ty", `${(-dy * 1.25).toFixed(3)}rem`);
    const settled = Math.abs(target.x - now.x) + Math.abs(target.y - now.y) < 0.001;
    if (!settled) frame = requestAnimationFrame(paint);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };
  const onMove = (event: PointerEvent) => {
    if (!isActive.value || event.pointerType !== "mouse") return;
    const box = wall.getBoundingClientRect();
    // Below or above the hero the wall settles back flat.
    const inside = event.clientY <= box.bottom && event.clientY >= box.top;
    target.x = inside ? (event.clientX - box.left) / box.width : 0.5;
    target.y = inside ? (event.clientY - box.top) / box.height : 0.5;
    schedule();
  };
  const onLeave = () => {
    target.x = 0.5;
    target.y = 0.5;
    schedule();
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  window.addEventListener("blur", onLeave);
  stopPointer = () => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("blur", onLeave);
  };
});
onBeforeUnmount(() => stopPointer?.());

const baseLogos = computed(() => (props.logos?.length ? props.logos : staticLogos));
const marqueeDuration = computed(() => `${props.durationSeconds}s`);

// Drawn tile width: 100px on phones and 200px from md (up to 400px on 1920px+
// screens), times the frame's scale (1.4, md:1.25).
const TILE_SIZES = "(min-width: 1920px) 500px, (min-width: 768px) 250px, 140px";

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffledForColumn = (logos: readonly string[], colIdx: number, count: number) => {
  const rand = mulberry32(123456 + colIdx * 99991);
  const arr = [...logos];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  // Columns longer than the logo list repeat it in the same shuffled order.
  return Array.from({ length: count }, (_, i) => arr[i % arr.length]!);
};

// The tiles are static, decorative markup, so each column is one HTML string
// (v-html): hydration does not walk the ~500 tile elements, and the loop copy is
// created by the browser's HTML parser instead of Vue. optPictureHtml escapes
// the URL; CMS logos without build-time copies stay a plain <img>.
const tileHtml = (src: string) =>
  `<div class="logo-marquee__tile">${optPictureHtml(src, TILE_SIZES, `class="logo-marquee__img" alt="" width="200" height="100" loading="lazy" decoding="async" fetchpriority="low" draggable="false"`)}</div>`;

const columnsConfig = computed(() => {
  const total = Math.max(0, Number(props.rows) || 0) + extraColumns.value;
  const logos = baseLogos.value;

  return Array.from({ length: total }, (_, idx) => ({
    idx,
    key: `col-${idx}`,
    html: shuffledForColumn(logos, idx, tilesPerColumn.value).map(tileHtml).join(""),
    isReverse: idx % 2 === 1,
    withLink: !props.asBackground && idx === 0,
  }));
});

const rootClass = computed(() =>
  props.asBackground
    ? "logo-marquee--background relative w-full h-full min-h-[900px] overflow-hidden"
    : "relative z-10 bg-black w-full overflow-hidden flex items-center justify-center"
);

// md:scale-[1.25] (was 1.3): at 1.3 a tilted desktop tile (48,250 px2) was a
// hair larger than the hero's biggest text (47,511 px2), so a lazily loaded
// tile, not the text painted with the HTML, became the Largest Contentful Paint.
const innerWrapClass = computed(() =>
  props.asBackground
    ? "logo-marquee__frame absolute inset-0 bottom-[-90px] md:-top-0 w-[160%] md:-left-[2%] md:scale-[1.25] scale-[1.4]"
    : "w-full h-full flex justify-center"
);

const trackClass = computed(() =>
  props.asBackground
    ? "flex h-[140%] items-start"
    : "flex h-[900px] items-start justify-center"
);

const colPadClass = computed(() => (props.asBackground ? "py-[2px]" : "py-[1px]"));
const colGapClass = computed(() => (props.asBackground ? "gap-[4px]" : "gap-[2px]"));
const colsGapClass = computed(() => (props.asBackground ? "gap-[4px]" : "gap-[2px]"));
</script>

<template>
  <section
    ref="targetRef"
    class="logo-marquee"
    :class="[rootClass, { 'logo-marquee--paused': !isActive }]"
    :aria-hidden="props.asBackground ? 'true' : undefined"
  >
    <div ref="tilt" :class="props.asBackground ? 'logo-marquee__tilt' : 'contents'">
    <div :class="innerWrapClass">
      <div class="w-full h-full rotate-[10deg] overflow-hidden">
        <div :class="[trackClass, colsGapClass]">
          <div
            v-for="col in columnsConfig"
            :key="col.key"
            class="logo-marquee__col flex flex-col h-max"
            :class="[col.isReverse ? 'logo-marquee__col--up' : 'logo-marquee__col--down', { 'is-looping': col.idx < loopCopies }]"
            :style="{ '--marquee-duration': marqueeDuration }"
          >
            <template v-for="copy in (col.idx < loopCopies ? 2 : 1)" :key="copy">
              <NuxtLink v-if="col.withLink" :to="props.linkTo" :aria-hidden="copy === 2 ? 'true' : undefined">
                <div class="flex flex-col items-center" :class="[colGapClass, colPadClass]" v-html="col.html" />
              </NuxtLink>
              <div
                v-else
                class="flex flex-col items-center"
                :class="[colGapClass, colPadClass]"
                :aria-hidden="copy === 2 ? 'true' : undefined"
                v-html="col.html"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
    </div>
  </section>
</template>

<!-- Not scoped: a scope attribute on each of the ~500 tiles would add ~15 KB to
     the home page HTML, so the classes are namespaced instead. -->
<style>
.logo-marquee__tile {
  position: relative;
  flex-shrink: 0;
  width: 6.25rem;
  height: 3.125rem;
  overflow: hidden;
  border-radius: 0.5rem;
  user-select: none;
  pointer-events: none;
}

.logo-marquee__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  pointer-events: none;
}

@media (min-width: 768px) {
  .logo-marquee__tile {
    width: 12.5rem;
    height: 6.25rem;
    border-radius: 0.625rem;
  }
}

.logo-marquee__col.is-looping {
  will-change: transform;
}

.logo-marquee__col--down.is-looping {
  animation: logo-marquee-scroll var(--marquee-duration) linear infinite;
}

.logo-marquee__col--up.is-looping {
  animation: logo-marquee-scroll var(--marquee-duration) linear infinite reverse;
}

.logo-marquee--paused .logo-marquee__col {
  animation-play-state: paused;
}

@keyframes logo-marquee-scroll {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-50%);
  }
}

/* Hero background: the tilted, scaled track is about twice as wide as the
   screen, so columns that never cross the viewport (measured at every point of
   the animation, plus a spare) are skipped: no layout, paint or image requests
   for them. */
@media (max-width: 479px) {
  .logo-marquee--background .logo-marquee__col:nth-child(n + 8) { display: none; }
}

@media (min-width: 480px) and (max-width: 767px) {
  .logo-marquee--background .logo-marquee__col:nth-child(n + 10) { display: none; }
}

@media (min-width: 768px) and (max-width: 1279px) {
  .logo-marquee--background .logo-marquee__col:nth-child(n + 9) { display: none; }
}

@media (min-width: 1280px) and (max-width: 1919px) {
  .logo-marquee--background .logo-marquee__col:nth-child(n + 12) { display: none; }
}

/* Wide and ultra-wide screens (1920px+): tiles grow with the shorter side of the
   screen (200px at 1920x1080, ~266px on 1440px-tall ultra-wides, 400px on 4K)
   so the wall keeps its density, and the frame is taller so the tilted track
   still reaches the bottom-left and top-right corners of a very wide hero. The
   column count is topped up on the client (fillWideScreen). */
@media (min-width: 1920px) {
  .logo-marquee--background .logo-marquee__tile {
    width: clamp(12.5rem, min(10.42vw, 18.52vh), 25rem);
    height: auto;
    aspect-ratio: 2 / 1;
  }

  .logo-marquee--background .logo-marquee__frame {
    top: -12vw;
    bottom: calc(-90px - 12vw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo-marquee__col {
    animation: none !important;
  }
}

/* The hero wall's lean towards the pointer (set from the pointer in JS; at
   rest it is flat). */
.logo-marquee__tilt {
  position: absolute;
  inset: 0;
  transform: perspective(100rem) rotateX(var(--wall-rx, 0deg)) rotateY(var(--wall-ry, 0deg)) translate3d(var(--wall-tx, 0rem), var(--wall-ty, 0rem), 0);
  transform-origin: 50% 60%;
}
</style>
