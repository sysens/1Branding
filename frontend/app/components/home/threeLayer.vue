<script setup lang="ts">
import { computed } from "vue";

type Props = {
  logos?: string[];
  rows?: number;
  durationSeconds?: number;
  linkTo?: string;
  title?: string;
  button?: string;
  showTitle?: boolean;
  showButton?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  logos: undefined,
  rows: 3,
  durationSeconds: 120,
  showTitle: false,
  showButton: false,
});

const marqueeDuration = computed(() => `${props.durationSeconds}s`);

const hasTitleText = computed(() => !!props.title?.trim());
const hasButtonText = computed(() => !!props.button?.trim());

const shouldShowTitle = computed(() => props.showTitle && hasTitleText.value);
const shouldShowButton = computed(() => props.showButton && hasButtonText.value);

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleArray = (arr: string[], seed: number) => {
  const rand = mulberry32(seed);
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

const spreadDuplicates = (arr: string[], seed: number) => {
  if (arr.length <= 1) return arr;

  const rand = mulberry32(seed);
  const result = [...arr];

  for (let pass = 0; pass < result.length * 3; pass++) {
    let changed = false;

    for (let i = 1; i < result.length; i++) {
      if (result[i] === result[i - 1]) {
        let swapIndex = -1;

        for (let j = i + 1; j < result.length; j++) {
          const prevOk = result[j] !== result[i - 1];
          const nextOk = j === result.length - 1 || result[j + 1] !== result[i];
          if (prevOk && nextOk) {
            swapIndex = j;
            break;
          }
        }

        if (swapIndex === -1) {
          const candidates: number[] = [];
          for (let j = 0; j < result.length; j++) {
            if (j !== i && result[j] !== result[i - 1]) {
              candidates.push(j);
            }
          }

          if (candidates.length) {
            swapIndex = candidates[Math.floor(rand() * candidates.length)];
          }
        }

        if (swapIndex !== -1) {
          [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  return result;
};

const row1 = [
  "/home/threeLayerLocal/11.webp",
  "/home/threeLayerLocal/12.webp",
  "/home/threeLayerLocal/13.webp",
  "/home/threeLayerLocal/14.webp",
  "/home/threeLayerLocal/15.webp",
  "/home/threeLayerLocal/16.webp",
  "/home/threeLayerLocal/17.webp",
  "/home/threeLayerLocal/18.webp",
  "/home/threeLayerLocal/19.webp",
  "/home/threeLayerLocal/199.webp",
];

const row2 = [
  "/home/threeLayerLocal/21.webp",
  "/home/threeLayerLocal/22.webp",
  "/home/threeLayerLocal/23.webp",
  "/home/threeLayerLocal/24.webp",
  "/home/threeLayerLocal/25.webp",
  "/home/threeLayerLocal/26.webp",
  "/home/threeLayerLocal/27.webp",
  "/home/threeLayerLocal/28.webp",
  "/home/threeLayerLocal/29.webp",
  "/home/threeLayerLocal/299.webp",
];

const row3 = [
  "/home/threeLayerLocal/31.webp",
  "/home/threeLayerLocal/32.webp",
  "/home/threeLayerLocal/33.webp",
  "/home/threeLayerLocal/34.webp",
  "/home/threeLayerLocal/35.webp",
  "/home/threeLayerLocal/36.webp",
  "/home/threeLayerLocal/37.webp",
  "/home/threeLayerLocal/38.webp",
  "/home/threeLayerLocal/39.webp",
  "/home/threeLayerLocal/40.webp",
];

const localRowSets = [row1, row2, row3];

const buildRowLogos = (logos: string[], rowIdx: number) => {
  const seed = 12345 + rowIdx * 99991;
  const shuffled = shuffleArray(logos, seed);
  return spreadDuplicates(shuffled, seed + 77);
};

const rowsConfig = computed(() => {
  const total = Math.max(0, Number(props.rows) || 0);

  return Array.from({ length: total }, (_, idx) => {
    const isReverse = idx % 2 === 1;
    const source =
      localRowSets[idx] && localRowSets[idx].length
        ? localRowSets[idx]
        : localRowSets[idx % localRowSets.length] || props.logos || row1;

    const preparedLogos = buildRowLogos(source, idx);

    return {
      key: `row-${idx}`,
      animClass: isReverse ? "animate-marquee-reverse" : "animate-marquee",
      withLink: idx === 0,
      logos: preparedLogos,
      duplicatedLogos: [...preparedLogos, ...preparedLogos],
    };
  });
});
</script>

<template>
  <section class="relative z-10 bg-black w-full overflow-hidden flex items-center">
    <div class="w-[120%] -ml-[10%]">
      <div class="w-full overflow-hidden space-y-4">
        <div
          v-for="row in rowsConfig"
          :key="row.key"
          class="marquee-row flex w-max"
          :class="row.animClass"
          :style="{ '--marquee-duration': marqueeDuration }"
        >
          <component
            :is="row.withLink ? 'NuxtLink' : 'div'"
            :to="row.withLink ? props.linkTo : undefined"
            class="flex items-center gap-2 md:gap-3 md:px-1.5 px-1"
          >
            <img
              v-for="(src, i) in row.duplicatedLogos"
              :key="row.key + '-' + i"
              :src="src"
              alt=""
              loading="lazy"
              decoding="async"
              class="marquee-image md:h-[17.0625rem] h-[205px] md:w-[30.375rem] w-[364px] shrink-0 object-cover rounded-[20px] md:rounded-[1.875rem] select-none pointer-events-none"
              draggable="false"
            />
          </component>
        </div>

        <div class="mt-20">
          <div
            v-if="shouldShowButton"
            class="flex justify-center md:mt-20 mt-[30px] mb-6"
          >
            <NuxtLink
              to="/Projects"
              class="text-white bg-[url('/home/Component3.png')] md:w-[16.25rem] w-[219px] md:h-[3.75rem] h-[50px] rounded-[32px] bg-[size:120%] bg-[position:100%_50%] transition-[background-position,background-size,box-shadow] duration-1000 ease-[cubic-bezier(.4,0,.2,1)] hover:bg-[size:140%] hover:bg-[position:0%_50%] hover:shadow-[0_0_30px_rgba(3,203,0,0.9)] flex items-center justify-center text-center"
            >
              {{ props.button }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes marquee {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}

.marquee-row {
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}

.animate-marquee,
.animate-marquee-reverse {
  will-change: transform;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}

.animate-marquee {
  animation: marquee var(--marquee-duration) linear infinite;
}

.animate-marquee-reverse {
  animation: marquee var(--marquee-duration) linear infinite reverse;
}

.marquee-image {
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>
