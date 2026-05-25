<script setup lang="ts">
import { computed } from "vue";
import MarqueeMedia from "./MarqueeMedia.vue";
import {
  buildBrandCollageRowsConfig,
  getLocalBrandCollageRows,
} from "~/utils/brandCollageRows";

type Props = {
  logos?: string[];
  rowSets?: string[][];
  staticMediaBaseUrl?: string;
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
  rowSets: undefined,
  staticMediaBaseUrl: "",
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

const fallbackRowSets = computed(() =>
  getLocalBrandCollageRows(props.staticMediaBaseUrl)
);

const optimizedImage = useImage();
const PRELOAD_IMAGE_LIMIT = 4;
const MARQUEE_IMAGE_WIDTH = 486;
const MARQUEE_IMAGE_HEIGHT = 273;
const MARQUEE_IMAGE_QUALITY = 78;

const rowsConfig = computed(() => {
  const total = Math.max(0, Number(props.rows) || 0);
  const legacyLogos = props.logos?.length ? [props.logos] : [];

  return buildBrandCollageRowsConfig({
    totalRows: total,
    adminRowSets: props.rowSets?.length ? props.rowSets : legacyLogos,
    fallbackRowSets: fallbackRowSets.value,
    linkTo: props.linkTo,
  });
});

const preloadImageSources = computed(() => {
  const firstRowImages = rowsConfig.value[0]?.duplicatedImages ?? [];
  const seen = new Set<string>();
  const sources: string[] = [];

  for (const image of firstRowImages) {
    if (seen.has(image.src)) {
      continue;
    }

    seen.add(image.src);
    sources.push(image.src);

    if (sources.length >= PRELOAD_IMAGE_LIMIT) {
      break;
    }
  }

  return sources;
});

useHead(() => ({
  link: preloadImageSources.value.map((src) => ({
    rel: "preload",
    as: "image",
    href: optimizedImage(src, {
      width: MARQUEE_IMAGE_WIDTH,
      height: MARQUEE_IMAGE_HEIGHT,
      fit: "cover",
      format: "webp",
      quality: MARQUEE_IMAGE_QUALITY,
    }),
    fetchpriority: "high",
  })),
}));
</script>

<template>
  <section class="relative z-10 w-full overflow-visible bg-transparent flex items-center">
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
            <MarqueeMedia
              v-for="(image, i) in row.duplicatedImages"
              :key="row.key + '-' + i"
              :src="image.src"
              :placeholder-src="image.placeholderSrc"
              :eager="row.key === 'row-0' && i < 4"
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

.marquee-image-frame {
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>
