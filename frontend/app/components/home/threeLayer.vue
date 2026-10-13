<script setup lang="ts">
import { computed, ref, watch } from "vue";
import MarqueeMedia from "./MarqueeMedia.vue";
import { useViewportActivity } from "~/composables/useViewportActivity";
import { isInitialCollageImage } from "~/utils/collageMedia";
import {
  buildBrandCollageRowsConfig,
  getLocalBrandCollageRows,
} from "~/utils/brandCollageRows";

const localePath = useLocalePath();

type Props = {
  logos?: string[];
  rowSets?: string[][];
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

const fallbackRowSets = computed(() => getLocalBrandCollageRows());

const { targetRef, isActive } = useViewportActivity({ rootMargin: "1200px 0px" });
const hasApproached = ref(false);
const settledSources = ref(new Set<string>());
watch(isActive, active => { if (active) hasApproached.value = true; });

// The images are not in the server HTML. Once the collage is near, they are
// switched on one row per task: rendering all ~60 NuxtImg (srcset for every
// width and density) at once was a single ~90ms main-thread task.
const readyRows = ref(0);
watch(hasApproached, (approached) => {
  if (!approached) return;
  const enableNextRow = () => {
    readyRows.value += 1;
    if (readyRows.value < rowsConfig.value.length) setTimeout(enableNextRow, 0);
  };
  enableNextRow();
});

function markSettled(src: string): void {
  settledSources.value.add(src);
}

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

</script>

<template>
  <section
    ref="targetRef"
    class="relative z-10 flex w-full items-center overflow-hidden bg-transparent"
    :class="{ 'brand-collage--paused': !isActive }"
  >
    <div class="w-full">
      <div class="w-full overflow-hidden space-y-4">
        <div
          v-for="(row, rowIndex) in rowsConfig"
          :key="row.key"
          class="marquee-row flex w-max"
          :class="[row.animClass, { 'marquee-row--waiting': !row.duplicatedImages.every(image => settledSources.has(image.src)) }]"
          :style="{ '--marquee-duration': marqueeDuration }"
        >
          <component
            :is="row.withLink ? 'NuxtLink' : 'div'"
            :to="row.withLink ? props.linkTo : undefined"
            class="flex items-center gap-2 md:gap-3 md:px-1.5 px-1"
          >
            <MarqueeMedia
              v-for="(image, i) in row.duplicatedImages"
              :key="row.key + '-' + i + '-' + image.src"
              :src="image.src"
              :eager="rowIndex < readyRows"
              :deferred="rowIndex >= readyRows"
              :priority="isInitialCollageImage(i, row.duplicatedImages.length / 2, row.animClass === 'animate-marquee-reverse') ? 'auto' : 'low'"
              @settled="markSettled"
            />
          </component>
        </div>

        <div class="mt-20">
          <div
            v-if="shouldShowButton"
            class="flex justify-center md:mt-20 mt-[30px] mb-6"
          >
            <NuxtLink
              :to="localePath('/Projects')"
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

.marquee-row--waiting,
.brand-collage--paused .animate-marquee,
.brand-collage--paused .animate-marquee-reverse {
  animation-play-state: paused;
}

.marquee-image-frame {
  transform: translateZ(0);
  backface-visibility: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .marquee-row { animation-play-state: paused; }
}
</style>
