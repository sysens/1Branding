<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useViewportActivity } from "~/composables/useViewportActivity";

type SparkleParticle = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  phase: number;
  drift: number;
  twinkleSpeed: number;
};

type Props = {
  id?: string;
  class?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  class: "",
  background: "transparent",
  minSize: 0.4,
  maxSize: 1,
  speed: 0.5,
  particleColor: "#ffffff",
  particleDensity: 1200,
});

const { targetRef: root, isActive } = useViewportActivity({
  rootMargin: "250px 0px",
});
const canvas = ref<HTMLCanvasElement | null>(null);
const isReady = ref(false);

const rootClasses = computed(() => ["sparkles-core", props.class]);

let context: CanvasRenderingContext2D | null = null;
let particles: SparkleParticle[] = [];
let animationFrame = 0;
let resizeObserver: ResizeObserver | null = null;
let reducedMotionQuery: MediaQueryList | null = null;
let reducedMotion = false;
let lastFrameTime = 0;

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const getParticleCount = (width: number, height: number) => {
  const density = Math.max(80, props.particleDensity);
  const areaFactor = (width * height) / 700;
  return Math.min(650, Math.max(24, Math.round(areaFactor * (density / 1200))));
};

const createParticle = (width: number, height: number): SparkleParticle => ({
  x: randomBetween(0, width),
  y: randomBetween(height * 0.08, height * 0.95),
  size: randomBetween(props.minSize, props.maxSize),
  alpha: randomBetween(0.22, 0.95),
  phase: randomBetween(0, Math.PI * 2),
  drift: randomBetween(-0.08, 0.08),
  twinkleSpeed: randomBetween(0.45, 1.15),
});

const createParticles = (width: number, height: number) => {
  const count = getParticleCount(width, height);
  particles = Array.from({ length: count }, () => createParticle(width, height));
};

const resizeCanvas = () => {
  if (!canvas.value || !root.value) return;

  const width = root.value.clientWidth;
  const height = root.value.clientHeight;
  if (width <= 0 || height <= 0) return;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.value.width = Math.round(width * pixelRatio);
  canvas.value.height = Math.round(height * pixelRatio);
  canvas.value.style.width = `${width}px`;
  canvas.value.style.height = `${height}px`;

  context = canvas.value.getContext("2d");
  context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  createParticles(width, height);
};

const drawBackground = (
  drawingContext: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  drawingContext.clearRect(0, 0, width, height);

  if (props.background === "transparent") return;

  drawingContext.fillStyle = props.background;
  drawingContext.fillRect(0, 0, width, height);
};

const drawParticles = (
  drawingContext: CanvasRenderingContext2D,
  width: number,
  height: number,
  delta: number
) => {
  for (const particle of particles) {
    const twinkle =
      0.45 + Math.sin(lastFrameTime * 0.001 * particle.twinkleSpeed + particle.phase) * 0.55;
    const verticalFade = 1 - Math.max(0, (particle.y - height * 0.82) / (height * 0.18));
    const opacity = Math.max(0, particle.alpha * twinkle * verticalFade);

    particle.x += particle.drift * delta * props.speed;
    if (particle.x < -2) particle.x = width + 2;
    if (particle.x > width + 2) particle.x = -2;

    drawingContext.globalAlpha = opacity;
    drawingContext.fillStyle = props.particleColor;
    drawingContext.beginPath();
    drawingContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    drawingContext.fill();
  }

  drawingContext.globalAlpha = 1;
};

const renderFrame = (time: number) => {
  if (!canvas.value || !root.value || !context || !isActive.value) {
    animationFrame = 0;
    return;
  }

  const width = root.value.clientWidth;
  const height = root.value.clientHeight;
  const delta = lastFrameTime ? Math.min(32, time - lastFrameTime) : 16;
  lastFrameTime = time;

  drawBackground(context, width, height);
  drawParticles(context, width, height, delta);

  if (!reducedMotion && isActive.value) {
    animationFrame = window.requestAnimationFrame(renderFrame);
  } else {
    animationFrame = 0;
  }
};

const stop = () => {
  window.cancelAnimationFrame(animationFrame);
  animationFrame = 0;
};

const start = () => {
  stop();

  if (!isActive.value) return;

  lastFrameTime = 0;
  animationFrame = window.requestAnimationFrame(renderFrame);
};

const handleMotionPreference = (event: MediaQueryListEvent) => {
  reducedMotion = event.matches;
  if (!reducedMotion) {
    start();
    return;
  }

  stop();

  if (isActive.value) {
    renderFrame(window.performance.now());
  }
};

onMounted(async () => {
  await nextTick();

  if (!root.value || !canvas.value) return;

  reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion = reducedMotionQuery.matches;
  reducedMotionQuery.addEventListener("change", handleMotionPreference);

  resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
    start();
  });
  resizeObserver.observe(root.value);

  resizeCanvas();
  isReady.value = true;
  start();
});

onBeforeUnmount(() => {
  stop();
  resizeObserver?.disconnect();
  reducedMotionQuery?.removeEventListener("change", handleMotionPreference);
});

watch(isActive, (active) => {
  if (active) {
    start();
    return;
  }

  stop();
});

watch(
  () => [
    props.background,
    props.minSize,
    props.maxSize,
    props.speed,
    props.particleColor,
    props.particleDensity,
  ],
  () => {
    resizeCanvas();
    start();
  }
);
</script>

<template>
  <div :id="id" ref="root" :class="rootClasses">
    <canvas
      ref="canvas"
      class="sparkles-core__canvas"
      :class="{ 'sparkles-core__canvas--ready': isReady }"
      aria-hidden="true"
    ></canvas>
  </div>
</template>

<style scoped>
.sparkles-core {
  position: relative;
  width: 100%;
  height: 100%;
}

.sparkles-core__canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.sparkles-core__canvas--ready {
  opacity: 1;
}
</style>
