<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

// A living gradient (after "Velaris"): a WebGL canvas that fills its positioned
// parent with drifting simplex-noise light in four colours, a vignette and a
// little film grain. It renders at a fraction of the CSS size (the light is
// soft, so it does not show) and at ~30fps, only while it is on screen and the
// tab is visible; with reduced motion it draws one still frame. It emits
// `ready` once the first frame is up, so the parent can drop a CSS fallback,
// and `lost` if the GPU context goes away, so the parent can bring it back.

type Rgb = [number, number, number];

const props = withDefaults(
  defineProps<{
    // Main light, highlight, deep tone, shadow (the darkest).
    colors?: [string, string, string, string];
    bg?: string;
    speed?: number;
    grain?: number;
    // 0..1: how far the light rises over the background colour.
    intensity?: number;
    // Canvas pixels per CSS pixel.
    resolution?: number;
  }>(),
  {
    colors: () => ["#0f7a3a", "#03cb00", "#0a4d24", "#000000"],
    bg: "#000000",
    speed: 1.6,
    grain: 0.25,
    intensity: 0.6,
    resolution: 0.5,
  },
);
const emit = defineEmits<{ ready: []; lost: [] }>();

const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);

const VERTEX = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_grain;
uniform float u_intensity;
uniform vec3 u_colors[4];
uniform vec3 u_bg;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  vec2 p = uv - 0.5;
  p.x *= u_resolution.x / u_resolution.y;
  float t = u_time * 0.1;

  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);

  vec3 col = u_bg;
  float dist = length(p) * 1.5;
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);

  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);
  col += u_colors[1] * smoothstep(0.8, 0.0, dist) * 0.3;
  col = mix(col * 0.2, col, vignette);
  col = mix(u_bg, col, u_intensity);

  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.1;
  gl_FragColor = vec4(col, 1.0);
}
`;

const toRgb = (hex: string): Rgb => {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16) / 255) as Rgb;
};

const FRAME_MS = 1000 / 30;
let teardown: (() => void) | undefined;

onMounted(() => {
  const element = canvas.value;
  const host = element?.parentElement;
  if (!element || !host) return;
  const gl = element.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) return;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const resolution = uniform("u_resolution");
  const time = uniform("u_time");
  gl.uniform1f(uniform("u_grain"), props.grain);
  gl.uniform1f(uniform("u_intensity"), props.intensity);
  gl.uniform3f(uniform("u_bg"), ...toRgb(props.bg));
  gl.uniform3fv(uniform("u_colors"), new Float32Array(props.colors.flatMap(toRgb)));

  const draw = (now: number) => {
    gl.uniform2f(resolution, element.width, element.height);
    gl.uniform1f(time, now * 0.001 * props.speed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frame = 0;
  let last = 0;
  let onScreen = false;

  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 2) * props.resolution;
    element.width = Math.max(1, Math.round(host.clientWidth * scale));
    element.height = Math.max(1, Math.round(host.clientHeight * scale));
    gl.viewport(0, 0, element.width, element.height);
    draw(performance.now());
  };

  const loop = (now: number) => {
    frame = requestAnimationFrame(loop);
    if (now - last < FRAME_MS) return;
    last = now;
    draw(now);
  };
  const sync = () => {
    const run = !still && onScreen && document.visibilityState === "visible";
    if (run && !frame) frame = requestAnimationFrame(loop);
    if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(host);
  const viewObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? false;
    sync();
  }, { rootMargin: "200px 0px" });
  viewObserver.observe(element);
  document.addEventListener("visibilitychange", sync);
  // A lost context (GPU reset, too many contexts) hands back to the fallback.
  const onLost = (event: Event) => {
    event.preventDefault();
    ready.value = false;
    onScreen = false;
    sync();
    emit("lost");
  };
  element.addEventListener("webglcontextlost", onLost);

  resize();
  ready.value = true;
  emit("ready");

  teardown = () => {
    if (frame) cancelAnimationFrame(frame);
    sizeObserver.disconnect();
    viewObserver.disconnect();
    document.removeEventListener("visibilitychange", sync);
    element.removeEventListener("webglcontextlost", onLost);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
});

onBeforeUnmount(() => teardown?.());
</script>

<template>
  <canvas ref="canvas" class="velaris" :class="{ 'is-ready': ready }" aria-hidden="true" />
</template>

<style scoped>
.velaris {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 1.2s ease;
}

.velaris.is-ready {
  opacity: 1;
}
</style>
