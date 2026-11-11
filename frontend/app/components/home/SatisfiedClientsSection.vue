<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import ManifestoScroll from "./ManifestoScroll.vue";
import ServiceBand from "./ServiceBand.vue";
import ThreeLayer from "./ThreeLayer.vue";

withDefaults(
  defineProps<{
    collageRows?: string[][];
    partnerLogos?: string[];
  }>(),
  {
    collageRows: () => [],
    partnerLogos: () => [],
  },
);

// Once "we build brands that…" has settled, the collage section does not rise
// from below: it is already there, pinned behind the statement's screen. For
// one screen of scroll the statement slowly dissolves (ManifestoScroll, hold)
// and, as it is uncovered, the collage comes forward from a little smaller to
// its size; then the page scrolls on. Both follow the same stretch of that
// screen ([FROM, TO], eased), so the collage has arrived as the statement is
// gone. Without the script (or with reduced motion) it simply stands in place.
const FROM = 0.05;
const TO = 0.85;
const START_SCALE = 0.92;

const stage = ref<HTMLElement | null>(null);
const emerge = ref<HTMLElement | null>(null);
let frame = 0;
let stop: (() => void) | undefined;

const render = () => {
  frame = 0;
  if (!stage.value || !emerge.value) return;
  const progress = -stage.value.getBoundingClientRect().top / window.innerHeight;
  const t = Math.min(1, Math.max(0, (progress - FROM) / (TO - FROM)));
  const eased = t * t * (3 - 2 * t);
  emerge.value.style.scale = (START_SCALE + (1 - START_SCALE) * eased).toFixed(4);
};

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(render);
};

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  stop = () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  };
  render();
});

onBeforeUnmount(() => {
  stop?.();
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <section class="clients-reveal">
    <ManifestoScroll class="clients-section__manifesto" :hold="1" />

    <!-- Under the manifesto, from where its last statement has settled: the
         panel stays pinned behind it for the one screen of scroll the spacer
         adds, while the statement dissolves. -->
    <div ref="stage" class="clients-section__stage">
      <div class="clients-section__gallery">
        <div ref="emerge" class="clients-section__emerge">
          <div class="clients-section__collage">
            <!-- What we design, tilted with the collage under it. -->
            <ServiceBand />
            <ThreeLayer
              :rows="3"
              :row-sets="collageRows"
              :show-title="false"
              :show-button="false"
            />
          </div>
        </div>
      </div>
      <div class="clients-section__stage-spacer" aria-hidden="true" />
    </div>
  </section>
</template>

<style scoped src="./SatisfiedClientsSection.css"></style>
