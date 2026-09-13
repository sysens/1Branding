<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { createCursorTrails, drawCursorTrails, stepCursorTrails, type CursorTrail } from "~/utils/cursorTrails";

const pointer = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
let cleanup: (() => void) | undefined;
onMounted(() => {
  const element = pointer.value, surface = canvas.value;
  if (!element || !surface) return;
  const context = surface.getContext("2d");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let trails: CursorTrail[] = [], frame = 0, lastTime = 0, lastMove = 0, x = 0, y = 0, running = false;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    surface.width = innerWidth * dpr; surface.height = innerHeight * dpr;
    context?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const stop = () => {
    cancelAnimationFrame(frame); frame = 0; running = false;
    element.hidden = true;
    document.documentElement.classList.remove("brand-cursor-active");
    context?.clearRect(0, 0, innerWidth, innerHeight);
    trails = [];
  };
  const draw = (time: number) => {
    frame = 0;
    if (!context || !running) return;
    if (time - lastTime >= 1000 / 60 - 1) {
      lastTime = time;
      context.clearRect(0, 0, innerWidth, innerHeight);
      stepCursorTrails(trails, x, y);
      drawCursorTrails(context, trails, Math.max(0, 1 - (time - lastMove) / 1000));
    }
    if (time - lastMove < 1200) frame = requestAnimationFrame(draw);
    else { running = false; trails = []; context.clearRect(0, 0, innerWidth, innerHeight); }
  };
  const move = (event: PointerEvent) => {
    if (!fine.matches || event.pointerType !== "mouse" || document.hidden) { stop(); return; }
    const target = event.target;
    if (target instanceof Element && target.closest("input, textarea, [contenteditable=true], iframe")) { stop(); return; }
    x = event.clientX; y = event.clientY;
    // Position follows the latest pointer event directly: no positional spring or lag.
    element.style.transform = `translate3d(${x - 9}px,${y - 2}px,0)`;
    element.hidden = false;
    document.documentElement.classList.add("brand-cursor-active");
    if (reduced.matches || !context) return;
    lastMove = performance.now();
    if (!running) {
      trails = createCursorTrails(x, y); running = true; lastTime = 0;
      frame = requestAnimationFrame(draw);
    }
  };
  const visibility = () => { if (document.hidden) stop(); };
  const leave = (event: PointerEvent) => { if (!event.relatedTarget) stop(); };
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerout", leave);
  window.addEventListener("blur", stop);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visibility);
  fine.addEventListener("change", stop); reduced.addEventListener("change", stop);
  resize();
  cleanup = () => {
    stop(); window.removeEventListener("pointermove", move); window.removeEventListener("pointerout", leave);
    window.removeEventListener("blur", stop); window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visibility);
    fine.removeEventListener("change", stop); reduced.removeEventListener("change", stop);
  };
});
onBeforeUnmount(() => cleanup?.());
</script>

<template>
  <Teleport to="body">
    <canvas ref="canvas" class="brand-cursor-trails" aria-hidden="true" />
    <div ref="pointer" class="brand-cursor" hidden aria-hidden="true">
      <!-- Inspira UI DefaultCursor silhouette; native-speed position, contrasting outline. -->
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path fill="#080a08" stroke="white" stroke-width="1.4" d="M9.391 2.32C8.42 1.56 7 2.253 7 3.486V28.41c0 1.538 1.966 2.18 2.874.938l6.225-8.523a2 2 0 0 1 1.615-.82h9.69c1.512 0 2.17-1.912.978-2.844z" />
      </svg>
    </div>
  </Teleport>
</template>

<style>
.brand-cursor, .brand-cursor-trails { position: fixed; top: 0; left: 0; pointer-events: none; z-index: 2147483000; }
.brand-cursor { width: 32px; height: 32px; will-change: transform; }
.brand-cursor-trails { width: 100%; height: 100%; }
@media (hover: hover) and (pointer: fine) {
  .brand-cursor-active, .brand-cursor-active * { cursor: none !important; }
}
@media (hover: none), (pointer: coarse) { .brand-cursor, .brand-cursor-trails { display: none; } }
</style>
