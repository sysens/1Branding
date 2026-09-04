<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { preloadSplineViewer } from "~/utils/splineViewerLoader";

type Props = {
  scene: string;
  showLoader?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  showLoader: true,
});

const emit = defineEmits<{
  loaded: [];
  failed: [];
}>();

const host = ref<HTMLElement | null>(null);
const isLoading = ref(true);
const hasError = ref(false);

let viewerElement: HTMLElement | null = null;
let logoCleanupTimer: ReturnType<typeof setInterval> | null = null;

const stopLogoCleanup = () => {
  if (!logoCleanupTimer) {
    return;
  }

  clearInterval(logoCleanupTimer);
  logoCleanupTimer = null;
};

const removeViewerLogo = () => {
  const root = viewerElement?.shadowRoot;

  if (!root) {
    return false;
  }

  const existingStyle = root.querySelector<HTMLStyleElement>(
    "style[data-onebranding-spline-logo-hidden='true']"
  );

  if (!existingStyle) {
    const style = document.createElement("style");
    style.dataset.onebrandingSplineLogoHidden = "true";
    style.textContent = `
      #logo {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    root.appendChild(style);
  }

  root.querySelector<HTMLElement>("#logo")?.remove();
  return true;
};

const startLogoCleanup = () => {
  stopLogoCleanup();

  let attempts = 0;

  logoCleanupTimer = setInterval(() => {
    attempts += 1;

    if (removeViewerLogo() || attempts >= 30) {
      stopLogoCleanup();
    }
  }, 160);
};

const clearViewer = () => {
  stopLogoCleanup();
  viewerElement?.remove();
  viewerElement = null;
};

const mountViewer = async () => {
  await nextTick();

  const target = host.value;
  const scene = props.scene.trim();

  clearViewer();
  hasError.value = false;

  if (!process.client || !target || !scene) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  try {
    await preloadSplineViewer();

    const element = document.createElement("spline-viewer");
    let hasCompletedLoading = false;

    const handleLoadComplete = () => {
      if (hasCompletedLoading) return;

      hasCompletedLoading = true;
      isLoading.value = false;
      startLogoCleanup();
      emit("loaded");
    };

    element.setAttribute("url", scene);
    element.setAttribute("background", "#000000");
    element.setAttribute("events-target", "local");
    element.setAttribute("loading", "eager");
    element.setAttribute("loading-anim", props.showLoader ? "true" : "false");

    if (props.showLoader) {
      element.setAttribute("loading-anim-type", "spinner-small-light");
    }

    element.className = "spline-scene-viewer__element";
    element.addEventListener("load-complete", handleLoadComplete, { once: true });
    element.addEventListener("load", handleLoadComplete, { once: true });

    target.appendChild(element);
    viewerElement = element;
    startLogoCleanup();
  } catch {
    hasError.value = true;
    isLoading.value = false;
    emit("failed");
  }
};

onMounted(() => {
  void mountViewer();
});

watch(
  () => [props.scene, props.showLoader],
  () => {
    void mountViewer();
  }
);

onBeforeUnmount(() => {
  clearViewer();
});
</script>

<template>
  <div ref="host" class="spline-scene-viewer">
    <div v-if="isLoading && showLoader" class="spline-scene-viewer__fallback">
      <span class="spline-scene-viewer__loader"></span>
    </div>

    <div v-if="hasError" class="spline-scene-viewer__fallback">
      <span class="spline-scene-viewer__error">3D scene unavailable</span>
    </div>
  </div>
</template>

<style scoped>
.spline-scene-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 20rem;
  overflow: visible;
}

.spline-scene-viewer :deep(.spline-scene-viewer__element) {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.spline-scene-viewer__fallback {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.spline-scene-viewer__loader {
  width: 2.25rem;
  height: 2.25rem;
  border: 2px solid rgba(255, 255, 255, 0.18);
  border-top-color: #f4f4f5;
  border-radius: 9999px;
  animation: spline-loader-spin 0.85s linear infinite;
}

.spline-scene-viewer__error {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.875rem;
}

@keyframes spline-loader-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
