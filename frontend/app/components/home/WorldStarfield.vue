<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

// Section-wide star layer behind the WebGL globe, matching the design: faint stars
// across the black background, a band of green sparkle dust spilling out to the
// left and right of the globe, a soft green haze, and a few flaring stars that
// twinkle. The static part is rendered once per size; only the flares animate.
const props = withDefaults(defineProps<{ anchorSelector?: string }>(), { anchorSelector: ".world-section__globe" });

type Star = { x: number; y: number; r: number; alpha: number; speed: number; phase: number; spikes: boolean };

const canvas = ref<HTMLCanvasElement | null>(null);
let staticLayer: HTMLCanvasElement | null = null;
let flares: Star[] = [];
let width = 0;
let height = 0;
let ratio = 1;
let frame = 0;
let lastDraw = 0;
let visible = false;
let reducedMotion = false;
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let resizeTimer: number | undefined;

const seeded = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};

const gaussian = (random: () => number) =>
  Math.sqrt(-2 * Math.log(Math.max(random(), 1e-6))) * Math.cos(2 * Math.PI * random());

const globeGeometry = (section: HTMLElement) => {
  const anchor = section.querySelector<HTMLElement>(props.anchorSelector);
  const box = section.getBoundingClientRect();
  if (!anchor) return { cx: width / 2, cy: height * 0.45, radius: Math.min(width, height) * 0.2 };
  const rect = anchor.getBoundingClientRect();
  // The globe camera frames the sphere at ~80% of the canvas half-height.
  return {
    cx: rect.left - box.left + rect.width / 2,
    cy: rect.top - box.top + rect.height / 2,
    radius: Math.min(rect.width, rect.height) * 0.4,
  };
};

const paintStatic = (section: HTMLElement) => {
  const layer = document.createElement("canvas");
  layer.width = Math.round(width * ratio);
  layer.height = Math.round(height * ratio);
  const ctx = layer.getContext("2d");
  if (!ctx) return null;
  ctx.scale(ratio, ratio);
  const random = seeded(2026);
  const { cx, cy, radius } = globeGeometry(section);

  // Soft green haze hugging the globe and trailing sideways.
  ctx.globalCompositeOperation = "lighter";
  for (const [dx, sx, sy, alpha] of [[0, 1.75, 1.05, 0.12], [-1.3, 1.05, 0.6, 0.1], [1.3, 1.05, 0.6, 0.1]] as const) {
    ctx.save();
    ctx.translate(cx + dx * radius, cy);
    ctx.scale(sx, sy);
    const haze = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.15);
    haze.addColorStop(0, `rgba(0, 255, 90, ${alpha})`);
    haze.addColorStop(1, "rgba(0, 255, 90, 0)");
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Faint background stars over the whole section (sparse, as in the design).
  const backgroundCount = Math.round((width * height) / 14000);
  for (let i = 0; i < backgroundCount; i++) {
    const x = random() * width;
    const y = random() * height;
    const r = 0.3 + random() * 0.8;
    const green = random() < 0.3;
    ctx.fillStyle = green ? `rgba(120, 255, 160, ${0.1 + random() * 0.3})` : `rgba(255, 255, 255, ${0.12 + random() * 0.35})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sparkle dust: a flattened ring around the globe, densest at its sides.
  const dustCount = Math.round(Math.min(1200, 380 + width * 0.3));
  for (let placed = 0; placed < dustCount;) {
    const angle = random() * Math.PI * 2;
    if (random() > 0.25 + 0.75 * Math.abs(Math.cos(angle)) ** 0.7) continue;
    const distance = radius * (1.02 + Math.abs(gaussian(random)) * 0.5);
    const x = cx + Math.cos(angle) * distance * 1.55;
    const y = cy + Math.sin(angle) * distance * 0.82 + gaussian(random) * radius * 0.06;
    const r = 0.3 + random() ** 2.4 * 1.1;
    const alpha = 0.12 + random() * 0.45;
    ctx.fillStyle = random() < 0.85 ? `rgba(60, 255, 120, ${alpha})` : `rgba(220, 255, 230, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    placed++;
  }

  // Flaring stars: mostly inside the dust band, a few scattered further out.
  flares = Array.from({ length: Math.round(8 + width / 160) }, (_, index) => {
    const nearGlobe = index % 3 !== 0;
    const angle = random() * Math.PI * 2;
    const distance = radius * (nearGlobe ? 1.05 + random() * 0.7 : 1.4 + random() * 2.4);
    return {
      x: nearGlobe ? cx + Math.cos(angle) * distance * 1.5 : random() * width,
      y: nearGlobe ? cy + Math.sin(angle) * distance * 0.8 : random() * height,
      r: 0.7 + random() ** 2 * 1.6,
      alpha: 0.5 + random() * 0.5,
      speed: 0.6 + random() * 1.6,
      phase: random() * Math.PI * 2,
      spikes: random() < 0.18,
    };
  });
  return layer;
};

const drawFlare = (ctx: CanvasRenderingContext2D, star: Star, intensity: number) => {
  const glowRadius = star.r * 5;
  const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowRadius);
  glow.addColorStop(0, `rgba(210, 255, 220, ${intensity})`);
  glow.addColorStop(0.25, `rgba(40, 255, 110, ${intensity * 0.55})`);
  glow.addColorStop(1, "rgba(0, 255, 90, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  if (!star.spikes) return;
  // A thin, tapering four-point glint on a few of the brightest stars only.
  const spike = star.r * 4.5 * (0.5 + intensity * 0.5);
  const glint = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, spike);
  glint.addColorStop(0, `rgba(200, 255, 215, ${intensity * 0.8})`);
  glint.addColorStop(1, "rgba(0, 255, 90, 0)");
  ctx.strokeStyle = glint;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(star.x - spike, star.y);
  ctx.lineTo(star.x + spike, star.y);
  ctx.moveTo(star.x, star.y - spike);
  ctx.lineTo(star.x, star.y + spike);
  ctx.stroke();
};

