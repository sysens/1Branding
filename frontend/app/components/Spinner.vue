<script setup lang="ts">
import { computed } from "vue";

type Props = {
  src?: string;
  size?: number;
};

const props = withDefaults(defineProps<Props>(), {
  src: "/General/loading.svg",
  size: 542,
});

const loaderStyle = computed(() => ({
  width: `min(${props.size}px, 82vw)`,
}));
</script>

<template>
  <div
    class="spinner-overlay fixed inset-0 grid h-[100dvh] place-items-center bg-black"
    role="status"
    aria-label="Loading"
  >
    <img
      class="spinner-image block"
      :src="props.src"
      alt=""
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
  max-height: 82vh;
  object-fit: contain;
}
</style>
