<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Application } from "@splinetool/runtime";
import { resolveBrandedRobotScene } from "~/utils/robotScene";

const props = defineProps<{ scene: string }>();
const host = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);
const failed = ref(false);
let application: Application | null = null;
let controller: AbortController | null = null;
let preloadObserver: IntersectionObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;
let nearViewport = false;
let inViewport = false;
let started = false;
let generation = 0;

// The robot's entrance is the scene's Spline "Start" event, and play() fires it
// again on every resume. So the scene is played once, the first time it shows;
// after that, off screen only its rendering pauses (renderMode "manual" skips
// whole frames) and the entrance does not run again.
const updatePlayback = () => {
  if (!application || !ready.value) return;
  const visible = inViewport && !document.hidden;
  if (!started) {
    if (!visible) return;
    started = true;
    application.play();
    return;
  }
  (application as Application & { renderMode: "auto" | "manual" }).renderMode = visible ? "auto" : "manual";
  if (visible) application.requestRender();
};

const clear = () => {
  controller?.abort();
  controller = null;
  application?.dispose();
  application = null;
  started = false;
  ready.value = false;
};

const load = async () => {
  const current = ++generation;
  clear();
  failed.value = false;
  if (!nearViewport || !canvas.value) return;
  const abort = new AbortController();
  controller = abort;
  let scene: Application | null = null;
  try {
    const { Application } = await import("@splinetool/runtime");
    if (current !== generation || !canvas.value) return;
    scene = new Application(canvas.value, {
      renderer: "webgl",
      renderMode: "auto",
      htmlContentMode: "none",
    });
    await scene.load(resolveBrandedRobotScene(props.scene), undefined, { signal: abort.signal });
    if (current !== generation) { scene.dispose(); return; }
    scene.stop();
    application = scene;
    ready.value = true;
    scene.requestRender();
    updatePlayback();
  } catch (error) {
    scene?.dispose();
    if (current !== generation || abort.signal.aborted) return;
    failed.value = true;
    console.error("Robot scene could not be initialized.", error);
  }
};

onMounted(() => {
  if (!host.value) return;
  preloadObserver = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting || nearViewport) return;
    nearViewport = true;
    preloadObserver?.disconnect();
    void load();
  }, { rootMargin: "800px 0px" });
  visibilityObserver = new IntersectionObserver(([entry]) => {
    inViewport = entry?.isIntersecting ?? false;
    updatePlayback();
  });
  preloadObserver.observe(host.value);
  visibilityObserver.observe(host.value);
  document.addEventListener("visibilitychange", updatePlayback);
});

watch(() => props.scene, load);
onBeforeUnmount(() => {
  generation++;
  clear();
  preloadObserver?.disconnect();
  visibilityObserver?.disconnect();
  document.removeEventListener("visibilitychange", updatePlayback);
});
</script>

<template>
  <div ref="host" class="branded-robot" :aria-busy="!ready && !failed">
    <canvas
      ref="canvas"
      class="branded-robot__canvas"
      :class="{ 'branded-robot__canvas--ready': ready }"
      role="img"
      aria-label="One Branding robot"
    />
    <span v-if="failed" class="branded-robot__error" role="status">3D scene unavailable</span>
  </div>
</template>

<style scoped>
.branded-robot {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: clip;
}
.branded-robot__canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.branded-robot__canvas--ready { opacity: 1; }
.branded-robot__error {
  position: absolute;
  inset: 50% 0 auto;
  text-align: center;
  color: #aaa;
}
@media (prefers-reduced-motion: reduce) {
  .branded-robot__canvas { transition: none; }
}
</style>
