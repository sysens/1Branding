<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useViewportActivity } from "~/composables/useViewportActivity";

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
// BrandStoriesSection); tiles render at 200x100 CSS px.
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
// A wider window can reveal more columns; they get their copy then.
const onResize = () => addCopies();
onMounted(() => {
  if ("requestIdleCallback" in window) window.requestIdleCallback(addCopies, { timeout: 1500 });
  else window.setTimeout(addCopies, 200);
  window.addEventListener("resize", onResize, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("resize", onResize));

const baseLogos = computed(() => (props.logos?.length ? props.logos : staticLogos));
const marqueeDuration = computed(() => `${props.durationSeconds}s`);

// 200x100 copies of the bundled thumbnails for the 100px mobile tiles.
const THUMB_DIR = "/logoss/thumbs/";
const tileSrcset = (src: string) =>
  src.startsWith(THUMB_DIR)
    ? `${src.replace(THUMB_DIR, "/logoss/thumbs-sm/")} 200w, ${src} 400w`
    : undefined;

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffledForColumn = (logos: readonly string[], colIdx: number) => {
  const rand = mulberry32(123456 + colIdx * 99991);
  const arr = [...logos];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr.slice(0, MAX_LOGOS_PER_COLUMN);
};

// The tiles are static, decorative markup, so each column is one HTML string
// (v-html): hydration does not walk the ~500 tile elements, and the loop copy is
// created by the browser's HTML parser instead of Vue. Logo URLs may come from
// the CMS, hence the attribute escaping.
const escapeAttr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const tileHtml = (src: string) => {
  const srcset = tileSrcset(src);
  const responsive = srcset ? ` srcset="${escapeAttr(srcset)}" sizes="(min-width: 768px) 200px, 100px"` : "";
  return `<div class="logo-marquee__tile"><img class="logo-marquee__img" src="${escapeAttr(src)}"${responsive} alt="" width="200" height="100" loading="lazy" decoding="async" fetchpriority="low" draggable="false"></div>`;
};

const columnsConfig = computed(() => {
  const total = Math.max(0, Number(props.rows) || 0);
  const logos = baseLogos.value;

  return Array.from({ length: total }, (_, idx) => ({
    idx,
    key: `col-${idx}`,
    html: shuffledForColumn(logos, idx).map(tileHtml).join(""),
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
    ? "absolute inset-0 bottom-[-90px] md:-top-0 w-[160%] md:-left-[2%] md:scale-[1.25] scale-[1.4]"
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

    <div
      v-if="props.asBackground"
      class="pointer-events-none absolute left-0 top-0 h-full md:w-[45%] w-[150px] md:bg-gradient-to-r from-black via-black/80 to-transparent"
    ></div>
  </section>
</template>

<!-- Not scoped: a scope attribute on each of the ~500 tiles would add ~15 KB to
     the home page HTML, so the classes are namespaced instead. -->
<style>
.logo-marquee__tile {
  position: relative;
  flex-shrink: 0;
  width: 100px;
  height: 50px;
  overflow: hidden;
  border-radius: 8px;
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
    width: 200px;
    height: 100px;
    border-radius: 10px;
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

@media (min-width: 1920px) and (max-width: 2559px) {
  .logo-marquee--background .logo-marquee__col:nth-child(n + 15) { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .logo-marquee__col {
    animation: none !important;
  }
}
</style>
