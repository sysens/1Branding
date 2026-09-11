<script setup lang="ts">
import { ref } from "vue";
import { motion } from "motion-v";
import MacbookKeyboard from "./MacbookKeyboard.vue";
import MacbookLid from "./MacbookLid.vue";
import { useMacbookScroll } from "~/composables/useMacbookScroll";

withDefaults(defineProps<{
  src?: string;
  alt?: string;
  title?: string;
  showGradient?: boolean;
}>(), {
  alt: "Digital product interface displayed on a MacBook",
  title: "This Macbook is built with Tailwindcss. No kidding.",
  showGradient: false,
});

const root = ref<HTMLElement | null>(null);
const device = ref<HTMLElement | null>(null);
const { scaleX, scaleY, rotate, translate, textTransform, textOpacity } = useMacbookScroll(root, device);
</script>

<template>
  <div ref="root" class="macbook-scroll">
    <motion.div v-if="$slots.title || title" class="macbook-scroll__title" :style="{ translateY: textTransform, opacity: textOpacity }">
      <slot name="title"><h2>{{ title }}</h2></slot>
    </motion.div>
    <div ref="device" class="macbook-scroll__device">
      <MacbookLid :src="src" :alt="alt" :scale-x="scaleX" :scale-y="scaleY" :rotate="rotate" :translate="translate" />
      <MacbookKeyboard :show-gradient="showGradient">
        <template #badge><slot name="badge" /></template>
      </MacbookKeyboard>
    </div>
  </div>
</template>

<style scoped>
.macbook-scroll {
  position: relative;
  display: flex;
  min-height: 200vh;
  width: 100%;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-block: 20rem;
  perspective: 800px;
}
.macbook-scroll__title { flex-shrink: 0; width: 100%; margin-bottom: 5rem; text-align: center; }
.macbook-scroll__title h2 { font-size: 1.875rem; line-height: 1.2; font-weight: 700; color: #262626; }
.macbook-scroll__device { position: relative; isolation: isolate; flex-shrink: 0; width: 32rem; }
@media (max-width: 767px) {
  .macbook-scroll { padding-block: 6rem 0; }
  /* Scale the hardware, not the page's readable heading and description. */
  .macbook-scroll__device { transform: scale(0.5); transform-origin: center top; }
}
@media (max-width: 639px) { .macbook-scroll__device { transform: scale(0.35); } }
@media (prefers-reduced-motion: reduce) {
  .macbook-scroll { min-height: 0; }
}
</style>
