<script setup lang="ts">
import { ref } from "vue";
import { Pause, Play } from "lucide-vue-next";
import { useThreeDMarquee } from "~/composables/useThreeDMarquee";
import { MARQUEE_ATLAS, MARQUEE_TILES } from "~/utils/marquee/layout";

const props = withDefaults(defineProps<{ images?: string[] }>(), { images: () => [] });
const root = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const paused = ref(false);
const { ready } = useThreeDMarquee(root, canvas, () => props.images, paused);
</script>

<template>
  <figure ref="root" class="three-d-marquee" :data-ready="ready" aria-label="OneBranding project gallery">
    <img v-show="!ready" class="three-d-marquee__fallback" :src="MARQUEE_ATLAS" alt="OneBranding branding project mosaic" width="1340" height="523" loading="lazy" decoding="async" />
    <canvas ref="canvas" class="three-d-marquee__canvas" :class="{ 'is-ready': ready }" aria-hidden="true" />
    <figcaption class="sr-only">{{ MARQUEE_TILES.map(tile => tile.title).join(', ') }}</figcaption>
    <button
      v-if="ready" class="three-d-marquee__pause" type="button" :aria-pressed="paused"
      :aria-label="paused ? 'Resume gallery animation' : 'Pause gallery animation'"
      :title="paused ? 'Resume gallery animation' : 'Pause gallery animation'" @click="paused = !paused"
    >
      <Play v-if="paused" :size="16" /><Pause v-else :size="16" />
    </button>
  </figure>
</template>

<style scoped>
.three-d-marquee { position: relative; width: 100%; height: clamp(34rem, 76svh, 48rem); margin: 0; overflow: clip; background: #000; }
.three-d-marquee__canvas, .three-d-marquee__fallback { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.three-d-marquee__fallback { object-fit: cover; }
.three-d-marquee__canvas { opacity: 0; touch-action: pan-y; }
.three-d-marquee__canvas.is-ready { opacity: 1; }
.three-d-marquee::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to bottom, #0009, transparent 27%, transparent 68%, #000 100%); }
.three-d-marquee__pause { position: absolute; z-index: 2; left: 1.5rem; bottom: 1.5rem; display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border: 1px solid #ffffff30; border-radius: 6px; color: #fff; background: #111b; opacity: 0; transition: opacity 150ms; }
.three-d-marquee:hover .three-d-marquee__pause, .three-d-marquee__pause:focus-visible { opacity: 1; }
.three-d-marquee__pause:focus-visible { outline: 2px solid #03cb32; outline-offset: 3px; }
@media (max-width: 767px) { .three-d-marquee { height: 25rem; } }
@media (hover: none) { .three-d-marquee__pause { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .three-d-marquee__pause { display: none; } }
</style>
