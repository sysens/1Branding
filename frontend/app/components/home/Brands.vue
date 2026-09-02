<script setup lang="ts">
import { computed } from "vue";
import { useViewportActivity } from "~/composables/useViewportActivity";

const { targetRef, isActive } = useViewportActivity({ rootMargin: "250px 0px" });

const props = withDefaults(
  defineProps<{
    logos?: string[];
  }>(),
  {
    logos: () => [],
  }
);

const baseLogos = computed(() => props.logos.filter(Boolean));

const MIN_ITEMS_FOR_SMOOTH = 24;

const logos = computed(() => {
  const arr = baseLogos.value;
  if (!arr.length) return [];
  const times = Math.max(2, Math.ceil(MIN_ITEMS_FOR_SMOOTH / arr.length));
  return Array.from({ length: times }, () => arr).flat();
});

const SECONDS_PER_ITEM = 0.1;

const marqueeDuration = computed(() => {
  const baseLen = Math.max(1, baseLogos.value.length);
  const effectiveLen = Math.max(baseLen, MIN_ITEMS_FOR_SMOOTH);
  return `${effectiveLen * SECONDS_PER_ITEM}s`;
});
</script>

<template>
  <section
    ref="targetRef"
    class="spaceBetween relative z-[5] flex h-auto w-full items-center overflow-visible"
    :class="{ 'brands--paused': !isActive }"
  >
    <div class="w-full overflow-hidden">
      <div
        class="flex w-max animate-marquee will-change-transform"
        :style="{ '--marquee-duration': marqueeDuration }"
      >
        <div class="flex items-center gap-16 px-8">
          <img
            v-for="(src, i) in logos"
            :key="'a-' + i"
            :src="src"
            alt=""
            class="h-[27px] w-auto max-w-[150px] md:max-w-[250px] shrink-0 object-contain md:h-[3.0625rem] opacity-90 select-none pointer-events-none"
            draggable="false"
          />
        </div>

        <div class="flex items-center gap-16 px-8" aria-hidden="true">
          <img
            v-for="(src, i) in logos"
            :key="'b-' + i"
            :src="src"
            alt=""
            class="h-[27px] w-auto max-w-[150px] md:max-w-[250px] shrink-0 object-contain md:h-[3.0625rem] opacity-90 select-none pointer-events-none"
            draggable="false"
          />
        </div>
      </div>
    </div>
  </section>
</template>
<style scoped>
.spaceBetween {
  min-height: clamp(3rem, 5vw, 5.5rem);
}

.brands--paused .animate-marquee {
  animation-play-state: paused;
}
</style>
