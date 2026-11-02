<script setup lang="ts">
import { computed } from "vue";
import { useViewportActivity } from "~/composables/useViewportActivity";

const { targetRef, isActive } = useViewportActivity({ rootMargin: "250px 0px" });

const props = withDefaults(
  defineProps<{
    logos?: string[];
    /** The brand name of each logo (its alt), in the same order. */
    alts?: string[];
    /** The width / height of each logo's artwork, in the same order. */
    ratios?: number[];
    durationSeconds?: number;
  }>(),
  {
    logos: () => [],
    alts: () => [],
    ratios: () => [],
  }
);

// A height multiplier (--logo-scale, read by the parent's CSS) that evens out
// visual weight: a logo of ratio 3 keeps the base height, squarer ones grow
// and very wide ones shrink (within limits), so each covers about the same area.
const logoScale = (ratio?: number) => (ratio ? Math.min(1.35, Math.max(0.45, Math.sqrt(3 / ratio))) : 1);

const baseLogos = computed(() => props.logos
  .map((src, i) => ({ src, alt: props.alts[i] ?? "", style: { "--logo-scale": logoScale(props.ratios[i]).toFixed(3) } }))
  .filter((logo) => Boolean(logo.src)));

const MIN_ITEMS_FOR_SMOOTH = 24;

const loopedLogos = computed(() => {
  const arr = baseLogos.value;
  if (!arr.length) return [];
  const times = Math.max(2, Math.ceil(MIN_ITEMS_FOR_SMOOTH / arr.length));
  return Array.from({ length: times }, () => arr).flat();
});

const SECONDS_PER_ITEM = 0.1;

const marqueeDuration = computed(() => {
  if (props.durationSeconds) return `${props.durationSeconds}s`;
  const baseLen = Math.max(1, baseLogos.value.length);
  const effectiveLen = Math.max(baseLen, MIN_ITEMS_FOR_SMOOTH);
  return `${effectiveLen * SECONDS_PER_ITEM}s`;
});
</script>

<template>
  <section
    ref="targetRef"
    class="spaceBetween relative z-[5] flex h-auto w-full items-center overflow-visible"
    :class="{ 'brands--paused': !isActive, 'brands--timed': Boolean(durationSeconds) }"
  >
    <div class="w-full overflow-hidden">
      <div
        class="flex w-max animate-marquee will-change-transform"
        :style="{ '--marquee-duration': marqueeDuration }"
      >
        <div class="flex items-center gap-16 px-8">
          <img
            v-for="(logo, i) in loopedLogos"
            :key="'a-' + i"
            :src="logo.src"
            :style="logo.style"
            :alt="i < baseLogos.length ? logo.alt : ''"
            class="h-[1.6875rem] w-auto max-w-[9.375rem] md:max-w-[15.625rem] shrink-0 object-contain md:h-[3.0625rem] opacity-90 select-none pointer-events-none"
            loading="lazy"
            decoding="async"
            draggable="false"
          >
        </div>

        <div class="flex items-center gap-16 px-8" aria-hidden="true">
          <img
            v-for="(logo, i) in loopedLogos"
            :key="'b-' + i"
            :src="logo.src"
            :style="logo.style"
            alt=""
            class="h-[1.6875rem] w-auto max-w-[9.375rem] md:max-w-[15.625rem] shrink-0 object-contain md:h-[3.0625rem] opacity-90 select-none pointer-events-none"
            loading="lazy"
            decoding="async"
            draggable="false"
          >
        </div>
      </div>
    </div>
  </section>
</template>
<style scoped>
.spaceBetween {
  min-height: clamp(3rem, 5vw, 5.5rem);
}

.brands--timed .animate-marquee { animation: brands-scroll var(--marquee-duration) linear infinite; }
@keyframes brands-scroll { to { transform: translateX(-50%); } }

.brands--paused .animate-marquee {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .animate-marquee { animation-play-state: paused; }
}
</style>
