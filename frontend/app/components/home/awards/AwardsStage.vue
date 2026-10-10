<script setup lang="ts">
import { ref } from "vue";
import { Pause, Play } from "lucide-vue-next";
import { useAwardsStage } from "~/composables/useAwardsStage";
import { AWARDS_PREVIEW } from "~/utils/awards/layout";
import AwardsGallery from "./AwardsGallery.vue";

const root = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const paused = ref(false);
const { ready } = useAwardsStage(root, canvas);
</script>

<template>
  <figure ref="root" class="awards-stage" :data-ready="ready" aria-label="OneBranding project gallery and number one">
    <img v-show="!ready" :src="AWARDS_PREVIEW" width="1366" height="840" loading="lazy" decoding="async" alt="Branding projects on a reflective stage with a green number one" class="awards-stage__preview" />
    <canvas ref="canvas" class="awards-stage__canvas" :class="{ 'is-ready': ready }" aria-hidden="true" />
    <AwardsGallery :paused="paused" />
    <button class="awards-stage__pause" type="button" :aria-pressed="paused" :aria-label="paused ? 'Play gallery animation' : 'Pause gallery animation'" :title="paused ? 'Play gallery animation' : 'Pause gallery animation'" @click="paused = !paused">
      <Play v-if="paused" :size="18" />
      <Pause v-else :size="18" />
    </button>
  </figure>
</template>

<style scoped>
/* max-height: on ultra-wide screens the stage stays one screen tall; the camera
   then shows the whole stage with more black floor at the faded sides. */
.awards-stage { position: relative; z-index: 1; width: 100%; aspect-ratio: 1366 / 840; max-height: 110svh; margin: 0; mask-image: linear-gradient(#000 72%, transparent); }
.awards-stage__canvas, .awards-stage__preview { position: absolute; z-index: 2; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
.awards-stage__canvas { opacity: 0; touch-action: pan-y; }
.awards-stage__canvas.is-ready { opacity: 1; }
.awards-stage::after { content: ''; position: absolute; z-index: 3; inset: 0; pointer-events: none; background: linear-gradient(90deg, #000, transparent 17%, transparent 83%, #000), linear-gradient(0deg, #000, transparent 12%); }
.awards-stage__pause { position: absolute; z-index: 4; left: 24px; bottom: 24px; display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid #ffffff40; border-radius: 6px; color: white; background: #111b; opacity: 0; }
.awards-stage:hover .awards-stage__pause, .awards-stage__pause:focus-visible { opacity: 1; }
.awards-stage__pause:focus-visible { outline: 2px solid #03cb32; outline-offset: 3px; }
@media (hover: none) { .awards-stage__pause { opacity: 1; left: 12px; bottom: 8px; } }
@media (prefers-reduced-motion: reduce) { .awards-stage__pause { display: none; } }
</style>
