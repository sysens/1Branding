<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import SplineSceneViewer from "~/components/home/SplineSceneViewer.vue";

type Props = {
  scene: string;
};

const props = defineProps<Props>();

const root = ref<HTMLElement | null>(null);
const shouldLoad = ref(false);

let observer: IntersectionObserver | null = null;

onMounted(() => {
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
      rootMargin: "500px 0px 500px 0px",
    }
  );

  observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <div ref="root" class="footer-robot-scene">
    <ClientOnly>
      <SplineSceneViewer
        v-if="shouldLoad"
        :scene="scene"
        :show-loader="false"
      />
      <div v-else class="footer-robot-scene__placeholder"></div>
    </ClientOnly>
  </div>
</template>

<style scoped>
.footer-robot-scene {
  position: relative;
  width: 100%;
  height: clamp(27rem, 43vw, 40rem);
  overflow: visible;
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

@media (max-width: 900px) {
  .footer-robot-scene {
    height: clamp(23rem, 85vw, 32rem);
  }
}
</style>
