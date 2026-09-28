<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

defineProps<{ frames: readonly string[]; alt: string }>();
const root = ref<HTMLElement | null>(null);
const active = ref(0);
const previous = ref(-1);
// Only the first frame is in the SSR markup (lazily loaded); the other seven
// (~1.8 MB) are requested once the section approaches the viewport.
const framesRequested = ref(false);
const ready: number[] = [];
let visible = false;
let disposed = false;
let timer: number | undefined;
let observer: IntersectionObserver | undefined;
const stop = () => { window.clearInterval(timer); timer = undefined; };
const sync = () => {
  stop();
  if (!visible || document.hidden || ready.length < 2 || disposed) return;
  timer = window.setInterval(() => {
    previous.value = active.value;
    active.value = ready[(ready.indexOf(active.value) + 1) % ready.length] ?? active.value;
  }, 1000);
};
const requestFrames = async () => {
  framesRequested.value = true;
  await nextTick();
  if (!root.value || disposed) return;
  const images = Array.from(root.value.querySelectorAll("img"));
  const decoded = await Promise.all(images.map(async (image, index) => {
    try { await image.decode(); return index; } catch { return -1; }
  }));
  if (disposed) return;
  ready.push(...decoded.filter(index => index >= 0));
  active.value = ready[0] ?? 0;
  sync();
};
onMounted(async () => {
  await nextTick();
  if (!root.value || disposed) return;
  observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (visible && !framesRequested.value) void requestFrames();
    sync();
  }, { rootMargin: "600px 0px" });
  observer.observe(root.value);
  document.addEventListener("visibilitychange", sync);
});
onBeforeUnmount(() => {
  disposed = true;
  stop();
  observer?.disconnect();
  document.removeEventListener("visibilitychange", sync);
});
</script>

<template>
  <div ref="root" class="info-media info-media--frames" role="img" :aria-label="alt">
    <template v-for="(frame, index) in frames" :key="frame">
      <img v-if="index === 0 || framesRequested" :src="frame" alt="" loading="lazy" decoding="async"
        class="info-media__frame" :class="{ 'is-active': index === active, 'is-previous': index === previous }" />
    </template>
  </div>
</template>

<style scoped>
.info-media--frames { position: relative; width: 100%; height: 100%; min-height: inherit; isolation: isolate; }
.info-media__frame { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; opacity: 0; z-index: 0; }
/* Keep an opaque outgoing frame below the incoming fade, including the loop boundary. */
.info-media__frame.is-previous { opacity: 1; z-index: 1; }
.info-media__frame.is-active { opacity: 1; z-index: 2; animation: reveal-frame 200ms ease-out; }
@keyframes reveal-frame { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .info-media__frame.is-active { animation: none; } }
</style>
