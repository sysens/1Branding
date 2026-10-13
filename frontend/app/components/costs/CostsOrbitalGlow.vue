<script setup lang="ts">
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

type Props = {
  speed?: number;
  intensity?: number;
  opacity?: number;
  color?: string;
  highlightColor?: string;
};

type OrbitalUniforms = {
  iTime: { value: number };
  iResolution: { value: [number, number] };
  iSpeed: { value: number };
  iIntensity: { value: number };
  iOpacity: { value: number };
  iColor: { value: [number, number, number] };
  iHighlightColor: { value: [number, number, number] };
};

const props = withDefaults(defineProps<Props>(), {
  speed: 0.7,
  intensity: 1,
  opacity: 0.92,
  color: "#03cb00",
  highlightColor: "#55ff94",
});

const containerRef = ref<HTMLDivElement | null>(null);

let renderer: Renderer | null = null;
let mesh: Mesh | null = null;
let uniforms: OrbitalUniforms | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let resizeObserver: ResizeObserver | null = null;
let animationFrameId: number | null = null;
let isVisible = false;

const hexToRgb = (hex: string): [number, number, number] => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return [1, 1, 1];

  const red = match[1] ?? "ff";
  const green = match[2] ?? "ff";
  const blue = match[3] ?? "ff";

  return [
    Number.parseInt(red, 16) / 255,
    Number.parseInt(green, 16) / 255,
    Number.parseInt(blue, 16) / 255,
  ];
};

const vertexShader = `
attribute vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform float iIntensity;
uniform float iOpacity;
uniform vec3 iColor;
uniform vec3 iHighlightColor;

void main() {
  vec2 frag = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
  vec2 point = frag / iResolution.y;
  float aspect = iResolution.x / iResolution.y;

  vec2 center = vec2(aspect * 0.28, 1.18);
  float radius = 1.22;
  vec2 relative = point - center;
  float signedDistance = length(relative) - radius;
  float ringDistance = abs(signedDistance);
  float angle = atan(relative.y, relative.x);

  float arcProgress = clamp((angle + 1.5707963) / 1.5707963, 0.0, 1.0);
  float rightBias = 0.26 + 0.74 * pow(arcProgress, 1.38);

  float travel = 0.5 + 0.5 * sin(iTime * iSpeed * 0.72);
  float highlightAngle = mix(-1.34, -0.06, travel);
  float travellingHighlight = exp(-pow((angle - highlightAngle) * 3.2, 2.0));
  float shimmer = 0.86 + 0.14 * sin(iTime * iSpeed * 1.8 + angle * 5.0);

  float core = exp(-ringDistance * 720.0);
  float nearGlow = exp(-ringDistance * 94.0);
  float farGlow = exp(-ringDistance * 25.0);
  float innerAtmosphere = step(signedDistance, 0.0) * exp(signedDistance * 7.5);

  float strength = (
    core * 1.3 +
    nearGlow * 0.72 +
    farGlow * 0.22 +
    innerAtmosphere * 0.075
  ) * rightBias * shimmer;

  float topEdgeFade = smoothstep(0.0, 0.105, point.y);
  float bottomEdgeFade = 1.0 - smoothstep(1.0, 1.12, point.y);
  strength *= topEdgeFade * bottomEdgeFade;
  strength *= 0.76 + travellingHighlight * 0.72;
  strength *= iIntensity;

  vec3 color = mix(iColor, iHighlightColor, 0.24 + travellingHighlight * 0.52);
  color *= strength;

  float alpha = clamp(max(color.r, max(color.g, color.b)) * iOpacity, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}`;

const resize = (): void => {
  if (!containerRef.value || !renderer || !uniforms) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  if (width === 0 || height === 0) return;

  renderer.setSize(width, height);
  uniforms.iResolution.value = [width * renderer.dpr, height * renderer.dpr];
};

const stopAnimation = (): void => {
  if (animationFrameId === null) return;
  window.cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
};

const render = (time: number): void => {
  if (!renderer || !mesh || !uniforms || !isVisible) {
    animationFrameId = null;
    return;
  }

  uniforms.iTime.value = time * 0.001;
  renderer.render({ scene: mesh });
  animationFrameId = window.requestAnimationFrame(render);
};

const startAnimation = (): void => {
  if (animationFrameId !== null || !isVisible) return;
  animationFrameId = window.requestAnimationFrame(render);
};

const initialize = (): void => {
  if (!containerRef.value || renderer) return;

  renderer = new Renderer({
    alpha: true,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  });

  const gl = renderer.gl;
  gl.canvas.style.width = "100%";
  gl.canvas.style.height = "100%";
  gl.canvas.style.display = "block";
  containerRef.value.replaceChildren(gl.canvas);

  uniforms = {
    iTime: { value: 0 },
    iResolution: { value: [1, 1] },
    iSpeed: { value: props.speed },
    iIntensity: { value: props.intensity },
    iOpacity: { value: props.opacity },
    iColor: { value: hexToRgb(props.color) },
    iHighlightColor: { value: hexToRgb(props.highlightColor) },
  };

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms,
    transparent: true,
  });

  mesh = new Mesh(gl, { geometry, program });
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(containerRef.value);
  resize();
  startAnimation();
};

watch(
  () => [
    props.speed,
    props.intensity,
    props.opacity,
    props.color,
    props.highlightColor,
  ] as const,
  () => {
    if (!uniforms) return;
    uniforms.iSpeed.value = props.speed;
    uniforms.iIntensity.value = props.intensity;
    uniforms.iOpacity.value = props.opacity;
    uniforms.iColor.value = hexToRgb(props.color);
    uniforms.iHighlightColor.value = hexToRgb(props.highlightColor);
  }
);

onMounted(() => {
  if (!containerRef.value) return;

  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry?.isIntersecting ?? false;
      if (!isVisible) {
        stopAnimation();
        return;
      }

      initialize();
      startAnimation();
    },
    { threshold: 0.05, rootMargin: "120px" }
  );

  intersectionObserver.observe(containerRef.value);
});

onBeforeUnmount(() => {
  stopAnimation();
  intersectionObserver?.disconnect();
  resizeObserver?.disconnect();

  if (renderer) {
    renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
    renderer.gl.canvas.remove();
  }

  renderer = null;
  mesh = null;
  uniforms = null;
});
</script>

<template>
  <div ref="containerRef" class="costs-orbital-glow" aria-hidden="true"/>
</template>

<style scoped>
.costs-orbital-glow {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
</style>
