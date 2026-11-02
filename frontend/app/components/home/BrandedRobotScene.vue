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
let generation = 0;

// The robot stands as its entrance in the scene ends (camera pulled back, arms
// up) from its first frame, and stays so. The entrance and the arms' idle
// swing are the Transition actions of the scene's Spline "Start" events, and
// the head turns to the cursor through two "LookAt" events; the runtime reads
// these from the scene's data each time it plays, so before it plays they are
// taken out and every part they move is put straight into its last state.
// This is the runtime's own data, not its typed API: if it is not there, the
// robot plays its entrance as before.
type SceneTween = { data: { state?: string | null } };
type SceneAction = { data: { type: string; object?: string; tweens?: SceneTween[] } };
type SceneEvent = { data: { type: string; disabled?: boolean; actions?: SceneAction[] } };
type SceneEntity = { data?: { events?: SceneEvent[] } };
type SceneEvents = { eventContext?: { page?: { traverseEntity?: (visit: (entity: SceneEntity) => void) => void } } };

const holdFinalPose = (scene: Application) => {
  const events: SceneEvents | undefined = scene.eventManager;
  const poses: Array<[string, string]> = [];
  events?.eventContext?.page?.traverseEntity?.((entity) => {
    for (const { data } of entity.data?.events ?? []) {
      if (data.type === "LookAt") data.disabled = true;
      if (data.type !== "Start" || !data.actions) continue;
      for (const { data: action } of data.actions) {
        if (action.type !== "Transition") continue;
        const state = [...(action.tweens ?? [])].reverse().find((tween) => tween.data.state)?.data.state;
        if (action.object && state) poses.push([action.object, state]);
      }
      data.actions = data.actions.filter((action) => action.data.type !== "Transition");
    }
  });
  for (const [id, state] of poses) {
    const object = scene.findObjectById(id);
    if (object) object.state = state;
  }
};

// The robot does not move, so off screen (or in a hidden tab) its rendering
// pauses: renderMode "manual" skips whole frames.
const updatePlayback = () => {
  if (!application || !ready.value) return;
  const visible = inViewport && !document.hidden;
  (application as Application & { renderMode: "auto" | "manual" }).renderMode = visible ? "auto" : "manual";
  if (visible) application.requestRender();
};

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const clear = () => {
  controller?.abort();
  controller = null;
  application?.dispose();
  application = null;
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
    // The entrance began as the scene loaded: stop it, take it out and play
    // the scene again, already standing; it shows once that frame is drawn.
    scene.stop();
    try {
      holdFinalPose(scene);
    } catch {
      // The runtime's data has changed shape: the entrance plays instead.
    }
    scene.play();
    application = scene;
    await nextFrame();
    await nextFrame();
    if (current !== generation) return;
    ready.value = true;
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
      aria-label="OneBranding robot"
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
