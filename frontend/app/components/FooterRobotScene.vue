<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import SplineSceneViewer from "~/components/home/SplineSceneViewer.vue";
import { preloadSplineViewer } from "~/utils/splineViewerLoader";

type Props = {
  scene: string;
};

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const props = defineProps<Props>();

const root = ref<HTMLElement | null>(null);
const emblem = ref<HTMLImageElement | null>(null);
const shouldLoad = ref(false);
const isSceneLoaded = ref(false);
const isSceneFailed = ref(false);
const isEmblemLoaded = ref(false);

const isReady = computed(
  () => isSceneLoaded.value && isEmblemLoaded.value
);

const isStageVisible = computed(() => isReady.value || isSceneFailed.value);

let observer: IntersectionObserver | null = null;
let idleCallbackId: number | null = null;
let preloadTimer: ReturnType<typeof setTimeout> | null = null;

const warmViewerModule = () => {
  idleCallbackId = null;
  preloadTimer = null;
  void preloadSplineViewer().catch(() => undefined);
};

const resetSceneState = () => {
  isSceneLoaded.value = false;
  isSceneFailed.value = false;
};

const handleSceneLoaded = () => {
  isSceneLoaded.value = true;
  isSceneFailed.value = false;
};

const handleSceneFailed = () => {
  isSceneFailed.value = true;
};

const handleEmblemReady = () => {
  isEmblemLoaded.value = true;
};

watch(() => props.scene, resetSceneState);

onMounted(() => {
  const idleWindow = window as IdleWindow;

  if (idleWindow.requestIdleCallback) {
    idleCallbackId = idleWindow.requestIdleCallback(warmViewerModule, {
      timeout: 1200,
    });
  } else {
    preloadTimer = setTimeout(warmViewerModule, 600);
  }

  if (emblem.value?.complete) {
    handleEmblemReady();
  }

  if (!root.value) return;

  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      shouldLoad.value = true;
      observer?.disconnect();
      observer = null;
    },
    {
      threshold: 0,
      rootMargin: "600px 0px 600px 0px",
    }
  );

  observer.observe(root.value);
});

onBeforeUnmount(() => {
  const idleWindow = window as IdleWindow;

  if (idleCallbackId !== null && idleWindow.cancelIdleCallback) {
    idleWindow.cancelIdleCallback(idleCallbackId);
    idleCallbackId = null;
  }

  if (preloadTimer) {
    clearTimeout(preloadTimer);
    preloadTimer = null;
  }

  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <div ref="root" class="footer-robot-scene" :aria-busy="!isStageVisible">
    <div
      class="footer-robot-scene__stage"
      :class="{ 'footer-robot-scene__stage--visible': isStageVisible }"
    >
      <ClientOnly>
        <SplineSceneViewer
          v-if="shouldLoad"
          :scene="scene"
          :show-loader="false"
          @loaded="handleSceneLoaded"
          @failed="handleSceneFailed"
        />
        <div v-else class="footer-robot-scene__placeholder"></div>
      </ClientOnly>

      <img
        ref="emblem"
        src="/General/logorobo.webp"
        alt=""
        class="footer-robot-scene__emblem"
        :class="{ 'footer-robot-scene__emblem--visible': isReady }"
        aria-hidden="true"
        draggable="false"
        @load="handleEmblemReady"
        @error="handleEmblemReady"
      />
    </div>
  </div>
</template>

<style scoped>
.footer-robot-scene {
  position: relative;
  width: 100%;
  height: clamp(27rem, 43vw, 40rem);
  overflow: visible;
}

.footer-robot-scene__stage {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease 0.9s;
  pointer-events: none;
}

.footer-robot-scene__stage--visible {
  opacity: 1;
  pointer-events: auto;
}

.footer-robot-scene :deep(.spline-scene-viewer) {
  min-height: 100%;
}

.footer-robot-scene :deep(.spline-scene-viewer__element) {
  transform: scale(1.12);
  transform-origin: center bottom;
}

.footer-robot-scene__placeholder {
  width: 100%;
  height: 100%;
}

/* Keep the fallback emblem on the same reveal timeline as the Spline scene. */
.footer-robot-scene__emblem {
  position: absolute;
  left: 48%;
  top: 47%;
  height: 26%;
  width: auto;
  transform: translate(-50%, -50%) perspective(30rem) rotateX(-5deg);
  mix-blend-mode: screen;
  filter: drop-shadow(0 0 0.7rem rgba(3, 203, 0, 0.4));
  opacity: 0;
  transition: opacity 0.45s ease;
  pointer-events: none;
  z-index: 2;
}

.footer-robot-scene__emblem--visible {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .footer-robot-scene__stage,
  .footer-robot-scene__emblem {
    transition-delay: 0s;
    transition-duration: 0s;
  }
}

@media (max-width: 900px) {
  .footer-robot-scene {
    height: clamp(23rem, 85vw, 32rem);
  }
}
</style>
