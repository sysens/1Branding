<script setup lang="ts">
import { computed } from "vue";

type Props = {
  src?: string;
  size?: number;
};

const props = withDefaults(defineProps<Props>(), {
  src: "/General/loading.webp",
  size: 542,
});

// The animation is the centred 1040x920 crop of the original 1920x1080 loader
// frames, so `size` (the old full-frame width) is scaled by the crop ratio to keep
// the logo and ring at exactly the same rendered size.
const CROP_WIDTH_RATIO = 1040 / 1920;

const loaderStyle = computed(() => ({
  width: `min(${Math.round(props.size * CROP_WIDTH_RATIO)}px, ${(82 * CROP_WIDTH_RATIO).toFixed(1)}vw)`,
}));

useHead({
  link: [{ rel: "preload", as: "image", href: props.src, fetchpriority: "high", key: "spinner-preload" }],
});
</script>

<template>
  <div
    class="spinner-overlay fixed inset-0 grid h-[100dvh] place-items-center bg-black"
    role="status"
    :aria-label="$t('a11y.loading')"
  >
    <img
      class="spinner-image block"
      :src="props.src"
      alt=""
      width="436"
      height="386"
      fetchpriority="high"
      decoding="async"
      :style="loaderStyle"
    />
  </div>
</template>

<style scoped>
.spinner-overlay {
  z-index: 2147483647;
}

.spinner-image {
  height: auto;
  /* 82vh of the full frame, scaled to the 920/1080 crop height */
  max-height: 69.8vh;
  object-fit: contain;
}
</style>
