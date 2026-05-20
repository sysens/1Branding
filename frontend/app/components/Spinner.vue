<script setup lang="ts">
import { computed, ref } from "vue";

type Props = {
  src: string;
  size?: number;
};

const props = withDefaults(defineProps<Props>(), {
  size: 542,
});

const videoReady = ref(false);
const videoFailed = ref(false);
const loaderSize = computed(() => `min(${props.size}px, 80vw, 260px)`);

const handleVideoReady = () => {
  videoReady.value = true;
};

const handleVideoError = () => {
  videoFailed.value = true;
};
</script>

<template>
  <div
    class="spinner-overlay fixed inset-0 grid h-[100dvh] place-items-center bg-black"
    role="status"
    aria-label="Loading"
  >
    <div class="absolute inset-0 bg-black backdrop-blur-md"></div>

    <div
      class="spinner-mark relative grid place-items-center"
      :style="{
        width: loaderSize,
        height: loaderSize,
      }"
    >
      <div
        v-if="!videoReady || videoFailed"
        class="spinner-fallback absolute inset-0 rounded-full"
      >
        <div class="spinner-fallback__ring"></div>
        <div class="spinner-fallback__core"></div>
      </div>

      <video
        class="relative z-[1] h-full w-full rounded-full object-cover transition-opacity duration-300"
        :class="videoReady && !videoFailed ? 'opacity-100' : 'opacity-0'"
        :src="props.src"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        @canplay="handleVideoReady"
        @loadeddata="handleVideoReady"
        @error="handleVideoError"
      ></video>
    </div>
  </div>
</template>

<style scoped>
.spinner-overlay {
  z-index: 2147483647;
}

.spinner-mark {
  filter: drop-shadow(0 0 24px rgba(3, 203, 0, 0.42));
}

.spinner-fallback {
  display: grid;
  place-items: center;
}

.spinner-fallback__ring,
.spinner-fallback__core {
  position: absolute;
  border-radius: 9999px;
}

.spinner-fallback__ring {
  inset: 0;
  border: 2px solid rgba(3, 203, 0, 0.3);
  border-top-color: rgba(62, 255, 71, 1);
  box-shadow:
    0 0 18px rgba(3, 203, 0, 0.85),
    inset 0 0 22px rgba(3, 203, 0, 0.28);
  animation: spinner-rotate 1s linear infinite;
}

.spinner-fallback__core {
  width: 34%;
  height: 34%;
  background: radial-gradient(circle, rgba(62, 255, 71, 0.94), rgba(3, 203, 0, 0.18) 64%, transparent 70%);
  animation: spinner-pulse 1.25s ease-in-out infinite;
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinner-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.86);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
