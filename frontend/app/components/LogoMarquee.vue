<script setup lang="ts">
import { computed } from "vue";
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

const staticLogos = [
  "/logoss/apexpizza.webp",
  "/logoss/artAnor.webp",
  "/logoss/asakabank.webp",
  "/logoss/barberra.webp",
  "/logoss/brono.webp",
  "/logoss/burger.webp",
  "/logoss/chizzago.webp",
  "/logoss/clop.webp",
  "/logoss/cybernat.webp",
  "/logoss/daniel.webp",
  "/logoss/Deco.webp",
  "/logoss/delicco.webp",
  "/logoss/dodokids.webp",
  "/logoss/FmFood.webp",
  "/logoss/GlossMaxx.webp",
  "/logoss/grechno.webp",
  "/logoss/GreenGo.webp",
  "/logoss/hayaati.webp",
  "/logoss/kebabHouse.webp",
  "/logoss/Korean.webp",
  "/logoss/Luqmam.webp",
  "/logoss/luxion.webp",
  "/logoss/Makva.webp",
  "/logoss/marinno.webp",
  "/logoss/merhaba.webp",
  "/logoss/milka.webp",
  "/logoss/nescafe.webp",
  "/logoss/OMAF.webp",
  "/logoss/perfectCandy.webp",
  "/logoss/perfectCandy2.webp",
  "/logoss/Poyqadam.webp",
  "/logoss/Rafting.webp",
  "/logoss/Raviosta.webp",
  "/logoss/RedBull.webp",
  "/logoss/silvera.webp",
  "/logoss/streetvibe.webp",
  "/logoss/st77.webp",
  "/logoss/texnikach.webp",
  "/logoss/websiteONEBRANDING.webp",
  "/logoss/wok.webp",
  "/logoss/yana.webp",
];

const MAX_LOGOS_PER_COLUMN = 18;
const { targetRef, isActive } = useViewportActivity({ rootMargin: "300px 0px" });

const baseLogos = computed(() => (props.logos?.length ? props.logos : staticLogos));
const marqueeDuration = computed(() => `${props.durationSeconds}s`);

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

const columnsConfig = computed(() => {
  const total = Math.max(0, Number(props.rows) || 0);
  const logos = baseLogos.value;

  return Array.from({ length: total }, (_, idx) => {
    const isReverse = idx % 2 === 1;
    return {
      idx,
      key: `col-${idx}`,
      logos: shuffledForColumn(logos, idx),
      isReverse,
      imgOpacityClass: "opacity-100",
      withLink: !props.asBackground && idx === 0,
    };
  });
});

const rootClass = computed(() =>
  props.asBackground
    ? "relative w-full h-full min-h-[900px] overflow-hidden"
    : "relative z-10 bg-black w-full overflow-hidden flex items-center justify-center"
);

const innerWrapClass = computed(() =>
  props.asBackground
    ? "absolute inset-0 bottom-[-90px] md:-top-0 w-[160%] md:-left-[2%] md:scale-[1.3] scale-[1.4]"
    : "w-full h-full flex justify-center"
);

const trackClass = computed(() =>
  props.asBackground
    ? "flex h-[140%] items-start"
    : "flex h-[900px] items-start justify-center"
);

const imgWrapperClass =
  "relative md:h-[100px] h-[50px] md:w-[200px] w-[100px] shrink-0 overflow-hidden rounded-[8px] md:rounded-[10px] select-none pointer-events-none";

const imgClass =
  "absolute inset-0 origin-center w-full h-full object-cover select-none pointer-events-none";

const colPadClass = computed(() => (props.asBackground ? "py-[2px]" : "py-[1px]"));
const colGapClass = computed(() => (props.asBackground ? "gap-[4px]" : "gap-[2px]"));
const colsGapClass = computed(() => (props.asBackground ? "gap-[4px]" : "gap-[2px]"));
</script>

<template>
  <section
    ref="targetRef"
    :class="[rootClass, { 'logo-marquee--paused': !isActive }]"
  >
    <div :class="innerWrapClass">
      <div class="w-full h-full rotate-[10deg] overflow-hidden">
        <div :class="[trackClass, colsGapClass]">
          <div
            v-for="col in columnsConfig"
            :key="col.key"
            class="flex flex-col h-max will-change-transform"
            :class="col.isReverse ? 'marqueeVerticalReverse' : 'marqueeVertical'"
            :style="{ '--marquee-duration': marqueeDuration }"
          >
            <component
              :is="col.withLink ? 'NuxtLink' : 'div'"
              :to="col.withLink ? props.linkTo : undefined"
              class="flex flex-col items-center"
              :class="[colGapClass, colPadClass]"
            >
              <div
                v-for="(src, i) in col.logos"
                :key="col.key + '-a-' + i"
                :class="[imgWrapperClass, col.imgOpacityClass]"
              >
                <img
                  :src="src"
                  alt=""
                  :class="imgClass"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  draggable="false"
                />
              </div>
            </component>

            <component
              :is="col.withLink ? 'NuxtLink' : 'div'"
              :to="col.withLink ? props.linkTo : undefined"
              class="flex flex-col items-center"
              :class="[colGapClass, colPadClass]"
              aria-hidden="true"
            >
              <div
                v-for="(src, i) in col.logos"
                :key="col.key + '-b-' + i"
                :class="[imgWrapperClass, col.imgOpacityClass]"
              >
                <img
                  :src="src"
                  alt=""
                  :class="imgClass"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  draggable="false"
                />
              </div>
            </component>
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

<style scoped>
.marqueeVertical {
  animation: marqueeVertical var(--marquee-duration) linear infinite;
}

.marqueeVerticalReverse {
  animation: marqueeVertical var(--marquee-duration) linear infinite reverse;
}

.logo-marquee--paused .marqueeVertical,
.logo-marquee--paused .marqueeVerticalReverse {
  animation-play-state: paused;
}

@keyframes marqueeVertical {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}
</style>