const draw = (time: number) => {
  const target = canvas.value;
  const ctx = target?.getContext("2d");
  if (!target || !ctx || !staticLayer) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(staticLayer, 0, 0);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.globalCompositeOperation = "lighter";
  const seconds = time / 1000;
  for (const star of flares) {
    const twinkle = reducedMotion ? 0.8 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(seconds * star.speed + star.phase));
    drawFlare(ctx, star, star.alpha * twinkle);
  }
  ctx.globalCompositeOperation = "source-over";
};

const loop = (time: number) => {
  frame = 0;
  if (!visible || document.hidden || reducedMotion) return;
  // ~30 fps is plenty for a slow twinkle.
  if (time - lastDraw >= 33) {
    lastDraw = time;
    draw(time);
  }
  frame = requestAnimationFrame(loop);
};

const start = () => {
  if (!frame && visible && !reducedMotion) frame = requestAnimationFrame(loop);
};

const rebuild = () => {
  const target = canvas.value;
  const section = target?.parentElement;
  if (!target || !section) return;
  width = section.clientWidth;
  height = section.clientHeight;
  if (!width || !height) return;
  ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  target.width = Math.round(width * ratio);
  target.height = Math.round(height * ratio);
  staticLayer = paintStatic(section);
  draw(performance.now());
};

const onVisibility = () => { if (!document.hidden) start(); };

onMounted(() => {
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  rebuild();
  const section = canvas.value?.parentElement;
  if (!section) return;
  resizeObserver = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(rebuild, 150);
  });
  resizeObserver.observe(section);
  intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (visible) start();
  }, { rootMargin: "200px 0px" });
  intersectionObserver.observe(section);
  document.addEventListener("visibilitychange", onVisibility);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  window.clearTimeout(resizeTimer);
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  document.removeEventListener("visibilitychange", onVisibility);
  staticLayer = null;
});
</script>

<template>
  <canvas ref="canvas" class="world-starfield" aria-hidden="true" />
</template>

<style scoped>
.world-starfield {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
